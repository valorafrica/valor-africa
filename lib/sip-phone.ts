import JsSIP from "jssip";
import { supabase } from "./supabase";

export type CallStatus =
  | "idle"
  | "connecting"
  | "ringing"
  | "active"
  | "ended"
  | "failed";

interface SipCredentials {
  extension: string;
  password: string;
  domain: string;
}

const SIP_WSS_URL = "wss://crm-voip-valorafrica.duckdns.org:8089/ws";

let ua: JsSIP.UA | null = null;
let currentDomain: string | null = null;
let currentSession: any = null;
let remoteAudioEl: HTMLAudioElement | null = null;

async function getSipCredentials(): Promise<SipCredentials> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw new Error("Session Supabase introuvable, veuillez vous reconnecter");
  }

  const res = await fetch("/api/sip-credentials", {
    headers: { Authorization: `Bearer ${session.access_token}` },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "Impossible de récupérer les identifiants SIP");
  }

  return res.json();
}

function getRemoteAudioElement(): HTMLAudioElement {
  if (!remoteAudioEl) {
    remoteAudioEl = document.createElement("audio");
    remoteAudioEl.autoplay = true;
    document.body.appendChild(remoteAudioEl);
  }
  return remoteAudioEl;
}

export async function ensureRegistered(): Promise<JsSIP.UA> {
  if (ua && ua.isRegistered()) return ua;

  const creds = await getSipCredentials();
  currentDomain = creds.domain;

  const socket = new JsSIP.WebSocketInterface(SIP_WSS_URL);
  const configuration = {
    sockets: [socket],
    uri: `sip:${creds.extension}@${creds.domain}`,
    password: creds.password,
    register: true,
  };

  ua = new JsSIP.UA(configuration);
  ua.start();

  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error("Timeout : le poste SIP ne s'est pas enregistré à temps"));
    }, 10000);

    ua!.on("registered", () => {
      clearTimeout(timeout);
      resolve();
    });

    ua!.on("registrationFailed", (e: any) => {
      clearTimeout(timeout);
      reject(new Error("Échec de l'enregistrement SIP : " + (e?.cause || "raison inconnue")));
    });
  });

  return ua;
}

export async function makeCall(
  numberToDial: string,
  callbacks: {
    onStatusChange?: (status: CallStatus) => void;
    onEnded?: (reason: string) => void;
  } = {}
) {
  const agent = await ensureRegistered();
  const audioEl = getRemoteAudioElement();

  // Ne garde que les chiffres (retire le "+", espaces, tirets, etc.)
  const cleanNumber = numberToDial.replace(/[^\d]/g, "");

  const options = {
    mediaConstraints: { audio: true, video: false },
    pcConfig: {
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        {
          urls: [
            "turn:2.29.7.43:3478?transport=udp",
            "turn:2.29.7.43:3478?transport=tcp",
          ],
          username: "turnuser",
          credential: "TurnPassword123",
        },
      ],
    },
  };

  callbacks.onStatusChange?.("connecting");

  currentSession = agent.call(`sip:${cleanNumber}@${currentDomain}`, options);

  currentSession.on("peerconnection", (e: any) => {
    e.peerconnection.addEventListener("track", (event: RTCTrackEvent) => {
      audioEl.srcObject = event.streams[0];
    });
  });

  currentSession.on("progress", () => {
    callbacks.onStatusChange?.("ringing");
  });

  currentSession.on("confirmed", () => {
    callbacks.onStatusChange?.("active");
  });

  currentSession.on("ended", (e: any) => {
    callbacks.onStatusChange?.("ended");
    callbacks.onEnded?.(e?.cause || "ended");
    currentSession = null;
  });

  currentSession.on("failed", (e: any) => {
    callbacks.onStatusChange?.("failed");
    callbacks.onEnded?.(e?.cause || "failed");
    currentSession = null;
  });
}

export function hangUp() {
  if (currentSession) {
    currentSession.terminate();
    currentSession = null;
  }
}