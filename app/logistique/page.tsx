"use client";
import React, { useState, useEffect, useMemo, useRef } from "react";
import * as XLSX from "xlsx";
import { supabase } from "../../lib/supabase";
import Sidebar from "../components/Sidebar";
import TopBar from "../components/TopBar";
import withAuth from "../components/withAuth";

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

function Logistique() {
  const [commandes, setCommandes] = useState([]);
  const [stocks, setStocks] = useState([]);
  const [produits, setProduits] = useState([]);
  const [recherche, setRecherche] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [currentProfile, setCurrentProfile] = useState(null);

  const getTabFromURL = () => {
    if (typeof window === "undefined") return "commandes";
    return new URLSearchParams(window.location.search).get("tab") || "commandes";
  };
  const [tab, setTab] = useState(getTabFromURL);
  const changeTab = (newTab) => {
    setTab(newTab);
    const url = newTab === "commandes" ? "/logistique" : `/logistique?tab=${newTab}`;
    window.history.pushState({}, "", url);
  };
  useEffect(() => {
    const handlePopState = () => setTab(getTabFromURL());
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);
  useEffect(() => { setTab(getTabFromURL()); }, [typeof window !== "undefined" ? window.location.search : ""]);

  const [filtreStatut, setFiltreStatut] = useState("Confirmé");
  const [filtreMarche, setFiltreMarche] = useState("Tous");
  const [filtreVille, setFiltreVille] = useState("Tous");
  const [filtreSource, setFiltreSource] = useState("Tous");
  const [filtreProduit, setFiltreProduit] = useState("Tous");
  const [filtreLivreur, setFiltreLivreur] = useState("Tous");
  const [filtreDateDebut, setFiltreDateDebut] = useState("");
  const [filtreDateFin, setFiltreDateFin] = useState("");
  const [filtreStockMarche, setFiltreStockMarche] = useState("Tous");
  const [filtreStockStatut, setFiltreStockStatut] = useState("Tous");

  const [selected, setSelected] = useState(null);
  const [showPanel, setShowPanel] = useState(false);
  const [livreur, setLivreur] = useState("");
  const [quantiteEdit, setQuantiteEdit] = useState("");
  const [remise, setRemise] = useState("");
  const [notesCrl, setNotesCrl] = useState("");

  const [showCallModal, setShowCallModal] = useState(false);
  const [showActiveCall, setShowActiveCall] = useState(false);
  const [callLead, setCallLead] = useState(null);
  const [callEditForm, setCallEditForm] = useState({});
  const [callSeconds, setCallSeconds] = useState(0);
  const [lastCallTime, setLastCallTime] = useState({});
  const timerRef = useRef(null);

  const [copiedId, setCopiedId] = useState(null);
  const [expandedRow, setExpandedRow] = useState(null);
  const [historiques, setHistoriques] = useState({});

  const [showNewCmd, setShowNewCmd] = useState(false);
  const [newCmd, setNewCmd] = useState({ nom_client: "", telephone: "", produit: "", quantite: "", prix_unitaire: "", ville: "", marche: "MA" });
  const [loadingNew, setLoadingNew] = useState(false);

  const [dashPeriode, setDashPeriode] = useState("semaine");
  const [dashPays, setDashPays] = useState("Tous");
  const [dashLivreur, setDashLivreur] = useState("Tous");

  const fetchAll = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUser(user);
    if (user) {
      const { data: profile } = await supabase.from("Profiles").select("*").eq("id", user.id).single();
      setCurrentProfile(profile);
    }
    const { data: leads } = await supabase.from("Leads").select("*").order("created_at", { ascending: false });
    const { data: stocksData } = await supabase.from("Stocks").select("*");
    const { data: produitsData } = await supabase.from("produits").select("*").order("created_at", { ascending: false });
    if (leads) setCommandes(leads);
    if (stocksData) setStocks(stocksData);
    if (produitsData) setProduits(produitsData);
  };

  useEffect(() => { fetchAll(); }, []);

  const toCode = (m) => {
    if (!m) return "";
    const trimmed = m.trim();
    const byCode = PAYS.find(p => p.code.toLowerCase() === trimmed.toLowerCase());
    if (byCode) return byCode.code;
    const byLabel = PAYS.find(p => p.label.toLowerCase() === trimmed.toLowerCase());
    if (byLabel) return byLabel.code;
    return trimmed.toUpperCase();
  };
  const initCap = (v) => v ? v.charAt(0).toUpperCase() + v.slice(1).toLowerCase() : v;
  const getDispo = (s) => Math.max(0, s.stock_total - s.stock_reserve - s.stock_livre + s.stock_retour);
  const prixTotal = (cmd) => Math.round((cmd.prix_unitaire || 0) * (cmd.quantite || 1) * (1 - (cmd.remise || 0) / 100));
  const timeAgo = (date) => {
    if (!date) return "—";
    const diff = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (diff < 60) return `${diff}s`;
    if (diff < 3600) return `${Math.floor(diff / 60)}min`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}j`;
    return `${Math.floor(diff / 604800)}sem`;
  };
  const getStatutColor = (s) => ({ "Nouveau": "#3B82F6", "Non confirmé": "#F97316", "Confirmé": "#10B981", "Annulé": "#EF4444", "Injoignable": "#F59E0B", "Assignée": "#3B82F6", "En cours": "#8B5CF6", "Livré": "#064E3B", "Retour": "#F97316", "Refusé": "#DC2626", "Absent": "#F59E0B" }[s] || "#6B7280");
  const getStatutLivColor = (s) => ({ "En cours": "#8B5CF6", "Livré": "#064E3B", "Injoignable": "#F59E0B", "Retour": "#F97316", "Refusé": "#DC2626" }[s] || "#6B7280");
  const isLivre = (cmd) => cmd.statut_livraison === "Livré";

  const DrapeauBadge = ({ code }) => {
    const c = toCode(code);
    const pays = PAYS.find(p => p.code === c);
    const bg = pays?.bg || "#6B7280";
    return <span style={{ background: bg, color: "white", padding: "2px 6px", borderRadius: 5, fontSize: 10, fontWeight: 800 }}>{c || "?"}</span>;
  };

  const SourceBadge = ({ src }) => {
    const cfg = { mb: { label: "MB", bg: "#EEF2FF", color: "#6366F1" }, crl: { label: "CRL", bg: "#FEF3C7", color: "#D97706" }, crc: { label: "CRC", bg: "#FCE7F3", color: "#DB2777" } };
    const c = cfg[src?.toLowerCase()] || { label: src?.toUpperCase() || "—", bg: "#F3F4F6", color: "#6B7280" };
    return <span style={{ background: c.bg, color: c.color, padding: "2px 7px", borderRadius: 10, fontSize: 10, fontWeight: 700 }}>{c.label}</span>;
  };

  const fetchHistorique = async (leadId) => {
    const { data } = await supabase.from("historique").select("*").eq("lead_id", leadId).order("created_at", { ascending: false });
    if (data) setHistoriques(prev => ({ ...prev, [leadId]: data }));
  };
  const toggleRow = async (leadId) => {
    if (expandedRow === leadId) setExpandedRow(null);
    else { setExpandedRow(leadId); await fetchHistorique(leadId); }
  };
  const logAction = async (leadId, action, ancienStatut, nouveauStatut, commentaire = "") => {
    await supabase.from("historique").insert([{ lead_id: leadId, action, ancien_statut: ancienStatut, nouveau_statut: nouveauStatut, commentaire, agent_nom: currentProfile?.nom || currentUser?.email || "Agent", agent_role: "CRL" }]);
  };
  const copyLead = (lead) => {
    navigator.clipboard.writeText(`Client: ${lead.nom_client}\nTél: ${lead.telephone}\nProduit: ${lead.produit} x${lead.quantite}\nTotal: ${prixTotal(lead)}\nMarché: ${toCode(lead.marche)}\nVille: ${lead.ville}\nStatut: ${lead.statut}\nLivraison: ${lead.statut_livraison || "—"}`);
    setCopiedId(lead.id);
    setTimeout(() => setCopiedId(null), 2000);
  };
  const openPanel = (cmd) => {
    setSelected(cmd); setQuantiteEdit(String(cmd.quantite)); setRemise(String(cmd.remise || 0));
    setNotesCrl(cmd.notes_livraison || ""); setLivreur(cmd.livreur || ""); setShowPanel(true);
  };
  const updateCommande = async () => {
    if (!selected) return;
    const qte = Number(quantiteEdit) || selected.quantite;
    const rem = Number(remise) || 0;
    const total = Math.round((selected.prix_unitaire * qte) * (1 - rem / 100));
    await supabase.from("Leads").update({ quantite: qte, remise: rem, prix_total: total, notes_livraison: notesCrl, livreur }).eq("id", selected.id);
    await logAction(selected.id, "Modification CRL", selected.statut, selected.statut, notesCrl || "");
    fetchAll();
    setSelected({ ...selected, quantite: qte, remise: rem, prix_total: total, notes_livraison: notesCrl, livreur });
    alert("✅ Modifié !");
  };
  const updateStatut = async (id, statut) => {
    const upd = { statut, statut_livraison: statut };
    if (livreur) upd.livreur = livreur;
    if (notesCrl) upd.notes_livraison = notesCrl;
    await supabase.from("Leads").update(upd).eq("id", id);
    await logAction(id, `Statut → ${statut}`, selected?.statut || "", statut, notesCrl || "");
    fetchAll(); setShowPanel(false); setSelected(null); setLivreur(""); setNotesCrl("");
  };
  const peutRelancer = (lead) => {
    const last = lastCallTime[lead.id];
    if (!last) return true;
    return (Date.now() - last.getTime()) / 60000 >= 30;
  };
  const minutesAvantRelance = (lead) => {
    const last = lastCallTime[lead.id];
    if (!last) return 0;
    return Math.max(0, Math.ceil(30 - (Date.now() - last.getTime()) / 60000));
  };
  const openCall = (lead) => {
    setCallLead(lead);
    setCallEditForm({ nom_client: lead.nom_client || "", telephone: lead.telephone || "", produit: lead.produit || "", quantite: lead.quantite || 1, prix_unitaire: lead.prix_unitaire || 0, ville: lead.ville || "", marche: lead.marche || "MA" });
    setShowCallModal(true);
  };
  const startCall = async () => {
    setShowCallModal(false); setShowActiveCall(true); setCallSeconds(0);
    const now = new Date();
    setLastCallTime(prev => ({ ...prev, [callLead.id]: now }));
    const newRelance = (callLead.nombre_relance || 0) + 1;
    await supabase.from("Leads").update({ nombre_relance: newRelance, dernier_appel_at: now.toISOString() }).eq("id", callLead.id);
    await logAction(callLead.id, `Tentative appel CRL (relance ${newRelance})`, callLead.statut || "", callLead.statut || "");
    timerRef.current = setInterval(() => setCallSeconds(s => s + 1), 1000);
  };
  const endCall = async (nouveauStatut) => {
    clearInterval(timerRef.current);
    const duree = callSeconds;
    const hasChanges = Object.keys(callEditForm).some(k => callEditForm[k] !== callLead[k]);
    const updateData = { statut: nouveauStatut, statut_livraison: nouveauStatut, duree_appel_total: (callLead.duree_appel_total || 0) + duree };
    if (hasChanges) Object.assign(updateData, callEditForm);
    await supabase.from("Leads").update(updateData).eq("id", callLead.id);
    await logAction(callLead.id, `Appel terminé CRL (${formatTime(duree)})`, callLead.statut || "", nouveauStatut, hasChanges ? "Infos modifiées" : "");
    setShowActiveCall(false); setCallLead(null); setCallSeconds(0); fetchAll();
  };
  const formatTime = (s) => `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;
  const formatDureeTotal = (sec) => { if (!sec) return "—"; return `${Math.floor(sec / 60)}min${sec % 60 > 0 ? ` ${sec % 60}s` : ""}`; };

  const exportExcel = () => {
    const data = commandesFiltrees.filter(l => l.statut === "Livré");
    if (data.length === 0) { alert("Aucun livré dans la sélection."); return; }
    const rows = data.map(l => ({ "Client": l.nom_client || "", "Téléphone": l.telephone || "", "Produit": l.produit || "", "Qté": l.quantite || 1, "Prix unit.": l.prix_unitaire || 0, "Total": prixTotal(l), "Marché": toCode(l.marche), "Ville": l.ville || "", "Livreur": l.livreur || "", "Statut": l.statut || "", "Date": new Date(l.created_at).toLocaleDateString("fr-FR") }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Livrés");
    XLSX.writeFile(wb, `livres-${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  const createCommandeDirecte = async () => {
    if (!newCmd.nom_client || !newCmd.telephone || !newCmd.produit) { alert("Remplis au moins nom, téléphone et produit !"); return; }
    setLoadingNew(true);
    const qte = Number(newCmd.quantite) || 1;
    const pu = Number(newCmd.prix_unitaire) || 0;
    const { error } = await supabase.from("Leads").insert([{ nom_client: newCmd.nom_client, telephone: newCmd.telephone, produit: newCmd.produit, quantite: qte, prix_unitaire: pu, prix_total: pu * qte, ville: newCmd.ville, marche: newCmd.marche, statut: "Assignée", statut_livraison: "Assignée", source_creation: "crl", m_b: "Hors système" }]);
    if (!error) {
      alert("✅ Commande directe créée !");
      setNewCmd({ nom_client: "", telephone: "", produit: "", quantite: "", prix_unitaire: "", ville: "", marche: "MA" });
      setShowNewCmd(false); fetchAll();
    } else { alert("Erreur: " + error.message); }
    setLoadingNew(false);
  };

  const getDashLeads = () => {
    const now = new Date(); let debut = new Date();
    if (dashPeriode === "aujourd'hui") debut.setHours(0, 0, 0, 0);
    else if (dashPeriode === "semaine") debut.setDate(now.getDate() - 7);
    else if (dashPeriode === "mois") debut.setMonth(now.getMonth() - 1);
    else debut.setFullYear(now.getFullYear() - 1);
    let base = commandes.filter(l => new Date(l.created_at) >= debut);
    if (dashPays !== "Tous") base = base.filter(l => toCode(l.marche) === dashPays);
    if (dashLivreur !== "Tous") base = base.filter(l => l.livreur === dashLivreur);
    return base;
  };
  const dashLeads   = getDashLeads();
  const dashLivre   = dashLeads.filter(l => l.statut_livraison === "Livré").length;
  const dashRetour  = dashLeads.filter(l => l.statut_livraison === "Retour" || l.statut_livraison === "Refusé").length;
  const dashEnCours = dashLeads.filter(l => l.statut_livraison === "En cours").length;
  const dashCA      = dashLeads.filter(l => l.statut_livraison === "Livré").reduce((sum, l) => sum + prixTotal(l), 0);
  const dashTotal   = dashLeads.length;
  const pctLiv      = dashTotal ? Math.round(dashLivre / dashTotal * 100) : 0;
  const pctRetour   = dashTotal ? Math.round(dashRetour / dashTotal * 100) : 0;

  const tousLivreurs = ["Tous", ...Array.from(new Set(commandes.map(l => l.livreur).filter(Boolean)))];

  const evolutionJours = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    let base = commandes.filter(l => new Date(l.created_at).toDateString() === d.toDateString());
    if (dashPays !== "Tous") base = base.filter(l => toCode(l.marche) === dashPays);
    if (dashLivreur !== "Tous") base = base.filter(l => l.livreur === dashLivreur);
    return { date: d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" }), total: base.length, livres: base.filter(l => l.statut_livraison === "Livré").length, retours: base.filter(l => l.statut_livraison === "Retour" || l.statut_livraison === "Refusé").length };
  });
  const maxEvol = Math.max(...evolutionJours.map(j => j.total), 1);

  const villes       = ["Tous", ...Array.from(new Set(commandes.filter(l => filtreMarche === "Tous" || toCode(l.marche) === filtreMarche).map(l => l.ville ? initCap(l.ville) : null).filter(Boolean)))];
  const produitsNoms = ["Tous", ...Array.from(new Set(commandes.map(l => l.produit).filter(Boolean)))];
  const livreursNoms = ["Tous", ...Array.from(new Set(commandes.map(l => l.livreur).filter(Boolean)))];

  const commandesFiltrees = useMemo(() => commandes.filter(l => {
    if (filtreStatut  !== "Tous" && l.statut !== filtreStatut && l.statut_confirmation !== filtreStatut) return false;
    if (filtreMarche  !== "Tous" && toCode(l.marche) !== filtreMarche) return false;
    if (filtreVille   !== "Tous" && initCap(l.ville) !== filtreVille)  return false;
    if (filtreSource  !== "Tous" && l.source_creation !== filtreSource) return false;
    if (filtreProduit !== "Tous" && l.produit !== filtreProduit)        return false;
    if (filtreLivreur !== "Tous" && l.livreur !== filtreLivreur)        return false;
    if (filtreDateDebut && new Date(l.created_at) < new Date(filtreDateDebut)) return false;
    if (filtreDateFin  && new Date(l.created_at) > new Date(filtreDateFin + "T23:59:59")) return false;
    if (recherche && ![l.nom_client, l.telephone, l.produit, l.ville, l.tracking_number, l.livreur].some(v => v?.toLowerCase().includes(recherche.toLowerCase()))) return false;
    return true;
  }), [commandes, filtreStatut, filtreMarche, filtreVille, filtreSource, filtreProduit, filtreLivreur, filtreDateDebut, filtreDateFin, recherche]);

  const stocksFiltres = useMemo(() => stocks.filter(s => {
    if (filtreStockMarche !== "Tous" && toCode(s.marche) !== filtreStockMarche) return false;
    const d = getDispo(s);
    if (filtreStockStatut === "Rupture"    && d !== 0) return false;
    if (filtreStockStatut === "Faible"     && !(d > 0 && d <= s.seuil_alerte)) return false;
    if (filtreStockStatut === "Disponible" && d < s.seuil_alerte) return false;
    return true;
  }), [stocks, filtreStockMarche, filtreStockStatut]);

  const nbAssigne = commandes.filter(l => l.statut_livraison === "Assignée").length;
  const nbCours   = commandes.filter(l => l.statut_livraison === "En cours").length;
  const nbLivre   = commandes.filter(l => l.statut_livraison === "Livré").length;
  const nbRetour  = commandes.filter(l => l.statut_livraison === "Retour").length;
  const nbRefuse  = commandes.filter(l => l.statut_livraison === "Refusé").length;
  const nbConf    = commandes.filter(l => !l.statut_livraison && (l.statut === "Confirmé" || l.statut_confirmation === "Confirmé")).length;

  const inputStyle = { padding: "8px 12px", border: "1.5px solid #E5E7EB", borderRadius: 8, fontSize: 13, outline: "none", background: "white", cursor: "pointer" };
  const fieldStyle = { width: "100%", padding: "10px 14px", border: "1.5px solid #E5E7EB", borderRadius: 8, fontSize: 13, outline: "none", boxSizing: "border-box" };
  const labelStyle = { fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 5 };
  const getRoleColor = (r) => ({ "CRC": "#DBEAFE", "CRL": "#F3E8FF", "Livreur": "#DCFCE7" }[r] || "#F3F4F6");
  const getRoleText  = (r) => ({ "CRC": "#1D4ED8", "CRL": "#6D28D9", "Livreur": "#166534" }[r] || "#374151");

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#F0F4F8" }}>
      <Sidebar role="crl" />
      <TopBar recherche={recherche} onRecherche={setRecherche} showRecherche={tab === "commandes"} />
      <div style={{ marginLeft: 240, flex: 1, padding: 32, paddingTop: 80 }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: "#1E3A5F" }}>Suivi Logistique</h1>
          <div style={{ display: "flex", gap: 8 }}>
            {[
              { id: "dashboard", label: "📊 Dashboard" },
              { id: "commandes", label: "🚚 Commandes" },
              { id: "stock",     label: "📦 Stock"     },
              { id: "sku",       label: "🏷️ SKU"       },
            ].map(t => (
              <button key={t.id} onClick={() => changeTab(t.id)} style={{ padding: "10px 18px", borderRadius: 8, border: "none", cursor: "pointer", fontWeight: 600, fontSize: 12, background: tab === t.id ? "#1E3A5F" : "white", color: tab === t.id ? "white" : "#374151", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>{t.label}</button>
            ))}
          </div>
        </div>

        {/* KPIs */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 12, marginBottom: 24 }}>
          {[
            { label: "Confirmés", value: nbConf,    color: "#10B981", filtre: "Confirmé" },
            { label: "Assignées", value: nbAssigne, color: "#3B82F6", filtre: "Assignée" },
            { label: "En cours",  value: nbCours,   color: "#8B5CF6", filtre: "En cours" },
            { label: "Livrés",    value: nbLivre,   color: "#064E3B", filtre: "Livré"    },
            { label: "Retours",   value: nbRetour,  color: "#F97316", filtre: "Retour"   },
            { label: "Refusés",   value: nbRefuse,  color: "#EF4444", filtre: "Refusé"   },
          ].map(s => (
            <div key={s.label} onClick={() => { setFiltreStatut(filtreStatut === s.filtre ? "Confirmé" : s.filtre); changeTab("commandes"); }}
              style={{ background: "white", borderRadius: 12, padding: "14px 16px", boxShadow: "0 1px 4px rgba(0,0,0,0.08)", borderTop: `3px solid ${s.color}`, cursor: "pointer", outline: filtreStatut === s.filtre ? `2px solid ${s.color}` : "none" }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 11, color: "#6B7280", marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* ════ DASHBOARD ════ */}
        {tab === "dashboard" && (
          <div>
            {/* Filtres */}
            <div style={{ display: "flex", gap: 8, marginBottom: 20, alignItems: "center", flexWrap: "wrap" }}>
              {[{ id: "aujourd'hui", label: "Aujourd'hui" }, { id: "semaine", label: "7 jours" }, { id: "mois", label: "30 jours" }, { id: "annee", label: "Année" }].map(p => (
                <button key={p.id} onClick={() => setDashPeriode(p.id)}
                  style={{ padding: "7px 16px", borderRadius: 8, border: "none", cursor: "pointer", fontWeight: 600, fontSize: 12, background: dashPeriode === p.id ? "#1E3A5F" : "white", color: dashPeriode === p.id ? "white" : "#374151", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
                  {p.label}
                </button>
              ))}
              <div style={{ width: 1, height: 28, background: "#E5E7EB", margin: "0 4px" }} />
              <select value={dashPays} onChange={e => setDashPays(e.target.value)}
                style={{ padding: "7px 12px", borderRadius: 8, border: "1.5px solid #E5E7EB", fontSize: 12, fontWeight: 600, background: dashPays !== "Tous" ? "#EFF6FF" : "white", color: dashPays !== "Tous" ? "#1D4ED8" : "#374151", cursor: "pointer", outline: "none" }}>
                <option value="Tous">🌍 Tous les pays</option>
                {PAYS.map(p => <option key={p.code} value={p.code}>{p.code} — {p.label}</option>)}
              </select>
              <select value={dashLivreur} onChange={e => setDashLivreur(e.target.value)}
                style={{ padding: "7px 12px", borderRadius: 8, border: "1.5px solid #E5E7EB", fontSize: 12, fontWeight: 600, background: dashLivreur !== "Tous" ? "#F5F3FF" : "white", color: dashLivreur !== "Tous" ? "#6D28D9" : "#374151", cursor: "pointer", outline: "none" }}>
                <option value="Tous">🚗 Tous les livreurs</option>
                {tousLivreurs.filter(l => l !== "Tous").map(l => <option key={l} value={l}>🚗 {l}</option>)}
              </select>
              {(dashPays !== "Tous" || dashLivreur !== "Tous") && (
                <button onClick={() => { setDashPays("Tous"); setDashLivreur("Tous"); }}
                  style={{ padding: "7px 12px", borderRadius: 8, border: "none", background: "#FEF2F2", color: "#EF4444", fontWeight: 600, fontSize: 12, cursor: "pointer" }}>
                  ✕ Reset filtres
                </button>
              )}
            </div>

            {/* Bannière */}
            <div style={{ background: "linear-gradient(135deg, #1E3A5F, #2E6DA4)", borderRadius: 16, padding: "24px 28px", marginBottom: 24, color: "white" }}>
              <div style={{ fontSize: 22, fontWeight: 800 }}>Bonjour {currentProfile?.nom?.split(" ")[0] || "Agent"} 👋</div>
              <div style={{ fontSize: 14, opacity: 0.8, marginTop: 4 }}>
                {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                {dashPays !== "Tous" && <span style={{ marginLeft: 10, background: "rgba(255,255,255,0.2)", padding: "2px 10px", borderRadius: 20, fontSize: 12 }}>📍 {PAYS.find(p => p.code === dashPays)?.label}</span>}
                {dashLivreur !== "Tous" && <span style={{ marginLeft: 6, background: "rgba(255,255,255,0.2)", padding: "2px 10px", borderRadius: 20, fontSize: 12 }}>🚗 {dashLivreur}</span>}
              </div>
              <div style={{ display: "flex", gap: 20, marginTop: 16, flexWrap: "wrap" }}>
                {[{ label: "Commandes", value: dashTotal }, { label: "Livrées", value: dashLivre }, { label: "En cours", value: dashEnCours }, { label: "CA généré", value: dashCA.toLocaleString() }].map(s => (
                  <div key={s.label} style={{ background: "rgba(255,255,255,0.15)", borderRadius: 10, padding: "12px 20px", minWidth: 130 }}>
                    <div style={{ fontSize: 28, fontWeight: 800 }}>{s.value}</div>
                    <div style={{ fontSize: 12, opacity: 0.8, marginTop: 4 }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Répartition + Performances */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
              <div style={{ background: "white", borderRadius: 16, padding: 24, boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
                <h3 style={{ margin: "0 0 20px", fontSize: 16, color: "#1E3A5F" }}>📊 Répartition des livraisons</h3>
                {(() => {
                  const data = [
                    { label: "Nouveau",        value: dashLeads.filter(l => !l.statut_livraison || l.statut_livraison === "Nouveau").length, color: "#3B82F6" },
                    { label: "En cours",       value: dashEnCours, color: "#8B5CF6" },
                    { label: "Livré",          value: dashLivre,   color: "#064E3B" },
                    { label: "Pas de réponse", value: dashLeads.filter(l => l.statut_livraison === "Pas de réponse").length, color: "#F59E0B" },
                    { label: "Retour",         value: dashLeads.filter(l => l.statut_livraison === "Retour").length,   color: "#F97316" },
                    { label: "Refusé",         value: dashLeads.filter(l => l.statut_livraison === "Refusé").length,   color: "#EF4444" },
                  ].filter(d => d.value > 0);
                  const total = data.reduce((s, d) => s + d.value, 0);
                  if (total === 0) return <div style={{ textAlign: "center", padding: "32px 0", color: "#9CA3AF" }}>Aucune donnée</div>;
                  let cumul = 0;
                  const size = 200, cx = 100, cy = 100, r = 78, inner = 50;
                  const slices = data.map(d => {
                    const pct = d.value / total;
                    const start = cumul * 2 * Math.PI - Math.PI / 2; cumul += pct;
                    const end = cumul * 2 * Math.PI - Math.PI / 2;
                    const x1 = cx + r * Math.cos(start), y1 = cy + r * Math.sin(start);
                    const x2 = cx + r * Math.cos(end),   y2 = cy + r * Math.sin(end);
                    const ix1 = cx + inner * Math.cos(start), iy1 = cy + inner * Math.sin(start);
                    const ix2 = cx + inner * Math.cos(end),   iy2 = cy + inner * Math.sin(end);
                    const large = pct > 0.5 ? 1 : 0;
                    return { ...d, pct, path: `M ${ix1} ${iy1} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} L ${ix2} ${iy2} A ${inner} ${inner} 0 ${large} 0 ${ix1} ${iy1} Z` };
                  });
                  return (
                    <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
                      <svg width={size} height={size} style={{ flexShrink: 0 }}>
                        {slices.map((s, i) => <path key={i} d={s.path} fill={s.color} stroke="white" strokeWidth={2} />)}
                        <text x={cx} y={cy - 8} textAnchor="middle" fontSize={24} fontWeight="800" fill="#1E3A5F">{total}</text>
                        <text x={cx} y={cy + 12} textAnchor="middle" fontSize={11} fill="#6B7280">commandes</text>
                      </svg>
                      <div style={{ flex: 1 }}>
                        {slices.map((s, i) => (
                          <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                            <div style={{ width: 12, height: 12, borderRadius: "50%", background: s.color, flexShrink: 0 }} />
                            <div style={{ flex: 1, fontSize: 12, color: "#374151" }}>{s.label}</div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: s.color }}>{s.value}</div>
                            <div style={{ fontSize: 11, color: "#9CA3AF", width: 36 }}>{Math.round(s.pct * 100)}%</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>
              <div style={{ background: "white", borderRadius: 16, padding: 24, boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
                <h3 style={{ margin: "0 0 20px", fontSize: 16, color: "#1E3A5F" }}>🎯 Performances</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                  {[
                    { label: "Taux de livraison",    value: pctLiv,    color: "#064E3B", detail: `${dashLivre}/${dashTotal}` },
                    { label: "Taux de retour/refus", value: pctRetour, color: "#EF4444", detail: `${dashRetour}/${dashTotal}` },
                    { label: "Taux en cours",        value: dashTotal ? Math.round(dashEnCours / dashTotal * 100) : 0, color: "#8B5CF6", detail: `${dashEnCours}/${dashTotal}` },
                    { label: "Taux pas de réponse",  value: dashTotal ? Math.round(dashLeads.filter(l => l.statut_livraison === "Pas de réponse").length / dashTotal * 100) : 0, color: "#F59E0B", detail: `${dashLeads.filter(l => l.statut_livraison === "Pas de réponse").length}/${dashTotal}` },
                  ].map(s => (
                    <div key={s.label}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                        <span style={{ fontSize: 13, color: "#374151", fontWeight: 600 }}>{s.label}</span>
                        <span style={{ fontSize: 13, fontWeight: 800, color: s.color }}>{s.value}% <span style={{ fontSize: 11, color: "#9CA3AF", fontWeight: 400 }}>({s.detail})</span></span>
                      </div>
                      <div style={{ background: "#F3F4F6", borderRadius: 20, height: 8, overflow: "hidden" }}>
                        <div style={{ width: `${Math.min(s.value, 100)}%`, height: "100%", background: s.color, borderRadius: 20, transition: "width 0.6s ease" }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Évolution 7 jours */}
            <div style={{ background: "white", borderRadius: 16, padding: 24, boxShadow: "0 1px 4px rgba(0,0,0,0.08)", marginBottom: 20 }}>
              <h3 style={{ margin: "0 0 20px", fontSize: 16, color: "#1E3A5F" }}>📈 Évolution des 7 derniers jours</h3>
              <div style={{ display: "flex", gap: 6, alignItems: "flex-end", height: 180 }}>
                {evolutionJours.map((j, i) => (
                  <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#1E3A5F" }}>{j.total > 0 ? j.total : ""}</div>
                    <div style={{ width: "100%", display: "flex", gap: 2, alignItems: "flex-end", height: 140 }}>
                      <div style={{ flex: 1, background: "#064E3B", borderRadius: "4px 4px 0 0", height: `${(j.livres / maxEvol) * 140}px`, minHeight: j.livres > 0 ? 4 : 0 }} />
                      <div style={{ flex: 1, background: "#EF4444", borderRadius: "4px 4px 0 0", height: `${(j.retours / maxEvol) * 140}px`, minHeight: j.retours > 0 ? 4 : 0 }} />
                      <div style={{ flex: 1, background: "#E5E7EB", borderRadius: "4px 4px 0 0", height: `${((j.total - j.livres - j.retours) / maxEvol) * 140}px`, minHeight: (j.total - j.livres - j.retours) > 0 ? 4 : 0 }} />
                    </div>
                    <div style={{ fontSize: 10, color: "#9CA3AF", textAlign: "center" }}>{j.date}</div>
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", gap: 16, marginTop: 12 }}>
                {[{ color: "#064E3B", label: "Livrés" }, { color: "#EF4444", label: "Retours/Refus" }, { color: "#E5E7EB", label: "Autres" }].map(l => (
                  <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ width: 12, height: 12, borderRadius: 3, background: l.color }} />
                    <span style={{ fontSize: 12, color: "#6B7280" }}>{l.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Par pays : visible UNIQUEMENT si filtre pays actif ── */}
            {dashPays !== "Tous" && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ background: "white", borderRadius: 16, padding: 20, boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
                  {(() => {
                    const { code, label, bg } = PAYS.find(p => p.code === dashPays) || { code: dashPays, label: dashPays, bg: "#6B7280" };
                    const mLeads = dashLeads;
                    const mLiv   = mLeads.filter(l => l.statut_livraison === "Livré").length;
                    const mRet   = mLeads.filter(l => l.statut_livraison === "Retour" || l.statut_livraison === "Refusé").length;
                    const mCA    = mLeads.filter(l => l.statut_livraison === "Livré").reduce((sum, l) => sum + prixTotal(l), 0);
                    return (
                      <div style={{ display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <span style={{ background: bg, color: "white", padding: "4px 10px", borderRadius: 8, fontSize: 14, fontWeight: 800 }}>{code}</span>
                          <span style={{ fontWeight: 700, fontSize: 18, color: "#1E3A5F" }}>{label}</span>
                        </div>
                        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                          {[["Total", mLeads.length, "#3B82F6"], ["Livrés", mLiv, "#064E3B"], ["Retours", mRet, "#EF4444"], ["CA", mCA.toLocaleString(), "#10B981"]].map(([k, v, c]) => (
                            <div key={k} style={{ background: "#F9FAFB", borderRadius: 10, padding: "12px 20px", minWidth: 100, textAlign: "center" }}>
                              <div style={{ fontSize: 22, fontWeight: 800, color: c }}>{v}</div>
                              <div style={{ fontSize: 12, color: "#6B7280", marginTop: 4 }}>{k}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* Dernières commandes */}
            <div style={{ background: "white", borderRadius: 16, padding: 24, boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
              <h3 style={{ margin: "0 0 16px", fontSize: 16, color: "#1E3A5F" }}>🕐 Dernières commandes traitées</h3>
              {dashLeads.slice(0, 8).map((cmd, i) => (
                <div key={cmd.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: i < 7 ? "1px solid #F3F4F6" : "none" }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{cmd.nom_client}</div>
                    <div style={{ fontSize: 12, color: "#6B7280" }}>{cmd.produit} · {cmd.ville} · <DrapeauBadge code={cmd.marche} />{cmd.livreur && <span style={{ marginLeft: 8, fontSize: 11, color: "#8B5CF6" }}>🚗 {cmd.livreur}</span>}</div>
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    {cmd.statut_livraison
                      ? <span style={{ background: `${getStatutLivColor(cmd.statut_livraison)}20`, color: getStatutLivColor(cmd.statut_livraison), padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600 }}>{cmd.statut_livraison}</span>
                      : <span style={{ background: "#EFF6FF", color: "#3B82F6", padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600 }}>Nouveau</span>}
                    {isLivre(cmd) && <span style={{ fontSize: 13 }}>🔒</span>}
                    <span style={{ fontSize: 11, color: "#9CA3AF" }}>{timeAgo(cmd.created_at)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ════ COMMANDES ════ */}
        {tab === "commandes" && (
          <div>
            <div style={{ background: "white", borderRadius: 12, padding: "16px 20px", marginBottom: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
              <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12 }}>
                  <div style={{ display: "flex", gap: 10, alignItems: "flex-end", flexWrap: "wrap", justifyContent: "center" }}>
                    {[
                      { label: "STATUT",  content: <select value={filtreStatut}  onChange={e => setFiltreStatut(e.target.value)}  style={inputStyle}>{["Confirmé","Assignée","En cours","Livré","Retour","Absent","Refusé","Injoignable","Annulé","Tous"].map(s => <option key={s} value={s}>{s}</option>)}</select> },
                      { label: "MARCHÉ",  content: <select value={filtreMarche}  onChange={e => { setFiltreMarche(e.target.value); setFiltreVille("Tous"); }} style={inputStyle}><option value="Tous">🌍 Tous</option>{PAYS.map(p => <option key={p.code} value={p.code}>{p.code} — {p.label}</option>)}</select> },
                      { label: "VILLE",   content: <select value={filtreVille}   onChange={e => setFiltreVille(e.target.value)}   style={inputStyle}>{villes.map(v => <option key={v} value={v}>{v}</option>)}</select> },
                      { label: "SOURCE",  content: <select value={filtreSource}  onChange={e => setFiltreSource(e.target.value)}  style={inputStyle}><option value="Tous">Toutes</option><option value="mb">MB</option><option value="crl">CRL</option><option value="crc">CRC</option></select> },
                      { label: "PRODUIT", content: <select value={filtreProduit} onChange={e => setFiltreProduit(e.target.value)} style={inputStyle}>{produitsNoms.map(p => <option key={p} value={p}>{p}</option>)}</select> },
                      { label: "LIVREUR", content: <select value={filtreLivreur} onChange={e => setFiltreLivreur(e.target.value)} style={inputStyle}>{livreursNoms.map(l => <option key={l} value={l}>{l === "Tous" ? "Tous" : `🚗 ${l}`}</option>)}</select> },
                    ].map(f => (
                      <div key={f.label}>
                        <div style={{ fontSize: 11, color: "#6B7280", fontWeight: 600, marginBottom: 4 }}>{f.label}</div>
                        {f.content}
                      </div>
                    ))}
                    <button onClick={() => { setFiltreStatut("Confirmé"); setFiltreMarche("Tous"); setFiltreVille("Tous"); setFiltreSource("Tous"); setFiltreProduit("Tous"); setFiltreLivreur("Tous"); setFiltreDateDebut(""); setFiltreDateFin(""); setRecherche(""); }}
                      style={{ padding: "8px 14px", background: "#F3F4F6", color: "#374151", border: "none", borderRadius: 8, fontWeight: 600, fontSize: 12, cursor: "pointer", alignSelf: "flex-end" }}>🔄 Reset</button>
                  </div>
                  <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 12, paddingTop: 12, borderTop: "1px solid #F3F4F6" }}>
                    <span style={{ fontSize: 11, color: "#6B7280", fontWeight: 600 }}>DU</span>
                    <input type="date" value={filtreDateDebut} onChange={e => setFiltreDateDebut(e.target.value)} style={inputStyle} />
                    <span style={{ fontSize: 11, color: "#6B7280", fontWeight: 600 }}>AU</span>
                    <input type="date" value={filtreDateFin} onChange={e => setFiltreDateFin(e.target.value)} style={inputStyle} />
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, flexShrink: 0 }}>
                  <button onClick={() => setShowNewCmd(true)} style={{ padding: "10px 18px", background: "#1E3A5F", color: "white", border: "none", borderRadius: 8, fontWeight: 600, fontSize: 12, cursor: "pointer", whiteSpace: "nowrap" }}>➕ Commande directe</button>
                  <button onClick={exportExcel} style={{ padding: "10px 18px", background: "#064E3B", color: "white", border: "none", borderRadius: 8, fontWeight: 600, fontSize: 12, cursor: "pointer", whiteSpace: "nowrap" }}>⬇️ Exporter livrés (.xlsx)</button>
                </div>
              </div>
            </div>

            <div style={{ background: "white", borderRadius: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.08)", overflow: "hidden" }}>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "#F9FAFB" }}>
                      {["", "Créé", "CRC", "Tracking", "Client", "Téléphone", "Produit", "Qté", "Prix", "Total", "Marché", "Ville", "Source", "Confirmation", "Livraison", "Livreur", "Durée", "Actions"].map(h => (
                        <th key={h} style={{ padding: "11px 12px", textAlign: "left", fontSize: 11, color: "#6B7280", fontWeight: 600, borderBottom: "1px solid #E5E7EB", whiteSpace: "nowrap" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {commandesFiltrees.length === 0 ? (
                      <tr><td colSpan={18} style={{ padding: "48px", textAlign: "center", color: "#9CA3AF" }}>
                        <div style={{ fontSize: 40, marginBottom: 8 }}>🚚</div>Aucune commande
                      </td></tr>
                    ) : commandesFiltrees.map((cmd, i) => {
                      const statut    = cmd.statut_confirmation || cmd.statut || "Confirmé";
                      const nbRelance = cmd.nombre_relance || 0;
                      const nbAppels  = cmd.nombre_appels  || 0;
                      const peutApp   = peutRelancer(cmd);
                      const attente   = minutesAvantRelance(cmd);
                      const crcNom    = cmd.crc_agent_nom || "—";
                      return (
                        <React.Fragment key={cmd.id}>
                          <tr style={{ background: expandedRow === cmd.id ? "#F0F9FF" : i % 2 ? "#FAFAFA" : "white", borderBottom: expandedRow === cmd.id ? "none" : "1px solid #F3F4F6" }}>
                            <td style={{ padding: "8px 6px", textAlign: "center" }}>
                              <button onClick={() => toggleRow(cmd.id)} style={{ width: 22, height: 22, background: expandedRow === cmd.id ? "#DBEAFE" : "#F3F4F6", border: "none", borderRadius: 4, cursor: "pointer", fontSize: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                {expandedRow === cmd.id ? "▼" : "▶"}
                              </button>
                            </td>
                            <td style={{ padding: "8px 10px", minWidth: 80 }}>
                              <div style={{ fontSize: 11, fontWeight: 700, color: "#1E3A5F" }}>{timeAgo(cmd.created_at)}</div>
                              <div style={{ fontSize: 10, color: "#6B7280", marginTop: 2 }}>{cmd.source || cmd.source_creation || "—"}</div>
                            </td>
                            <td style={{ padding: "8px 10px", minWidth: 80 }}><div style={{ fontSize: 11, fontWeight: 700, color: "#374151" }}>{crcNom}</div></td>
                            <td style={{ padding: "8px 10px", fontSize: 11, fontWeight: 700, color: "#6366F1", whiteSpace: "nowrap" }}>{cmd.tracking_number || "—"}</td>
                            <td style={{ padding: "8px 10px", fontWeight: 600, fontSize: 12, whiteSpace: "nowrap" }}>{cmd.nom_client}</td>
                            <td style={{ padding: "8px 10px", fontSize: 11 }}>{cmd.telephone}</td>
                            <td style={{ padding: "8px 10px", fontSize: 11 }}><div style={{ fontWeight: 600 }}>{cmd.produit}</div></td>
                            <td style={{ padding: "8px 10px", fontSize: 11, textAlign: "center" }}>{cmd.quantite}</td>
                            <td style={{ padding: "8px 10px", fontSize: 11 }}>{cmd.prix_unitaire}</td>
                            <td style={{ padding: "8px 10px", fontSize: 12, fontWeight: 700, color: "#1E3A5F", whiteSpace: "nowrap" }}>
                              {prixTotal(cmd).toLocaleString()}
                              {(cmd.remise || 0) > 0 && <div style={{ fontSize: 9, color: "#10B981", fontWeight: 700 }}>-{cmd.remise}%</div>}
                            </td>
                            <td style={{ padding: "8px 10px" }}><DrapeauBadge code={cmd.marche} /></td>
                            <td style={{ padding: "8px 10px", fontSize: 11 }}>{cmd.ville ? initCap(cmd.ville) : "—"}</td>
                            <td style={{ padding: "8px 10px" }}><SourceBadge src={cmd.source_creation} /></td>
                            <td style={{ padding: "8px 10px", minWidth: 160 }}>
                              <span style={{ background: `${getStatutColor(statut)}20`, color: getStatutColor(statut), padding: "3px 8px", borderRadius: 20, fontSize: 10, fontWeight: 600, display: "inline-block" }}>{statut}</span>
                              {nbAppels > 0 && <div style={{ marginTop: 4 }}><span style={{ background: nbAppels >= 3 ? "#FEF2F2" : "#FFF7ED", color: nbAppels >= 3 ? "#EF4444" : "#F97316", padding: "2px 6px", borderRadius: 6, fontSize: 10, fontWeight: 700 }}>📞 {nbAppels} appel{nbAppels > 1 ? "s" : ""}</span></div>}
                              {cmd.notes_crc && <div style={{ marginTop: 4, background: "#FEF3C7", borderRadius: 6, padding: "3px 7px", display: "flex", gap: 3 }}><span style={{ fontSize: 10 }}>💬</span><span style={{ fontSize: 10, color: "#92400E", fontStyle: "italic", wordBreak: "break-word" }}>{cmd.notes_crc}</span></div>}
                            </td>
                            <td style={{ padding: "8px 10px", minWidth: 160 }}>
                              {cmd.statut_livraison ? <span style={{ background: `${getStatutLivColor(cmd.statut_livraison)}20`, color: getStatutLivColor(cmd.statut_livraison), padding: "3px 8px", borderRadius: 20, fontSize: 10, fontWeight: 600, display: "inline-block" }}>{cmd.statut_livraison}</span> : <span style={{ color: "#D1D5DB", fontSize: 10 }}>—</span>}
                              {nbRelance > 0 && <div style={{ marginTop: 4 }}><span style={{ background: nbRelance >= 9 ? "#FEF2F2" : nbRelance >= 6 ? "#FFFBEB" : "#F0FDF4", color: nbRelance >= 9 ? "#EF4444" : nbRelance >= 6 ? "#F59E0B" : "#10B981", padding: "2px 6px", borderRadius: 6, fontSize: 10, fontWeight: 700 }}>🔄 {nbRelance} relance{nbRelance > 1 ? "s" : ""}</span></div>}
                              {cmd.notes_livraison && <div style={{ marginTop: 4, background: "#F0FDF4", borderRadius: 6, padding: "3px 7px", display: "flex", gap: 3 }}><span style={{ fontSize: 10 }}>🚗</span><span style={{ fontSize: 10, color: "#166534", fontStyle: "italic", wordBreak: "break-word" }}>{cmd.notes_livraison}</span></div>}
                            </td>
                            <td style={{ padding: "8px 10px", fontSize: 11 }}>
                              {cmd.livreur ? <span style={{ background: "#F5F3FF", color: "#6D28D9", padding: "3px 8px", borderRadius: 8, fontSize: 11, fontWeight: 600 }}>🚗 {cmd.livreur}</span> : <span style={{ color: "#D1D5DB", fontSize: 10 }}>—</span>}
                            </td>
                            <td style={{ padding: "8px 10px", fontSize: 10, color: "#6B7280" }}>{formatDureeTotal(cmd.duree_appel_total || 0)}</td>
                            <td style={{ padding: "8px 10px" }}>
                              <div style={{ display: "flex", gap: 5 }}>
                                <button onClick={() => copyLead(cmd)} style={{ width: 28, height: 28, background: copiedId === cmd.id ? "#ECFDF5" : "#F0FDF4", border: "none", borderRadius: 6, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13 }}>{copiedId === cmd.id ? "✅" : "📋"}</button>
                                <button onClick={() => { if (!isLivre(cmd)) openPanel(cmd); }} title={isLivre(cmd) ? "Commande livrée" : "Modifier"}
                                  style={{ width: 28, height: 28, background: isLivre(cmd) ? "#F3F4F6" : "#FFFBEB", border: "none", borderRadius: 6, cursor: isLivre(cmd) ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, opacity: isLivre(cmd) ? 0.4 : 1 }}>
                                  {isLivre(cmd) ? "🔒" : "✏️"}
                                </button>
                                <button onClick={() => { if (!isLivre(cmd) && peutApp) openCall(cmd); }} title={isLivre(cmd) ? "Livré" : !peutApp ? `Attendre ${attente}min` : "Appeler"}
                                  style={{ width: 28, height: 28, background: isLivre(cmd) || !peutApp ? "#F3F4F6" : "#ECFDF5", border: "none", borderRadius: 6, cursor: (isLivre(cmd) || !peutApp) ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, opacity: (isLivre(cmd) || !peutApp) ? 0.4 : 1 }}>
                                  {isLivre(cmd) ? "🔒" : !peutApp ? `⏳${attente}` : "📞"}
                                </button>
                              </div>
                            </td>
                          </tr>
                          {expandedRow === cmd.id && (
                            <tr>
                              <td colSpan={18} style={{ padding: "0 16px 16px 36px", background: "#F0F9FF", borderBottom: "1px solid #BFDBFE" }}>
                                <div style={{ borderLeft: "3px solid #3B82F6", paddingLeft: 16, paddingTop: 12 }}>
                                  <div style={{ fontSize: 12, fontWeight: 700, color: "#1D4ED8", marginBottom: 10 }}>📋 Historique</div>
                                  {!historiques[cmd.id] ? <div style={{ fontSize: 12, color: "#9CA3AF" }}>Chargement...</div>
                                    : historiques[cmd.id].length === 0 ? <div style={{ fontSize: 12, color: "#9CA3AF" }}>Aucun historique</div>
                                    : historiques[cmd.id].map((h, idx) => (
                                      <div key={idx} style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 8 }}>
                                        <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#3B82F6", marginTop: 5, flexShrink: 0 }} />
                                        <div>
                                          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                                            <span style={{ fontSize: 12, fontWeight: 600, color: "#1E3A5F" }}>{h.action}</span>
                                            {h.ancien_statut && h.nouveau_statut && h.ancien_statut !== h.nouveau_statut && (
                                              <span style={{ fontSize: 11, color: "#6B7280" }}>
                                                <span style={{ background: `${getStatutColor(h.ancien_statut)}20`, color: getStatutColor(h.ancien_statut), padding: "1px 5px", borderRadius: 4 }}>{h.ancien_statut}</span>
                                                {" → "}
                                                <span style={{ background: `${getStatutColor(h.nouveau_statut)}20`, color: getStatutColor(h.nouveau_statut), padding: "1px 5px", borderRadius: 4 }}>{h.nouveau_statut}</span>
                                              </span>
                                            )}
                                            <span style={{ background: getRoleColor(h.agent_role), color: getRoleText(h.agent_role), padding: "1px 5px", borderRadius: 4, fontSize: 10, fontWeight: 700 }}>{h.agent_role}</span>
                                            <span style={{ fontSize: 10, color: "#9CA3AF" }}>{h.agent_nom} • {new Date(h.created_at).toLocaleString("fr-FR")}</span>
                                          </div>
                                          {h.commentaire && <div style={{ fontSize: 11, color: "#6B7280", marginTop: 2 }}>{h.commentaire}</div>}
                                        </div>
                                      </div>
                                    ))}
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ════ STOCK ════ */}
        {tab === "stock" && (
          <div style={{ background: "white", borderRadius: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.08)", overflow: "hidden" }}>
            <div style={{ padding: "14px 20px", borderBottom: "1px solid #E5E7EB", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
              <h2 style={{ margin: 0, fontSize: 16, color: "#1E3A5F" }}>📦 Stock disponible</h2>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div>
                  <div style={{ fontSize: 11, color: "#6B7280", fontWeight: 600, marginBottom: 4 }}>MARCHÉ</div>
                  <select value={filtreStockMarche} onChange={e => setFiltreStockMarche(e.target.value)} style={inputStyle}>
                    <option value="Tous">🌍 Tous</option>
                    {PAYS.map(p => <option key={p.code} value={p.code}>{p.code} — {p.label}</option>)}
                  </select>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: "#6B7280", fontWeight: 600, marginBottom: 4 }}>STATUT</div>
                  <select value={filtreStockStatut} onChange={e => setFiltreStockStatut(e.target.value)} style={inputStyle}>
                    <option value="Tous">📦 Tous</option><option value="Disponible">✅ Disponible</option><option value="Faible">⚠️ Faible</option><option value="Rupture">🔴 Rupture</option>
                  </select>
                </div>
                <button onClick={() => { setFiltreStockMarche("Tous"); setFiltreStockStatut("Tous"); }} style={{ padding: "8px 14px", background: "#F3F4F6", color: "#374151", border: "none", borderRadius: 8, fontWeight: 600, fontSize: 12, cursor: "pointer", marginTop: 18 }}>🔄 Reset</button>
                <div style={{ fontSize: 12, color: "#6B7280", marginTop: 18 }}>{stocksFiltres.length} produit{stocksFiltres.length > 1 ? "s" : ""}</div>
              </div>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#F9FAFB" }}>
                  {["Produit","Marché","Disponible","Statut","Action"].map(h => (
                    <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, color: "#6B7280", fontWeight: 600, borderBottom: "1px solid #E5E7EB" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {stocksFiltres.length === 0 ? (
                  <tr><td colSpan={5} style={{ padding: "48px", textAlign: "center", color: "#9CA3AF" }}><div style={{ fontSize: 40, marginBottom: 8 }}>📦</div>Aucun produit</td></tr>
                ) : stocksFiltres.map((s, i) => {
                  const dispo = getDispo(s); const isRupture = dispo === 0; const isFaible = dispo > 0 && dispo <= s.seuil_alerte;
                  return (
                    <tr key={s.id} style={{ background: i % 2 ? "#FAFAFA" : "white", borderBottom: "1px solid #F3F4F6" }}>
                      <td style={{ padding: "12px 16px", fontWeight: 600, fontSize: 13 }}>{s.produit}</td>
                      <td style={{ padding: "12px 16px" }}><DrapeauBadge code={s.marche} /></td>
                      <td style={{ padding: "12px 16px", textAlign: "center" }}><span style={{ fontWeight: 800, fontSize: 14, color: isRupture ? "#EF4444" : isFaible ? "#F59E0B" : "#10B981" }}>{dispo}</span></td>
                      <td style={{ padding: "12px 16px" }}><span style={{ background: isRupture ? "#FEF2F2" : isFaible ? "#FFFBEB" : "#ECFDF5", color: isRupture ? "#EF4444" : isFaible ? "#F59E0B" : "#10B981", padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600 }}>{isRupture ? "🔴 Rupture" : isFaible ? "⚠️ Faible" : "✅ OK"}</span></td>
                      <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 600 }}>{isRupture ? <span style={{ color: "#EF4444" }}>🚫 Ne pas livrer</span> : isFaible ? <span style={{ color: "#F59E0B" }}>⚠️ Prudence</span> : <span style={{ color: "#10B981" }}>✅ Disponible</span>}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ════ SKU ════ */}
        {tab === "sku" && (
          <div style={{ background: "white", borderRadius: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.08)", overflow: "hidden" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid #E5E7EB" }}>
              <h2 style={{ margin: 0, fontSize: 16, color: "#1E3A5F" }}>🏷️ Catalogue produits ({produits.length})</h2>
            </div>
            {produits.length === 0 ? (
              <div style={{ textAlign: "center", padding: "48px 0", color: "#9CA3AF" }}><div style={{ fontSize: 48, marginBottom: 12 }}>🏷️</div><div>Aucun produit</div></div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 20, padding: 24 }}>
                {produits.map(p => (
                  <div key={p.id} style={{ border: "1px solid #E5E7EB", borderRadius: 12, overflow: "hidden", opacity: p.actif ? 1 : 0.6 }}>
                    {p.photo_url ? <img src={p.photo_url} alt={p.nom} style={{ width: "100%", height: 150, objectFit: "cover" }} onError={e => { e.target.style.display = "none"; }} /> : <div style={{ width: "100%", height: 100, background: "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36 }}>🏷️</div>}
                    <div style={{ padding: 14 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: "#111827", marginBottom: 4 }}>{p.nom}</div>
                      <div style={{ fontSize: 12, color: "#6B7280", marginBottom: 8 }}>{p.description}</div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ fontWeight: 800, fontSize: 15, color: "#1E3A5F" }}>{p.prix_unitaire ? Number(p.prix_unitaire).toLocaleString() : "—"}</div>
                        <DrapeauBadge code={p.marche} />
                      </div>
                      <div style={{ marginTop: 8 }}><span style={{ background: p.actif ? "#ECFDF5" : "#F3F4F6", color: p.actif ? "#10B981" : "#6B7280", padding: "3px 8px", borderRadius: 6, fontSize: 11, fontWeight: 600 }}>{p.actif ? "✅ Actif" : "⏸️ Inactif"}</span></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ════ MODAL COMMANDE DIRECTE ════ */}
      {showNewCmd && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setShowNewCmd(false)}>
          <div style={{ background: "white", borderRadius: 16, padding: 28, width: "90vw", maxWidth: 620, boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: 16, color: "#1E3A5F", fontWeight: 800 }}>➕ Commande directe</h2>
              <button onClick={() => setShowNewCmd(false)} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#9CA3AF" }}>✕</button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              {[["Nom client *","nom_client","text","Ex: Ahmed Benali"],["Téléphone *","telephone","text","Ex: +212 600 000000"],["Produit *","produit","text","Ex: Chaussures X3"],["Quantité","quantite","number","Ex: 2"],["Prix unitaire","prix_unitaire","number","Ex: 1500"],["Ville","ville","text","Ex: Casablanca"]].map(([label,key,type,ph]) => (
                <div key={key}><label style={labelStyle}>{label}</label><input type={type} placeholder={ph} value={newCmd[key]} onChange={e => setNewCmd({ ...newCmd, [key]: e.target.value })} style={fieldStyle} /></div>
              ))}
              <div><label style={labelStyle}>Marché</label>
                <select value={newCmd.marche} onChange={e => setNewCmd({ ...newCmd, marche: e.target.value })} style={fieldStyle}>
                  {PAYS.map(p => <option key={p.code} value={p.code}>{p.code} — {p.label}</option>)}
                </select>
              </div>
            </div>
            {newCmd.quantite && newCmd.prix_unitaire && (
              <div style={{ marginTop: 16, background: "#EFF6FF", borderRadius: 10, padding: "12px 16px", fontSize: 14, color: "#1E3A5F", fontWeight: 600 }}>
                💰 Total : {Number(newCmd.quantite) * Number(newCmd.prix_unitaire)}
              </div>
            )}
            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              <button onClick={() => setShowNewCmd(false)} style={{ flex: 1, padding: "12px", background: "#F3F4F6", color: "#374151", border: "none", borderRadius: 10, fontWeight: 600, cursor: "pointer" }}>Annuler</button>
              <button onClick={createCommandeDirecte} disabled={loadingNew} style={{ flex: 2, padding: "12px", background: loadingNew ? "#9CA3AF" : "#1E3A5F", color: "white", border: "none", borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: loadingNew ? "not-allowed" : "pointer" }}>
                {loadingNew ? "Création..." : "➕ Créer la commande"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════ PANEL TRAITER ════ */}
      {showPanel && selected && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "flex-end" }} onClick={() => setShowPanel(false)}>
          <div style={{ background: "white", width: 420, height: "100vh", overflowY: "auto", padding: 28, boxShadow: "-4px 0 24px rgba(0,0,0,0.15)" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 16, color: "#1E3A5F", fontWeight: 800 }}>✏️ Traiter la commande</h3>
              <button onClick={() => setShowPanel(false)} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#9CA3AF" }}>✕</button>
            </div>
            <div style={{ background: "#F0F9FF", borderRadius: 12, padding: 16, marginBottom: 16, borderLeft: "4px solid #3B82F6" }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: "#1E3A5F" }}>{selected.nom_client}</div>
              <a href={`tel:${selected.telephone}`} style={{ fontSize: 14, color: "#3B82F6", fontWeight: 600, textDecoration: "none", display: "block", marginTop: 4 }}>📞 {selected.telephone}</a>
              <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {[["Marché",toCode(selected.marche)],["Ville",selected.ville||"—"],["Produit",selected.produit],["Prix unit.",selected.prix_unitaire],["Statut",selected.statut_confirmation||selected.statut],["Livreur",selected.livreur||"—"]].map(([k,v]) => (
                  <div key={k}><div style={{ fontSize: 10, color: "#9CA3AF", fontWeight: 600 }}>{k}</div><div style={{ fontSize: 12, fontWeight: 700 }}>{v}</div></div>
                ))}
              </div>
            </div>
            <div style={{ background: "#F0F4F8", borderRadius: 12, padding: 16, marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#1E3A5F", marginBottom: 12 }}>✏️ Modifier</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                <div><label style={labelStyle}>Quantité</label><input type="number" value={quantiteEdit} onChange={e => setQuantiteEdit(e.target.value)} style={fieldStyle} /></div>
                <div><label style={labelStyle}>Remise %</label><input type="number" min="0" max="100" value={remise} onChange={e => setRemise(e.target.value)} style={fieldStyle} /></div>
              </div>
              <div style={{ background: "#EFF6FF", borderRadius: 8, padding: "10px 12px", fontSize: 13, color: "#1E3A5F", fontWeight: 700, marginBottom: 10 }}>
                💰 Total : {Math.round((selected.prix_unitaire||0)*(Number(quantiteEdit)||1)*(1-(Number(remise)||0)/100))}
                {Number(remise)>0 && <span style={{ color:"#10B981", marginLeft:8, fontSize:12 }}>(-{remise}%)</span>}
              </div>
              <div><label style={labelStyle}>Commentaire livraison</label>
                <input value={notesCrl} onChange={e => setNotesCrl(e.target.value)} placeholder="Ex: Rappel 17h30..." style={fieldStyle} />
              </div>
              <button onClick={updateCommande} style={{ width:"100%", marginTop:10, padding:"10px", background:"#1E3A5F", color:"white", border:"none", borderRadius:8, fontWeight:700, fontSize:13, cursor:"pointer" }}>💾 Enregistrer</button>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Nom du livreur</label>
              <input placeholder="Ex: Samir K." value={livreur} onChange={e => setLivreur(e.target.value)} style={fieldStyle} />
            </div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#6B7280", marginBottom: 10 }}>CHANGER LE STATUT :</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {selected.statut==="Confirmé" && <button onClick={() => updateStatut(selected.id,"Assignée")} style={{ padding:"10px", background:"#EFF6FF", color:"#3B82F6", border:"1px solid #3B82F640", borderRadius:10, fontWeight:700, fontSize:13, cursor:"pointer" }}>📋 Assigner au livreur</button>}
              <button onClick={() => updateStatut(selected.id,"En cours")} style={{ padding:"10px", background:"#F5F3FF", color:"#8B5CF6", border:"1px solid #8B5CF640", borderRadius:10, fontWeight:700, fontSize:13, cursor:"pointer" }}>🔄 En cours de livraison</button>
              <button onClick={() => updateStatut(selected.id,"Livré")}    style={{ padding:"10px", background:"#ECFDF5", color:"#10B981", border:"1px solid #10B98140", borderRadius:10, fontWeight:700, fontSize:13, cursor:"pointer" }}>✅ Livré</button>
              <button onClick={() => updateStatut(selected.id,"Absent")}   style={{ padding:"10px", background:"#FFFBEB", color:"#F59E0B", border:"1px solid #F59E0B40", borderRadius:10, fontWeight:700, fontSize:13, cursor:"pointer" }}>⚠️ Absent / Injoignable</button>
              <button onClick={() => updateStatut(selected.id,"Refusé")}   style={{ padding:"10px", background:"#FEF2F2", color:"#EF4444", border:"1px solid #EF444440", borderRadius:10, fontWeight:700, fontSize:13, cursor:"pointer" }}>❌ Refusé</button>
              <button onClick={() => updateStatut(selected.id,"Retour")}   style={{ padding:"10px", background:"#FFF7ED", color:"#F97316", border:"1px solid #F9731640", borderRadius:10, fontWeight:700, fontSize:13, cursor:"pointer" }}>↩️ Retour entrepôt</button>
              <button onClick={() => updateStatut(selected.id,"Annulé")}   style={{ padding:"10px", background:"#FEF2F2", color:"#DC2626", border:"1px solid #DC262640", borderRadius:10, fontWeight:700, fontSize:13, cursor:"pointer" }}>🚫 Annuler</button>
            </div>
          </div>
        </div>
      )}

      {/* ════ MODAL APPEL ════ */}
      {showCallModal && callLead && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "white", borderRadius: 16, padding: 28, width: "85vw", maxWidth: 860, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: 18, color: "#1E3A5F" }}>📞 Préparer l'appel</h2>
              <button onClick={() => setShowCallModal(false)} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#9CA3AF" }}>✕</button>
            </div>
            <div style={{ background: "#EFF6FF", borderRadius: 10, padding: "10px 16px", marginBottom: 16, fontSize: 12, color: "#1D4ED8" }}>
              📋 <strong>Process :</strong> 3 tentatives × 30min = 1 appel.
              <div style={{ marginTop: 4 }}>Relances : <strong>{callLead.nombre_relance||0}</strong></div>
            </div>
            {!peutRelancer(callLead) && (
              <div style={{ background: "#FEF2F2", border: "1px solid #EF4444", borderRadius: 10, padding: "10px 16px", marginBottom: 16, fontSize: 13, color: "#EF4444", fontWeight: 600 }}>
                ⏳ Encore {minutesAvantRelance(callLead)} minutes avant de pouvoir relancer
              </div>
            )}
            {callLead.notes_crc && (
              <div style={{ background: "#FEF3C7", borderRadius: 10, padding: "10px 16px", marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#92400E", marginBottom: 4 }}>💬 Note CRC</div>
                <div style={{ fontSize: 13, color: "#78350F" }}>{callLead.notes_crc}</div>
              </div>
            )}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              <div>
                <div style={{ background: "#F0FDF4", borderRadius: 12, padding: 20, marginBottom: 16 }}>
                  <div style={{ fontSize: 13, color: "#6B7280", marginBottom: 4 }}>Client à appeler</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: "#1E3A5F" }}>{callLead.telephone}</div>
                  <div style={{ fontSize: 13, color: "#6B7280", marginTop: 4 }}>{callLead.nom_client} · {callLead.ville}</div>
                </div>
                <div style={{ background: "#F9FAFB", borderRadius: 10, padding: 14 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    {[["Produit",callLead.produit],["Qté",callLead.quantite],["Prix",callLead.prix_unitaire],["Total",prixTotal(callLead)],["Marché",toCode(callLead.marche)],["Statut",callLead.statut_livraison||callLead.statut]].map(([k,v]) => (
                      <div key={k}><div style={{ fontSize: 10, color: "#9CA3AF", fontWeight: 600 }}>{k}</div><div style={{ fontSize: 12, fontWeight: 700 }}>{v}</div></div>
                    ))}
                  </div>
                </div>
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 10 }}>✏️ Modifier si nécessaire</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  {[["Nom client","nom_client","text"],["Téléphone","telephone","text"],["Produit","produit","text"],["Quantité","quantite","number"],["Prix unitaire","prix_unitaire","number"],["Ville","ville","text"]].map(([label,key,type]) => (
                    <div key={key}><label style={labelStyle}>{label}</label><input type={type} value={callEditForm[key]} onChange={e => setCallEditForm({...callEditForm,[key]:e.target.value})} style={fieldStyle} /></div>
                  ))}
                  <div><label style={labelStyle}>Marché</label>
                    <select value={callEditForm.marche} onChange={e => setCallEditForm({...callEditForm,marche:e.target.value})} style={fieldStyle}>
                      {PAYS.map(p => <option key={p.code} value={p.code}>{p.code} — {p.label}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            </div>
            <div style={{ marginTop: 20 }}>
              <a href={`tel:${callLead.telephone}`} style={{ textDecoration: "none" }} onClick={startCall}>
                <button disabled={!peutRelancer(callLead)} style={{ width: "100%", padding: "14px", background: peutRelancer(callLead) ? "#10B981" : "#9CA3AF", color: "white", border: "none", borderRadius: 12, fontWeight: 800, fontSize: 16, cursor: peutRelancer(callLead) ? "pointer" : "not-allowed" }}>
                  📞 Appeler {callLead.telephone}
                </button>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ════ ÉCRAN APPEL EN COURS ════ */}
      {showActiveCall && callLead && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 3000, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "white", borderRadius: 20, padding: 32, width: "85vw", maxWidth: 860, boxShadow: "0 20px 60px rgba(0,0,0,0.4)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 24 }}>
              <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#10B981" }} />
              <span style={{ fontSize: 16, fontWeight: 700, color: "#1E3A5F" }}>Appel en cours</span>
              <span style={{ fontSize: 28, fontWeight: 800, color: "#10B981" }}>{formatTime(callSeconds)}</span>
              {callSeconds >= 150 && <span style={{ background: "#FEF2F2", color: "#EF4444", padding: "4px 10px", borderRadius: 8, fontSize: 12, fontWeight: 700 }}>⚠️ 3min approche</span>}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
              <div>
                <div style={{ background: "#F0FDF4", borderRadius: 12, padding: 16, marginBottom: 16 }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: "#1E3A5F" }}>{callEditForm.nom_client}</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "#10B981", marginTop: 4 }}>{callEditForm.telephone}</div>
                  <div style={{ fontSize: 12, color: "#6B7280", marginTop: 4 }}>{callEditForm.ville} · {toCode(callEditForm.marche)}</div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  {[["Nom client","nom_client","text"],["Téléphone","telephone","text"],["Produit","produit","text"],["Quantité","quantite","number"],["Prix unitaire","prix_unitaire","number"],["Ville","ville","text"]].map(([label,key,type]) => (
                    <div key={key}><label style={{...labelStyle,fontSize:11}}>{label}</label><input type={type} value={callEditForm[key]} onChange={e => setCallEditForm({...callEditForm,[key]:e.target.value})} style={{...fieldStyle,padding:"8px 10px",fontSize:12}} /></div>
                  ))}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 12 }}>TERMINER L'APPEL :</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {[
                    { statut:"Livré",    bg:"#ECFDF5", color:"#10B981", border:"#10B981", label:"✅ Livré" },
                    { statut:"En cours", bg:"#F5F3FF", color:"#8B5CF6", border:"#8B5CF6", label:"🔄 En cours de livraison" },
                    { statut:"Absent",   bg:"#FFFBEB", color:"#F59E0B", border:"#F59E0B", label:"⚠️ Absent / Injoignable" },
                    { statut:"Refusé",   bg:"#FEF2F2", color:"#EF4444", border:"#EF4444", label:"❌ Refusé" },
                    { statut:"Retour",   bg:"#FFF7ED", color:"#F97316", border:"#F97316", label:"↩️ Retour entrepôt" },
                  ].map(btn => (
                    <button key={btn.statut} onClick={() => endCall(btn.statut)}
                      style={{ padding: "12px 16px", background: btn.bg, color: btn.color, border: `1.5px solid ${btn.border}40`, borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: "pointer", textAlign: "left" }}>
                      {btn.label}
                    </button>
                  ))}
                </div>
                <button onClick={() => endCall(callLead.statut||"Confirmé")} style={{ width:"100%", marginTop:16, padding:"12px", background:"#EF4444", color:"white", border:"none", borderRadius:12, fontWeight:800, fontSize:15, cursor:"pointer" }}>
                  📵 Raccrocher sans changer le statut
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default withAuth(Logistique, "crl");