"use client";
import { useState } from "react";
import { supabase } from "../lib/supabase";

export default function Home() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    setLoading(true);
    setError("");
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError("Email ou mot de passe incorrect");
      setLoading(false);
      return;
    }
    const { data: profile } = await supabase
      .from("Profiles")
      .select("role, marche")
      .eq("email", email)
      .single();
    if (!profile) {
      setError("Profil introuvable — contactez l'administrateur");
      setLoading(false);
      return;
    }
    switch (profile.role) {
      case "media_buyer": window.location.href = "/media-buyer"; break;
      case "crc": window.location.href = "/confirmation"; break;
      case "crl": window.location.href = "/logistique"; break;
      case "livreur": window.location.href = "/livreur"; break;
      case "stock": window.location.href = "/stock"; break;
      case "comptable": window.location.href = "/comptable"; break;
      case "manager": window.location.href = "/dashboard"; break;
      default: window.location.href = "/dashboard";
    }
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #1E3A5F 0%, #2E6DA4 50%, #1a5276 100%)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "Arial, sans-serif",
      position: "relative",
      overflow: "hidden",
    }}>

      {/* ── Réseau logistique SVG en arrière-plan ── */}
      <svg
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.15 }}
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Lignes du réseau */}
        <g stroke="#F5A623" strokeWidth="1.5" fill="none" opacity="0.8">
          <line x1="120" y1="200" x2="320" y2="130" />
          <line x1="320" y1="130" x2="560" y2="180" />
          <line x1="560" y1="180" x2="750" y2="100" />
          <line x1="750" y1="100" x2="980" y2="160" />
          <line x1="980" y1="160" x2="1180" y2="90" />
          <line x1="1180" y1="90" x2="1360" y2="180" />
          <line x1="120" y1="200" x2="200" y2="420" />
          <line x1="200" y1="420" x2="400" y2="360" />
          <line x1="400" y1="360" x2="560" y2="180" />
          <line x1="400" y1="360" x2="600" y2="480" />
          <line x1="600" y1="480" x2="750" y2="350" />
          <line x1="750" y1="350" x2="980" y2="160" />
          <line x1="750" y1="350" x2="900" y2="500" />
          <line x1="900" y1="500" x2="1100" y2="420" />
          <line x1="1100" y1="420" x2="1180" y2="90" />
          <line x1="1100" y1="420" x2="1300" y2="500" />
          <line x1="1300" y1="500" x2="1360" y2="180" />
          <line x1="200" y1="420" x2="250" y2="650" />
          <line x1="250" y1="650" x2="480" y2="700" />
          <line x1="480" y1="700" x2="600" y2="480" />
          <line x1="480" y1="700" x2="700" y2="750" />
          <line x1="700" y1="750" x2="900" y2="500" />
          <line x1="700" y1="750" x2="950" y2="800" />
          <line x1="950" y1="800" x2="1150" y2="720" />
          <line x1="1150" y1="720" x2="1300" y2="500" />
          <line x1="320" y1="130" x2="400" y2="360" />
          <line x1="750" y1="100" x2="750" y2="350" />
          <line x1="1360" y1="180" x2="1300" y2="500" />
          <line x1="50" y1="600" x2="200" y2="420" />
          <line x1="50" y1="600" x2="250" y2="650" />
          <line x1="1400" y1="650" x2="1300" y2="500" />
          <line x1="1400" y1="650" x2="1150" y2="720" />
        </g>

        {/* Noeuds du réseau — grands */}
        <g fill="#F5A623" opacity="0.9">
          {/* Camion 🚚 */}
          <circle cx="120" cy="200" r="28" fill="#F5A623" />
          <text x="120" y="207" textAnchor="middle" fontSize="22" fill="white">🚚</text>

          {/* Entrepôt */}
          <circle cx="750" cy="100" r="28" fill="#2E6DA4" stroke="#F5A623" strokeWidth="2" />
          <text x="750" y="107" textAnchor="middle" fontSize="22" fill="white">🏭</text>

          {/* Avion */}
          <circle cx="1360" cy="180" r="28" fill="#F5A623" />
          <text x="1360" y="187" textAnchor="middle" fontSize="22" fill="white">✈️</text>

          {/* Colis */}
          <circle cx="600" cy="480" r="28" fill="#2E6DA4" stroke="#F5A623" strokeWidth="2" />
          <text x="600" y="487" textAnchor="middle" fontSize="22" fill="white">📦</text>

          {/* Graphique */}
          <circle cx="1300" cy="500" r="28" fill="#F5A623" />
          <text x="1300" y="507" textAnchor="middle" fontSize="22" fill="white">📊</text>

          {/* Maison / stock */}
          <circle cx="700" cy="750" r="28" fill="#2E6DA4" stroke="#F5A623" strokeWidth="2" />
          <text x="700" y="757" textAnchor="middle" fontSize="22" fill="white">🏠</text>

          {/* Chariot */}
          <circle cx="250" cy="650" r="28" fill="#F5A623" />
          <text x="250" y="657" textAnchor="middle" fontSize="22" fill="white">🛒</text>

          {/* Retour */}
          <circle cx="50" cy="600" r="22" fill="#2E6DA4" stroke="#F5A623" strokeWidth="2" />
          <text x="50" y="607" textAnchor="middle" fontSize="18" fill="white">↩️</text>

          {/* Sac */}
          <circle cx="320" cy="130" r="22" fill="#2E6DA4" stroke="#F5A623" strokeWidth="2" />
          <text x="320" y="137" textAnchor="middle" fontSize="18" fill="white">🛍️</text>
        </g>

        {/* Noeuds secondaires — petits points */}
        <g fill="#F5A623" opacity="0.6">
          <circle cx="560" cy="180" r="8" />
          <circle cx="980" cy="160" r="8" />
          <circle cx="1180" cy="90" r="8" />
          <circle cx="200" cy="420" r="8" />
          <circle cx="400" cy="360" r="8" />
          <circle cx="750" cy="350" r="8" />
          <circle cx="900" cy="500" r="8" />
          <circle cx="1100" cy="420" r="8" />
          <circle cx="480" cy="700" r="8" />
          <circle cx="950" cy="800" r="8" />
          <circle cx="1150" cy="720" r="8" />
          <circle cx="1400" cy="650" r="8" />
        </g>

        {/* Carte du monde simplifiée en blanc très transparent */}
        <g fill="white" opacity="0.04">
          <ellipse cx="400" cy="350" rx="280" ry="180" />
          <ellipse cx="900" cy="320" rx="320" ry="160" />
          <ellipse cx="1200" cy="400" rx="180" ry="120" />
          <ellipse cx="650" cy="600" rx="200" ry="100" />
        </g>
      </svg>

      {/* ── Carte de login ── */}
      <div style={{
        background: "white",
        borderRadius: 24,
        padding: "48px 44px",
        width: "100%",
        maxWidth: 440,
        boxShadow: "0 24px 80px rgba(0,0,0,0.35)",
        position: "relative",
        zIndex: 10,
      }}>

        {/* Logo centré + plus grand */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 16,
          }}>
            <img
              src="/logo.svg"
              alt="Valor Africa"
              style={{ height: 90, width: "auto" }}
            />
          </div>
          <p style={{ color: "#6B7280", margin: 0, fontSize: 14 }}>
            Plateforme de gestion des opérations
          </p>
        </div>

        {error && (
          <div style={{
            background: "#FEF2F2", border: "1px solid #EF4444",
            borderRadius: 8, padding: "10px 14px", marginBottom: 16,
            fontSize: 13, color: "#EF4444", textAlign: "center",
          }}>
            {error}
          </div>
        )}

        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Email</label>
          <input
            type="email"
            placeholder="votre@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{
              width: "100%", padding: "12px 16px",
              border: "2px solid #E5E7EB", borderRadius: 10,
              fontSize: 14, outline: "none", boxSizing: "border-box",
              transition: "border-color 0.2s",
            }}
            onFocus={e => e.target.style.borderColor = "#2E6DA4"}
            onBlur={e => e.target.style.borderColor = "#E5E7EB"}
          />
        </div>

        <div style={{ marginBottom: 28 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Mot de passe</label>
          <input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            style={{
              width: "100%", padding: "12px 16px",
              border: "2px solid #E5E7EB", borderRadius: 10,
              fontSize: 14, outline: "none", boxSizing: "border-box",
            }}
            onFocus={e => e.target.style.borderColor = "#2E6DA4"}
            onBlur={e => e.target.style.borderColor = "#E5E7EB"}
          />
        </div>

        <button
          onClick={handleLogin}
          disabled={loading}
          style={{
            width: "100%", padding: "14px",
            background: loading ? "#9CA3AF" : "linear-gradient(135deg, #1E3A5F, #2E6DA4)",
            color: "white", border: "none", borderRadius: 10,
            fontSize: 16, fontWeight: 700,
            cursor: loading ? "not-allowed" : "pointer",
            boxShadow: loading ? "none" : "0 4px 16px rgba(30,58,95,0.4)",
            transition: "opacity 0.2s",
          }}
        >
          {loading ? "Connexion..." : "Se connecter"}
        </button>

        <p style={{ textAlign: "center", marginTop: 20, fontSize: 12, color: "#9CA3AF" }}>
          Accès réservé aux membres de l'équipe
        </p>
      </div>
    </div>
  );
}