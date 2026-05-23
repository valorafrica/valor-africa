"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import Sidebar from "../components/Sidebar";
import withAuth from "../components/withAuth";

function Logistique() {
  const [commandes, setCommandes] = useState<any[]>([]);
  const [stocks, setStocks] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [filter, setFilter] = useState("Confirmé");
  const [livreur, setLivreur] = useState("");
  const [tab, setTab] = useState("commandes");
  const [quantiteEdit, setQuantiteEdit] = useState("");
  const [remise, setRemise] = useState("");
  const [newCmd, setNewCmd] = useState({ nom_client: "", telephone: "", produit: "", quantite: "", prix_unitaire: "", ville: "", marche: "DZ" });
  const [loadingNew, setLoadingNew] = useState(false);

  const fetchCommandes = async () => {
    const { data } = await supabase.from("Leads").select("*").order("created_at", { ascending: false });
    if (data) setCommandes(data);
  };

  const fetchStock = async () => {
    const { data } = await supabase.from("Stocks").select("*").order("created_at", { ascending: false });
    if (data) setStocks(data);
  };

  useEffect(() => { fetchCommandes(); fetchStock(); }, []);

  const updateStatut = async (id: number, statut: string) => {
    const updateData: any = { statut };
    if (statut === "Assignée" && livreur) updateData.livreur = livreur;
    await supabase.from("Leads").update(updateData).eq("id", id);
    fetchCommandes(); setSelected(null); setLivreur("");
  };

  const updateCommande = async () => {
    if (!selected) return;
    const qte = Number(quantiteEdit) || selected.quantite;
    const rem = Number(remise) || 0;
    const total = (selected.prix_unitaire * qte) * (1 - rem / 100);
    await supabase.from("Leads").update({ quantite: qte, remise: rem, prix_total: Math.round(total) }).eq("id", selected.id);
    fetchCommandes();
    setSelected({ ...selected, quantite: qte, remise: rem, prix_total: Math.round(total) });
    alert("✅ Commande mise à jour !");
  };

  const createCommandeDirecte = async () => {
    if (!newCmd.nom_client || !newCmd.telephone || !newCmd.produit) {
      alert("Remplis au moins le nom, téléphone et produit !");
      return;
    }
    setLoadingNew(true);
    const qte = Number(newCmd.quantite) || 1;
    const pu = Number(newCmd.prix_unitaire) || 0;
    const { error } = await supabase.from("Leads").insert([{
      nom_client: newCmd.nom_client,
      telephone: newCmd.telephone,
      produit: newCmd.produit,
      quantite: qte,
      prix_unitaire: pu,
      prix_total: pu * qte,
      ville: newCmd.ville,
      marche: newCmd.marche,
      statut: "Assignée",
      m_b: "Hors système",
    }]);
    if (!error) {
      alert("✅ Commande directe créée !");
      setNewCmd({ nom_client: "", telephone: "", produit: "", quantite: "", prix_unitaire: "", ville: "", marche: "DZ" });
      fetchCommandes();
      setTab("commandes");
    } else {
      alert("Erreur: " + error.message);
    }
    setLoadingNew(false);
  };

  const getStatutColor = (statut: string) => {
    const colors: any = {
      "Confirmé": "#10B981", "Assignée": "#3B82F6", "En cours": "#8B5CF6",
      "Livré": "#064E3B", "Retour": "#F97316", "Annulé": "#EF4444",
      "Absent": "#F59E0B", "Refusé": "#EF4444", "Injoignable": "#6B7280",
    };
    return colors[statut] || "#6B7280";
  };

  const filtered = commandes.filter(l => filter === "Tous" ? true : l.statut === filter);

  const prixTotal = (cmd: any) => {
    const base = (cmd.prix_unitaire || 0) * (cmd.quantite || 1);
    const rem = cmd.remise || 0;
    return Math.round(base * (1 - rem / 100));
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#F0F4F8" }}>
      <Sidebar role="🚚 Agent CRL" />
      <div style={{ marginLeft: 240, flex: 1, padding: 32 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: "#1E3A5F" }}>Suivi Logistique</h1>
            <p style={{ margin: "4px 0 0", color: "#6B7280", fontSize: 14 }}>Gestion des livraisons et livreurs</p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {[
              { id: "commandes", label: "🚚 Commandes" },
              { id: "nouvelle", label: "➕ Commande directe" },
              { id: "stock", label: "📦 Stock" },
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

        {tab === "commandes" && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 16, marginBottom: 24 }}>
              {[
                { label: "Confirmés", value: commandes.filter(l => l.statut === "Confirmé").length, color: "#10B981" },
                { label: "Assignées", value: commandes.filter(l => l.statut === "Assignée").length, color: "#3B82F6" },
                { label: "En cours", value: commandes.filter(l => l.statut === "En cours").length, color: "#8B5CF6" },
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

            <div style={{ display: "grid", gridTemplateColumns: "1fr 400px", gap: 20 }}>
              <div style={{ background: "white", borderRadius: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.08)", overflow: "hidden" }}>
                <div style={{ padding: "16px 20px", borderBottom: "1px solid #E5E7EB", display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {["Tous", "Confirmé", "Assignée", "En cours", "Livré", "Retour", "Absent"].map(f => (
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
                ) : filtered.map((cmd, i) => (
                  <div key={cmd.id} onClick={() => { setSelected(cmd); setQuantiteEdit(String(cmd.quantite)); setRemise(String(cmd.remise || 0)); }} style={{
                    padding: "16px 20px", borderBottom: "1px solid #F3F4F6", cursor: "pointer",
                    background: selected?.id === cmd.id ? "#EFF6FF" : i % 2 ? "#FAFAFA" : "white",
                    borderLeft: selected?.id === cmd.id ? "3px solid #1E3A5F" : "3px solid transparent"
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 14 }}>{cmd.nom_client}</div>
                        <div style={{ fontSize: 12, color: "#6B7280", marginTop: 2 }}>{cmd.telephone} · {cmd.marche} · {cmd.ville}</div>
                        <div style={{ fontSize: 12, color: "#6366F1", marginTop: 4, fontWeight: 600 }}>
                          {cmd.produit} × {cmd.quantite} — Total : {prixTotal(cmd)}
                          {cmd.remise > 0 && <span style={{ color: "#10B981", marginLeft: 6 }}>(-{cmd.remise}%)</span>}
                        </div>
                        {cmd.livreur && <div style={{ fontSize: 12, color: "#10B981", marginTop: 4 }}>🚗 Livreur : {cmd.livreur}</div>}
                        {cmd.m_b === "Hors système" && <div style={{ fontSize: 11, color: "#8B5CF6", marginTop: 2 }}>⚡ Commande directe</div>}
                      </div>
                      <span style={{
                        background: `${getStatutColor(cmd.statut)}20`,
                        color: getStatutColor(cmd.statut),
                        padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600
                      }}>{cmd.statut}</span>
                    </div>
                  </div>
                ))}
              </div>

              {selected ? (
                <div style={{ background: "white", borderRadius: 16, padding: 24, boxShadow: "0 1px 4px rgba(0,0,0,0.08)", position: "sticky", top: 20, height: "fit-content" }}>
                  <h3 style={{ margin: "0 0 16px", color: "#1E3A5F" }}>Commande #{selected.id}</h3>
                  <div style={{ background: "#F9FAFB", borderRadius: 12, padding: 16, marginBottom: 16 }}>
                    <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 8 }}>{selected.nom_client}</div>
                    <a href={`tel:${selected.telephone}`} style={{ fontSize: 14, color: "#1E3A5F", fontWeight: 600, textDecoration: "none" }}>📞 {selected.telephone}</a>
                    <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                      {[
                        ["Marché", selected.marche],
                        ["Ville", selected.ville],
                        ["Produit", selected.produit],
                        ["Prix unitaire", selected.prix_unitaire],
                        ["Statut", selected.statut],
                      ].map(([k, v]) => (
                        <div key={k}>
                          <div style={{ fontSize: 11, color: "#9CA3AF", fontWeight: 600 }}>{k}</div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{v}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Modifier quantité et remise */}
                  <div style={{ background: "#F0F4F8", borderRadius: 12, padding: 16, marginBottom: 16 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#1E3A5F", marginBottom: 12 }}>✏️ Modifier la commande</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                      <div>
                        <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>Quantité</label>
                        <input type="number" value={quantiteEdit} onChange={(e) => setQuantiteEdit(e.target.value)}
                          style={{ width: "100%", padding: "8px 10px", border: "1.5px solid #E5E7EB", borderRadius: 8, fontSize: 13, boxSizing: "border-box", outline: "none" }} />
                      </div>
                      <div>
                        <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>Remise %</label>
                        <input type="number" min="0" max="100" value={remise} onChange={(e) => setRemise(e.target.value)}
                          style={{ width: "100%", padding: "8px 10px", border: "1.5px solid #E5E7EB", borderRadius: 8, fontSize: 13, boxSizing: "border-box", outline: "none" }} />
                      </div>
                    </div>
                    <div style={{ background: "#EFF6FF", borderRadius: 8, padding: "10px 12px", fontSize: 13, color: "#1E3A5F", fontWeight: 700, marginBottom: 10 }}>
                      💰 Total : {Math.round((selected.prix_unitaire || 0) * (Number(quantiteEdit) || 1) * (1 - (Number(remise) || 0) / 100))}
                      {Number(remise) > 0 && <span style={{ color: "#10B981", marginLeft: 8, fontSize: 12 }}>(-{remise}% remise)</span>}
                    </div>
                    <button onClick={updateCommande} style={{
                      width: "100%", padding: "10px", background: "#1E3A5F", color: "white",
                      border: "none", borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: "pointer"
                    }}>💾 Enregistrer les modifications</button>
                  </div>

                  {(selected.statut === "Confirmé" || selected.statut === "Assignée") && (
                    <div style={{ marginBottom: 12 }}>
                      <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Nom du livreur</label>
                      <input placeholder="Ex: Samir K." value={livreur} onChange={(e) => setLivreur(e.target.value)}
                        style={{ width: "100%", padding: "10px 12px", border: "1.5px solid #E5E7EB", borderRadius: 8, fontSize: 13, boxSizing: "border-box", outline: "none" }} />
                    </div>
                  )}

                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {selected.statut === "Confirmé" && (
                      <button onClick={() => updateStatut(selected.id, "Assignée")} style={{ padding: "10px", background: "#EFF6FF", color: "#3B82F6", border: "1px solid #3B82F640", borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                        📋 Assigner au livreur
                      </button>
                    )}
                    <button onClick={() => updateStatut(selected.id, "En cours")} style={{ padding: "10px", background: "#F5F3FF", color: "#8B5CF6", border: "1px solid #8B5CF640", borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>🔄 En cours</button>
                    <button onClick={() => updateStatut(selected.id, "Livré")} style={{ padding: "10px", background: "#ECFDF5", color: "#10B981", border: "1px solid #10B98140", borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>✅ Livré</button>
                    <button onClick={() => updateStatut(selected.id, "Absent")} style={{ padding: "10px", background: "#FFFBEB", color: "#F59E0B", border: "1px solid #F59E0B40", borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>⚠️ Absent</button>
                    <button onClick={() => updateStatut(selected.id, "Refusé")} style={{ padding: "10px", background: "#FEF2F2", color: "#EF4444", border: "1px solid #EF444440", borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>❌ Refusé</button>
                    <button onClick={() => updateStatut(selected.id, "Injoignable")} style={{ padding: "10px", background: "#F9FAFB", color: "#6B7280", border: "1px solid #6B728040", borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>📵 Injoignable</button>
                    <button onClick={() => updateStatut(selected.id, "Retour")} style={{ padding: "10px", background: "#FFF7ED", color: "#F97316", border: "1px solid #F9731640", borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>↩️ Retour entrepôt</button>
                    <button onClick={() => updateStatut(selected.id, "Annulé")} style={{ padding: "10px", background: "#FEF2F2", color: "#EF4444", border: "1px solid #EF444440", borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>🚫 Annuler</button>
                  </div>
                </div>
              ) : (
                <div style={{ background: "white", borderRadius: 16, padding: 48, textAlign: "center", color: "#9CA3AF", boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>🚚</div>
                  <div>Sélectionne une commande pour la traiter</div>
                </div>
              )}
            </div>
          </>
        )}

        {tab === "nouvelle" && (
          <div style={{ background: "white", borderRadius: 16, padding: 28, boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
            <h2 style={{ margin: "0 0 8px", fontSize: 16, color: "#1E3A5F" }}>➕ Commande directe hors système</h2>
            <p style={{ margin: "0 0 24px", fontSize: 13, color: "#6B7280" }}>Pour les ventes terrain ou clients supplémentaires trouvés par le livreur.</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              {[
                ["Nom client *", "nom_client", "text", "Ex: Ahmed Benali"],
                ["Téléphone *", "telephone", "text", "Ex: +213 555 0101"],
                ["Produit *", "produit", "text", "Ex: Chaussures X3"],
                ["Quantité", "quantite", "number", "Ex: 2"],
                ["Prix unitaire", "prix_unitaire", "number", "Ex: 1500"],
                ["Ville", "ville", "text", "Ex: Oran"],
              ].map(([label, key, type, placeholder]) => (
                <div key={key as string}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>{label as string}</label>
                  <input type={type as string} placeholder={placeholder as string} value={(newCmd as any)[key as string]}
                    onChange={(e) => setNewCmd({ ...newCmd, [key as string]: e.target.value })}
                    style={{ width: "100%", padding: "11px 14px", border: "1.5px solid #E5E7EB", borderRadius: 8, fontSize: 14, outline: "none", boxSizing: "border-box" }} />
                </div>
              ))}
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Marché</label>
                <select value={newCmd.marche} onChange={(e) => setNewCmd({ ...newCmd, marche: e.target.value })}
                  style={{ width: "100%", padding: "11px 14px", border: "1.5px solid #E5E7EB", borderRadius: 8, fontSize: 14, outline: "none", boxSizing: "border-box" }}>
                  <option value="DZ">🇩🇿 Algérie</option>
                  <option value="MA">🇲🇦 Maroc</option>
                  <option value="TN">🇹🇳 Tunisie</option>
                </select>
              </div>
            </div>
            {newCmd.quantite && newCmd.prix_unitaire && (
              <div style={{ marginTop: 16, background: "#EFF6FF", borderRadius: 10, padding: "12px 16px", fontSize: 14, color: "#1E3A5F", fontWeight: 600 }}>
                💰 Total : {Number(newCmd.quantite) * Number(newCmd.prix_unitaire)}
              </div>
            )}
            <button onClick={createCommandeDirecte} disabled={loadingNew} style={{
              marginTop: 24, padding: "12px 32px", background: loadingNew ? "#9CA3AF" : "#1E3A5F",
              color: "white", border: "none", borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: loadingNew ? "not-allowed" : "pointer"
            }}>
              {loadingNew ? "Création..." : "➕ Créer la commande"}
            </button>
          </div>
        )}

        {tab === "stock" && (
          <div style={{ background: "white", borderRadius: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.08)", overflow: "hidden" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid #E5E7EB" }}>
              <h2 style={{ margin: 0, fontSize: 16, color: "#1E3A5F" }}>📦 Stock disponible — Lecture seule</h2>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#F9FAFB" }}>
                  {["Produit", "Marché", "Disponible", "Statut", "Notes"].map(h => (
                    <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, color: "#6B7280", fontWeight: 600, borderBottom: "1px solid #E5E7EB" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {stocks.length === 0 ? (
                  <tr><td colSpan={5} style={{ padding: "48px", textAlign: "center", color: "#9CA3AF" }}>
                    <div style={{ fontSize: 48, marginBottom: 12 }}>📦</div>Aucun produit en stock
                  </td></tr>
                ) : stocks.map((s, i) => {
                  const dispo = s.stock_total - s.stock_reserve - s.stock_livre + s.stock_retour;
                  const isRupture = dispo === 0;
                  const isFaible = dispo < s.seuil_alerte && dispo > 0;
                  return (
                    <tr key={s.id} style={{ background: i % 2 ? "#FAFAFA" : "white", borderBottom: "1px solid #F3F4F6" }}>
                      <td style={{ padding: "12px 16px", fontWeight: 600, fontSize: 13 }}>{s.produit}</td>
                      <td style={{ padding: "12px 16px", fontSize: 13 }}>{s.marche}</td>
                      <td style={{ padding: "12px 16px", textAlign: "center" }}>
                        <span style={{ fontWeight: 800, fontSize: 14, color: isRupture ? "#EF4444" : isFaible ? "#F59E0B" : "#10B981" }}>{dispo}</span>
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <span style={{
                          background: isRupture ? "#FEF2F2" : isFaible ? "#FFFBEB" : "#ECFDF5",
                          color: isRupture ? "#EF4444" : isFaible ? "#F59E0B" : "#10B981",
                          padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600
                        }}>{isRupture ? "🔴 Rupture" : isFaible ? "⚠️ Faible" : "✅ OK"}</span>
                      </td>
                      <td style={{ padding: "12px 16px", fontSize: 12, color: "#6B7280" }}>{s.notes}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default withAuth(Logistique, "crl");