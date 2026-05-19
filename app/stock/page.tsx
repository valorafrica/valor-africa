"use client";
import { useState } from "react";

export default function Stock() {
  const [tab, setTab] = useState("stock");

  return (
    <div style={{ minHeight: "100vh", background: "#F3F4F6", fontFamily: "Arial, sans-serif" }}>

      {/* Header */}
      <div style={{
        background: "linear-gradient(135deg, #4C1D95, #8B5CF6)",
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
        <span style={{ color: "white", fontSize: 14 }}>📦 Équipe Stock</span>
      </div>

      {/* Tabs */}
      <div style={{ padding: "24px 32px 0" }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
          {[
            { id: "stock", label: "📦 Gestion Stock" },
            { id: "alertes", label: "⚠️ Alertes" },
            { id: "mouvements", label: "📊 Mouvements J+1" },
          ].map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              padding: "10px 20px",
              borderRadius: 8,
              border: "none",
              cursor: "pointer",
              fontWeight: 600,
              fontSize: 13,
              background: tab === t.id ? "#8B5CF6" : "white",
              color: tab === t.id ? "white" : "#374151",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
            }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab: Gestion Stock */}
        {tab === "stock" && (
          <div style={{ background: "white", borderRadius: 16, padding: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ margin: 0, color: "#4C1D95" }}>📦 Gestion du Stock</h2>
              <button style={{
                padding: "10px 20px",
                background: "#8B5CF6",
                color: "white",
                border: "none",
                borderRadius: 8,
                fontWeight: 600,
                fontSize: 13,
                cursor: "pointer"
              }}>
                ➕ Ajouter produit
              </button>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#F9FAFB" }}>
                  {["Produit", "Marché", "Stock total", "Réservé", "Livré", "Retour", "Disponible", "Seuil", "Statut", "Actions"].map(h => (
                    <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, color: "#6B7280", fontWeight: 600, borderBottom: "1px solid #E5E7EB" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan={10} style={{ padding: "48px", textAlign: "center", color: "#9CA3AF" }}>
                    <div style={{ fontSize: 48, marginBottom: 12 }}>📦</div>
                    Aucun produit en stock
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* Tab: Alertes */}
        {tab === "alertes" && (
          <div style={{ background: "white", borderRadius: 16, padding: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
            <h2 style={{ margin: "0 0 20px", color: "#4C1D95" }}>⚠️ Alertes Stock</h2>
            <div style={{ textAlign: "center", padding: "48px 0", color: "#9CA3AF" }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
              <div>Aucune alerte stock pour le moment</div>
            </div>
          </div>
        )}

        {/* Tab: Mouvements J+1 */}
        {tab === "mouvements" && (
          <div style={{ background: "white", borderRadius: 16, padding: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
            <h2 style={{ margin: "0 0 20px", color: "#4C1D95" }}>📊 Mouvements Stock J+1</h2>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#F9FAFB" }}>
                  {["Date", "Produit", "Marché", "Livrés", "Retours", "Refus", "Mouvement net", "Stock après"].map(h => (
                    <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 13, color: "#6B7280", fontWeight: 600, borderBottom: "1px solid #E5E7EB" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan={8} style={{ padding: "48px", textAlign: "center", color: "#9CA3AF" }}>
                    Aucun mouvement pour le moment
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