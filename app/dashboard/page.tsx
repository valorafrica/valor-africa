"use client";
import { useState, useEffect, useRef } from "react";
import { supabase } from "../../lib/supabase";
import Sidebar from "../components/Sidebar";
import withAuth from "../components/withAuth";

function Dashboard() {
  const [leads, setLeads] = useState<any[]>([]);
  const [stocks, setStocks] = useState<any[]>([]);
  const [produits, setProduits] = useState<any[]>([]);
  const [charges, setCharges] = useState<any[]>([]);
  const [societes, setSocietes] = useState<any[]>([]);
  const [tab, setTab] = useState("dashboard");

  // SKU
  const [showSKUModal, setShowSKUModal] = useState(false);
  const [editProduit, setEditProduit] = useState<any>(null);
  const [skuForm, setSkuForm] = useState<any>({ nom: "", description: "", prix_unitaire: "", marche: "DZ", photo_url: "", actif: true });
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [savingSKU, setSavingSKU] = useState(false);
  const [filterSKUMarche, setFilterSKUMarche] = useState("Tous");
  const [filterSKUActif, setFilterSKUActif] = useState("Tous");
  const [searchSKU, setSearchSKU] = useState("");
  const fileInputRef = useRef<any>(null);

  // Charges
  const [showChargeModal, setShowChargeModal] = useState(false);
  const [editCharge, setEditCharge] = useState<any>(null);
  const [chargeForm, setChargeForm] = useState<any>({
    marche: "MA", ville: "", societe_livraison: "",
    voip: "", frais_livraison: "", hors_zones: "",
    echecs: "", deplacement_depot: "", caution: "",
    salaires_livreurs: "", transitaire: "", notes: ""
  });
  const [savingCharge, setSavingCharge] = useState(false);
  const [filtreChargeMarche, setFiltreChargeMarche] = useState("Tous");
  const [filtreChargeVille, setFiltreChargeVille] = useState("Tous");
  const [filtreChargeSociete, setFiltreChargeSociete] = useState("Tous");

  // Dashboard
  const [dashPeriode, setDashPeriode] = useState("semaine");

  const fetchData = async () => {
    const { data: leadsData } = await supabase.from("Leads").select("*").order("created_at", { ascending: false });
    const { data: stocksData } = await supabase.from("Stocks").select("*");
    const { data: produitsData } = await supabase.from("produits").select("*").order("created_at", { ascending: false });
    const { data: chargesData } = await supabase.from("charges").select("*").order("created_at", { ascending: false });
    const { data: societesData } = await supabase.from("societes_livraison").select("*");
    if (leadsData) setLeads(leadsData);
    if (stocksData) setStocks(stocksData);
    if (produitsData) setProduits(produitsData);
    if (chargesData) setCharges(chargesData);
    if (societesData) setSocietes(societesData);
  };

  useEffect(() => { fetchData(); }, []);

  const toCode = (marche: string) => {
    const map: any = { "Algérie": "DZ", "DZ": "DZ", "Maroc": "MA", "MA": "MA", "Tunisie": "TN", "TN": "TN" };
    return map[marche?.trim()] || marche?.trim().toUpperCase() || "";
  };

  const getDispo = (s: any) => Math.max(0, s.stock_total - s.stock_reserve - s.stock_livre + s.stock_retour);
  const alertes = stocks.filter(s => getDispo(s) < s.seuil_alerte);
  const getStatutEffectif = (l: any) => l.statut_confirmation || l.statut || "Nouveau";

  // Dashboard calculs
  const totalLeads = leads.length;
  const nbConf = leads.filter(l => getStatutEffectif(l) === "Confirmé").length;
  const nbLivre = leads.filter(l => l.statut_livraison === "Livré").length;
  const nbAnnule = leads.filter(l => getStatutEffectif(l) === "Annulé").length;
  const nbInjoig = leads.filter(l => getStatutEffectif(l) === "Injoignable").length;
  const caTotal = leads.filter(l => l.statut_livraison === "Livré").reduce((sum, l) => sum + (l.prix_unitaire || 0) * (l.quantite || 1), 0);
  const pctConf = totalLeads ? Math.round(nbConf / totalLeads * 100) : 0;
  const pctLiv = totalLeads ? Math.round(nbLivre / totalLeads * 100) : 0;

  const evolutionJours = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const jLeads = leads.filter(l => new Date(l.created_at).toDateString() === d.toDateString());
    return {
      date: d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" }),
      total: jLeads.length,
      confirmes: jLeads.filter(l => getStatutEffectif(l) === "Confirmé").length,
      livres: jLeads.filter(l => l.statut_livraison === "Livré").length,
    };
  });
  const maxEvol = Math.max(...evolutionJours.map(j => j.total), 1);

  // SKU handlers
  const openAddSKU = () => {
    setEditProduit(null);
    setSkuForm({ nom: "", description: "", prix_unitaire: "", marche: "DZ", photo_url: "", actif: true });
    setShowSKUModal(true);
  };
  const openEditSKU = (p: any) => {
    setEditProduit(p);
    setSkuForm({ nom: p.nom || "", description: p.description || "", prix_unitaire: p.prix_unitaire || "", marche: p.marche || "DZ", photo_url: p.photo_url || "", actif: p.actif ?? true });
    setShowSKUModal(true);
  };
  const handlePhotoUpload = async (file: File) => {
    setUploadingPhoto(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `produits/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("photos").upload(path, file, { upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from("photos").getPublicUrl(path);
      setSkuForm((prev: any) => ({ ...prev, photo_url: data.publicUrl }));
    } catch (e: any) { alert("Erreur upload : " + e.message); }
    setUploadingPhoto(false);
  };
  const saveSKU = async () => {
    if (!skuForm.nom.trim()) { alert("Nom obligatoire."); return; }
    setSavingSKU(true);
    const payload = { nom: skuForm.nom.trim(), description: skuForm.description.trim(), prix_unitaire: Number(skuForm.prix_unitaire) || 0, marche: skuForm.marche, photo_url: skuForm.photo_url, actif: skuForm.actif };
    if (editProduit) await supabase.from("produits").update(payload).eq("id", editProduit.id);
    else await supabase.from("produits").insert([payload]);
    setSavingSKU(false); setShowSKUModal(false); fetchData();
  };
  const toggleActif = async (p: any) => { await supabase.from("produits").update({ actif: !p.actif }).eq("id", p.id); fetchData(); };
  const deleteSKU = async (id: number) => { if (!confirm("Supprimer ce produit ?")) return; await supabase.from("produits").delete().eq("id", id); fetchData(); };
  const produitsFiltres = produits.filter(p => {
    if (filterSKUMarche !== "Tous" && p.marche !== filterSKUMarche) return false;
    if (filterSKUActif === "Actif" && !p.actif) return false;
    if (filterSKUActif === "Inactif" && p.actif) return false;
    if (searchSKU && !p.nom?.toLowerCase().includes(searchSKU.toLowerCase())) return false;
    return true;
  });

  // Charges handlers
  const openAddCharge = () => {
    setEditCharge(null);
    setChargeForm({ marche: "MA", ville: "", societe_livraison: "", voip: "", frais_livraison: "", hors_zones: "", echecs: "", deplacement_depot: "", caution: "", salaires_livreurs: "", transitaire: "", notes: "" });
    setShowChargeModal(true);
  };
  const openEditCharge = (c: any) => {
    setEditCharge(c);
    setChargeForm({
      marche: c.marche || "MA", ville: c.ville || "", societe_livraison: c.societe_livraison || "",
      voip: c.voip || "", frais_livraison: c.frais_livraison || "", hors_zones: c.hors_zones || "",
      echecs: c.echecs || "", deplacement_depot: c.deplacement_depot || "", caution: c.caution || "",
      salaires_livreurs: c.salaires_livreurs || "", transitaire: c.transitaire || "", notes: c.notes || ""
    });
    setShowChargeModal(true);
  };
  const saveCharge = async () => {
    if (!chargeForm.marche) { alert("Marché obligatoire."); return; }
    setSavingCharge(true);
    if (editCharge) await supabase.from("charges").update(chargeForm).eq("id", editCharge.id);
    else await supabase.from("charges").insert([chargeForm]);
    setSavingCharge(false); setShowChargeModal(false); fetchData();
  };
  const deleteCharge = async (id: number) => { if (!confirm("Supprimer cette ligne de charges ?")) return; await supabase.from("charges").delete().eq("id", id); fetchData(); };

  // Filtres charges
  const villesCharges = ["Tous", ...Array.from(new Set(charges.map(c => c.ville).filter(Boolean)))];
  const societesCharges = ["Tous", ...Array.from(new Set(charges.map(c => c.societe_livraison).filter(Boolean)))];
  const chargesFiltres = charges.filter(c => {
    if (filtreChargeMarche !== "Tous" && c.marche !== filtreChargeMarche) return false;
    if (filtreChargeVille !== "Tous" && c.ville !== filtreChargeVille) return false;
    if (filtreChargeSociete !== "Tous" && c.societe_livraison !== filtreChargeSociete) return false;
    return true;
  });

  const DrapeauBadge = ({ code }: { code: string }) => {
    const c = toCode(code);
    const cfg: any = { DZ: "#006233", MA: "#C1272D", TN: "#E70013" };
    return <span style={{ background: cfg[c] || "#6B7280", color: "white", padding: "2px 7px", borderRadius: 5, fontSize: 11, fontWeight: 800 }}>{c || "?"}</span>;
  };

  const inputStyle: any = { width: "100%", padding: "10px 14px", border: "1.5px solid #E5E7EB", borderRadius: 8, fontSize: 13, outline: "none", boxSizing: "border-box" };
  const labelStyle: any = { fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 5 };
  const selectStyle: any = { padding: "8px 12px", border: "1.5px solid #E5E7EB", borderRadius: 8, fontSize: 13, outline: "none", background: "white", cursor: "pointer" };
  const cellStyle: any = { padding: "10px 12px", fontSize: 12, borderBottom: "1px solid #F3F4F6", whiteSpace: "nowrap" };

  const colonnesCharges = [
    { key: "voip", label: "VoIP" },
    { key: "frais_livraison", label: "Frais liv." },
    { key: "hors_zones", label: "Hors zones" },
    { key: "echecs", label: "Échecs" },
    { key: "deplacement_depot", label: "Dépl. dépôt" },
    { key: "caution", label: "Caution" },
    { key: "salaires_livreurs", label: "Sal. livreurs" },
    { key: "transitaire", label: "Transitaire" },
  ];

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#F0F4F8" }}>
      <Sidebar role="manager" />
      <div style={{ marginLeft: 240, flex: 1, padding: 32 }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: "#1E3A5F" }}>Tableau de bord</h1>
          <div style={{ display: "flex", gap: 8 }}>
            {[
              { id: "dashboard", label: "📊 Dashboard" },
              { id: "sku",       label: `🏷️ SKU (${produits.length})` },
              { id: "charges",   label: `💸 Charges (${charges.length})` },
              { id: "stock",     label: "📦 Stock" },
            ].map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{ padding: "10px 20px", borderRadius: 8, border: "none", cursor: "pointer", fontWeight: 600, fontSize: 13, background: tab === t.id ? "#1E3A5F" : "white", color: tab === t.id ? "white" : "#374151", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
                {t.label}
              </button>
            ))}
            <button onClick={fetchData} style={{ padding: "10px 16px", background: "#F3F4F6", color: "#374151", border: "none", borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: "pointer" }}>🔄</button>
          </div>
        </div>

        {/* ════ TAB DASHBOARD ════ */}
        {tab === "dashboard" && (
          <div>
            <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
              {["aujourd'hui", "semaine", "mois", "annee"].map(p => (
                <button key={p} onClick={() => setDashPeriode(p)} style={{ padding: "7px 16px", borderRadius: 8, border: "none", cursor: "pointer", fontWeight: 600, fontSize: 12, background: dashPeriode === p ? "#1E3A5F" : "white", color: dashPeriode === p ? "white" : "#374151", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
                  {p === "aujourd'hui" ? "Aujourd'hui" : p === "semaine" ? "7 jours" : p === "mois" ? "30 jours" : "Année"}
                </button>
              ))}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 20 }}>
              {[
                { label: "Total Leads", value: totalLeads, color: "#3B82F6", icon: "📋" },
                { label: "Confirmés", value: `${nbConf} (${pctConf}%)`, color: "#10B981", icon: "✅" },
                { label: "Livrés", value: `${nbLivre} (${pctLiv}%)`, color: "#064E3B", icon: "✔️" },
                { label: "CA Total", value: caTotal.toLocaleString(), color: "#6366F1", icon: "💰" },
                { label: "Annulés", value: nbAnnule, color: "#EF4444", icon: "❌" },
                { label: "Injoignables", value: nbInjoig, color: "#F59E0B", icon: "📵" },
                { label: "Alertes stock", value: alertes.length, color: "#F97316", icon: "⚠️" },
                { label: "Produits actifs", value: produits.filter(p => p.actif).length, color: "#8B5CF6", icon: "🏷️" },
              ].map(s => (
                <div key={s.label} style={{ background: "white", borderRadius: 12, padding: "16px 20px", boxShadow: "0 1px 4px rgba(0,0,0,0.08)", borderTop: `3px solid ${s.color}` }}>
                  <div style={{ fontSize: 22, marginBottom: 8 }}>{s.icon}</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: 12, color: "#6B7280", marginTop: 4 }}>{s.label}</div>
                </div>
              ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20, marginBottom: 20 }}>
              <div style={{ background: "white", borderRadius: 16, padding: 24, boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
                <h3 style={{ margin: "0 0 20px", fontSize: 14, fontWeight: 700, color: "#1E3A5F" }}>📈 Évolution 7 jours</h3>
                <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 140 }}>
                  {evolutionJours.map((j, idx) => (
                    <div key={idx} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                      <div style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center", gap: 2, justifyContent: "flex-end", height: 110 }}>
                        <div style={{ width: "60%", background: "#064E3B", borderRadius: "3px 3px 0 0", height: `${Math.round((j.livres / maxEvol) * 80)}px`, minHeight: j.livres > 0 ? 4 : 0 }} />
                        <div style={{ width: "80%", background: "#10B981", borderRadius: "3px 3px 0 0", height: `${Math.round((j.confirmes / maxEvol) * 80)}px`, minHeight: j.confirmes > 0 ? 4 : 0 }} />
                        <div style={{ width: "100%", background: "#DBEAFE", borderRadius: "3px 3px 0 0", height: `${Math.round((j.total / maxEvol) * 80)}px`, minHeight: j.total > 0 ? 4 : 0 }} />
                      </div>
                      <div style={{ fontSize: 10, color: "#6B7280", fontWeight: 600 }}>{j.date}</div>
                      <div style={{ fontSize: 9, color: "#374151", fontWeight: 700 }}>{j.total}</div>
                    </div>
                  ))}
                </div>
                <div style={{ display: "flex", gap: 16, marginTop: 12, justifyContent: "center" }}>
                  {[{ color: "#DBEAFE", label: "Total" }, { color: "#10B981", label: "Confirmés" }, { color: "#064E3B", label: "Livrés" }].map(l => (
                    <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <div style={{ width: 10, height: 10, background: l.color, borderRadius: 2 }} />
                      <span style={{ fontSize: 10, color: "#6B7280" }}>{l.label}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ background: "white", borderRadius: 16, padding: 24, boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
                <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 700, color: "#1E3A5F" }}>⚠️ Alertes Stock</h3>
                {alertes.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "20px 0", color: "#9CA3AF" }}><div style={{ fontSize: 32, marginBottom: 8 }}>✅</div><div style={{ fontSize: 12 }}>Aucune alerte</div></div>
                ) : alertes.map(s => {
                  const dispo = getDispo(s);
                  const isRupture = dispo === 0;
                  return (
                    <div key={s.id} style={{ padding: "10px 14px", background: isRupture ? "#FEF2F2" : "#FFFBEB", borderRadius: 10, marginBottom: 8, borderLeft: `3px solid ${isRupture ? "#EF4444" : "#F59E0B"}` }}>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{s.produit}</div>
                      <div style={{ fontSize: 11, color: "#6B7280", marginTop: 2 }}>{s.marche} · {dispo} restants</div>
                      <span style={{ fontSize: 10, fontWeight: 700, color: isRupture ? "#EF4444" : "#F59E0B" }}>{isRupture ? "🔴 RUPTURE" : "⚠️ FAIBLE"}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 20 }}>
              {["DZ", "MA", "TN"].map(code => {
                const mLeads = leads.filter(l => toCode(l.marche) === code);
                const mConf = mLeads.filter(l => getStatutEffectif(l) === "Confirmé").length;
                const mLiv = mLeads.filter(l => l.statut_livraison === "Livré").length;
                const mCA = mLeads.filter(l => l.statut_livraison === "Livré").reduce((sum, l) => sum + (l.prix_unitaire || 0) * (l.quantite || 1), 0);
                const cfg: any = { DZ: { nom: "Algérie", bg: "#006233", flag: "🇩🇿" }, MA: { nom: "Maroc", bg: "#C1272D", flag: "🇲🇦" }, TN: { nom: "Tunisie", bg: "#E70013", flag: "🇹🇳" } };
                return (
                  <div key={code} style={{ background: "white", borderRadius: 16, padding: 20, boxShadow: "0 1px 4px rgba(0,0,0,0.08)", borderLeft: `4px solid ${cfg[code].bg}` }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                      <span style={{ fontSize: 22 }}>{cfg[code].flag}</span>
                      <span style={{ fontWeight: 700, fontSize: 15, color: "#1E3A5F" }}>{cfg[code].nom}</span>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
                      {[["Total", mLeads.length, "#3B82F6"], ["Confirmés", mConf, "#10B981"], ["Livrés", mLiv, "#064E3B"], ["CA", mCA.toLocaleString(), "#6366F1"]].map(([k, v, c]) => (
                        <div key={k as string} style={{ background: "#F9FAFB", borderRadius: 8, padding: "10px 12px" }}>
                          <div style={{ fontSize: 16, fontWeight: 800, color: c as string }}>{v as any}</div>
                          <div style={{ fontSize: 11, color: "#6B7280" }}>{k}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ background: "white", borderRadius: 16, padding: 24, boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
              <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 700, color: "#1E3A5F" }}>📋 Derniers leads</h3>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "#F9FAFB" }}>
                      {["Client", "Produit", "Marché", "Ville", "Confirmation", "Livraison", "Date"].map(h => (
                        <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 11, color: "#6B7280", fontWeight: 600, borderBottom: "1px solid #E5E7EB" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {leads.slice(0, 10).map((lead, i) => (
                      <tr key={lead.id} style={{ background: i % 2 ? "#FAFAFA" : "white", borderBottom: "1px solid #F3F4F6" }}>
                        <td style={{ padding: "10px 14px", fontWeight: 600, fontSize: 13 }}>{lead.nom_client}</td>
                        <td style={{ padding: "10px 14px", fontSize: 12 }}>{lead.produit}</td>
                        <td style={{ padding: "10px 14px" }}><DrapeauBadge code={lead.marche} /></td>
                        <td style={{ padding: "10px 14px", fontSize: 12 }}>{lead.ville}</td>
                        <td style={{ padding: "10px 14px" }}>
                          <span style={{ background: "#F3F4F6", color: "#374151", padding: "3px 8px", borderRadius: 20, fontSize: 11, fontWeight: 600 }}>{getStatutEffectif(lead)}</span>
                        </td>
                        <td style={{ padding: "10px 14px" }}>
                          {lead.statut_livraison ? <span style={{ background: "#F3F4F6", color: "#374151", padding: "3px 8px", borderRadius: 20, fontSize: 11, fontWeight: 600 }}>{lead.statut_livraison}</span> : <span style={{ color: "#D1D5DB", fontSize: 11 }}>—</span>}
                        </td>
                        <td style={{ padding: "10px 14px", fontSize: 11, color: "#9CA3AF" }}>{new Date(lead.created_at).toLocaleDateString("fr-FR")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ════ TAB SKU ════ */}
        {tab === "sku" && (
          <div>
            <div style={{ background: "white", borderRadius: 12, padding: "14px 20px", marginBottom: 20, boxShadow: "0 1px 4px rgba(0,0,0,0.06)", display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
              <input placeholder="🔍 Rechercher un produit..." value={searchSKU} onChange={e => setSearchSKU(e.target.value)}
                style={{ flex: 1, minWidth: 200, padding: "8px 12px", border: "1.5px solid #E5E7EB", borderRadius: 8, fontSize: 13, outline: "none" }} />
              <select value={filterSKUMarche} onChange={e => setFilterSKUMarche(e.target.value)} style={selectStyle}>
                <option value="Tous">🌍 Tous marchés</option>
                <option value="DZ">🇩🇿 Algérie</option>
                <option value="MA">🇲🇦 Maroc</option>
                <option value="TN">🇹🇳 Tunisie</option>
              </select>
              <select value={filterSKUActif} onChange={e => setFilterSKUActif(e.target.value)} style={selectStyle}>
                <option value="Tous">📦 Tous</option>
                <option value="Actif">✅ Actifs</option>
                <option value="Inactif">⏸️ Inactifs</option>
              </select>
              <div style={{ fontSize: 12, color: "#6B7280" }}>{produitsFiltres.length} produit{produitsFiltres.length > 1 ? "s" : ""}</div>
              <button onClick={openAddSKU} style={{ marginLeft: "auto", padding: "10px 20px", background: "#1E3A5F", color: "white", border: "none", borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                ➕ Ajouter un produit
              </button>
            </div>
            {produitsFiltres.length === 0 ? (
              <div style={{ background: "white", borderRadius: 16, padding: "60px 0", textAlign: "center", color: "#9CA3AF", boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
                <div style={{ fontSize: 52, marginBottom: 12 }}>🏷️</div>
                <div style={{ fontWeight: 600, fontSize: 15 }}>Aucun produit</div>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 20 }}>
                {produitsFiltres.map(p => (
                  <div key={p.id} style={{ background: "white", borderRadius: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.08)", overflow: "hidden", opacity: p.actif ? 1 : 0.65, border: p.actif ? "none" : "2px dashed #E5E7EB" }}>
                    <div style={{ width: "100%", height: 180, background: "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", position: "relative" }}>
                      {p.photo_url ? <img src={p.photo_url} alt={p.nom} style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => { (e.target as any).style.display = "none"; }} /> : <span style={{ fontSize: 52 }}>📦</span>}
                      <div style={{ position: "absolute", top: 10, right: 10 }}>
                        <span style={{ background: p.actif ? "#ECFDF5" : "#F3F4F6", color: p.actif ? "#10B981" : "#6B7280", padding: "3px 8px", borderRadius: 20, fontSize: 11, fontWeight: 700 }}>
                          {p.actif ? "✅ Actif" : "⏸️ Inactif"}
                        </span>
                      </div>
                    </div>
                    <div style={{ padding: 16 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                        <div style={{ fontWeight: 700, fontSize: 15, color: "#111827" }}>{p.nom}</div>
                        <DrapeauBadge code={p.marche} />
                      </div>
                      {p.description && <div style={{ fontSize: 12, color: "#6B7280", marginBottom: 10, lineHeight: 1.4 }}>{p.description}</div>}
                      <div style={{ fontSize: 18, fontWeight: 800, color: "#1E3A5F", marginBottom: 14 }}>{p.prix_unitaire ? Number(p.prix_unitaire).toLocaleString() : "—"}</div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button onClick={() => openEditSKU(p)} style={{ flex: 1, padding: "8px", background: "#EFF6FF", color: "#3B82F6", border: "none", borderRadius: 8, fontWeight: 600, fontSize: 12, cursor: "pointer" }}>✏️ Modifier</button>
                        <button onClick={() => toggleActif(p)} style={{ flex: 1, padding: "8px", background: p.actif ? "#FFFBEB" : "#ECFDF5", color: p.actif ? "#F59E0B" : "#10B981", border: "none", borderRadius: 8, fontWeight: 600, fontSize: 12, cursor: "pointer" }}>
                          {p.actif ? "⏸️ Désactiver" : "✅ Activer"}
                        </button>
                        <button onClick={() => deleteSKU(p.id)} style={{ width: 34, padding: "8px", background: "#FEF2F2", color: "#EF4444", border: "none", borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: "pointer" }}>🗑️</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ════ TAB CHARGES ════ */}
        {tab === "charges" && (
          <div>
            {/* Filtres + bouton ajouter */}
            <div style={{ background: "white", borderRadius: 12, padding: "14px 20px", marginBottom: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.06)", display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
              <div>
                <div style={{ fontSize: 11, color: "#6B7280", fontWeight: 600, marginBottom: 4 }}>MARCHÉ</div>
                <select value={filtreChargeMarche} onChange={e => setFiltreChargeMarche(e.target.value)} style={selectStyle}>
                  <option value="Tous">🌍 Tous</option>
                  <option value="MA">🇲🇦 Maroc</option>
                  <option value="DZ">🇩🇿 Algérie</option>
                  <option value="TN">🇹🇳 Tunisie</option>
                </select>
              </div>
              <div>
                <div style={{ fontSize: 11, color: "#6B7280", fontWeight: 600, marginBottom: 4 }}>VILLE</div>
                <select value={filtreChargeVille} onChange={e => setFiltreChargeVille(e.target.value)} style={selectStyle}>
                  {villesCharges.map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
              <div>
                <div style={{ fontSize: 11, color: "#6B7280", fontWeight: 600, marginBottom: 4 }}>SOCIÉTÉ LIVRAISON</div>
                <select value={filtreChargeSociete} onChange={e => setFiltreChargeSociete(e.target.value)} style={selectStyle}>
                  {societesCharges.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <button onClick={() => { setFiltreChargeMarche("Tous"); setFiltreChargeVille("Tous"); setFiltreChargeSociete("Tous"); }}
                style={{ padding: "8px 14px", background: "#F3F4F6", color: "#374151", border: "none", borderRadius: 8, fontWeight: 600, fontSize: 12, cursor: "pointer", alignSelf: "flex-end" }}>
                🔄 Reset
              </button>
              <div style={{ fontSize: 12, color: "#6B7280", alignSelf: "flex-end" }}>{chargesFiltres.length} ligne{chargesFiltres.length > 1 ? "s" : ""}</div>
              <button onClick={openAddCharge} style={{ marginLeft: "auto", padding: "10px 20px", background: "#1E3A5F", color: "white", border: "none", borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: "pointer", alignSelf: "flex-end" }}>
                ➕ Ajouter une ligne
              </button>
            </div>

            {/* Tableau charges */}
            <div style={{ background: "white", borderRadius: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.08)", overflow: "hidden" }}>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 900 }}>
                  <thead>
                    <tr style={{ background: "#1E3A5F" }}>
                      {["Marché", "Ville", "Sté livraison", "VoIP", "Frais liv.", "Hors zones", "Échecs", "Dépl. dépôt", "Caution", "Sal. livreurs", "Transitaire", "Notes", "Actions"].map(h => (
                        <th key={h} style={{ padding: "12px 14px", textAlign: "left", fontSize: 11, color: "white", fontWeight: 600, whiteSpace: "nowrap" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {chargesFiltres.length === 0 ? (
                      <tr><td colSpan={13} style={{ padding: "48px", textAlign: "center", color: "#9CA3AF" }}>
                        <div style={{ fontSize: 40, marginBottom: 8 }}>💸</div>Aucune charge enregistrée
                      </td></tr>
                    ) : chargesFiltres.map((c, i) => (
                      <tr key={c.id} style={{ background: i % 2 ? "#FAFAFA" : "white" }}>
                        <td style={cellStyle}><DrapeauBadge code={c.marche} /></td>
                        <td style={{ ...cellStyle, fontWeight: 600 }}>{c.ville || "—"}</td>
                        <td style={cellStyle}>{c.societe_livraison || "—"}</td>
                        {colonnesCharges.map(col => (
                          <td key={col.key} style={{ ...cellStyle, color: c[col.key] ? "#111827" : "#D1D5DB" }}>
                            {c[col.key] || "—"}
                          </td>
                        ))}
                        <td style={{ ...cellStyle, maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", color: "#6B7280", fontStyle: "italic" }}>
                          {c.notes || "—"}
                        </td>
                        <td style={cellStyle}>
                          <div style={{ display: "flex", gap: 6 }}>
                            <button onClick={() => openEditCharge(c)} style={{ width: 28, height: 28, background: "#FFFBEB", border: "none", borderRadius: 6, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13 }}>✏️</button>
                            <button onClick={() => deleteCharge(c.id)} style={{ width: 28, height: 28, background: "#FEF2F2", border: "none", borderRadius: 6, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13 }}>🗑️</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ════ TAB STOCK ════ */}
        {tab === "stock" && (
          <div style={{ background: "white", borderRadius: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.08)", overflow: "hidden" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid #E5E7EB" }}>
              <h2 style={{ margin: 0, fontSize: 16, color: "#1E3A5F" }}>📦 Stock global</h2>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#F9FAFB" }}>
                  {["Produit", "Marché", "Total", "Réservé", "Livré", "Retour", "Disponible", "Seuil", "Statut"].map(h => (
                    <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, color: "#6B7280", fontWeight: 600, borderBottom: "1px solid #E5E7EB" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {stocks.map((s, i) => {
                  const dispo = getDispo(s);
                  const isRupture = dispo === 0;
                  const isFaible = dispo > 0 && dispo <= s.seuil_alerte;
                  return (
                    <tr key={s.id} style={{ background: i % 2 ? "#FAFAFA" : "white", borderBottom: "1px solid #F3F4F6" }}>
                      <td style={{ padding: "12px 16px", fontWeight: 600, fontSize: 13 }}>{s.produit}</td>
                      <td style={{ padding: "12px 16px" }}><DrapeauBadge code={s.marche} /></td>
                      <td style={{ padding: "12px 16px", fontSize: 13 }}>{s.stock_total}</td>
                      <td style={{ padding: "12px 16px", fontSize: 13, color: "#6366F1" }}>{s.stock_reserve}</td>
                      <td style={{ padding: "12px 16px", fontSize: 13, color: "#064E3B" }}>{s.stock_livre}</td>
                      <td style={{ padding: "12px 16px", fontSize: 13, color: "#F97316" }}>{s.stock_retour}</td>
                      <td style={{ padding: "12px 16px" }}><span style={{ fontWeight: 800, fontSize: 14, color: isRupture ? "#EF4444" : isFaible ? "#F59E0B" : "#10B981" }}>{dispo}</span></td>
                      <td style={{ padding: "12px 16px", fontSize: 13, color: "#6B7280" }}>{s.seuil_alerte}</td>
                      <td style={{ padding: "12px 16px" }}>
                        <span style={{ background: isRupture ? "#FEF2F2" : isFaible ? "#FFFBEB" : "#ECFDF5", color: isRupture ? "#EF4444" : isFaible ? "#F59E0B" : "#10B981", padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600 }}>
                          {isRupture ? "🔴 Rupture" : isFaible ? "⚠️ Faible" : "✅ OK"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ════ MODAL SKU ════ */}
        {showSKUModal && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ background: "white", borderRadius: 16, padding: 28, width: 560, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                <h2 style={{ margin: 0, fontSize: 18, color: "#1E3A5F" }}>{editProduit ? "✏️ Modifier le produit" : "➕ Ajouter un produit"}</h2>
                <button onClick={() => setShowSKUModal(false)} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#9CA3AF" }}>✕</button>
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={labelStyle}>Photo du produit</label>
                <div style={{ width: "100%", height: 160, background: "#F3F4F6", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", border: "2px dashed #E5E7EB", cursor: "pointer", position: "relative" }}
                  onClick={() => fileInputRef.current?.click()}>
                  {skuForm.photo_url ? <img src={skuForm.photo_url} alt="preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : uploadingPhoto ? <div style={{ fontSize: 13, color: "#6B7280" }}>⏳ Upload...</div> : <div style={{ textAlign: "center", color: "#9CA3AF" }}><div style={{ fontSize: 32, marginBottom: 8 }}>📷</div><div style={{ fontSize: 13 }}>Cliquer pour choisir</div></div>}
                  {skuForm.photo_url && <button onClick={e => { e.stopPropagation(); setSkuForm((p: any) => ({ ...p, photo_url: "" })); }} style={{ position: "absolute", top: 8, right: 8, background: "#EF4444", color: "white", border: "none", borderRadius: 6, width: 28, height: 28, cursor: "pointer", fontSize: 14, fontWeight: 700 }}>✕</button>}
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={e => { const f = e.target.files?.[0]; if (f) handlePhotoUpload(f); }} />
                <input placeholder="Ou coller une URL..." value={skuForm.photo_url} onChange={e => setSkuForm((p: any) => ({ ...p, photo_url: e.target.value }))} style={{ ...inputStyle, marginTop: 8, fontSize: 12 }} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={labelStyle}>Nom *</label>
                  <input value={skuForm.nom} onChange={e => setSkuForm((p: any) => ({ ...p, nom: e.target.value }))} placeholder="Ex: Montre Sport" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Prix unitaire</label>
                  <input type="number" value={skuForm.prix_unitaire} onChange={e => setSkuForm((p: any) => ({ ...p, prix_unitaire: e.target.value }))} placeholder="2500" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Marché</label>
                  <select value={skuForm.marche} onChange={e => setSkuForm((p: any) => ({ ...p, marche: e.target.value }))} style={{ ...inputStyle, cursor: "pointer" }}>
                    <option value="DZ">🇩🇿 Algérie</option>
                    <option value="MA">🇲🇦 Maroc</option>
                    <option value="TN">🇹🇳 Tunisie</option>
                  </select>
                </div>
                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={labelStyle}>Description</label>
                  <textarea value={skuForm.description} onChange={e => setSkuForm((p: any) => ({ ...p, description: e.target.value }))} rows={3} style={{ ...inputStyle, resize: "vertical" as any }} />
                </div>
                <div style={{ gridColumn: "1 / -1", display: "flex", alignItems: "center", gap: 10 }}>
                  <label style={{ ...labelStyle, margin: 0 }}>Statut :</label>
                  <button onClick={() => setSkuForm((p: any) => ({ ...p, actif: !p.actif }))} style={{ padding: "6px 14px", background: skuForm.actif ? "#ECFDF5" : "#F3F4F6", color: skuForm.actif ? "#10B981" : "#6B7280", border: `1.5px solid ${skuForm.actif ? "#10B981" : "#E5E7EB"}`, borderRadius: 8, fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
                    {skuForm.actif ? "✅ Actif" : "⏸️ Inactif"}
                  </button>
                  <span style={{ fontSize: 11, color: "#9CA3AF" }}>{skuForm.actif ? "Visible dans MB, CRC, Logistique" : "Masqué"}</span>
                </div>
              </div>
              <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
                <button onClick={saveSKU} disabled={savingSKU} style={{ flex: 1, padding: "13px", background: savingSKU ? "#9CA3AF" : "#1E3A5F", color: "white", border: "none", borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
                  {savingSKU ? "⏳..." : editProduit ? "💾 Sauvegarder" : "➕ Ajouter"}
                </button>
                <button onClick={() => setShowSKUModal(false)} style={{ padding: "13px 20px", background: "#F3F4F6", color: "#374151", border: "none", borderRadius: 10, fontWeight: 600, cursor: "pointer" }}>Annuler</button>
              </div>
            </div>
          </div>
        )}

        {/* ════ MODAL CHARGES ════ */}
        {showChargeModal && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ background: "white", borderRadius: 16, padding: 28, width: "85vw", maxWidth: 800, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                <h2 style={{ margin: 0, fontSize: 18, color: "#1E3A5F" }}>
                  {editCharge ? "✏️ Modifier les charges" : "➕ Ajouter une ligne de charges"}
                </h2>
                <button onClick={() => setShowChargeModal(false)} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#9CA3AF" }}>✕</button>
              </div>

              {/* Infos générales */}
              <div style={{ background: "#F0F9FF", borderRadius: 10, padding: "14px 16px", marginBottom: 20, borderLeft: "4px solid #3B82F6" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#1D4ED8", marginBottom: 12 }}>📍 Identification</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
                  <div>
                    <label style={labelStyle}>Marché *</label>
                    <select value={chargeForm.marche} onChange={e => setChargeForm({ ...chargeForm, marche: e.target.value })} style={{ ...inputStyle, cursor: "pointer" }}>
                      <option value="MA">🇲🇦 Maroc</option>
                      <option value="DZ">🇩🇿 Algérie</option>
                      <option value="TN">🇹🇳 Tunisie</option>
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Ville</label>
                    <input value={chargeForm.ville} onChange={e => setChargeForm({ ...chargeForm, ville: e.target.value })} placeholder="Ex: Casablanca" style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Société de livraison</label>
                    <input value={chargeForm.societe_livraison} onChange={e => setChargeForm({ ...chargeForm, societe_livraison: e.target.value })} placeholder="Ex: Amana" style={inputStyle} />
                  </div>
                </div>
              </div>

              {/* Charges */}
              <div style={{ background: "#FFFBEB", borderRadius: 10, padding: "14px 16px", marginBottom: 20, borderLeft: "4px solid #F59E0B" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#92400E", marginBottom: 12 }}>💸 Détail des charges</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 14 }}>
                  {colonnesCharges.map(col => (
                    <div key={col.key}>
                      <label style={labelStyle}>{col.label}</label>
                      <input
                        value={chargeForm[col.key]}
                        onChange={e => setChargeForm({ ...chargeForm, [col.key]: e.target.value })}
                        placeholder="Montant ou description libre..."
                        style={inputStyle}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div style={{ marginBottom: 20 }}>
                <label style={labelStyle}>Notes / Observations</label>
                <textarea value={chargeForm.notes} onChange={e => setChargeForm({ ...chargeForm, notes: e.target.value })} placeholder="Informations complémentaires..." rows={3}
                  style={{ ...inputStyle, resize: "vertical" as any }} />
              </div>

              <div style={{ display: "flex", gap: 12 }}>
                <button onClick={saveCharge} disabled={savingCharge} style={{ flex: 1, padding: "13px", background: savingCharge ? "#9CA3AF" : "#1E3A5F", color: "white", border: "none", borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
                  {savingCharge ? "⏳ Sauvegarde..." : editCharge ? "💾 Sauvegarder" : "➕ Ajouter"}
                </button>
                <button onClick={() => setShowChargeModal(false)} style={{ padding: "13px 20px", background: "#F3F4F6", color: "#374151", border: "none", borderRadius: 10, fontWeight: 600, cursor: "pointer" }}>Annuler</button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default withAuth(Dashboard, "manager");