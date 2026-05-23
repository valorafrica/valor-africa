"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import Sidebar from "../components/Sidebar";
import withAuth from "../components/withAuth";

function Comptable() {
  const [livraisons, setLivraisons] = useState<any[]>([]);
  const [tab, setTab] = useState("rapport");

  const fetchLivraisons = async () => {
    const { data } = await supabase
      .from("Leads")
      .select("*")
      .in("statut", ["Livré", "Retour", "Refusé", "Absent"])
      .order("created_at", { ascending: false });
    if (data) setLivraisons(data);
  };

  useEffect(() => { fetchLivraisons(); }, []);

  const totalCA = livraisons.filter(l => l.statut === "Livré").reduce((sum, l) => sum + (l.prix || 0), 0);
  const totalLivres = livraisons.filter(l => l.statut === "Livré").length;
  const totalRetours = livraisons.filter(l => l.statut === "Retour" || l.statut === "Refusé").length;

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#F0F4F8" }}>
      <Sidebar role="💰 Comptable" />

      <div style={{ marginLeft: 240, flex: 1, padding: 32 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: "#1E3A5F" }}>Comptabilité</h1>
            <p style={{ margin: "4px 0 0", color: "#6B7280", fontSize: 14 }}>Rapport financier et suivi des paiements</p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {[
              { id: "rapport", label: "💰 Rapport J+1" },
              { id: "societes", label: "🏢 Par société" },
              { id: "tresorerie", label: "📅 Trésorerie" },
            ].map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{
                padding: "10px 20px", borderRadius: 8, border: "none", cursor: "pointer",
                fontWeight: 600, fontSize: 13,
                background: tab === t.id ? "#1E3A5F" : "white",
                color: tab === t.id ? "white" : "#374151",
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
              }}>{t.label}</button>
            ))}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
          {[
            { label: "CA Total", value: totalCA, color: "#10B981", icon: "💰" },
            { label: "Livrés", value: totalLivres, color: "#6366F1", icon: "✅" },
            { label: "Retours/Refus", value: totalRetours, color: "#EF4444", icon: "↩️" },
            { label: "Net estimé", value: totalCA, color: "#1E3A5F", icon: "🏦" },
          ].map(kpi => (
            <div key={kpi.label} style={{ background: "white", borderRadius: 12, padding: "20px", boxShadow: "0 1px 4px rgba(0,0,0,0.08)", borderTop: `3px solid ${kpi.color}` }}>
              <div style={{ fontSize: 24 }}>{kpi.icon}</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: kpi.color, marginTop: 8 }}>{kpi.value}</div>
              <div style={{ fontSize: 13, color: "#6B7280", marginTop: 4 }}>{kpi.label}</div>
            </div>
          ))}
        </div>

        {tab === "rapport" && (
          <div style={{ background: "white", borderRadius: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.08)", overflow: "hidden" }}>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid #E5E7EB", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ margin: 0, fontSize: 16, color: "#1E3A5F" }}>💰 Rapport financier</h2>
              <button style={{ padding: "8px 20px", background: "#10B981", color: "white", border: "none", borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
                📥 Exporter Excel
              </button>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#F9FAFB" }}>
                  {["Client", "Marché", "Ville", "Produit", "Qté", "Prix", "Société Livr.", "Statut", "Net", "Date"].map(h => (
                    <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, color: "#6B7280", fontWeight: 600, borderBottom: "1px solid #E5E7EB" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {livraisons.length === 0 ? (
                  <tr><td colSpan={10} style={{ padding: "48px", textAlign: "center", color: "#9CA3AF" }}>
                    <div style={{ fontSize: 48, marginBottom: 12 }}>💰</div>
                    Aucune livraison à afficher
                  </td></tr>
                ) : livraisons.map((l, i) => (
                  <tr key={l.id} style={{ background: i % 2 ? "#FAFAFA" : "white", borderBottom: "1px solid #F3F4F6" }}>
                    <td style={{ padding: "12px 16px", fontWeight: 600, fontSize: 13 }}>{l.nom_client}</td>
                    <td style={{ padding: "12px 16px", fontSize: 13 }}>{l.marche}</td>
                    <td style={{ padding: "12px 16px", fontSize: 13 }}>{l.ville}</td>
                    <td style={{ padding: "12px 16px", fontSize: 13 }}>{l.produit}</td>
                    <td style={{ padding: "12px 16px", fontSize: 13, textAlign: "center" }}>{l.quantite}</td>
                    <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 600 }}>{l.prix}</td>
                    <td style={{ padding: "12px 16px", fontSize: 13, color: "#6B7280" }}>{l.societe_livraison || "—"}</td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{
                        background: l.statut === "Livré" ? "#ECFDF5" : "#FEF2F2",
                        color: l.statut === "Livré" ? "#10B981" : "#EF4444",
                        padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600
                      }}>{l.statut}</span>
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 700, color: l.statut === "Livré" ? "#10B981" : "#EF4444" }}>
                      {l.statut === "Livré" ? l.prix : 0}
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: 12, color: "#9CA3AF" }}>
                      {new Date(l.created_at).toLocaleDateString("fr-FR")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === "societes" && (
          <div style={{ background: "white", borderRadius: 16, padding: 24, boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
            <h2 style={{ margin: "0 0 20px", color: "#1E3A5F" }}>🏢 Récap par société</h2>
            <div style={{ textAlign: "center", padding: "48px 0", color: "#9CA3AF" }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🏢</div>
              <div>Aucune société configurée</div>
            </div>
          </div>
        )}

        {tab === "tresorerie" && (
          <div style={{ background: "white", borderRadius: 16, padding: 24, boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
            <h2 style={{ margin: "0 0 20px", color: "#1E3A5F" }}>📅 Prévision trésorerie</h2>
            <div style={{ textAlign: "center", padding: "48px 0", color: "#9CA3AF" }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>📅</div>
              <div>Aucun virement prévu</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default withAuth(Comptable, "comptable");