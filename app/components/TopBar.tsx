"use client";
import { useState, useEffect, useRef } from "react";
import { supabase } from "../../lib/supabase";

interface TopBarProps {
  recherche?: string;
  onRecherche?: (val: string) => void;
  showRecherche?: boolean;
}

export default function TopBar({ recherche = "", onRecherche, showRecherche = true }: TopBarProps) {
  const [currentProfile, setCurrentProfile] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showNotifs, setShowNotifs] = useState(false);
  const [showProfil, setShowProfil] = useState(false);
  const [callSeconds, setCallSeconds] = useState(0);
  const [callActive, setCallActive] = useState(false);
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const timerRef = useRef<any>(null);
  const sessionRef = useRef<any>(null);
  const notifRef = useRef<any>(null);
  const profilRef = useRef<any>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
      if (user) {
        const { data: profile } = await supabase.from("Profiles").select("*").eq("id", user.id).single();
        setCurrentProfile(profile);
      }
    };
    fetchUser();
    sessionRef.current = setInterval(() => setSessionSeconds(s => s + 1), 1000);
    return () => clearInterval(sessionRef.current);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifs(false);
      if (profilRef.current && !profilRef.current.contains(e.target)) setShowProfil(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    const startHandler = () => {
      setCallActive(true);
      setCallSeconds(0);
      timerRef.current = setInterval(() => setCallSeconds(s => s + 1), 1000);
    };
    const stopHandler = () => {
      setCallActive(false);
      setCallSeconds(0);
      clearInterval(timerRef.current);
    };
    window.addEventListener("callStarted", startHandler);
    window.addEventListener("callEnded", stopHandler);
    return () => {
      window.removeEventListener("callStarted", startHandler);
      window.removeEventListener("callEnded", stopHandler);
      clearInterval(timerRef.current);
    };
  }, []);

  const formatTime = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  const formatSession = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (h > 0) return `${h}h${m.toString().padStart(2, "0")}m`;
    return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  const getRoleColor = (role: string) => ({
    manager:     { bg: "#FEF3C7", color: "#D97706" },
    crc:         { bg: "#DBEAFE", color: "#1D4ED8" },
    crl:         { bg: "#F3E8FF", color: "#6D28D9" },
    livreur:     { bg: "#DCFCE7", color: "#166534" },
    media_buyer: { bg: "#FCE7F3", color: "#DB2777" },
    stock:       { bg: "#FFF7ED", color: "#C2410C" },
    comptable:   { bg: "#F0FDF4", color: "#15803D" },
  }[role?.toLowerCase()] || { bg: "#F3F4F6", color: "#374151" });

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  const roleCfg = getRoleColor(currentProfile?.role);

  return (
    <div style={{
      position: "fixed", top: 0, left: 240, right: 0, height: 56,
      background: "white", borderBottom: "1px solid #E5E7EB",
      display: "flex", alignItems: "center", gap: 12,
      padding: "0 20px", zIndex: 100,
      boxShadow: "0 1px 4px rgba(0,0,0,0.06)"
    }}>

      {/* GAUCHE — Avatar + Nom + Rôle */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
        <div style={{ width: 32, height: 32, borderRadius: "50%", background: roleCfg.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, color: roleCfg.color }}>
          {currentProfile?.nom?.charAt(0)?.toUpperCase() || "?"}
        </div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#1E3A5F", lineHeight: 1.2 }}>
            {currentProfile?.nom || currentUser?.email?.split("@")[0] || "—"}
          </div>
          <div style={{ display: "flex", gap: 6, alignItems: "center", marginTop: 2 }}>
            <span style={{ background: roleCfg.bg, color: roleCfg.color, padding: "1px 6px", borderRadius: 6, fontSize: 10, fontWeight: 700 }}>
              {currentProfile?.role?.toUpperCase() || "—"}
            </span>
            {currentProfile?.sip && (
              <span style={{ background: "#DBEAFE", color: "#1D4ED8", padding: "1px 6px", borderRadius: 6, fontSize: 10, fontWeight: 700 }}>
                📡 {currentProfile.sip}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Séparateur */}
      <div style={{ width: 1, height: 28, background: "#E5E7EB", flexShrink: 0 }} />

      {/* Barre de recherche — juste après le profil, à gauche */}
      {showRecherche && (
        <div style={{ width: 280, flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#F9FAFB", border: "1.5px solid #E5E7EB", borderRadius: 20, padding: "5px 12px" }}>
            <span style={{ fontSize: 12, color: "#9CA3AF" }}>🔍</span>
            <input
              placeholder="Rechercher..."
              value={recherche}
              onChange={e => onRecherche?.(e.target.value)}
              style={{ flex: 1, border: "none", outline: "none", fontSize: 12, background: "transparent", color: "#111827" }}
            />
            {recherche && (
              <button onClick={() => onRecherche?.("")} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "#9CA3AF", padding: 0 }}>✕</button>
            )}
          </div>
        </div>
      )}

      {/* CENTRE — Timer session + Timer appel */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: 20, padding: "5px 14px" }}>
          <span style={{ fontSize: 11, color: "#6B7280" }}>⏱ Session</span>
          <span style={{ fontSize: 13, fontWeight: 800, color: "#1E3A5F" }}>{formatSession(sessionSeconds)}</span>
        </div>
        {callActive && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#ECFDF5", border: "1px solid #10B981", borderRadius: 20, padding: "5px 14px" }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#10B981" }} />
            <span style={{ fontSize: 13, fontWeight: 800, color: "#10B981" }}>{formatTime(callSeconds)}</span>
            <span style={{ fontSize: 11, color: "#065F46" }}>Appel en cours</span>
            {callSeconds >= 150 && (
              <span style={{ background: "#FEF2F2", color: "#EF4444", padding: "2px 8px", borderRadius: 8, fontSize: 11, fontWeight: 700 }}>⚠️ 3min</span>
            )}
          </div>
        )}
      </div>

      {/* DROITE — Notifications + Profil */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>

        <div ref={notifRef} style={{ position: "relative" }}>
          <button onClick={() => setShowNotifs(!showNotifs)}
            style={{ width: 34, height: 34, background: showNotifs ? "#EFF6FF" : "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: 10, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, position: "relative" }}>
            🔔
          </button>
          {showNotifs && (
            <div style={{ position: "absolute", top: 42, right: 0, width: 280, background: "white", borderRadius: 12, boxShadow: "0 8px 32px rgba(0,0,0,0.15)", border: "1px solid #E5E7EB", zIndex: 200 }}>
              <div style={{ padding: "12px 16px", borderBottom: "1px solid #E5E7EB", fontWeight: 700, fontSize: 13, color: "#1E3A5F" }}>🔔 Notifications</div>
              <div style={{ padding: "28px 16px", textAlign: "center", color: "#9CA3AF", fontSize: 13 }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>✅</div>Aucune notification
              </div>
            </div>
          )}
        </div>

        <div ref={profilRef} style={{ position: "relative" }}>
          <button onClick={() => setShowProfil(!showProfil)}
            style={{ display: "flex", alignItems: "center", gap: 8, background: showProfil ? "#EFF6FF" : "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: 10, padding: "5px 10px", cursor: "pointer" }}>
            <div style={{ width: 24, height: 24, borderRadius: "50%", background: roleCfg.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: roleCfg.color }}>
              {currentProfile?.nom?.charAt(0)?.toUpperCase() || "?"}
            </div>
            <span style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>{currentProfile?.nom?.split(" ")[0] || "Profil"}</span>
            <span style={{ fontSize: 10, color: "#9CA3AF" }}>▾</span>
          </button>
          {showProfil && (
            <div style={{ position: "absolute", top: 42, right: 0, width: 220, background: "white", borderRadius: 12, boxShadow: "0 8px 32px rgba(0,0,0,0.15)", border: "1px solid #E5E7EB", zIndex: 200 }}>
              <div style={{ padding: 14, borderBottom: "1px solid #E5E7EB" }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: "#1E3A5F" }}>{currentProfile?.nom || "—"}</div>
                <div style={{ fontSize: 11, color: "#6B7280", marginTop: 2 }}>{currentUser?.email || "—"}</div>
                <div style={{ marginTop: 8, display: "flex", gap: 6, flexWrap: "wrap" }}>
                  <span style={{ background: roleCfg.bg, color: roleCfg.color, padding: "2px 8px", borderRadius: 6, fontSize: 10, fontWeight: 700 }}>
                    {currentProfile?.role?.toUpperCase() || "—"}
                  </span>
                  {currentProfile?.sip && (
                    <span style={{ background: "#DBEAFE", color: "#1D4ED8", padding: "2px 8px", borderRadius: 6, fontSize: 10, fontWeight: 700 }}>
                      📡 SIP: {currentProfile.sip}
                    </span>
                  )}
                </div>
              </div>
              <div style={{ padding: 8 }}>
                <button onClick={handleLogout}
                  style={{ width: "100%", padding: "10px 14px", background: "#FEF2F2", color: "#EF4444", border: "none", borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: "pointer", textAlign: "left" }}>
                  🚪 Se déconnecter
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}