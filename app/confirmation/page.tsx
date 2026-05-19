"use client";
import { useState } from "react";

export default function Confirmation() {
  const [tab, setTab] = useState("leads");

  return (
    <div style={{ minHeight: "100vh", background: "#F3F4F6", fontFamily: "Arial, sans-serif" }}>

      {/* Header */}
      <div style={{
        background: "linear-gradient(135deg, #92400E, #F59E0B)",
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
        <span style={{ color: "white", fontSize: 14 }}>📞 Agent Confirmation (CRC)</span>
      </div>

      {/* Tabs */}
      <div style={{ padding: "24px 32px 0" }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
          {[
            { id: "leads", label: "📋 Leads à traiter" },
            { id: "confirmes", label: "✅ Confirmés" },
            { id: "stock", label: "📦 Stock" },
            { id: "performance", label: "📊 Performance" },
          ].map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              padding: "10px 20px",
              borderRadius: 8,
              border: "none",
              cursor: "pointer",
              fontWeight: 600,
              fontSize: 13,
              background: tab === t.id ? "#F59E0B" : "white",
              color: tab === t.id ? "white" : "#374151",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
            }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab: Leads à traiter */}
        {tab === "leads" && (
          <div style={{ background: "white", borderRadius: 16, padding: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
            <h2 style={{ margin: "0 0 20px", color: "#92400E" }}>📋 Leads à traiter</h2>
            <div style={{ textAlign: "center", padding: "48px 0", color: "#9CA3AF" }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>📞</div>
              <div>Aucun lead à traiter pour le moment</div>
            </div>
          </div>
        )}

        {/* Tab: Confirmés */}
        {tab === "confirmes" && (
          <div style={{ background: "white", borderRadius: 16, padding: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
            <h2 style={{ margin: "0 0 20px", color: "#92400E" }}>✅ Commandes confirmées</h2>
            <div style={{ textAlign: "center", padding: "48px 0", color: "#9CA3AF" }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
              <div>Aucune commande confirmée aujourd'hui</div>
            </div>
          </div>
        )}

        {/* Tab: Stock */}
        {tab === "stock" && (
          <div style={{ background: "white", borderRadius: 16, padding: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
            <h2 style={{ margin: "0 0 20px", color: "#92400E" }}>📦 Stock disponible</h2>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#F9FAFB" }}>
                  {["Produit", "Marché", "Stock dispo", "Statut", "Confirmation autorisée ?"].map(h => (
                    <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 13, color: "#6B7280", fontWeight: 600, borderBottom: "1px solid #E5E7EB" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan={5} style={{ padding: "48px", textAlign: "center", color: "#9CA3AF" }}>
                    Aucun produit en stock
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* Tab: Performance */}
        {tab === "performance" && (
          <div style={{ background: "white", borderRadius: 16, padding: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
            <h2 style={{ margin: "0 0 20px", color: "#92400E" }}>📊 Ma Performance</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
              {[
                { label: "Leads reçus", value: "0", color: "#F59E0B" },
                { label: "Confirmés", value: "0", color: "#10B981" },
                { label: "Annulés", value: "0", color: "#EF4444" },
                { label: "Taux confirmation", value: "0%", color: "#6366F1" },
              ].map(kpi => (
                <div key={kpi.label} style={{
                  background: "#F9FAFB",
                  borderRadius: 12,
                  padding: 20,
                  borderLeft: `4px solid ${kpi.color}`
                }}>
                  <div style={{ fontSize: 28, fontWeight: 800, color: kpi.color }}>{kpi.value}</div>
                  <div style={{ fontSize: 13, color: "#6B7280", marginTop: 4 }}>{kpi.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}