"use client";
import { useState } from "react";

export default function Livreur() {
  const [tab, setTab] = useState("commandes");

  return (
    <div style={{ minHeight: "100vh", background: "#F3F4F6", fontFamily: "Arial, sans-serif" }}>

      {/* Header */}
      <div style={{
        background: "linear-gradient(135deg, #1E40AF, #3B82F6)",
        padding: "20px 32px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 28 }}>🌍</span>
          <h1 style={{ color: "white", margin: 0, fontSize: 22, fontWeight: 800 }}>
            Valor Africa
          </h1>
        </div>
        <span style={{ color: "white", fontSize: 14 }}>🚗 Livreur</span>
      </div>

      {/* Tabs */}
      <div style={{ padding: "24px 32px 0" }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
          {[
            { id: "commandes", label: "📦 Mes commandes" },
            { id: "historique", label: "📈 Historique" },
          ].map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              padding: "10px 20px",
              borderRadius: 8,
              border: "none",
              cursor: "pointer",
              fontWeight: 600,
              fontSize: 13,
              background: tab === t.id ? "#3B82F6" : "white",
              color: tab === t.id ? "white" : "#374151",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
            }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab: Mes commandes */}
        {tab === "commandes" && (
          <div>
            {/* Alerte importante */}
            <div style={{
              background: "#FEF2F2",
              border: "1px solid #EF4444",
              borderRadius: 12,
              padding: "14px 20px",
              marginBottom: 20,
              fontSize: 13,
              color: "#EF4444",
              fontWeight: 600
            }}>
              ⚠️ Pour toute modification de prix ou quantité → Contacter votre agent via WhatsApp
            </div>

            <div style={{ background: "white", borderRadius: 16, padding: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
              <h2 style={{ margin: "0 0 20px", color: "#1E40AF" }}>📦 Mes commandes du jour</h2>
              <div style={{ textAlign: "center", padding: "48px 0", color: "#9CA3AF" }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🚗</div>
                <div>Aucune commande assignée aujourd'hui</div>
              </div>
            </div>

            {/* Guide statuts */}
            <div style={{ background: "white", borderRadius: 16, padding: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.08)", marginTop: 20 }}>
              <h3 style={{ margin: "0 0 16px", color: "#1E40AF" }}>📋 Guide des statuts</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {[
                  { statut: "🚗 En route", quand: "Tu pars vers le client", bg: "#EFF6FF", color: "#3B82F6" },
                  { statut: "✅ Livré", quand: "Client a accepté et payé", bg: "#ECFDF5", color: "#10B981" },
                  { statut: "⚠️ Absent", quand: "Client pas chez lui", bg: "#FFFBEB", color: "#F59E0B" },
                  { statut: "❌ Refusé", quand: "Client refuse la commande", bg: "#FEF2F2", color: "#EF4444" },
                  { statut: "📵 Injoignable", quand: "Téléphone éteint", bg: "#F5F3FF", color: "#8B5CF6" },
                  { statut: "↩️ Retour", quand: "Après 3 tentatives échouées", bg: "#F9FAFB", color: "#6B7280" },
                ].map(s => (
                  <div key={s.statut} style={{
                    background: s.bg,
                    borderRadius: 10,
                    padding: "12px 16px",
                    borderLeft: `3px solid ${s.color}`
                  }}>
                    <div style={{ fontWeight: 700, color: s.color, fontSize: 14 }}>{s.statut}</div>
                    <div style={{ fontSize: 12, color: "#6B7280", marginTop: 4 }}>{s.quand}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab: Historique */}
        {tab === "historique" && (
          <div style={{ background: "white", borderRadius: 16, padding: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
            <h2 style={{ margin: "0 0 20px", color: "#1E40AF" }}>📈 Mon historique</h2>
            <div style={{ textAlign: "center", padding: "48px 0", color: "#9CA3AF" }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>📈</div>
              <div>Aucune livraison effectuée pour le moment</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}