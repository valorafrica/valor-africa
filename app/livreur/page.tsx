"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import Sidebar from "../components/Sidebar";

export default function Livreur() {
  const [commandes, setCommandes] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [filter, setFilter] = useState("Assignée");

  const fetchCommandes = async () => {
    const { data } = await supabase
      .from("Leads")
      .select("*")
      .in("statut", ["Assignée", "En route", "Absent", "Injoignable"])
      .order("created_at", { ascending: false });
    if (data) setCommandes(data);
  };

  useEffect(() => { fetchCommandes(); }, []);

  const updateStatut = async (id: number, statut: string) => {
    await supabase.from("Leads").update({ statut }).eq("id", id);
    fetchCommandes();
    setSelected(null);
  };

  const getStatutColor = (statut: string) => {
    const colors: any = {
      "Assignée": "#3B82F6",
      "En route": "#8B5CF6",
      "Livré": "#10B981",
      "Absent": "#F59E0B",
      "Refusé": "#EF4444",
      "Injoignable": "#6B7280",
    };
    return colors[statut] || "#6B7280";
  };

  const filtered = commandes.filter(l => filter === "Tous" ? true : l.statut === filter);

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#F0F4F8" }}>
      <Sidebar role="🚗 Livreur" />

      <div style={{ marginLeft: 240, flex: 1, padding: 32 }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: "#1E3A5F" }}>Mes Livraisons</h1>
          <p style={{ margin: "4px 0 0", color: "#6B7280", fontSize: 14 }}>Commandes assignées</p>
        </div>

        {/* Alerte importante */}
        <div style={{
          background: "#FEF2F2", border: "1px solid #EF4444",
          borderRadius: 12, padding: "14px 20px", marginBottom: 24,
          fontSize: 13, color: "#EF4444", fontWeight: 600
        }}>
          ⚠️ Pour toute modification de prix ou quantité → Contacter votre agent via WhatsApp
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
          {[
            { label: "À traiter", value: commandes.filter(l => l.statut === "Assignée").length, color: "#3B82F6" },
            { label: "En route", value: commandes.filter(l => l.statut === "En route").length, color: "#8B5CF6" },
            { label: "Absent", value: commandes.filter(l => l.statut === "Absent").length, color: "#F59E0B" },
            { label: "Injoignable", value: commandes.filter(l => l.statut === "Injoignable").length, color: "#6B7280" },
          ].map(s => (
            <div key={s.label} onClick={() => setFilter(s.label === "À traiter" ? "Assignée" : s.label)} style={{
              background: "white", borderRadius: 12, padding: "16px 20px",
              boxShadow: "0 1px 4px rgba(0,0,0,0.08)", borderTop: `3px solid ${s.color}`,
              cursor: "pointer"
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
              {["Tous", "Assignée", "En route", "Absent", "Injoignable"].map(f => (
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
                <div style={{ fontSize: 48, marginBottom: 12 }}>🚗</div>
                <div>Aucune commande dans cette catégorie</div>
              </div>
            ) : (
              filtered.map((cmd, i) => (
                <div key={cmd.id} onClick={() => setSelected(cmd)} style={{
                  padding: "16px 20px",
                  borderBottom: "1px solid #F3F4F6",
                  cursor: "pointer",
                  background: selected?.id === cmd.id ? "#EFF6FF" : i % 2 ? "#FAFAFA" : "white",
                  borderLeft: selected?.id === cmd.id ? "3px solid #3B82F6" : "3px solid transparent"
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>{cmd.nom_client}</div>
                      <div style={{ fontSize: 12, color: "#6B7280", marginTop: 2 }}>
                        📍 {cmd.ville} · {cmd.marche}
                      </div>
                      <div style={{ fontSize: 12, color: "#6366F1", marginTop: 4, fontWeight: 600 }}>
                        {cmd.produit} × {cmd.quantite} — 💰 {cmd.prix} 🔒
                      </div>
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
                <div style={{ fontSize: 13, color: "#6B7280", marginBottom: 12 }}>📍 {selected.ville}</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
                  {[
                    ["Produit", selected.produit],
                    ["Quantité", selected.quantite],
                    ["Prix 🔒", `${selected.prix}`],
                    ["Marché", selected.marche],
                  ].map(([k, v]) => (
                    <div key={k}>
                      <div style={{ fontSize: 11, color: "#9CA3AF", fontWeight: 600 }}>{k}</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{v}</div>
                    </div>
                  ))}
                </div>
                <a href={`tel:${selected.telephone}`} style={{
                  display: "block", textAlign: "center",
                  padding: "10px", background: "#1E3A5F", color: "white",
                  borderRadius: 8, textDecoration: "none", fontWeight: 600, fontSize: 14
                }}>
                  📞 Appeler le client
                </a>
              </div>

              {/* Note modification */}
              <div style={{ background: "#FEF2F2", borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 12, color: "#EF4444", fontWeight: 600 }}>
                🔒 Prix et quantité non modifiables — Contacter l'agent via WhatsApp
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {selected.statut === "Assignée" && (
                  <button onClick={() => updateStatut(selected.id, "En route")} style={{
                    padding: "11px", background: "#F5F3FF", color: "#8B5CF6",
                    border: "1px solid #8B5CF640", borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: "pointer"
                  }}>
                    🚗 Je pars en livraison
                  </button>
                )}
                <button onClick={() => updateStatut(selected.id, "Livré")} style={{
                  padding: "11px", background: "#ECFDF5", color: "#10B981",
                  border: "1px solid #10B98140", borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: "pointer"
                }}>
                  ✅ Livré — Client a accepté
                </button>
                <button onClick={() => updateStatut(selected.id, "Absent")} style={{
                  padding: "11px", background: "#FFFBEB", color: "#F59E0B",
                  border: "1px solid #F59E0B40", borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: "pointer"
                }}>
                  ⚠️ Client absent
                </button>
                <button onClick={() => updateStatut(selected.id, "Refusé")} style={{
                  padding: "11px", background: "#FEF2F2", color: "#EF4444",
                  border: "1px solid #EF444440", borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: "pointer"
                }}>
                  ❌ Client a refusé
                </button>
                <button onClick={() => updateStatut(selected.id, "Injoignable")} style={{
                  padding: "11px", background: "#F9FAFB", color: "#6B7280",
                  border: "1px solid #6B728040", borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: "pointer"
                }}>
                  📵 Injoignable
                </button>
              </div>
            </div>
          ) : (
            <div style={{ background: "white", borderRadius: 16, padding: 48, textAlign: "center", color: "#9CA3AF", boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🚗</div>
              <div>Sélectionne une commande pour la traiter</div>
            </div>
          )}
        </div>

        {/* Guide statuts */}
        <div style={{ background: "white", borderRadius: 16, padding: 24, boxShadow: "0 1px 4px rgba(0,0,0,0.08)", marginTop: 20 }}>
          <h3 style={{ margin: "0 0 16px", color: "#1E3A5F" }}>📋 Guide des statuts</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
            {[
              { statut: "🚗 En route", quand: "Tu pars vers le client", bg: "#F5F3FF", color: "#8B5CF6" },
              { statut: "✅ Livré", quand: "Client a accepté et payé", bg: "#ECFDF5", color: "#10B981" },
              { statut: "⚠️ Absent", quand: "Client pas chez lui", bg: "#FFFBEB", color: "#F59E0B" },
              { statut: "❌ Refusé", quand: "Client refuse la commande", bg: "#FEF2F2", color: "#EF4444" },
              { statut: "📵 Injoignable", quand: "Téléphone éteint", bg: "#F9FAFB", color: "#6B7280" },
            ].map(s => (
              <div key={s.statut} style={{ background: s.bg, borderRadius: 10, padding: "12px 16px", borderLeft: `3px solid ${s.color}` }}>
                <div style={{ fontWeight: 700, color: s.color, fontSize: 13 }}>{s.statut}</div>
                <div style={{ fontSize: 12, color: "#6B7280", marginTop: 4 }}>{s.quand}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}