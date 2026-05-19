"use client";
import { useState } from "react";

export default function MediaBuyer() {
  const [tab, setTab] = useState("leads");

  return (
    <div style={{ minHeight: "100vh", background: "#F3F4F6", fontFamily: "Arial, sans-serif" }}>
      
      {/* Header */}
      <div style={{
        background: "linear-gradient(135deg, #1E3A5F, #2E6DA4)",
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
        <span style={{ color: "white", fontSize: 14 }}>📊 Media Buyer</span>
      </div>

      {/* Tabs */}
      <div style={{ padding: "24px 32px 0" }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
          {[
            { id: "leads", label: "📤 Mes Leads" },
            { id: "upload", label: "➕ Nouveau Lead" },
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
              background: tab === t.id ? "#6366F1" : "white",
              color: tab === t.id ? "white" : "#374151",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
            }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab: Mes Leads */}
        {tab === "leads" && (
          <div style={{ background: "white", borderRadius: 16, padding: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
            <h2 style={{ margin: "0 0 20px", color: "#1E3A5F" }}>📋 Mes Leads</h2>
            <div style={{ textAlign: "center", padding: "48px 0", color: "#9CA3AF" }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
              <div>Aucun lead pour le moment</div>
              <div style={{ fontSize: 13, marginTop: 8 }}>Clique sur "Nouveau Lead" pour commencer</div>
            </div>
          </div>
        )}

        {/* Tab: Nouveau Lead */}
        {tab === "upload" && (
          <div style={{ background: "white", borderRadius: 16, padding: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
            <h2 style={{ margin: "0 0 20px", color: "#1E3A5F" }}>➕ Nouveau Lead</h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              {[
                ["Nom complet", "text", "Ex: Karim Benali"],
                ["Téléphone", "text", "Ex: +213 555 0101"],
                ["Produit", "text", "Ex: Chaussures X3"],
                ["Prix", "number", "Ex: 2900"],
                ["Ville / Wilaya", "text", "Ex: Oran"],
                ["Source campagne", "text", "Ex: Facebook - Camp. Mai"],
              ].map(([label, type, placeholder]) => (
                <div key={label as string}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>
                    {label as string}
                  </label>
                  <input type={type as string} placeholder={placeholder as string} style={{
                    width: "100%",
                    padding: "10px 14px",
                    border: "2px solid #E5E7EB",
                    borderRadius: 8,
                    fontSize: 14,
                    outline: "none",
                    boxSizing: "border-box"
                  }} />
                </div>
              ))}
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>
                  Marché
                </label>
                <select style={{
                  width: "100%",
                  padding: "10px 14px",
                  border: "2px solid #E5E7EB",
                  borderRadius: 8,
                  fontSize: 14,
                  outline: "none",
                  boxSizing: "border-box"
                }}>
                  <option value="DZ">🇩🇿 Algérie</option>
                  <option value="MA">🇲🇦 Maroc</option>
                  <option value="TN">🇹🇳 Tunisie</option>
                </select>
              </div>
            </div>
            <button style={{
              marginTop: 24,
              padding: "12px 32px",
              background: "#6366F1",
              color: "white",
              border: "none",
              borderRadius: 10,
              fontWeight: 700,
              fontSize: 14,
              cursor: "pointer"
            }}>
              ➕ Ajouter le lead
            </button>
          </div>
        )}

        {/* Tab: Stock */}
        {tab === "stock" && (
          <div style={{ background: "white", borderRadius: 16, padding: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
            <h2 style={{ margin: "0 0 20px", color: "#1E3A5F" }}>📦 Stock Disponible</h2>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#F9FAFB" }}>
                  {["Produit", "🇩🇿 Algérie", "🇲🇦 Maroc", "🇹🇳 Tunisie", "Action"].map(h => (
                    <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 13, color: "#6B7280", fontWeight: 600, borderBottom: "1px solid #E5E7EB" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan={5} style={{ padding: "48px", textAlign: "center", color: "#9CA3AF" }}>
                    Aucun produit en stock pour le moment
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* Tab: Performance */}
        {tab === "performance" && (
          <div style={{ background: "white", borderRadius: 16, padding: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
            <h2 style={{ margin: "0 0 20px", color: "#1E3A5F" }}>📊 Ma Performance</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
              {[
                { label: "Leads uploadés", value: "0", color: "#6366F1" },
                { label: "Confirmés", value: "0", color: "#10B981" },
                { label: "Livrés", value: "0", color: "#3B82F6" },
                { label: "Taux confirmation", value: "0%", color: "#F59E0B" },
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