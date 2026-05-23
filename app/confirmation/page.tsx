"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import Sidebar from "../components/Sidebar";
import withAuth from "../components/withAuth";

function Confirmation() {
  const [leads, setLeads] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [filter, setFilter] = useState("Nouveau");

  const fetchLeads = async () => {
    const { data } = await supabase
      .from("Leads")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setLeads(data);
  };

  useEffect(() => { fetchLeads(); }, []);

  const updateStatut = async (id: number, statut: string) => {
    await supabase.from("Leads").update({ statut }).eq("id", id);
    fetchLeads();
    setSelected(null);
  };

  const getStatutColor = (statut: string) => {
    const colors: any = {
      "Nouveau": "#3B82F6", "En appel": "#F59E0B",
      "Confirmé": "#10B981", "Annulé": "#EF4444",
    };
    return colors[statut] || "#6B7280";
  };

  const filtered = leads.filter(l => filter === "Tous" ? true : l.statut === filter);

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#F0F4F8" }}>
      <Sidebar role="📞 Agent CRC" />

      <div style={{ marginLeft: 240, flex: 1, padding: 32 }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: "#1E3A5F" }}>Confirmation des leads</h1>
          <p style={{ margin: "4px 0 0", color: "#6B7280", fontSize: 14 }}>Traiter et confirmer les commandes</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
          {[
            { label: "Nouveaux", value: leads.filter(l => l.statut === "Nouveau").length, color: "#3B82F6" },
            { label: "En appel", value: leads.filter(l => l.statut === "En appel").length, color: "#F59E0B" },
            { label: "Confirmés", value: leads.filter(l => l.statut === "Confirmé").length, color: "#10B981" },
            { label: "Annulés", value: leads.filter(l => l.statut === "Annulé").length, color: "#EF4444" },
          ].map(s => (
            <div key={s.label} style={{ background: "white", borderRadius: 12, padding: "16px 20px", boxShadow: "0 1px 4px rgba(0,0,0,0.08)", borderTop: `3px solid ${s.color}`, cursor: "pointer" }}
              onClick={() => setFilter(s.label)}>
              <div style={{ fontSize: 28, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 13, color: "#6B7280", marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 20 }}>
          <div style={{ background: "white", borderRadius: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.08)", overflow: "hidden" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid #E5E7EB", display: "flex", gap: 8 }}>
              {["Tous", "Nouveau", "En appel", "Confirmé", "Annulé"].map(f => (
                <button key={f} onClick={() => setFilter(f)} style={{
                  padding: "6px 14px", borderRadius: 20, border: "none", cursor: "pointer",
                  fontSize: 12, fontWeight: 600,
                  background: filter === f ? "#1E3A5F" : "#F3F4F6",
                  color: filter === f ? "white" : "#374151"
                }}>{f} ({leads.filter(l => f === "Tous" ? true : l.statut === f).length})</button>
              ))}
            </div>

            {filtered.length === 0 ? (
              <div style={{ textAlign: "center", padding: "48px 0", color: "#9CA3AF" }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>📞</div>
                <div>Aucun lead dans cette catégorie</div>
              </div>
            ) : (
              filtered.map((lead, i) => (
                <div key={lead.id} onClick={() => setSelected(lead)} style={{
                  padding: "16px 20px",
                  borderBottom: "1px solid #F3F4F6",
                  cursor: "pointer",
                  background: selected?.id === lead.id ? "#EFF6FF" : i % 2 ? "#FAFAFA" : "white",
                  borderLeft: selected?.id === lead.id ? "3px solid #1E3A5F" : "3px solid transparent"
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14, color: "#111827" }}>{lead.nom_client}</div>
                      <div style={{ fontSize: 12, color: "#6B7280", marginTop: 2 }}>{lead.telephone} · {lead.marche} · {lead.ville}</div>
                      <div style={{ fontSize: 12, color: "#6366F1", marginTop: 4, fontWeight: 600 }}>{lead.produit} — {lead.prix}</div>
                    </div>
                    <span style={{
                      background: `${getStatutColor(lead.statut)}20`,
                      color: getStatutColor(lead.statut),
                      padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600
                    }}>{lead.statut}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          {selected ? (
            <div style={{ background: "white", borderRadius: 16, padding: 24, boxShadow: "0 1px 4px rgba(0,0,0,0.08)", position: "sticky", top: 20, height: "fit-content" }}>
              <h3 style={{ margin: "0 0 16px", color: "#1E3A5F" }}>Fiche Lead</h3>
              <div style={{ background: "#F9FAFB", borderRadius: 12, padding: 16, marginBottom: 16 }}>
                <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>{selected.nom_client}</div>
                <a href={`tel:${selected.telephone}`} style={{ fontSize: 15, color: "#1E3A5F", fontWeight: 600, textDecoration: "none" }}>
                  📞 {selected.telephone}
                </a>
                <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  {[
                    ["Marché", selected.marche],
                    ["Ville", selected.ville],
                    ["Produit", selected.produit],
                    ["Prix", selected.prix],
                    ["Quantité", selected.quantite],
                    ["Source", selected.source],
                  ].map(([k, v]) => (
                    <div key={k}>
                      <div style={{ fontSize: 11, color: "#9CA3AF", fontWeight: 600 }}>{k}</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{v}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <button onClick={() => updateStatut(selected.id, "En appel")} style={{ padding: "11px", background: "#FFFBEB", color: "#F59E0B", border: "1px solid #F59E0B40", borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                  📞 En cours d'appel
                </button>
                <button onClick={() => updateStatut(selected.id, "Confirmé")} style={{ padding: "11px", background: "#ECFDF5", color: "#10B981", border: "1px solid #10B98140", borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                  ✅ Confirmer la commande
                </button>
                <button onClick={() => updateStatut(selected.id, "Annulé")} style={{ padding: "11px", background: "#FEF2F2", color: "#EF4444", border: "1px solid #EF444440", borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                  ❌ Annuler
                </button>
              </div>
            </div>
          ) : (
            <div style={{ background: "white", borderRadius: 16, padding: 48, textAlign: "center", color: "#9CA3AF", boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
              <div>Sélectionne un lead pour le traiter</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default withAuth(Confirmation, "crc");