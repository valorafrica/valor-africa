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
      background: "linear-gradient(135deg, #1E3A5F 0%, #2E6DA4 100%)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "Arial, sans-serif"
    }}>
      <div style={{
        background: "white", borderRadius: 20, padding: "48px 40px",
        width: "100%", maxWidth: 420, boxShadow: "0 20px 60px rgba(0,0,0,0.3)"
      }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <img src="/logo.svg" alt="Valor Africa" style={{ height: 60, width: "auto", marginBottom: 16 }} />
          <p style={{ color: "#6B7280", marginTop: 8, fontSize: 14 }}>
            Plateforme de gestion des opérations
          </p>
        </div>

        {error && (
          <div style={{ background: "#FEF2F2", border: "1px solid #EF4444", borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 13, color: "#EF4444", textAlign: "center" }}>
            {error}
          </div>
        )}

        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Email</label>
          <input type="email" placeholder="votre@email.com" value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ width: "100%", padding: "12px 16px", border: "2px solid #E5E7EB", borderRadius: 10, fontSize: 14, outline: "none", boxSizing: "border-box" }} />
        </div>

        <div style={{ marginBottom: 24 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Mot de passe</label>
          <input type="password" placeholder="••••••••" value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            style={{ width: "100%", padding: "12px 16px", border: "2px solid #E5E7EB", borderRadius: 10, fontSize: 14, outline: "none", boxSizing: "border-box" }} />
        </div>

        <button onClick={handleLogin} disabled={loading} style={{
          width: "100%", padding: "14px",
          background: loading ? "#9CA3AF" : "linear-gradient(135deg, #1E3A5F, #2E6DA4)",
          color: "white", border: "none", borderRadius: 10,
          fontSize: 16, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer"
        }}>
          {loading ? "Connexion..." : "Se connecter"}
        </button>

        <p style={{ textAlign: "center", marginTop: 20, fontSize: 12, color: "#9CA3AF" }}>
          Accès réservé aux membres de l'équipe
        </p>
      </div>
    </div>
  );
}