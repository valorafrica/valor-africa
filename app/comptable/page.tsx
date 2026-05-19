"use client";
import { useState } from "react";

export default function Comptable() {
  const [tab, setTab] = useState("rapport");

  return (
    <div style={{ minHeight: "100vh", background: "#F3F4F6", fontFamily: "Arial, sans-serif" }}>

      {/* Header */}
      <div style={{
        background: "linear-gradient(135deg, #991B1B, #EF4444)",
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
        <span style={{ color: "white", fontSize: 14 }}>💰 Équipe Comptable</span>
      </div>

      {/* Tabs */}
      <div style={{ padding: "24px 32px 0" }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
          {[
            { id: "rapport", label: "💰 Rapport J+1" },
            { id: "societes", label: "🏢 Par société" },
            { id: "tresorerie", label: "📅 Trésorerie" },
          ].map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              padding: "10px 20px",
              borderRadius: 8,
              border: "none",
              cursor: "pointer",
              fontWeight: 600,
              fontSize: 13,
              background: tab === t.id ? "#EF4444" : "white",
              color: tab === t.id ? "white" : "#374151",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
            }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab: Rapport J+1 */}
        {tab === "rapport" && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
              {[
                { label: "CA Total", value: "0", color: "#10B981", icon: "💰" },
                { label: "Frais livraison", value: "0", color: "#F59E0B", icon: "🚚" },
                { label: "Net à recevoir", value: "0", color: "#6366F1", icon: "✅" },
                { label: "Retours/Refus", value: "0", color: "#EF4444", icon: "↩️" },
              ].map(kpi => (
                <div key={kpi.label} style={{
                  background: "white",
                  borderRadius: 12,
                  padding: 20,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                  borderLeft: `4px solid ${kpi.color}`
                }}>
                  <div style={{ fontSize: 24 }}>{kpi.icon}</div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: kpi.color, marginTop: 8 }}>{kpi.value}</div>
                  <div style={{ fontSize: 13, color: "#6B7280", marginTop: 4 }}>{kpi.label}</div>
                </div>
              ))}
            </div>

            <div style={{ background: "white", borderRadius: 16, padding: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <h2 style={{ margin: 0, color: "#991B1B" }}>💰 Rapport financier J+1</h2>
                <button style={{
                  padding: "10px 20px",
                  background: "#EF4444",
                  color: "white",
                  border: "none",
                  borderRadius: 8,
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: "pointer"
                }}>
                  📥 Exporter Excel
                </button>
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#F9FAFB" }}>
                    {["Date", "ID", "Client", "Marché", "Produit", "Prix", "Société", "Frais", "Statut", "Net"].map(h => (
                      <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, color: "#6B7280", fontWeight: 600, borderBottom: "1px solid #E5E7EB" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td colSpan={10} style={{ padding: "48px", textAlign: "center", color: "#9CA3AF" }}>
                      <div style={{ fontSize: 48, marginBottom: 12 }}>💰</div>
                      Aucune livraison à afficher
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab: Par société */}
        {tab === "societes" && (
          <div style={{ background: "white", borderRadius: 16, padding: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
            <h2 style={{ margin: "0 0 20px", color: "#991B1B" }}>🏢 Récap par société de livraison</h2>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#F9FAFB" }}>
                  {["Société", "Marché", "Livrés", "Retours", "CA Brut", "Frais", "Net", "Virement prévu"].map(h => (
                    <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 13, color: "#6B7280", fontWeight: 600, borderBottom: "1px solid #E5E7EB" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan={8} style={{ padding: "48px", textAlign: "center", color: "#9CA3AF" }}>
                    <div style={{ fontSize: 48, marginBottom: 12 }}>🏢</div>
                    Aucune société configurée
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* Tab: Trésorerie */}
        {tab === "tresorerie" && (
          <div style={{ background: "white", borderRadius: 16, padding: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
            <h2 style={{ margin: "0 0 20px", color: "#991B1B" }}>📅 Prévision trésorerie</h2>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#F9FAFB" }}>
                  {["Date virement prévu", "Société", "Marché", "Montant attendu", "Reçu ?", "Date réception"].map(h => (
                    <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 13, color: "#6B7280", fontWeight: 600, borderBottom: "1px solid #E5E7EB" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan={6} style={{ padding: "48px", textAlign: "center", color: "#9CA3AF" }}>
                    <div style={{ fontSize: 48, marginBottom: 12 }}>📅</div>
                    Aucun virement prévu
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}