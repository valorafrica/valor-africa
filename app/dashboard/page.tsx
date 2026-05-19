export default function Dashboard() {
  return (
    <div style={{
      minHeight: "100vh",
      background: "#F3F4F6",
      fontFamily: "Arial, sans-serif"
    }}>
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
        <span style={{ color: "white", fontSize: 14 }}>
          👋 Bienvenue Manager
        </span>
      </div>

      <div style={{ padding: 32 }}>
        <h2 style={{ color: "#1E3A5F", marginBottom: 24 }}>
          🎯 Tableau de bord
        </h2>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
          {[
            { label: "Total Leads", value: "0", color: "#3B82F6", icon: "📋" },
            { label: "Confirmés", value: "0", color: "#10B981", icon: "✅" },
            { label: "En livraison", value: "0", color: "#F59E0B", icon: "🚚" },
            { label: "Livrés", value: "0", color: "#6366F1", icon: "✔️" },
            { label: "Annulés", value: "0", color: "#EF4444", icon: "❌" },
            { label: "Retours", value: "0", color: "#8B5CF6", icon: "↩️" },
          ].map((kpi) => (
            <div key={kpi.label} style={{
              background: "white",
              borderRadius: 16,
              padding: "24px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
              borderLeft: `4px solid ${kpi.color}`
            }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>{kpi.icon}</div>
              <div style={{ fontSize: 36, fontWeight: 800, color: kpi.color }}>
                {kpi.value}
              </div>
              <div style={{ fontSize: 14, color: "#6B7280", marginTop: 4 }}>
                {kpi.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}