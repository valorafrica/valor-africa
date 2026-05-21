"use client";
import Sidebar from "../components/Sidebar";

export default function Dashboard() {
  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#F0F4F8" }}>
      <Sidebar role="👑 Manager" />

      {/* Main content */}
      <div style={{ marginLeft: 240, flex: 1, padding: 32 }}>

        {/* Header */}
        <div style={{
          display: "flex", justifyContent: "space-between",
          alignItems: "center", marginBottom: 32
        }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: "#1E3A5F" }}>
              Tableau de bord
            </h1>
            <p style={{ margin: "4px 0 0", color: "#6B7280", fontSize: 14 }}>
              Vue globale des opérations
            </p>
          </div>
          <div style={{
            background: "white", borderRadius: 10, padding: "8px 16px",
            fontSize: 13, color: "#6B7280", boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
          }}>
            📅 {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </div>
        </div>

        {/* KPIs */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20, marginBottom: 32 }}>
          {[
            { label: "Total Leads", value: "0", color: "#3B82F6", bg: "#EFF6FF", icon: "📋", trend: "+0%" },
            { label: "Confirmés", value: "0", color: "#10B981", bg: "#ECFDF5", icon: "✅", trend: "+0%" },
            { label: "En livraison", value: "0", color: "#F59E0B", bg: "#FFFBEB", icon: "🚚", trend: "+0%" },
            { label: "Livrés", value: "0", color: "#6366F1", bg: "#EEF2FF", icon: "✔️", trend: "+0%" },
            { label: "Annulés", value: "0", color: "#EF4444", bg: "#FEF2F2", icon: "❌", trend: "+0%" },
            { label: "Retours", value: "0", color: "#8B5CF6", bg: "#F5F3FF", icon: "↩️", trend: "+0%" },
            { label: "Stock alertes", value: "0", color: "#F97316", bg: "#FFF7ED", icon: "⚠️", trend: "" },
            { label: "CA Total", value: "0", color: "#064E3B", bg: "#ECFDF5", icon: "💰", trend: "+0%" },
          ].map((kpi) => (
            <div key={kpi.label} style={{
              background: "white",
              borderRadius: 16,
              padding: "20px 24px",
              boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
              borderTop: `4px solid ${kpi.color}`,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12,
                  background: kpi.bg, display: "flex",
                  alignItems: "center", justifyContent: "center", fontSize: 22
                }}>
                  {kpi.icon}
                </div>
                {kpi.trend && (
                  <span style={{ fontSize: 12, color: "#10B981", fontWeight: 600, background: "#ECFDF5", padding: "2px 8px", borderRadius: 20 }}>
                    {kpi.trend}
                  </span>
                )}
              </div>
              <div style={{ fontSize: 32, fontWeight: 800, color: kpi.color, marginTop: 12 }}>{kpi.value}</div>
              <div style={{ fontSize: 13, color: "#6B7280", marginTop: 4 }}>{kpi.label}</div>
            </div>
          ))}
        </div>

        {/* Par marché */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20, marginBottom: 32 }}>
          {[
            { pays: "🇩🇿 Algérie", leads: 0, confirmes: 0, livres: 0, ca: "0 DA" },
            { pays: "🇲🇦 Maroc", leads: 0, confirmes: 0, livres: 0, ca: "0 MAD" },
            { pays: "🇹🇳 Tunisie", leads: 0, confirmes: 0, livres: 0, ca: "0 TND" },
          ].map((m) => (
            <div key={m.pays} style={{
              background: "white", borderRadius: 16, padding: 24,
              boxShadow: "0 1px 4px rgba(0,0,0,0.08)"
            }}>
              <h3 style={{ margin: "0 0 16px", fontSize: 16, color: "#1E3A5F" }}>{m.pays}</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {[
                  { label: "Leads", value: m.leads, color: "#3B82F6" },
                  { label: "Confirmés", value: m.confirmes, color: "#10B981" },
                  { label: "Livrés", value: m.livres, color: "#6366F1" },
                  { label: "CA", value: m.ca, color: "#F59E0B" },
                ].map(s => (
                  <div key={s.label} style={{
                    background: "#F9FAFB", borderRadius: 10, padding: "10px 14px"
                  }}>
                    <div style={{ fontSize: 18, fontWeight: 800, color: s.color }}>{s.value}</div>
                    <div style={{ fontSize: 12, color: "#6B7280" }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Derniers leads */}
        <div style={{ background: "white", borderRadius: 16, padding: 24, boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
          <h3 style={{ margin: "0 0 20px", fontSize: 16, color: "#1E3A5F" }}>📋 Derniers leads</h3>
          <div style={{ textAlign: "center", padding: "40px 0", color: "#9CA3AF" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
            <div>Aucun lead pour le moment</div>
          </div>
        </div>
      </div>
    </div>
  );
}