"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import Sidebar from "../components/Sidebar";

export default function Logistique() {
  const [commandes, setCommandes] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [filter, setFilter] = useState("Confirmé");
  const [livreur, setLivreur] = useState("");

  const fetchCommandes = async () => {
    const { data } = await supabase
      .from("Leads")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setCommandes(data);
  };

  useEffect(() => { fetchCommandes(); }, []);

  const updateStatut = async (id: number, statut: string) => {
    const updateData: any = { statut };
    if (statut === "Assignée" && livreur) {
      updateData.livreur = livreur;
    }
    await supabase.from("Leads").update(updateData).eq("id", id);
    fetchCommandes();
    setSelected(null);
    setLivreur("");
  };

  const getStatutColor = (statut: string) => {
    const colors: any = {
      "Confirmé": "#10B981",
      "Assignée": "#3B82F6",
      "En route": "#8B5CF6",
      "Livré": "#064E3B",
      "Retour": "#F97316",
      "Annulé": "#EF4444",
      "Absent": "#F59E0B",
      "Refusé": "#EF4444",
      "Injoignable": "#6B7280",
    };
    return colors[statut] || "#6B7280";
  };

  const filtered = commandes.filter(l => filter === "Tous" ? true : l.statut === filter);

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#F0F4F8" }}>
      <Sidebar role="🚚 Agent CRL" />

      <div style={{ marginLeft: 240, flex: 1, padding: 32 }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: "#1E3A5F" }}>Suivi Logistique</h1>
          <p style={{ margin: "4px 0 0", color: "#6B7280", fontSize: 14 }}>Gestion des livraisons et livreurs</p>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 16, marginBottom: 24 }}>
          {[
            { label: "Confirmés", value: commandes.filter(l => l.statut === "Confirmé").length, color: "#10B981" },
            { label: "Assignées", value: commandes.filter(l => l.statut === "Assignée").length, color: "#3B82F6" },
            { label: "En route", value: commandes.filter(l => l.statut === "En route").length, color: "#8B5CF6" },
            { label: "Livrés", value: commandes.filter(l => l.statut === "Livré").length, color: "#064E3B" },
            { label: "Retours", value: commandes.filter(l => l.statut === "Retour").length, color: "#F97316" },
          ].map(s => (
            <div key={s.label} onClick={() => setFilter(s.label)} style={{
              background: "white", borderRadius: 12, padding: "16px 20px",
              boxShadow: "0 1px 4px rgba(0,0,0,0.08)", borderTop: `3px solid ${s.color}`,
              cursor: "pointer", opacity: filter === s.label ? 1 : 0.8
            }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 13, color: "#6B7280", marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 20 }}>
          {/* Liste commandes */}
          <div style={{ background: "white", borderRadius: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.08)", overflow: "hidden" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid #E5E7EB", display: "flex", gap: 8, flexWrap: "wrap" }}>
              {["Tous", "Confirmé", "Assignée", "En route", "Livré", "Retour", "Absent"].map(f => (
                <button key={f} onClick={() => setFilter(f)} style={{
                  padding: "6px 14px", borderRadius: 20, border: "none", cursor: "pointer",
                  fontSize: 12, fontWeight: 600,
                  background: filter === f ? "#1E3A5F" : "#F3F4F6",
                  color: filter === f ? "white" : "#374151"
                }}>{f} ({commandes.filter(l => f === "Tous" ? true : l.statut === f).length})</button>
              ))}
            </div>

            {filtered.length === 0 ? (
              <div style={{ textAlign: "center", padding: "48px 0", color: "#9CA3AF" }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🚚</div>
                <div>Aucune commande dans cette catégorie</div>
              </div>
            ) : (
              filtered.map((cmd, i) => (
                <div key={cmd.id} onClick={() => setSelected(cmd)} style={{
                  padding: "16px 20px",
                  borderBottom: "1px solid #F3F4F6",
                  cursor: "pointer",
                  background: selected?.id === cmd.id ? "#EFF6FF" : i % 2 ? "#FAFAFA" : "white",
                  borderLeft: selected?.id === cmd.id ? "3px solid #1E3A5F" : "3px solid transparent"
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>{cmd.nom_client}</div>
                      <div style={{ fontSize: 12, color: "#6B7280", marginTop: 2 }}>
                        {cmd.telephone} · {cmd.marche} · {cmd.ville}
                      </div>
                      <div style={{ fontSize: 12, color: "#6366F1", marginTop: 4, fontWeight: 600 }}>
                        {cmd.produit} × {cmd.quantite} — {cmd.prix}
                      </div>
                      {cmd.livreur && (
                        <div style={{ fontSize: 12, color: "#10B981", marginTop: 4 }}>
                          🚗 Livreur : {cmd.livreur}
                        </div>
                      )}
                    </div>
                    <span style={{
                      background: `${getStatutColor(cmd.statut)}20`,
                      color: getStatutColor(cmd.statut),
                      padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600
                    }}>{cmd.statut}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Panneau détail */}
          {selected ? (
            <div style={{ background: "white", borderRadius: 16, padding: 24, boxShadow: "0 1px 4px rgba(0,0,0,0.08)", position: "sticky", top: 20, height: "fit-content" }}>
              <h3 style={{ margin: "0 0 16px", color: "#1E3A5F" }}>Commande #{selected.id}</h3>
              <div style={{ background: "#F9FAFB", borderRadius: 12, padding: 16, marginBottom: 16 }}>
                <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 8 }}>{selected.nom_client}</div>
                <a href={`tel:${selected.telephone}`} style={{ fontSize: 14, color: "#1E3A5F", fontWeight: 600, textDecoration: "none" }}>
                  📞 {selected.telephone}
                </a>
                <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  {[
                    ["Marché", selected.marche],
                    ["Ville", selected.ville],
                    ["Produit", selected.produit],
                    ["Quantité", selected.quantite],
                    ["Prix", selected.prix],
                    ["Statut actuel", selected.statut],
                  ].map(([k, v]) => (
                    <div key={k}>
                      <div style={{ fontSize: 11, color: "#9CA3AF", fontWeight: 600 }}>{k}</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{v}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Assigner livreur */}
              {(selected.statut === "Confirmé" || selected.statut === "Assignée") && (
                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>
                    Nom du livreur
                  </label>
                  <input
                    placeholder="Ex: Samir K."
                    value={livreur}
                    onChange={(e) => setLivreur(e.target.value)}
                    style={{ width: "100%", padding: "10px 12px", border: "1.5px solid #E5E7EB", borderRadius: 8, fontSize: 13, boxSizing: "border-box", outline: "none" }}
                  />
                </div>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {selected.statut === "Confirmé" && (
                  <button onClick={() => updateStatut(selected.id, "Assignée")} style={{
                    padding: "11px", background: "#EFF6FF", color: "#3B82F6",
                    border: "1px solid #3B82F640", borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: "pointer"
                  }}>
                    📋 Assigner au livreur
                  </button>
                )}
                {selected.statut === "Assignée" && (
                  <div style={{ padding: "10px", background: "#EFF6FF", borderRadius: 10, fontSize: 13, color: "#3B82F6", fontWeight: 600, textAlign: "center" }}>
                    ⏳ En attente que le livreur parte
                  </div>
                )}
                <button onClick={() => updateStatut(selected.id, "Livré")} style={{
                  padding: "11px", background: "#ECFDF5", color: "#10B981",
                  border: "1px solid #10B98140", borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: "pointer"
                }}>
                  ✅ Marquer comme livré
                </button>
                <button onClick={() => updateStatut(selected.id, "Retour")} style={{
                  padding: "11px", background: "#FFF7ED", color: "#F97316",
                  border: "1px solid #F9731640", borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: "pointer"
                }}>
                  ↩️ Retour entrepôt
                </button>
                <button onClick={() => updateStatut(selected.id, "Annulé")} style={{
                  padding: "11px", background: "#FEF2F2", color: "#EF4444",
                  border: "1px solid #EF444440", borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: "pointer"
                }}>
                  ❌ Annuler
                </button>
              </div>
            </div>
          ) : (
            <div style={{ background: "white", borderRadius: 16, padding: 48, textAlign: "center", color: "#9CA3AF", boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🚚</div>
              <div>Sélectionne une commande pour la traiter</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}