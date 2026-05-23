"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import Sidebar from "../components/Sidebar";

export default function Dashboard() {
  const [leads, setLeads] = useState<any[]>([]);
  const [stocks, setStocks] = useState<any[]>([]);

  const fetchData = async () => {
    const { data: leadsData } = await supabase.from("Leads").select("*").order("created_at", { ascending: false });
    const { data: stocksData } = await supabase.from("Stocks").select("*");
    if (leadsData) setLeads(leadsData);
    if (stocksData) setStocks(stocksData);
  };

  useEffect(() => { fetchData(); }, []);

  const kpis = [
    { label: "Total Leads", value: leads.length, color: "#3B82F6", bg: "#EFF6FF", icon: "📋" },
    { label: "Confirmés", value: leads.filter(l => l.statut === "Confirmé").length, color: "#10B981", bg: "#ECFDF5", icon: "✅" },
    { label: "En cours", value: leads.filter(l => l.statut === "En cours").length, color: "#8B5CF6", bg: "#F5F3FF", icon: "🚚" },
    { label: "Livrés", value: leads.filter(l => l.statut === "Livré").length, color: "#064E3B", bg: "#ECFDF5", icon: "✔️" },
    { label: "Annulés", value: leads.filter(l => l.statut === "Annulé").length, color: "#EF4444", bg: "#FEF2F2", icon: "❌" },
    { label: "Retours", value: leads.filter(l => l.statut === "Retour").length, color: "#F97316", bg: "#FFF7ED", icon: "↩️" },
    { label: "Stock alertes", value: stocks.filter(s => (s.stock_total - s.stock_reserve - s.stock_livre + s.stock_retour) < s.seuil_alerte).length, color: "#F59E0B", bg: "#FFFBEB", icon: "⚠️" },
    { label: "CA Total", value: leads.filter(l => l.statut === "Livré").reduce((sum, l) => sum + (l.prix || 0), 0), color: "#10B981", bg: "#ECFDF5", icon: "💰" },
  ];

  const marches = [
    { pays: "🇩🇿 Algérie", code: "DZ", currency: "DA" },
    { pays: "🇲🇦 Maroc", code: "MA", currency: "MAD" },
    { pays: "🇹🇳 Tunisie", code: "TN", currency: "TND" },
  ];

  const alertes = stocks.filter(s => (s.stock_total - s.stock_reserve - s.stock_livre + s.stock_retour) < s.seuil_alerte);

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#F0F4F8" }}>
      <Sidebar role="👑 Manager" />
      <div style={{ marginLeft: 240, flex: 1, padding: 32 }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: "#1E3A5F" }}>Tableau de bord</h1>
            <p style={{ margin: "4px 0 0", color: "#6B7280", fontSize: 14 }}>Vue globale des opérations</p>
          </div>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <button onClick={fetchData} style={{ padding: "8px 16px", background: "#1E3A5F", color: "white", border: "none", borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
              🔄 Actualiser
            </button>
            <div style={{ background: "white", borderRadius: 10, padding: "8px 16px", fontSize: 13, color: "#6B7280", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
              📅 {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </div>
          </div>
        </div>

        {/* KPIs */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20, marginBottom: 32 }}>
          {kpis.map((kpi) => (
            <div key={kpi.label} style={{
              background: "white", borderRadius: 16, padding: "20px 24px",
              boxShadow: "0 1px 4px rgba(0,0,0,0.08)", borderTop: `4px solid ${kpi.color}`,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: kpi.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>
                  {kpi.icon}
                </div>
              </div>
              <div style={{ fontSize: 32, fontWeight: 800, color: kpi.color, marginTop: 12 }}>{kpi.value}</div>
              <div style={{ fontSize: 13, color: "#6B7280", marginTop: 4 }}>{kpi.label}</div>
            </div>
          ))}
        </div>

        {/* Par marché */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20, marginBottom: 32 }}>
          {marches.map((m) => {
            const mLeads = leads.filter(l => l.marche === m.code);
            const ca = mLeads.filter(l => l.statut === "Livré").reduce((sum, l) => sum + (l.prix || 0), 0);
            return (
              <div key={m.code} style={{ background: "white", borderRadius: 16, padding: 24, boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
                <h3 style={{ margin: "0 0 16px", fontSize: 16, color: "#1E3A5F" }}>{m.pays}</h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  {[
                    { label: "Leads", value: mLeads.length, color: "#3B82F6" },
                    { label: "Confirmés", value: mLeads.filter(l => l.statut === "Confirmé").length, color: "#10B981" },
                    { label: "Livrés", value: mLeads.filter(l => l.statut === "Livré").length, color: "#6366F1" },
                    { label: `CA (${m.currency})`, value: ca, color: "#F59E0B" },
                  ].map(s => (
                    <div key={s.label} style={{ background: "#F9FAFB", borderRadius: 10, padding: "10px 14px" }}>
                      <div style={{ fontSize: 18, fontWeight: 800, color: s.color }}>{s.value}</div>
                      <div style={{ fontSize: 12, color: "#6B7280" }}>{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          {/* Derniers leads */}
          <div style={{ background: "white", borderRadius: 16, padding: 24, boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
            <h3 style={{ margin: "0 0 20px", fontSize: 16, color: "#1E3A5F" }}>📋 Derniers leads</h3>
            {leads.slice(0, 8).map((lead, i) => (
              <div key={lead.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: i < 7 ? "1px solid #F3F4F6" : "none" }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{lead.nom_client}</div>
                  <div style={{ fontSize: 12, color: "#6B7280" }}>{lead.produit} · {lead.marche} · {lead.ville}</div>
                </div>
                <span style={{
                  background: lead.statut === "Confirmé" ? "#ECFDF5" : lead.statut === "Annulé" ? "#FEF2F2" : "#EFF6FF",
                  color: lead.statut === "Confirmé" ? "#10B981" : lead.statut === "Annulé" ? "#EF4444" : "#3B82F6",
                  padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600
                }}>{lead.statut}</span>
              </div>
            ))}
            {leads.length === 0 && (
              <div style={{ textAlign: "center", padding: "32px 0", color: "#9CA3AF" }}>
                <div style={{ fontSize: 40, marginBottom: 8 }}>📋</div>
                <div>Aucun lead pour le moment</div>
              </div>
            )}
          </div>

          {/* Alertes stock */}
          <div style={{ background: "white", borderRadius: 16, padding: 24, boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
            <h3 style={{ margin: "0 0 20px", fontSize: 16, color: "#1E3A5F" }}>⚠️ Alertes Stock</h3>
            {alertes.length === 0 ? (
              <div style={{ textAlign: "center", padding: "32px 0", color: "#9CA3AF" }}>
                <div style={{ fontSize: 40, marginBottom: 8 }}>✅</div>
                <div>Aucune alerte stock</div>
              </div>
            ) : alertes.map((s, i) => {
              const dispo = s.stock_total - s.stock_reserve - s.stock_livre + s.stock_retour;
              const isRupture = dispo === 0;
              return (
                <div key={s.id} style={{ padding: "12px 16px", background: isRupture ? "#FEF2F2" : "#FFFBEB", borderRadius: 10, marginBottom: 10, borderLeft: `3px solid ${isRupture ? "#EF4444" : "#F59E0B"}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{s.produit}</div>
                      <div style={{ fontSize: 12, color: "#6B7280" }}>Marché : {s.marche} · Dispo : {dispo}</div>
                    </div>
                    <span style={{ fontWeight: 800, color: isRupture ? "#EF4444" : "#F59E0B", fontSize: 12 }}>
                      {isRupture ? "🔴 RUPTURE" : "⚠️ FAIBLE"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}