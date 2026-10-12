"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import Sidebar from "../components/Sidebar";
import withAuth from "../components/withAuth";

// ── Config pays ───────────────────────────────────────────────────────────────
const PAYS = [
  { code: "MA", label: "Maroc",             bg: "#C1272D" },
  { code: "CG", label: "Congo-Brazzaville", bg: "#009A44" },
  { code: "CD", label: "Congo-Kinshasa",    bg: "#007FFF" },
  { code: "GA", label: "Gabon",             bg: "#009E60" },
  { code: "TD", label: "Tchad",             bg: "#002664" },
  { code: "MG", label: "Madagascar",        bg: "#FC3D32" },
  { code: "TZ", label: "Tanzanie",          bg: "#1EB53A" },
  { code: "AO", label: "Angola",            bg: "#CC0000" },
  { code: "ML", label: "Mali",              bg: "#009A00" },
  { code: "GQ", label: "Guinée Éq.",        bg: "#3E9A00" },
  { code: "NG", label: "Nigeria",           bg: "#008751" },
  { code: "KE", label: "Kenya",             bg: "#006600" },
  { code: "CI", label: "Côte d'Ivoire",     bg: "#F77F00" },
  { code: "TG", label: "Togo",              bg: "#006A4E" },
  { code: "BJ", label: "Bénin",             bg: "#008751" },
];
const PAYS_MAP: Record<string, typeof PAYS[number]> = Object.fromEntries(PAYS.map(p => [p.code, p]));
const toPaysCode = (raw: string): string => {
  if (!raw) return "";
  const val = raw.trim().toLowerCase();
  const map: Record<string, string> = {
    "ma": "MA", "maroc": "MA", "morocco": "MA",
    "cg": "CG", "congo": "CG", "congo-brazzaville": "CG",
    "cd": "CD", "rdc": "CD", "congo-kinshasa": "CD",
    "ga": "GA", "gabon": "GA",
    "td": "TD", "tchad": "TD", "chad": "TD",
    "mg": "MG", "madagascar": "MG",
    "tz": "TZ", "tanzanie": "TZ", "tanzania": "TZ",
    "ao": "AO", "angola": "AO",
    "ml": "ML", "mali": "ML",
    "gq": "GQ", "guinée équatoriale": "GQ", "equatorial guinea": "GQ",
    "ng": "NG", "nigeria": "NG",
    "ke": "KE", "kenya": "KE",
    "ci": "CI", "côte d'ivoire": "CI", "civ": "CI", "ivory coast": "CI",
    "tg": "TG", "togo": "TG",
    "bj": "BJ", "bénin": "BJ", "benin": "BJ",
  };
  return map[val] || raw.trim().toUpperCase();
};
const nomPays = (code: string) => PAYS_MAP[toPaysCode(code)]?.label || code;

// ── Catégories et sous-catégories de dépenses ─────────────────────────────────
const CATEGORIES: Record<string, string[]> = {
  "Logistique": ["Frais de livraison", "Commandes annulées", "Commandes hors zone", "Caution", "Autre logistique"],
  "Bureau": ["Loyer", "Électricité / Eau", "Internet", "Carburant", "Achat emballage", "Transport bureau", "Autre bureau"],
  "Salaires": ["Salaire fixe", "Prime livreur", "Bonus", "Aide", "Autre salaire"],
  "VoIP": ["Recharge modem GSM", "Recharge téléphone", "Location passerelle", "Autre VoIP"],
  "Achat": ["Transport et dédouanement", "Expédition colis", "Récupération colis", "Achat produit", "Autre achat"],
  "Mvm de fonds": ["Frais de transfert", "Frais de retrait", "Déplacement pour dépôt", "Change devise", "Autre mvm"],
  "Exceptionnelle": ["Remboursement client", "Commande doublante", "Modification système", "Certification", "Autre exceptionnelle"],
  "Pub / Marketing": ["Facebook Ads", "TikTok Ads", "Google Ads", "Autre pub"],
  "Autres": ["Autre"],
};

// ── Composant ChargesTable ────────────────────────────────────────────────────
function ChargesTable() {
  const [charges, setCharges] = useState<any[]>([]);
  const [filtreMarche, setFiltreMarche] = useState("Tous");
  const [filtreVille, setFiltreVille] = useState("Tous");
  const [filtreSociete, setFiltreSociete] = useState("Tous");

  useEffect(() => {
    supabase.from("charges").select("*").order("marche").then(({ data }) => {
      if (data) setCharges(data);
    });
  }, []);

  const villes   = ["Tous", ...Array.from(new Set(charges.map(c => c.ville).filter(Boolean)))];
  const societes = ["Tous", ...Array.from(new Set(charges.map(c => c.societe_livraison).filter(Boolean)))];
  const filtres  = charges.filter(c => {
    if (filtreMarche  !== "Tous" && c.marche !== filtreMarche) return false;
    if (filtreVille   !== "Tous" && c.ville  !== filtreVille)  return false;
    if (filtreSociete !== "Tous" && c.societe_livraison !== filtreSociete) return false;
    return true;
  });
  const colonnes = ["voip","frais_livraison","hors_zones","echecs","deplacement_depot","caution","salaires_livreurs","transitaire"];
  const selectStyle: any = { padding: "8px 12px", border: "1.5px solid #E5E7EB", borderRadius: 8, fontSize: 13, outline: "none", background: "white", cursor: "pointer" };
  const cellStyle: any   = { padding: "10px 12px", fontSize: 12, borderBottom: "1px solid #F3F4F6", whiteSpace: "nowrap" };

  return (
    <div>
      <div style={{ padding: "12px 20px", borderBottom: "1px solid #E5E7EB", display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <select value={filtreMarche} onChange={e => setFiltreMarche(e.target.value)} style={selectStyle}>
          <option value="Tous">🌍 Tous pays</option>
          {PAYS.map(p => <option key={p.code} value={p.code}>{p.code} — {p.label}</option>)}
        </select>
        <select value={filtreVille} onChange={e => setFiltreVille(e.target.value)} style={selectStyle}>
          {villes.map(v => <option key={v} value={v}>{v}</option>)}
        </select>
        <select value={filtreSociete} onChange={e => setFiltreSociete(e.target.value)} style={selectStyle}>
          {societes.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <button onClick={() => { setFiltreMarche("Tous"); setFiltreVille("Tous"); setFiltreSociete("Tous"); }}
          style={{ padding: "8px 14px", background: "#F3F4F6", color: "#374151", border: "none", borderRadius: 8, fontWeight: 600, fontSize: 12, cursor: "pointer" }}>🔄 Reset</button>
        <span style={{ fontSize: 12, color: "#6B7280" }}>{filtres.length} ligne{filtres.length > 1 ? "s" : ""}</span>
      </div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 900 }}>
          <thead>
            <tr style={{ background: "#1E3A5F" }}>
              {["Pays","Ville","Sté livraison","VoIP","Frais liv.","Hors zones","Échecs","Dépl. dépôt","Caution","Sal. livreurs","Transitaire","Notes"].map(h => (
                <th key={h} style={{ padding: "12px 14px", textAlign: "left", fontSize: 11, color: "white", fontWeight: 600, whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtres.length === 0 ? (
              <tr><td colSpan={12} style={{ padding: "48px", textAlign: "center", color: "#9CA3AF" }}>
                <div style={{ fontSize: 40, marginBottom: 8 }}>💸</div>Aucune charge
              </td></tr>
            ) : filtres.map((c, i) => {
              const code = toPaysCode(c.marche);
              const cfg  = PAYS_MAP[code] || { bg: "#6B7280" };
              return (
                <tr key={c.id} style={{ background: i % 2 ? "#FAFAFA" : "white" }}>
                  <td style={cellStyle}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                      <span style={{ background: cfg.bg, color: "white", padding: "2px 7px", borderRadius: 5, fontSize: 11, fontWeight: 800, display: "inline-block" }}>{code}</span>
                      <span style={{ fontSize: 9, color: "#6B7280" }}>{nomPays(c.marche)}</span>
                    </div>
                  </td>
                  <td style={{ ...cellStyle, fontWeight: 600 }}>{c.ville || "—"}</td>
                  <td style={cellStyle}>{c.societe_livraison || "—"}</td>
                  {colonnes.map(k => <td key={k} style={{ ...cellStyle, color: c[k] ? "#111827" : "#D1D5DB" }}>{c[k] || "—"}</td>)}
                  <td style={{ ...cellStyle, color: "#6B7280", fontStyle: "italic", maxWidth: 150 }}>{c.notes || "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Page principale Comptable ─────────────────────────────────────────────────
function Comptable() {
  const getTabFromURL = () => {
    if (typeof window === "undefined") return "rapport_journalier";
    return new URLSearchParams(window.location.search).get("tab") || "rapport_journalier";
  };

  const [livraisons, setLivraisons] = useState<any[]>([]);
  const [tab, setTab] = useState(getTabFromURL);

  // ── Rapport journalier (Recettes) ─────────────────────────────────────────
  const [marche, setMarche]               = useState("MA");
  const [rapport, setRapport]             = useState<any[]>([]);
  const [soldeInitial, setSoldeInitial]   = useState<number>(0);
  const [showModalRapport, setShowModalRapport] = useState(false);
  const [showModalSolde, setShowModalSolde]     = useState(false);
  const [editLigne, setEditLigne]         = useState<any>(null);
  const [saving, setSaving]               = useState(false);
  const [filtrePartenaire, setFiltrePartenaire] = useState("Tous");
  const moisActuel = new Date().toISOString().slice(0, 7);

  const [form, setForm] = useState<any>({
    date: new Date().toISOString().split("T")[0],
    partenaire: "", nb_livraisons: "", encaissement: "",
    recette_externe: "", frais_livraison: "", autres_charges: "",
    versement: "", frais_transfert: "", commentaire: "",
  });
  const [soldeForm, setSoldeForm] = useState({ mois: moisActuel, solde: "" });

  // ── Dépenses ─────────────────────────────────────────────────────────────
  const [depenses, setDepenses]           = useState<any[]>([]);
  const [showModalDepense, setShowModalDepense] = useState(false);
  const [editDepense, setEditDepense]     = useState<any>(null);
  const [filtreDepensePays, setFiltreDepensePays] = useState("Tous");
  const [filtreDepenseCat, setFiltreDepenseCat]   = useState("Tous");
  const [filtreDepenseMois, setFiltreDepenseMois] = useState("");
  const [depenseForm, setDepenseForm] = useState<any>({
    date: new Date().toISOString().split("T")[0],
    categorie: "Logistique", sous_categorie: "Frais de livraison",
    description: "", montant: "", pays: "MA",
    responsable: "", justificatif: "", notes: "",
  });

  // ── Virements ────────────────────────────────────────────────────────────
  const [virementData, setVirementData]     = useState<Record<string, { attendu: number; recu: number; statut: string; date_recu: string; notes: string }>>({});
  const [editingVirement, setEditingVirement] = useState<string | null>(null);
  const [savedSuccess, setSavedSuccess]       = useState<string | null>(null);

  // ── Filtres livraisons ────────────────────────────────────────────────────
  const [filtreLivSociete, setFiltreLivSociete] = useState("Tous");
  const [filtreLivPays, setFiltreLivPays]       = useState("Tous");
  const [filtreLivStatut, setFiltreLivStatut]   = useState("Tous");

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const fetchDepenses = async () => {
    const { data } = await supabase.from("depenses").select("*").order("date", { ascending: false });
    if (data) setDepenses(data);
  };
  const fetchLivraisons = async () => {
    const { data } = await supabase.from("Leads").select("*").in("statut_livraison", ["Livré","Retour","Refusé"]).order("created_at", { ascending: false });
    if (data) setLivraisons(data);
  };
  const fetchRapport = async () => {
    const { data } = await supabase.from("rapport_comptable").select("*").eq("marche", marche).order("date", { ascending: true });
    if (data) setRapport(data);
    const { data: soldeData } = await supabase.from("solde_initial").select("*").eq("marche", marche).eq("mois", moisActuel).single();
    setSoldeInitial(soldeData ? soldeData.solde : 0);
  };

  useEffect(() => { fetchLivraisons(); fetchDepenses(); }, []);
  useEffect(() => { fetchRapport(); setFiltrePartenaire("Tous"); }, [marche]);
  useEffect(() => {
    const handlePopState = () => setTab(getTabFromURL());
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    const map: Record<string, { attendu: number; recu: number; statut: string; date_recu: string; notes: string }> = {};
    livraisons.forEach(l => {
      const soc = l.ste_livraison || l.societe_livraison || "Sans société";
      if (!map[soc]) map[soc] = { attendu: 0, recu: 0, statut: "En attente", date_recu: "", notes: "" };
      if (l.statut_livraison === "Livré") map[soc].attendu += (l.prix_unitaire||0)*(l.quantite||1);
    });
    setVirementData(prev => {
      const merged = { ...map };
      Object.keys(prev).forEach(k => {
        if (merged[k]) { merged[k].recu = prev[k].recu; merged[k].statut = prev[k].statut; merged[k].date_recu = prev[k].date_recu; merged[k].notes = prev[k].notes; }
      });
      return merged;
    });
  }, [livraisons]);

  // ── Calculs rapport ───────────────────────────────────────────────────────
  const partenaires   = ["Tous", ...Array.from(new Set(rapport.map(l => l.partenaire).filter(Boolean)))];
  const rapportFiltre = filtrePartenaire === "Tous" ? rapport : rapport.filter(l => l.partenaire === filtrePartenaire);

  const lignesCalculees = rapportFiltre.reduce((acc: any[], ligne, i) => {
    const totalRecette = (Number(ligne.encaissement)||0) + (Number(ligne.recette_externe)||0);
    const diff = totalRecette - (Number(ligne.frais_livraison)||0) - (Number(ligne.autres_charges)||0);
    const soldeJMoins1 = i === 0 ? soldeInitial : acc[i-1].solde;
    const solde = soldeJMoins1 + diff + (Number(ligne.versement)||0) - (Number(ligne.frais_transfert)||0);
    acc.push({ ...ligne, total_recette: totalRecette, difference: diff, solde_j1: soldeJMoins1, solde });
    return acc;
  }, []);

  const soldeFinal     = lignesCalculees.length > 0 ? lignesCalculees[lignesCalculees.length-1].solde : soldeInitial;
  const totalNbLiv     = lignesCalculees.reduce((s,l) => s + (Number(l.nb_livraisons)||0), 0);
  const totalEnc       = lignesCalculees.reduce((s,l) => s + (Number(l.encaissement)||0), 0);
  const totalExtRef    = lignesCalculees.reduce((s,l) => s + (Number(l.recette_externe)||0), 0);
  const totalRecettes  = lignesCalculees.reduce((s,l) => s + (l.total_recette||0), 0);
  const totalFrais     = lignesCalculees.reduce((s,l) => s + (Number(l.frais_livraison)||0), 0);
  const totalAutres    = lignesCalculees.reduce((s,l) => s + (Number(l.autres_charges)||0), 0);
  const totalDiff      = lignesCalculees.reduce((s,l) => s + (l.difference||0), 0);
  const totalVers      = lignesCalculees.reduce((s,l) => s + (Number(l.versement)||0), 0);
  const totalTransfert = lignesCalculees.reduce((s,l) => s + (Number(l.frais_transfert)||0), 0);

  // ── Calculs dépenses ──────────────────────────────────────────────────────
  const depensesFiltrees = depenses.filter(d => {
    if (filtreDepensePays !== "Tous" && d.pays !== filtreDepensePays) return false;
    if (filtreDepenseCat  !== "Tous" && d.categorie !== filtreDepenseCat) return false;
    if (filtreDepenseMois && !d.date?.startsWith(filtreDepenseMois)) return false;
    return true;
  });
  const totalDepenses    = depensesFiltrees.reduce((s,d) => s + (Number(d.montant)||0), 0);
  const totalDepensesAll = depenses.reduce((s,d) => s + (Number(d.montant)||0), 0);

  const depensesParCat = Object.keys(CATEGORIES).map(cat => ({
    cat, total: depenses.filter(d => d.categorie === cat).reduce((s,d) => s + (Number(d.montant)||0), 0)
  })).filter(x => x.total > 0).sort((a,b) => b.total - a.total);

  const depensesParPays = PAYS.map(p => ({
    code: p.code, label: p.label, bg: p.bg,
    total: depenses.filter(d => d.pays === p.code).reduce((s,d) => s + (Number(d.montant)||0), 0)
  })).filter(x => x.total > 0).sort((a,b) => b.total - a.total);

  const maxDepCat  = Math.max(...depensesParCat.map(d => d.total), 1);
  const maxDepPays = Math.max(...depensesParPays.map(d => d.total), 1);

  // ── KPIs globaux ──────────────────────────────────────────────────────────
  const livres      = livraisons.filter(l => l.statut_livraison === "Livré");
  const totalCA     = livres.reduce((sum,l) => sum + ((l.prix_unitaire||0)*(l.quantite||1)), 0);
  const beneficeNet = totalCA - totalDepensesAll;
  const totalAttendu = Object.values(virementData).reduce((s,v) => s + v.attendu, 0);
  const totalRecu    = Object.values(virementData).reduce((s,v) => s + (v.recu||0), 0);
  const totalReste   = totalAttendu - totalRecu;

  // ── Handlers rapport ──────────────────────────────────────────────────────
  const openAdd  = () => {
    setEditLigne(null);
    setForm({ date: new Date().toISOString().split("T")[0], partenaire:"", nb_livraisons:"", encaissement:"", recette_externe:"", frais_livraison:"", autres_charges:"", versement:"", frais_transfert:"", commentaire:"" });
    setShowModalRapport(true);
  };
  const openEdit = (ligne: any) => {
    setEditLigne(ligne);
    setForm({ date: ligne.date, partenaire: ligne.partenaire||"", nb_livraisons: ligne.nb_livraisons||"", encaissement: ligne.encaissement||"", recette_externe: ligne.recette_externe||"", frais_livraison: ligne.frais_livraison||"", autres_charges: ligne.autres_charges||"", versement: ligne.versement||"", frais_transfert: ligne.frais_transfert||"", commentaire: ligne.commentaire||"" });
    setShowModalRapport(true);
  };
  const saveLigne = async () => {
    setSaving(true);
    const payload = { date: form.date, marche, partenaire: form.partenaire, nb_livraisons: Number(form.nb_livraisons)||0, encaissement: Number(form.encaissement)||0, recette_externe: Number(form.recette_externe)||0, frais_livraison: Number(form.frais_livraison)||0, autres_charges: Number(form.autres_charges)||0, versement: Number(form.versement)||0, frais_transfert: Number(form.frais_transfert)||0, commentaire: form.commentaire };
    if (editLigne) await supabase.from("rapport_comptable").update(payload).eq("id", editLigne.id);
    else await supabase.from("rapport_comptable").insert([payload]);
    setSaving(false); setShowModalRapport(false); fetchRapport();
  };
  const deleteLigne = async (id: number) => {
    if (!confirm("Supprimer cette ligne ?")) return;
    await supabase.from("rapport_comptable").delete().eq("id", id);
    fetchRapport();
  };
  const saveSoldeInitial = async () => {
    setSaving(true);
    const { data: existing } = await supabase.from("solde_initial").select("*").eq("marche", marche).eq("mois", soldeForm.mois).single();
    if (existing) await supabase.from("solde_initial").update({ solde: Number(soldeForm.solde) }).eq("id", existing.id);
    else await supabase.from("solde_initial").insert([{ marche, mois: soldeForm.mois, solde: Number(soldeForm.solde) }]);
    setSaving(false); setShowModalSolde(false); fetchRapport();
  };

  // ── Handlers dépenses ─────────────────────────────────────────────────────
  const openAddDepense = () => {
    setEditDepense(null);
    setDepenseForm({ date: new Date().toISOString().split("T")[0], categorie: "Logistique", sous_categorie: "Frais de livraison", description: "", montant: "", pays: marche, responsable: "", justificatif: "", notes: "" });
    setShowModalDepense(true);
  };
  const openEditDepense = (d: any) => {
    setEditDepense(d);
    setDepenseForm({ date: d.date, categorie: d.categorie, sous_categorie: d.sous_categorie||"", description: d.description||"", montant: d.montant||"", pays: d.pays||"MA", responsable: d.responsable||"", justificatif: d.justificatif||"", notes: d.notes||"" });
    setShowModalDepense(true);
  };
  const saveDepense = async () => {
    if (!depenseForm.montant) { alert("Le montant est obligatoire."); return; }
    setSaving(true);
    const payload = { date: depenseForm.date, categorie: depenseForm.categorie, sous_categorie: depenseForm.sous_categorie, description: depenseForm.description, montant: Number(depenseForm.montant)||0, pays: depenseForm.pays, responsable: depenseForm.responsable, justificatif: depenseForm.justificatif, notes: depenseForm.notes };
    if (editDepense) await supabase.from("depenses").update(payload).eq("id", editDepense.id);
    else await supabase.from("depenses").insert([payload]);
    setSaving(false); setShowModalDepense(false); fetchDepenses();
  };
  const deleteDepense = async (id: number) => {
    if (!confirm("Supprimer cette dépense ?")) return;
    await supabase.from("depenses").delete().eq("id", id);
    fetchDepenses();
  };

  const saveVirement = (soc: string) => { setEditingVirement(null); setSavedSuccess(soc); setTimeout(() => setSavedSuccess(null), 2000); };
  const getStatutVirement = (v: { attendu: number; recu: number; statut: string }) => {
    if (v.statut === "Reçu total" || v.recu >= v.attendu) return { label: "✅ Reçu total", bg: "#ECFDF5", color: "#065F46" };
    if (v.statut === "Reçu partiel" || (v.recu > 0 && v.recu < v.attendu)) return { label: "🟡 Reçu partiel", bg: "#FFFBEB", color: "#92400E" };
    return { label: "🔴 Non reçu", bg: "#FEF2F2", color: "#991B1B" };
  };

  const getCatColor = (cat: string) => ({
    "Logistique": "#3B82F6", "Bureau": "#8B5CF6", "Salaires": "#EF4444",
    "VoIP": "#06B6D4", "Achat": "#10B981", "Mvm de fonds": "#F59E0B",
    "Exceptionnelle": "#F97316", "Pub / Marketing": "#6366F1", "Autres": "#6B7280",
  }[cat] || "#6B7280");

  const formatNum  = (n: number) => n === 0 ? "0" : n.toLocaleString("fr-FR");
  const colorSolde = (n: number) => n >= 0 ? "#10B981" : "#EF4444";
  const paysActuel = PAYS_MAP[marche];

  const inputStyle: any  = { width: "100%", padding: "9px 12px", border: "1.5px solid #E5E7EB", borderRadius: 8, fontSize: 13, outline: "none", boxSizing: "border-box" };
  const labelStyle: any  = { fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 };
  const thStyle: any     = { padding: "10px 12px", textAlign: "left", fontSize: 11, color: "white", fontWeight: 600, whiteSpace: "nowrap", background: "#1E3A5F" };
  const tdStyle: any     = { padding: "9px 12px", fontSize: 12, borderBottom: "1px solid #F3F4F6", whiteSpace: "nowrap" };
  const fieldStyle: any  = { width: "100%", padding: "8px 12px", border: "1.5px solid #E5E7EB", borderRadius: 8, fontSize: 13, outline: "none", boxSizing: "border-box" };
  const selectStyle: any = { padding: "8px 12px", border: "1.5px solid #E5E7EB", borderRadius: 8, fontSize: 13, outline: "none", background: "white", cursor: "pointer" };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#F0F4F8" }}>
      <Sidebar role="comptable" />
      <div style={{ marginLeft: 240, flex: 1, padding: 32 }}>

        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: "#1E3A5F" }}>Comptabilité</h1>
          <p style={{ margin: "4px 0 0", color: "#6B7280", fontSize: 14 }}>Rapport financier et suivi des paiements</p>
        </div>

        {/* KPIs */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 16, marginBottom: 24 }}>
          {[
            { label: "CA Total",       value: totalCA.toLocaleString("fr-FR"),         color: "#10B981", icon: "💰" },
            { label: "Total dépenses", value: totalDepensesAll.toLocaleString("fr-FR"), color: "#EF4444", icon: "💸" },
            { label: "Bénéfice net",   value: beneficeNet.toLocaleString("fr-FR"),      color: beneficeNet >= 0 ? "#10B981" : "#EF4444", icon: "📈" },
            { label: "Livrés",         value: livres.length,                             color: "#6366F1", icon: "✅" },
            { label: "Solde actuel",   value: formatNum(soldeFinal),                    color: soldeFinal >= 0 ? "#10B981" : "#EF4444", icon: "🏦" },
          ].map(kpi => (
            <div key={kpi.label} style={{ background: "white", borderRadius: 12, padding: "20px", boxShadow: "0 1px 4px rgba(0,0,0,0.08)", borderTop: `3px solid ${kpi.color}` }}>
              <div style={{ fontSize: 24 }}>{kpi.icon}</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: kpi.color, marginTop: 8 }}>{kpi.value}</div>
              <div style={{ fontSize: 13, color: "#6B7280", marginTop: 4 }}>{kpi.label}</div>
            </div>
          ))}
        </div>

        {/* ════ TAB RAPPORT JOURNALIER ════ */}
        {tab === "rapport_journalier" && (
          <div>
            {/* Filtres */}
            <div style={{ background: "white", borderRadius: 12, padding: "16px 20px", marginBottom: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.06)", display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
              {/* Select pays */}
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 12, color: "#6B7280", fontWeight: 600 }}>Pays :</span>
                <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                  {paysActuel && (
                    <span style={{ position: "absolute", left: 10, background: paysActuel.bg, color: "white", padding: "1px 6px", borderRadius: 4, fontSize: 10, fontWeight: 800, zIndex: 1, pointerEvents: "none" }}>
                      {paysActuel.code}
                    </span>
                  )}
                  <select value={marche} onChange={e => setMarche(e.target.value)} style={{ ...selectStyle, paddingLeft: 52, minWidth: 180 }}>
                    {PAYS.map(p => <option key={p.code} value={p.code}>{p.code} — {p.label}</option>)}
                  </select>
                </div>
              </div>

              {/* Select partenaire */}
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 12, color: "#6B7280", fontWeight: 600 }}>Partenaire :</span>
                <select value={filtrePartenaire} onChange={e => setFiltrePartenaire(e.target.value)} style={{ ...selectStyle, minWidth: 180 }}>
                  {partenaires.map(p => <option key={p} value={p}>{p === "Tous" ? "🏢 Tous partenaires" : p}</option>)}
                </select>
                {filtrePartenaire !== "Tous" && (
                  <button onClick={() => setFiltrePartenaire("Tous")} style={{ padding: "4px 8px", background: "#F3F4F6", border: "none", borderRadius: 6, fontSize: 11, cursor: "pointer" }}>✕</button>
                )}
              </div>

              <div style={{ width: 1, height: 28, background: "#E5E7EB" }} />

              {/* Solde initial */}
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 12, color: "#6B7280" }}>Solde initial :</span>
                <span style={{ fontWeight: 800, fontSize: 14, color: colorSolde(soldeInitial) }}>{formatNum(soldeInitial)}</span>
                <button onClick={() => { setSoldeForm({ mois: moisActuel, solde: String(soldeInitial) }); setShowModalSolde(true); }}
                  style={{ padding: "4px 10px", background: "#EFF6FF", color: "#3B82F6", border: "none", borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>✏️</button>
              </div>

              <div style={{ marginLeft: "auto", display: "flex", gap: 10, alignItems: "center" }}>
                <div style={{ background: soldeFinal >= 0 ? "#ECFDF5" : "#FEF2F2", borderRadius: 10, padding: "8px 16px", fontSize: 13, fontWeight: 800, color: colorSolde(soldeFinal) }}>
                  💰 Solde : {formatNum(soldeFinal)}
                </div>
                <button onClick={openAdd} style={{ padding: "10px 20px", background: "#1E3A5F", color: "white", border: "none", borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                  ➕ Ajouter une ligne
                </button>
              </div>
            </div>

            {/* Tableau recettes */}
            <div style={{ background: "white", borderRadius: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.08)", overflow: "hidden", marginBottom: 24 }}>
              <div style={{ padding: "14px 20px", borderBottom: "1px solid #E5E7EB", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h2 style={{ margin: 0, fontSize: 15, color: "#1E3A5F", fontWeight: 700 }}>
                  📈 Recettes — {paysActuel?.label || marche}
                  {filtrePartenaire !== "Tous" && <span style={{ fontSize: 12, color: "#6B7280", fontWeight: 400, marginLeft: 8 }}>· {filtrePartenaire}</span>}
                </h2>
                <span style={{ fontSize: 12, color: "#6B7280" }}>{lignesCalculees.length} ligne{lignesCalculees.length > 1 ? "s" : ""}</span>
              </div>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 1200 }}>
                  <thead>
                    <tr>
                      {["Date","Partenaire","Nb Livr.","Encaissement","Recette ext.","Total recette","Frais liv.","Autres charges","Différence","Solde J-1","Versement","Frais transfert","Solde","Commentaire","Actions"].map(h => (
                        <th key={h} style={thStyle}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {/* Ligne solde initial */}
                    <tr style={{ background: "#F0F9FF" }}>
                      <td colSpan={12} style={{ ...tdStyle, fontSize: 11, color: "#6B7280", fontStyle: "italic" }}>
                        Solde initial — {paysActuel?.label} — {moisActuel}
                      </td>
                      <td style={{ ...tdStyle, fontWeight: 800, color: colorSolde(soldeInitial) }}>{formatNum(soldeInitial)}</td>
                      <td style={tdStyle}></td><td style={tdStyle}></td>
                    </tr>

                    {lignesCalculees.length === 0 ? (
                      <tr><td colSpan={15} style={{ padding: "48px", textAlign: "center", color: "#9CA3AF" }}>
                        <div style={{ fontSize: 40, marginBottom: 8 }}>📊</div>
                        {filtrePartenaire !== "Tous" ? `Aucune ligne pour "${filtrePartenaire}"` : `Aucune ligne — Cliquez sur "Ajouter une ligne"`}
                      </td></tr>
                    ) : lignesCalculees.map((l, i) => (
                      <tr key={l.id} style={{ background: i%2 ? "#FAFAFA" : "white" }}>
                        <td style={{ ...tdStyle, fontWeight: 600 }}>{new Date(l.date).toLocaleDateString("fr-FR")}</td>
                        <td style={{ ...tdStyle, fontWeight: 600 }}>{l.partenaire||"—"}</td>
                        <td style={{ ...tdStyle, textAlign: "center" }}>{l.nb_livraisons||0}</td>
                        <td style={{ ...tdStyle, color: "#10B981", fontWeight: 600 }}>{formatNum(Number(l.encaissement)||0)}</td>
                        <td style={{ ...tdStyle, color: "#6366F1" }}>{formatNum(Number(l.recette_externe)||0)}</td>
                        <td style={{ ...tdStyle, fontWeight: 700, color: "#1E3A5F" }}>{formatNum(l.total_recette||0)}</td>
                        <td style={{ ...tdStyle, color: "#EF4444" }}>{formatNum(Number(l.frais_livraison)||0)}</td>
                        <td style={{ ...tdStyle, color: "#F97316" }}>{formatNum(Number(l.autres_charges)||0)}</td>
                        <td style={{ ...tdStyle, fontWeight: 700, color: colorSolde(l.difference) }}>{formatNum(l.difference)}</td>
                        <td style={{ ...tdStyle, color: colorSolde(l.solde_j1) }}>{formatNum(l.solde_j1)}</td>
                        <td style={{ ...tdStyle, color: "#6366F1" }}>{formatNum(Number(l.versement)||0)}</td>
                        <td style={{ ...tdStyle, color: "#8B5CF6" }}>{formatNum(Number(l.frais_transfert)||0)}</td>
                        <td style={{ ...tdStyle, fontWeight: 800, fontSize: 13, color: colorSolde(l.solde) }}>{formatNum(l.solde)}</td>
                        <td style={{ ...tdStyle, color: "#6B7280", fontStyle: "italic", maxWidth: 140 }}>{l.commentaire||"—"}</td>
                        <td style={tdStyle}>
                          <div style={{ display: "flex", gap: 6 }}>
                            <button onClick={() => openEdit(l)} style={{ width: 28, height: 28, background: "#FFFBEB", border: "none", borderRadius: 6, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13 }}>✏️</button>
                            <button onClick={() => deleteLigne(l.id)} style={{ width: 28, height: 28, background: "#FEF2F2", border: "none", borderRadius: 6, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13 }}>🗑️</button>
                          </div>
                        </td>
                      </tr>
                    ))}

                    {/* Totaux */}
                    {lignesCalculees.length > 0 && (
                      <tr style={{ background: "#1E3A5F" }}>
                        <td colSpan={2} style={{ ...tdStyle, color: "white", fontWeight: 800, borderBottom: "none" }}>TOTAUX</td>
                        <td style={{ ...tdStyle, color: "white", fontWeight: 800, textAlign: "center", borderBottom: "none" }}>{totalNbLiv}</td>
                        <td style={{ ...tdStyle, color: "#86EFAC", fontWeight: 800, borderBottom: "none" }}>{formatNum(totalEnc)}</td>
                        <td style={{ ...tdStyle, color: "#C4B5FD", fontWeight: 800, borderBottom: "none" }}>{formatNum(totalExtRef)}</td>
                        <td style={{ ...tdStyle, color: "#FDE68A", fontWeight: 800, borderBottom: "none" }}>{formatNum(totalRecettes)}</td>
                        <td style={{ ...tdStyle, color: "#FCA5A5", fontWeight: 800, borderBottom: "none" }}>{formatNum(totalFrais)}</td>
                        <td style={{ ...tdStyle, color: "#FED7AA", fontWeight: 800, borderBottom: "none" }}>{formatNum(totalAutres)}</td>
                        <td style={{ ...tdStyle, color: totalDiff >= 0 ? "#86EFAC" : "#FCA5A5", fontWeight: 800, borderBottom: "none" }}>{formatNum(totalDiff)}</td>
                        <td style={{ ...tdStyle, color: "white", borderBottom: "none" }}>—</td>
                        <td style={{ ...tdStyle, color: "#C4B5FD", fontWeight: 800, borderBottom: "none" }}>{formatNum(totalVers)}</td>
                        <td style={{ ...tdStyle, color: "#DDD6FE", fontWeight: 800, borderBottom: "none" }}>{formatNum(totalTransfert)}</td>
                        <td style={{ ...tdStyle, color: soldeFinal >= 0 ? "#86EFAC" : "#FCA5A5", fontWeight: 800, fontSize: 14, borderBottom: "none" }}>{formatNum(soldeFinal)}</td>
                        <td colSpan={2} style={{ ...tdStyle, borderBottom: "none" }}></td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Dépenses du pays sélectionné */}
            <div style={{ background: "white", borderRadius: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.08)", overflow: "hidden" }}>
              <div style={{ padding: "14px 20px", borderBottom: "1px solid #E5E7EB", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h2 style={{ margin: 0, fontSize: 15, color: "#EF4444", fontWeight: 700 }}>
                  📉 Dépenses — {paysActuel?.label || marche}
                </h2>
                <button onClick={openAddDepense} style={{ padding: "8px 16px", background: "#EF4444", color: "white", border: "none", borderRadius: 8, fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
                  ➕ Ajouter une dépense
                </button>
              </div>

              {/* Résumé par catégorie pour ce pays */}
              {(() => {
                const depensesPays = depenses.filter(d => d.pays === marche);
                const parCat = Object.keys(CATEGORIES).map(cat => ({
                  cat, total: depensesPays.filter(d => d.categorie === cat).reduce((s,d) => s + (Number(d.montant)||0), 0)
                })).filter(x => x.total > 0);
                const totalPays = parCat.reduce((s,x) => s + x.total, 0);
                if (parCat.length === 0) return null;
                return (
                  <div style={{ padding: "12px 20px", borderBottom: "1px solid #F3F4F6", display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                    <span style={{ fontSize: 12, color: "#6B7280", fontWeight: 600 }}>Total dépenses ce pays :</span>
                    <span style={{ fontSize: 14, fontWeight: 800, color: "#EF4444" }}>{formatNum(totalPays)}</span>
                    <span style={{ fontSize: 11, color: "#D1D5DB" }}>|</span>
                    {parCat.map(x => (
                      <span key={x.cat} style={{ background: `${getCatColor(x.cat)}20`, color: getCatColor(x.cat), padding: "3px 8px", borderRadius: 8, fontSize: 11, fontWeight: 600 }}>
                        {x.cat} : {formatNum(x.total)}
                      </span>
                    ))}
                  </div>
                );
              })()}

              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "#FEF2F2" }}>
                      {["Date","Catégorie","Sous-catégorie","Description","Montant","Responsable","Notes","Actions"].map(h => (
                        <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 11, color: "#991B1B", fontWeight: 600, borderBottom: "1px solid #FEE2E2", whiteSpace: "nowrap" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {depenses.filter(d => d.pays === marche).length === 0 ? (
                      <tr><td colSpan={8} style={{ padding: "32px", textAlign: "center", color: "#9CA3AF" }}>
                        Aucune dépense pour {paysActuel?.label || marche} — cliquez sur "Ajouter une dépense"
                      </td></tr>
                    ) : depenses.filter(d => d.pays === marche).map((d, i) => (
                      <tr key={d.id} style={{ background: i%2 ? "#FAFAFA" : "white", borderBottom: "1px solid #F3F4F6" }}>
                        <td style={{ padding: "9px 14px", fontSize: 12, fontWeight: 600 }}>{new Date(d.date).toLocaleDateString("fr-FR")}</td>
                        <td style={{ padding: "9px 14px" }}>
                          <span style={{ background: `${getCatColor(d.categorie)}20`, color: getCatColor(d.categorie), padding: "2px 8px", borderRadius: 6, fontSize: 11, fontWeight: 700 }}>{d.categorie}</span>
                        </td>
                        <td style={{ padding: "9px 14px", fontSize: 12, color: "#6B7280" }}>{d.sous_categorie||"—"}</td>
                        <td style={{ padding: "9px 14px", fontSize: 12, fontWeight: 600 }}>{d.description||"—"}</td>
                        <td style={{ padding: "9px 14px", fontSize: 13, fontWeight: 800, color: "#EF4444" }}>{formatNum(Number(d.montant)||0)}</td>
                        <td style={{ padding: "9px 14px", fontSize: 12, color: "#6B7280" }}>{d.responsable||"—"}</td>
                        <td style={{ padding: "9px 14px", fontSize: 11, color: "#6B7280", fontStyle: "italic" }}>{d.notes||"—"}</td>
                        <td style={{ padding: "9px 14px" }}>
                          <div style={{ display: "flex", gap: 6 }}>
                            <button onClick={() => openEditDepense(d)} style={{ width: 26, height: 26, background: "#FFFBEB", border: "none", borderRadius: 6, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}>✏️</button>
                            <button onClick={() => deleteDepense(d.id)} style={{ width: 26, height: 26, background: "#FEF2F2", border: "none", borderRadius: 6, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}>🗑️</button>
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

        {/* ════ TAB LIVRAISONS ════ */}
        {tab === "rapport" && (() => {
          const societesDispos = ["Tous", ...Array.from(new Set(livraisons.map(l => l.ste_livraison||l.societe_livraison).filter(Boolean)))];
          const paysDispos     = ["Tous", ...Array.from(new Set(livraisons.map(l => toPaysCode(l.marche)).filter(Boolean)))];
          const statutsDispos  = ["Tous", ...Array.from(new Set(livraisons.map(l => l.statut_livraison).filter(Boolean)))];
          const livFiltered = livraisons.filter(l => {
            const soc = l.ste_livraison||l.societe_livraison||"";
            if (filtreLivSociete !== "Tous" && soc !== filtreLivSociete) return false;
            if (filtreLivPays    !== "Tous" && toPaysCode(l.marche) !== filtreLivPays) return false;
            if (filtreLivStatut  !== "Tous" && l.statut_livraison !== filtreLivStatut) return false;
            return true;
          });
          return (
            <div>
              <div style={{ background: "white", borderRadius: 12, padding: "14px 20px", marginBottom: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.06)", display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                <select value={filtreLivSociete} onChange={e => setFiltreLivSociete(e.target.value)} style={selectStyle}>
                  <option value="Tous">🏢 Toutes sociétés</option>
                  {societesDispos.filter(s => s !== "Tous").map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <select value={filtreLivPays} onChange={e => setFiltreLivPays(e.target.value)} style={selectStyle}>
                  <option value="Tous">🌍 Tous pays</option>
                  {paysDispos.filter(p => p !== "Tous").map(p => <option key={p} value={p}>{p} — {nomPays(p)}</option>)}
                </select>
                <select value={filtreLivStatut} onChange={e => setFiltreLivStatut(e.target.value)} style={selectStyle}>
                  <option value="Tous">📊 Tous statuts</option>
                  {statutsDispos.filter(s => s !== "Tous").map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                {(filtreLivSociete !== "Tous" || filtreLivPays !== "Tous" || filtreLivStatut !== "Tous") && (
                  <button onClick={() => { setFiltreLivSociete("Tous"); setFiltreLivPays("Tous"); setFiltreLivStatut("Tous"); }}
                    style={{ padding: "8px 12px", background: "#F3F4F6", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 600 }}>🔄 Reset</button>
                )}
                <span style={{ fontSize: 12, color: "#6B7280", marginLeft: "auto" }}>{livFiltered.length} livraison{livFiltered.length > 1 ? "s" : ""}</span>
              </div>
              <div style={{ background: "white", borderRadius: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.08)", overflow: "hidden" }}>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ background: "#F9FAFB" }}>
                        {["Client","Pays","Ville","Produit","Qté","Prix unit.","Total","Société Livr.","Statut liv.","Net","Date"].map(h => (
                          <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, color: "#6B7280", fontWeight: 600, borderBottom: "1px solid #E5E7EB", whiteSpace: "nowrap" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {livFiltered.length === 0 ? (
                        <tr><td colSpan={11} style={{ padding: "48px", textAlign: "center", color: "#9CA3AF" }}>
                          <div style={{ fontSize: 48, marginBottom: 12 }}>💰</div>Aucune livraison
                        </td></tr>
                      ) : livFiltered.map((l, i) => {
                        const total   = (l.prix_unitaire||0)*(l.quantite||1);
                        const isLivre = l.statut_livraison === "Livré";
                        const code    = toPaysCode(l.marche);
                        const cfg     = PAYS_MAP[code] || { bg: "#6B7280" };
                        return (
                          <tr key={l.id} style={{ background: i%2 ? "#FAFAFA" : "white", borderBottom: "1px solid #F3F4F6" }}>
                            <td style={{ padding: "12px 16px", fontWeight: 600, fontSize: 13 }}>{l.nom_client}</td>
                            <td style={{ padding: "12px 16px" }}>
                              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                                <span style={{ background: cfg.bg, color: "white", padding: "2px 6px", borderRadius: 5, fontSize: 10, fontWeight: 800, display: "inline-block" }}>{code}</span>
                                <span style={{ fontSize: 9, color: "#6B7280" }}>{nomPays(l.marche)}</span>
                              </div>
                            </td>
                            <td style={{ padding: "12px 16px", fontSize: 13 }}>{l.ville}</td>
                            <td style={{ padding: "12px 16px", fontSize: 13 }}>{l.produit}</td>
                            <td style={{ padding: "12px 16px", fontSize: 13, textAlign: "center" }}>{l.quantite}</td>
                            <td style={{ padding: "12px 16px", fontSize: 13 }}>{(l.prix_unitaire||0).toLocaleString("fr-FR")}</td>
                            <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 600 }}>{total.toLocaleString("fr-FR")}</td>
                            <td style={{ padding: "12px 16px", fontSize: 13, color: "#6B7280" }}>{l.ste_livraison||l.societe_livraison||"—"}</td>
                            <td style={{ padding: "12px 16px" }}>
                              <span style={{ background: isLivre ? "#ECFDF5" : "#FEF2F2", color: isLivre ? "#065F46" : "#991B1B", padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600 }}>{l.statut_livraison}</span>
                            </td>
                            <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 700, color: isLivre ? "#10B981" : "#EF4444" }}>{isLivre ? total.toLocaleString("fr-FR") : "0"}</td>
                            <td style={{ padding: "12px 16px", fontSize: 12, color: "#9CA3AF" }}>{new Date(l.created_at).toLocaleDateString("fr-FR")}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          );
        })()}

        {/* ════ TAB DÉPENSES ════ */}
        {tab === "depenses" && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 20 }}>
              {[
                { label: "Total dépenses",  value: totalDepensesAll.toLocaleString("fr-FR"), color: "#EF4444" },
                { label: "Ce mois",         value: depenses.filter(d => d.date?.startsWith(moisActuel)).reduce((s,d) => s + (Number(d.montant)||0), 0).toLocaleString("fr-FR"), color: "#F97316" },
                { label: "Nb transactions", value: depenses.length, color: "#6366F1" },
                { label: "Bénéfice net",    value: beneficeNet.toLocaleString("fr-FR"), color: beneficeNet >= 0 ? "#10B981" : "#EF4444" },
              ].map(k => (
                <div key={k.label} style={{ background: "white", borderRadius: 12, padding: "20px", boxShadow: "0 1px 4px rgba(0,0,0,0.08)", borderTop: `3px solid ${k.color}` }}>
                  <div style={{ fontSize: 24, fontWeight: 800, color: k.color }}>{k.value}</div>
                  <div style={{ fontSize: 13, color: "#6B7280", marginTop: 4 }}>{k.label}</div>
                </div>
              ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
              <div style={{ background: "white", borderRadius: 16, padding: 24, boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
                <h3 style={{ margin: "0 0 16px", fontSize: 15, color: "#1E3A5F" }}>📊 Par catégorie</h3>
                {depensesParCat.length === 0
                  ? <div style={{ textAlign: "center", color: "#9CA3AF", padding: "24px 0" }}>Aucune dépense</div>
                  : depensesParCat.map(d => (
                    <div key={d.cat} style={{ marginBottom: 12 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <span style={{ fontSize: 12, color: "#374151", fontWeight: 600 }}>{d.cat}</span>
                        <span style={{ fontSize: 12, fontWeight: 800, color: getCatColor(d.cat) }}>{formatNum(d.total)}</span>
                      </div>
                      <div style={{ background: "#F3F4F6", borderRadius: 20, height: 7, overflow: "hidden" }}>
                        <div style={{ width: `${(d.total/maxDepCat)*100}%`, height: "100%", background: getCatColor(d.cat), borderRadius: 20 }} />
                      </div>
                    </div>
                  ))
                }
              </div>
              <div style={{ background: "white", borderRadius: 16, padding: 24, boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
                <h3 style={{ margin: "0 0 16px", fontSize: 15, color: "#1E3A5F" }}>🌍 Par pays</h3>
                {depensesParPays.length === 0
                  ? <div style={{ textAlign: "center", color: "#9CA3AF", padding: "24px 0" }}>Aucune dépense</div>
                  : depensesParPays.map(d => (
                    <div key={d.code} style={{ marginBottom: 12 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, alignItems: "center" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ background: d.bg, color: "white", padding: "1px 6px", borderRadius: 4, fontSize: 10, fontWeight: 800 }}>{d.code}</span>
                          <span style={{ fontSize: 12, color: "#374151" }}>{d.label}</span>
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 800, color: d.bg }}>{formatNum(d.total)}</span>
                      </div>
                      <div style={{ background: "#F3F4F6", borderRadius: 20, height: 7, overflow: "hidden" }}>
                        <div style={{ width: `${(d.total/maxDepPays)*100}%`, height: "100%", background: d.bg, borderRadius: 20 }} />
                      </div>
                    </div>
                  ))
                }
              </div>
            </div>

            <div style={{ background: "white", borderRadius: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.08)", overflow: "hidden" }}>
              <div style={{ padding: "16px 20px", borderBottom: "1px solid #E5E7EB", display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                <h2 style={{ margin: 0, fontSize: 15, color: "#1E3A5F", flex: 1 }}>💸 Toutes les dépenses</h2>
                <select value={filtreDepensePays} onChange={e => setFiltreDepensePays(e.target.value)} style={selectStyle}>
                  <option value="Tous">🌍 Tous pays</option>
                  {PAYS.map(p => <option key={p.code} value={p.code}>{p.code} — {p.label}</option>)}
                </select>
                <select value={filtreDepenseCat} onChange={e => setFiltreDepenseCat(e.target.value)} style={selectStyle}>
                  <option value="Tous">📂 Toutes catégories</option>
                  {Object.keys(CATEGORIES).map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <input type="month" value={filtreDepenseMois} onChange={e => setFiltreDepenseMois(e.target.value)} style={{ ...selectStyle, fontSize: 12 }} />
                {(filtreDepensePays !== "Tous" || filtreDepenseCat !== "Tous" || filtreDepenseMois) && (
                  <button onClick={() => { setFiltreDepensePays("Tous"); setFiltreDepenseCat("Tous"); setFiltreDepenseMois(""); }}
                    style={{ padding: "8px 12px", background: "#F3F4F6", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 600 }}>🔄 Reset</button>
                )}
                <button onClick={openAddDepense} style={{ padding: "9px 18px", background: "#EF4444", color: "white", border: "none", borderRadius: 8, fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
                  ➕ Ajouter une dépense
                </button>
              </div>
              {depensesFiltrees.length > 0 && (
                <div style={{ padding: "10px 20px", background: "#FFF5F5", borderBottom: "1px solid #FEE2E2", display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 13, color: "#6B7280" }}>{depensesFiltrees.length} dépense{depensesFiltrees.length > 1 ? "s" : ""}</span>
                  <span style={{ fontSize: 14, fontWeight: 800, color: "#EF4444" }}>Total : {formatNum(totalDepenses)}</span>
                </div>
              )}
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "#F9FAFB" }}>
                      {["Date","Catégorie","Sous-catégorie","Description","Montant","Pays","Responsable","Notes","Actions"].map(h => (
                        <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, color: "#6B7280", fontWeight: 600, borderBottom: "1px solid #E5E7EB", whiteSpace: "nowrap" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {depensesFiltrees.length === 0 ? (
                      <tr><td colSpan={9} style={{ padding: "48px", textAlign: "center", color: "#9CA3AF" }}>
                        <div style={{ fontSize: 40, marginBottom: 8 }}>💸</div>Aucune dépense
                      </td></tr>
                    ) : depensesFiltrees.map((d, i) => {
                      const code = toPaysCode(d.pays);
                      const cfg  = PAYS_MAP[code] || { bg: "#6B7280" };
                      return (
                        <tr key={d.id} style={{ background: i%2 ? "#FAFAFA" : "white", borderBottom: "1px solid #F3F4F6" }}>
                          <td style={{ padding: "10px 16px", fontSize: 12, fontWeight: 600 }}>{new Date(d.date).toLocaleDateString("fr-FR")}</td>
                          <td style={{ padding: "10px 16px" }}>
                            <span style={{ background: `${getCatColor(d.categorie)}20`, color: getCatColor(d.categorie), padding: "3px 8px", borderRadius: 8, fontSize: 11, fontWeight: 700 }}>{d.categorie}</span>
                          </td>
                          <td style={{ padding: "10px 16px", fontSize: 12, color: "#6B7280" }}>{d.sous_categorie||"—"}</td>
                          <td style={{ padding: "10px 16px", fontSize: 13, fontWeight: 600, maxWidth: 200 }}>{d.description||"—"}</td>
                          <td style={{ padding: "10px 16px", fontSize: 14, fontWeight: 800, color: "#EF4444" }}>{formatNum(Number(d.montant)||0)}</td>
                          <td style={{ padding: "10px 16px" }}>
                            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                              <span style={{ background: cfg.bg, color: "white", padding: "2px 6px", borderRadius: 4, fontSize: 10, fontWeight: 800, display: "inline-block" }}>{code}</span>
                              <span style={{ fontSize: 9, color: "#6B7280" }}>{nomPays(d.pays)}</span>
                            </div>
                          </td>
                          <td style={{ padding: "10px 16px", fontSize: 12, color: "#6B7280" }}>{d.responsable||"—"}</td>
                          <td style={{ padding: "10px 16px", fontSize: 12, color: "#6B7280", fontStyle: "italic" }}>{d.notes||"—"}</td>
                          <td style={{ padding: "10px 16px" }}>
                            <div style={{ display: "flex", gap: 6 }}>
                              <button onClick={() => openEditDepense(d)} style={{ width: 28, height: 28, background: "#FFFBEB", border: "none", borderRadius: 6, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13 }}>✏️</button>
                              <button onClick={() => deleteDepense(d.id)} style={{ width: 28, height: 28, background: "#FEF2F2", border: "none", borderRadius: 6, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13 }}>🗑️</button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ════ TAB TRESORERIE ════ */}
        {tab === "tresorerie" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
              {[
                { label: "Total à recevoir", value: totalAttendu.toLocaleString("fr-FR"), color: "#1E3A5F" },
                { label: "Déjà reçu",        value: totalRecu.toLocaleString("fr-FR"),    color: "#10B981" },
                { label: "Reste en attente", value: totalReste.toLocaleString("fr-FR"),   color: totalReste > 0 ? "#EF4444" : "#10B981" },
              ].map(c => (
                <div key={c.label} style={{ background: "white", borderRadius: 12, padding: "20px 24px", boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
                  <div style={{ fontSize: 13, color: "#6B7280" }}>{c.label}</div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: c.color, marginTop: 6 }}>{c.value}</div>
                </div>
              ))}
            </div>
            <div style={{ background: "white", borderRadius: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.08)", overflow: "hidden" }}>
              <div style={{ padding: "20px 24px", borderBottom: "1px solid #E5E7EB", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h2 style={{ margin: 0, fontSize: 16, color: "#1E3A5F" }}>📅 Virements attendus par société</h2>
                <span style={{ fontSize: 12, background: "#DBEAFE", color: "#1D4ED8", padding: "4px 10px", borderRadius: 20, fontWeight: 600 }}>✏️ Modifiable</span>
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#F9FAFB" }}>
                    {["Société","Montant attendu","Montant reçu","Écart","Date réception","Notes","Statut","Actions"].map(h => (
                      <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, color: "#6B7280", fontWeight: 600, borderBottom: "1px solid #E5E7EB" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Object.keys(virementData).length === 0 ? (
                    <tr><td colSpan={8} style={{ padding: "48px", textAlign: "center", color: "#9CA3AF" }}>
                      <div style={{ fontSize: 48, marginBottom: 12 }}>📅</div>Aucun virement
                    </td></tr>
                  ) : Object.entries(virementData).map(([soc, v], i) => {
                    const isEditing  = editingVirement === soc;
                    const ecart      = v.attendu - (v.recu||0);
                    const statutInfo = getStatutVirement(v);
                    return (
                      <tr key={soc} style={{ background: isEditing ? "#F0F9FF" : i%2 ? "#FAFAFA" : "white", borderBottom: "1px solid #F3F4F6" }}>
                        <td style={{ padding: "14px 16px", fontWeight: 700, fontSize: 14 }}>{soc}</td>
                        <td style={{ padding: "14px 16px", fontSize: 14, fontWeight: 600, color: "#1E3A5F" }}>{v.attendu.toLocaleString("fr-FR")}</td>
                        <td style={{ padding: "10px 16px" }}>
                          {isEditing
                            ? <input type="number" value={v.recu||""} onChange={e => setVirementData(prev => ({ ...prev, [soc]: { ...prev[soc], recu: Number(e.target.value) } }))} style={{ ...fieldStyle, width: 120 }} placeholder="0" />
                            : <span style={{ fontSize: 14, fontWeight: 600, color: v.recu > 0 ? "#10B981" : "#9CA3AF" }}>{v.recu > 0 ? v.recu.toLocaleString("fr-FR") : "— (à saisir)"}</span>
                          }
                        </td>
                        <td style={{ padding: "14px 16px", fontSize: 14, fontWeight: 700, color: ecart > 0 ? "#EF4444" : "#10B981" }}>
                          {ecart > 0 ? `-${ecart.toLocaleString("fr-FR")}` : "✅ Soldé"}
                        </td>
                        <td style={{ padding: "10px 16px" }}>
                          {isEditing
                            ? <input type="date" value={v.date_recu||""} onChange={e => setVirementData(prev => ({ ...prev, [soc]: { ...prev[soc], date_recu: e.target.value } }))} style={{ ...fieldStyle, width: 140 }} />
                            : <span style={{ fontSize: 13, color: v.date_recu ? "#374151" : "#9CA3AF" }}>{v.date_recu ? new Date(v.date_recu).toLocaleDateString("fr-FR") : "—"}</span>
                          }
                        </td>
                        <td style={{ padding: "10px 16px" }}>
                          {isEditing
                            ? <input value={v.notes||""} onChange={e => setVirementData(prev => ({ ...prev, [soc]: { ...prev[soc], notes: e.target.value } }))} style={{ ...fieldStyle, width: 160 }} placeholder="Notes..." />
                            : <span style={{ fontSize: 12, color: v.notes ? "#374151" : "#9CA3AF", fontStyle: v.notes ? "normal" : "italic" }}>{v.notes||"—"}</span>
                          }
                        </td>
                        <td style={{ padding: "10px 16px" }}>
                          {isEditing
                            ? <select value={v.statut} onChange={e => setVirementData(prev => ({ ...prev, [soc]: { ...prev[soc], statut: e.target.value } }))} style={{ ...fieldStyle, width: 150 }}>
                                <option value="En attente">🔴 En attente</option>
                                <option value="Reçu partiel">🟡 Reçu partiel</option>
                                <option value="Reçu total">✅ Reçu total</option>
                                <option value="Litige">⚠️ Litige</option>
                              </select>
                            : <span style={{ background: statutInfo.bg, color: statutInfo.color, padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, whiteSpace: "nowrap" }}>{statutInfo.label}</span>
                          }
                        </td>
                        <td style={{ padding: "10px 16px" }}>
                          {isEditing
                            ? <div style={{ display: "flex", gap: 6 }}>
                                <button onClick={() => saveVirement(soc)} style={{ padding: "6px 14px", background: "#10B981", color: "white", border: "none", borderRadius: 8, fontWeight: 700, fontSize: 12, cursor: "pointer" }}>{savedSuccess === soc ? "✅ Sauvé !" : "💾 Sauver"}</button>
                                <button onClick={() => setEditingVirement(null)} style={{ padding: "6px 10px", background: "#F3F4F6", color: "#374151", border: "none", borderRadius: 8, fontWeight: 600, fontSize: 12, cursor: "pointer" }}>✕</button>
                              </div>
                            : <button onClick={() => setEditingVirement(soc)} style={{ padding: "6px 14px", background: "#EFF6FF", color: "#1D4ED8", border: "1px solid #BFDBFE", borderRadius: 8, fontWeight: 600, fontSize: 12, cursor: "pointer" }}>✏️ Modifier</button>
                          }
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div style={{ padding: "16px 24px", borderTop: "2px solid #E5E7EB", background: "#F9FAFB", display: "flex", gap: 32, alignItems: "center" }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>Total attendu : <span style={{ color: "#1E3A5F", fontWeight: 800 }}>{totalAttendu.toLocaleString("fr-FR")}</span></div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>Total reçu : <span style={{ color: "#10B981", fontWeight: 800 }}>{totalRecu.toLocaleString("fr-FR")}</span></div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>Reste : <span style={{ color: totalReste > 0 ? "#EF4444" : "#10B981", fontWeight: 800 }}>{totalReste.toLocaleString("fr-FR")}</span></div>
                <div style={{ marginLeft: "auto" }}>
                  <div style={{ width: 200, background: "#E5E7EB", borderRadius: 20, height: 8, overflow: "hidden" }}>
                    <div style={{ width: `${totalAttendu > 0 ? Math.min(100, Math.round(totalRecu/totalAttendu*100)) : 0}%`, height: "100%", background: "#10B981", borderRadius: 20 }} />
                  </div>
                  <div style={{ fontSize: 11, color: "#6B7280", marginTop: 4, textAlign: "right" }}>
                    {totalAttendu > 0 ? Math.min(100, Math.round(totalRecu/totalAttendu*100)) : 0}% reçu
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ════ TAB CHARGES FIXES ════ */}
        {tab === "charges" && (
          <div style={{ background: "white", borderRadius: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.08)", overflow: "hidden" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid #E5E7EB", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ margin: 0, fontSize: 16, color: "#1E3A5F" }}>📋 Tableau des charges — Référence</h2>
              <span style={{ fontSize: 12, background: "#F3F4F6", color: "#6B7280", padding: "4px 10px", borderRadius: 20, fontWeight: 600 }}>👁️ Lecture seule</span>
            </div>
            <ChargesTable />
          </div>
        )}

        {/* ════ MODAL RECETTE ════ */}
        {showModalRapport && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ background: "white", borderRadius: 16, padding: 28, width: "85vw", maxWidth: 700, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <h2 style={{ margin: 0, fontSize: 18, color: "#1E3A5F" }}>{editLigne ? "✏️ Modifier la recette" : "➕ Ajouter une recette"}</h2>
                <button onClick={() => setShowModalRapport(false)} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#9CA3AF" }}>✕</button>
              </div>
              <div style={{ marginBottom: 14, padding: "10px 14px", background: "#F0F9FF", borderRadius: 8, fontSize: 13, color: "#1D4ED8", fontWeight: 600 }}>
                Pays : {paysActuel?.label || marche}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                {([
                  ["Date *","date","date",""],
                  ["Partenaire","partenaire","text","Ex: STD, SOX, Interne..."],
                  ["Nb Livraisons","nb_livraisons","number","0"],
                  ["Encaissement","encaissement","number","0"],
                  ["Recette externe","recette_externe","number","0"],
                  ["Frais de livraison","frais_livraison","number","0"],
                  ["Autres charges","autres_charges","number","0"],
                  ["Versement","versement","number","0"],
                  ["Frais de transfert","frais_transfert","number","0"],
                ] as [string,string,string,string][]).map(([label,key,type,ph]) => (
                  <div key={key}>
                    <label style={labelStyle}>{label}</label>
                    <input type={type} placeholder={ph} value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} style={inputStyle} />
                  </div>
                ))}
                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={labelStyle}>Commentaire</label>
                  <input value={form.commentaire} onChange={e => setForm({ ...form, commentaire: e.target.value })} placeholder="Notes..." style={inputStyle} />
                </div>
              </div>
              {/* Aperçu */}
              {(form.encaissement || form.recette_externe || form.frais_livraison || form.autres_charges) && (
                <div style={{ marginTop: 14, background: "#F0F9FF", borderRadius: 10, padding: "12px 16px", display: "flex", gap: 16, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 12, color: "#6B7280" }}>Total recette : <strong style={{ color: "#10B981" }}>{formatNum((Number(form.encaissement)||0)+(Number(form.recette_externe)||0))}</strong></span>
                  <span style={{ fontSize: 12, color: "#6B7280" }}>Différence : <strong style={{ color: colorSolde((Number(form.encaissement)||0)+(Number(form.recette_externe)||0)-(Number(form.frais_livraison)||0)-(Number(form.autres_charges)||0)) }}>{formatNum((Number(form.encaissement)||0)+(Number(form.recette_externe)||0)-(Number(form.frais_livraison)||0)-(Number(form.autres_charges)||0))}</strong></span>
                </div>
              )}
              <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
                <button onClick={saveLigne} disabled={saving} style={{ flex: 1, padding: "13px", background: saving ? "#9CA3AF" : "#1E3A5F", color: "white", border: "none", borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
                  {saving ? "⏳..." : editLigne ? "💾 Sauvegarder" : "➕ Ajouter"}
                </button>
                <button onClick={() => setShowModalRapport(false)} style={{ padding: "13px 20px", background: "#F3F4F6", color: "#374151", border: "none", borderRadius: 10, fontWeight: 600, cursor: "pointer" }}>Annuler</button>
              </div>
            </div>
          </div>
        )}

        {/* ════ MODAL SOLDE INITIAL ════ */}
        {showModalSolde && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ background: "white", borderRadius: 16, padding: 28, width: 420, boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <h2 style={{ margin: 0, fontSize: 18, color: "#1E3A5F" }}>💰 Solde initial — {paysActuel?.label}</h2>
                <button onClick={() => setShowModalSolde(false)} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#9CA3AF" }}>✕</button>
              </div>
              <div style={{ background: "#FFF7ED", borderRadius: 10, padding: "12px 16px", marginBottom: 20, fontSize: 13, color: "#92400E" }}>
                ℹ️ Solde final du mois précédent. À saisir une fois par mois.
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={labelStyle}>Mois (format : 2025-11)</label>
                <input value={soldeForm.mois} onChange={e => setSoldeForm({ ...soldeForm, mois: e.target.value })} style={inputStyle} />
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={labelStyle}>Solde initial (peut être négatif)</label>
                <input type="number" value={soldeForm.solde} onChange={e => setSoldeForm({ ...soldeForm, solde: e.target.value })} placeholder="0" style={inputStyle} />
              </div>
              <div style={{ display: "flex", gap: 12 }}>
                <button onClick={saveSoldeInitial} disabled={saving} style={{ flex: 1, padding: "13px", background: saving ? "#9CA3AF" : "#1E3A5F", color: "white", border: "none", borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
                  {saving ? "⏳..." : "💾 Sauvegarder"}
                </button>
                <button onClick={() => setShowModalSolde(false)} style={{ padding: "13px 20px", background: "#F3F4F6", color: "#374151", border: "none", borderRadius: 10, fontWeight: 600, cursor: "pointer" }}>Annuler</button>
              </div>
            </div>
          </div>
        )}

        {/* ════ MODAL DÉPENSE ════ */}
        {showModalDepense && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ background: "white", borderRadius: 16, padding: 28, width: "85vw", maxWidth: 640, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <h2 style={{ margin: 0, fontSize: 18, color: "#EF4444" }}>{editDepense ? "✏️ Modifier la dépense" : "➕ Ajouter une dépense"}</h2>
                <button onClick={() => setShowModalDepense(false)} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#9CA3AF" }}>✕</button>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div>
                  <label style={labelStyle}>Date *</label>
                  <input type="date" value={depenseForm.date} onChange={e => setDepenseForm({ ...depenseForm, date: e.target.value })} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Pays</label>
                  <select value={depenseForm.pays} onChange={e => setDepenseForm({ ...depenseForm, pays: e.target.value })} style={inputStyle}>
                    {PAYS.map(p => <option key={p.code} value={p.code}>{p.code} — {p.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Catégorie *</label>
                  <select value={depenseForm.categorie} onChange={e => setDepenseForm({ ...depenseForm, categorie: e.target.value, sous_categorie: CATEGORIES[e.target.value]?.[0] || "" })} style={inputStyle}>
                    {Object.keys(CATEGORIES).map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Sous-catégorie</label>
                  <select value={depenseForm.sous_categorie} onChange={e => setDepenseForm({ ...depenseForm, sous_categorie: e.target.value })} style={inputStyle}>
                    {(CATEGORIES[depenseForm.categorie] || []).map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={labelStyle}>Description</label>
                  <input value={depenseForm.description} onChange={e => setDepenseForm({ ...depenseForm, description: e.target.value })} placeholder="Ex: Frais de livraison du 01/11 — 18 livraisons" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Montant *</label>
                  <input type="number" value={depenseForm.montant} onChange={e => setDepenseForm({ ...depenseForm, montant: e.target.value })} placeholder="0" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Responsable</label>
                  <input value={depenseForm.responsable} onChange={e => setDepenseForm({ ...depenseForm, responsable: e.target.value })} placeholder="Ex: Ahmed" style={inputStyle} />
                </div>
                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={labelStyle}>Notes</label>
                  <input value={depenseForm.notes} onChange={e => setDepenseForm({ ...depenseForm, notes: e.target.value })} placeholder="Notes optionnelles..." style={inputStyle} />
                </div>
              </div>
              {depenseForm.montant && (
                <div style={{ marginTop: 14, background: "#FEF2F2", borderRadius: 10, padding: "12px 16px", display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 12, color: "#6B7280" }}>Dépense :</span>
                  <span style={{ fontSize: 18, fontWeight: 800, color: "#EF4444" }}>{Number(depenseForm.montant).toLocaleString("fr-FR")}</span>
                  <span style={{ fontSize: 12, color: "#6B7280" }}>· {depenseForm.categorie} / {depenseForm.sous_categorie}</span>
                </div>
              )}
              <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
                <button onClick={saveDepense} disabled={saving} style={{ flex: 1, padding: "13px", background: saving ? "#9CA3AF" : "#EF4444", color: "white", border: "none", borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
                  {saving ? "⏳..." : editDepense ? "💾 Sauvegarder" : "➕ Ajouter"}
                </button>
                <button onClick={() => setShowModalDepense(false)} style={{ padding: "13px 20px", background: "#F3F4F6", color: "#374151", border: "none", borderRadius: 10, fontWeight: 600, cursor: "pointer" }}>Annuler</button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default withAuth(Comptable, "comptable");