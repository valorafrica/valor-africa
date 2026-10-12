"use client";
import { useState, useEffect, useRef } from "react";
import * as XLSX from "xlsx";
import { supabase } from "../../lib/supabase";
import Sidebar from "../components/Sidebar";
import TopBar from "../components/TopBar";
import withAuth from "../components/withAuth";
import { makeCall, hangUp, CallStatus } from "../../lib/sip-phone";

function Confirmation() {
  const [leads, setLeads] = useState<any[]>([]);
  const [stocks, setStocks] = useState<any[]>([]);
  const [produits, setProduits] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentProfile, setCurrentProfile] = useState<any>(null);

  const [recherche, setRecherche] = useState("");
  const [filtreStatut, setFiltreStatut] = useState("Tous");
  const [filtreMarche, setFiltreMarche] = useState("Tous");
  const [filtreVille, setFiltreVille] = useState("Tous");
  const [filtreSource, setFiltreSource] = useState("Tous");
  const [filtreProduit, setFiltreProduit] = useState("Tous");
  const [filtreDateDebut, setFiltreDateDebut] = useState("");
  const [filtreDateFin, setFiltreDateFin] = useState("");
  const [filtreStockMarche, setFiltreStockMarche] = useState("Tous");
  const [filtreStockStatut, setFiltreStockStatut] = useState("Tous");

  // ✅ Période dashboard
  const [dashPeriode, setDashPeriode] = useState("semaine");

  const [showEditModal, setShowEditModal] = useState(false);
  const [showCallModal, setShowCallModal] = useState(false);
  const [showActiveCall, setShowActiveCall] = useState(false);
  const [showStockAlert, setShowStockAlert] = useState(false);
  const [stockAlertInfo, setStockAlertInfo] = useState<any>(null);
  const [pendingConfirmAction, setPendingConfirmAction] = useState<(() => void) | null>(null);
  const [editLead, setEditLead] = useState<any>(null);
  const [callLead, setCallLead] = useState<any>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [callEditForm, setCallEditForm] = useState<any>({});
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  const [historiques, setHistoriques] = useState<{ [key: number]: any[] }>({});
  const [callSeconds, setCallSeconds] = useState(0);
  const [webrtcStatus, setWebrtcStatus] = useState<CallStatus>("idle");
  const [lastCallTime, setLastCallTime] = useState<{ [key: number]: Date }>({});
  const timerRef = useRef<any>(null);

  const getTabFromURL = () => {
    if (typeof window === "undefined") return "leads";
    return new URLSearchParams(window.location.search).get("tab") || "leads";
  };

  const [tab, setTab] = useState(getTabFromURL);

  const changeTab = (newTab: string) => {
    setTab(newTab);
    const url = newTab === "leads" ? "/confirmation" : `/confirmation?tab=${newTab}`;
    window.history.pushState({}, "", url);
  };

  useEffect(() => {
    const handlePopState = () => setTab(getTabFromURL());
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    setTab(getTabFromURL());
  }, [typeof window !== "undefined" ? window.location.search : ""]);

  const initCap = (v: string) => v ? v.charAt(0).toUpperCase() + v.slice(1).toLowerCase() : v;

  const timeAgo = (date: string) => {
    if (!date) return "—";
    const diff = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (diff < 60) return `${diff}s`;
    if (diff < 3600) return `${Math.floor(diff / 60)}min`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}j`;
    return `${Math.floor(diff / 604800)}sem`;
  };

  const runAutoRules = async () => {
    const hier = new Date();
    hier.setDate(hier.getDate() - 1);
    hier.setHours(23, 59, 59, 999);
    await supabase.from("Leads")
      .update({ statut: "Non confirmé", statut_confirmation: "Non confirmé" })
      .eq("statut", "Nouveau").lt("created_at", hier.toISOString());
  };

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUser(user);
    if (user) {
      const { data: profile } = await supabase.from("Profiles").select("*").eq("id", user.id).single();
      setCurrentProfile(profile);
    }
    await runAutoRules();
    const { data: leadsData }    = await supabase.from("Leads").select("*").order("created_at", { ascending: false });
    const { data: stocksData }   = await supabase.from("Stocks").select("*");
    const { data: produitsData } = await supabase.from("produits").select("*").order("created_at", { ascending: false });
    const { data: profilesData } = await supabase.from("Profiles").select("*");
    if (leadsData)    setLeads(leadsData);
    if (stocksData)   setStocks(stocksData);
    if (produitsData) setProduits(produitsData);
    if (profilesData) setProfiles(profilesData);
  };

  useEffect(() => { fetchData(); }, []);

  const fetchHistorique = async (leadId: number) => {
    const { data } = await supabase.from("historique").select("*").eq("lead_id", leadId).order("created_at", { ascending: false });
    if (data) setHistoriques(prev => ({ ...prev, [leadId]: data }));
  };

  const toggleRow = async (leadId: number) => {
    if (expandedRow === leadId) setExpandedRow(null);
    else { setExpandedRow(leadId); await fetchHistorique(leadId); }
  };

  const logAction = async (leadId: number, action: string, ancienStatut: string, nouveauStatut: string, commentaire = "") => {
    await supabase.from("historique").insert([{
      lead_id: leadId, action, ancien_statut: ancienStatut, nouveau_statut: nouveauStatut,
      commentaire, agent_nom: currentProfile?.nom || currentUser?.email || "Agent", agent_role: "CRC",
    }]);
  };

  const toCode = (marche: string) => {
    const map: any = { "Algérie": "DZ", "algérie": "DZ", "DZ": "DZ", "Maroc": "MA", "maroc": "MA", "MA": "MA", "Tunisie": "TN", "tunisie": "TN", "TN": "TN" };
    return map[marche?.trim()] || marche?.trim()?.toUpperCase() || "";
  };

  const getDispo = (s: any) => Math.max(0, s.stock_total - s.stock_reserve - s.stock_livre + s.stock_retour);

  const checkStock = (lead: any) => {
    const stock = stocks.find(s => s.produit?.toLowerCase() === lead.produit?.toLowerCase() && toCode(s.marche) === toCode(lead.marche));
    if (!stock) return { ok: true, stock: null, dispo: 0 };
    const dispo = getDispo(stock);
    return { ok: dispo >= (Number(lead.quantite) || 1), stock, dispo };
  };

  const peutRelancer = (lead: any) => {
    const last = lastCallTime[lead.id];
    if (!last) return true;
    return (Date.now() - last.getTime()) / 60000 >= 30;
  };

  const minutesAvantRelance = (lead: any) => {
    const last = lastCallTime[lead.id];
    if (!last) return 0;
    return Math.max(0, Math.ceil(30 - (Date.now() - last.getTime()) / 60000));
  };

  const getStatutColor    = (s: string) => ({ "Nouveau": "#3B82F6", "Non confirmé": "#F97316", "Confirmé": "#10B981", "Annulé": "#EF4444", "Injoignable": "#F59E0B" }[s] || "#6B7280");
  const getStatutLivColor = (s: string) => ({ "En cours": "#8B5CF6", "Livré": "#064E3B", "Injoignable": "#F59E0B", "Retour": "#F97316", "Refusé": "#DC2626" }[s] || "#6B7280");
  const getStatutEffectif = (l: any) => l.statut_confirmation || l.statut || "Nouveau";

  const SourceBadge = ({ src }: { src: string }) => {
    const cfg: any = { mb: { label: "MB", bg: "#EEF2FF", color: "#6366F1" }, crl: { label: "CRL", bg: "#FEF3C7", color: "#D97706" }, crc: { label: "CRC", bg: "#FCE7F3", color: "#DB2777" } };
    const c = cfg[src?.toLowerCase()] || { label: src?.toUpperCase() || "—", bg: "#F3F4F6", color: "#6B7280" };
    return <span style={{ background: c.bg, color: c.color, padding: "2px 7px", borderRadius: 10, fontSize: 10, fontWeight: 700 }}>{c.label}</span>;
  };

  const DrapeauBadge = ({ code }: { code: string }) => {
    const c = toCode(code);
    const cfg: any = { DZ: "#006233", MA: "#C1272D", TN: "#E70013" };
    return <span style={{ background: cfg[c] || "#6B7280", color: "white", padding: "2px 6px", borderRadius: 5, fontSize: 10, fontWeight: 800 }}>{c || "?"}</span>;
  };

  const copyLead = (lead: any) => {
    navigator.clipboard.writeText(`Client: ${lead.nom_client}\nTél: ${lead.telephone}\nProduit: ${lead.produit} x${lead.quantite}\nTotal: ${(lead.prix_unitaire || 0) * (lead.quantite || 1)}\nMarché: ${toCode(lead.marche)}\nVille: ${lead.ville}\nStatut: ${getStatutEffectif(lead)}\nLivraison: ${lead.statut_livraison || "—"}`);
    setCopiedId(lead.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const openEdit = (lead: any) => {
    setEditLead(lead);
    setEditForm({ nom_client: lead.nom_client || "", telephone: lead.telephone || "", produit: lead.produit || "", quantite: lead.quantite || 1, prix_unitaire: lead.prix_unitaire || 0, ville: lead.ville || "", marche: lead.marche || "DZ", source: lead.source || "", statut_confirmation: lead.statut_confirmation || lead.statut || "Nouveau", notes_crc: lead.notes_crc || "" });
    setShowEditModal(true);
  };

  const saveEdit = async () => {
    if (editForm.statut_confirmation === "Confirmé" && getStatutEffectif(editLead) !== "Confirmé") {
      const { ok, stock, dispo } = checkStock({ ...editLead, ...editForm });
      if (!ok) { setStockAlertInfo({ lead: { ...editLead, ...editForm }, stock, dispo }); setPendingConfirmAction(() => async () => { await _doSaveEdit(); }); setShowStockAlert(true); return; }
    }
    await _doSaveEdit();
  };

  const _doSaveEdit = async () => {
    await supabase.from("Leads").update({ ...editForm, statut: editForm.statut_confirmation }).eq("id", editLead.id);
    await logAction(editLead.id, "Modification", getStatutEffectif(editLead), editForm.statut_confirmation, editForm.notes_crc || "");
    setShowEditModal(false); fetchData();
    if (expandedRow === editLead.id) fetchHistorique(editLead.id);
  };

  const openCall = (lead: any) => {
    setCallLead(lead);
    setCallEditForm({ nom_client: lead.nom_client || "", telephone: lead.telephone || "", produit: lead.produit || "", quantite: lead.quantite || 1, prix_unitaire: lead.prix_unitaire || 0, ville: lead.ville || "", marche: lead.marche || "DZ" });
    setShowCallModal(true);
  };

  const startCall = async () => {
    setShowCallModal(false); setShowActiveCall(true); setCallSeconds(0);
    const now = new Date();
    setLastCallTime(prev => ({ ...prev, [callLead.id]: now }));
    window.dispatchEvent(new Event("callStarted"));
    const newRelance = (callLead.nombre_relance || 0) + 1;
    const newNbAppelsJour = (callLead.nombre_appels_jour || 0) + 1;
    let newNbAppels = callLead.nombre_appels || 0;
    const updateData: any = { nombre_relance: newRelance, nombre_appels_jour: newNbAppelsJour, dernier_appel_at: now.toISOString() };
    if (newNbAppelsJour >= 3) { newNbAppels++; updateData.nombre_appels = newNbAppels; updateData.nombre_appels_jour = 0; }
    if (newNbAppels >= 3 && newNbAppelsJour === 0) {
      updateData.statut = "Injoignable"; updateData.statut_confirmation = "Injoignable";
      await logAction(callLead.id, "Injoignable automatique (3 appels)", getStatutEffectif(callLead), "Injoignable");
    } else {
      await logAction(callLead.id, `Tentative (relance ${newRelance})`, getStatutEffectif(callLead), getStatutEffectif(callLead));
    }
    await supabase.from("tentatives_appel").insert([{ lead_id: callLead.id, agent_id: currentUser?.id, agent_nom: currentProfile?.nom || currentUser?.email || "Agent", duree_secondes: 0, statut_apres: getStatutEffectif(callLead) }]);
    await supabase.from("Leads").update(updateData).eq("id", callLead.id);
    timerRef.current = setInterval(() => setCallSeconds(s => s + 1), 1000);

    setWebrtcStatus("connecting");
    try {
      await makeCall(callLead.telephone, {
        onStatusChange: (status) => setWebrtcStatus(status),
        onEnded: () => setWebrtcStatus("ended"),
      });
    } catch (err: any) {
      console.error("Erreur appel WebRTC :", err);
      alert("Erreur lors du lancement de l'appel : " + (err?.message || "raison inconnue"));
      setWebrtcStatus("failed");
    }
  };

  const endCall = async (nouveauStatut: string) => {
        hangUp();
    if (nouveauStatut === "Confirmé") {
      const { ok, stock, dispo } = checkStock({ ...callLead, ...callEditForm });
      if (!ok) {
        clearInterval(timerRef.current);
        setStockAlertInfo({ lead: { ...callLead, ...callEditForm }, stock, dispo });
        setPendingConfirmAction(() => async () => { await _doEndCall(nouveauStatut); });
        setShowStockAlert(true); setShowActiveCall(false); return;
      }
    }
    await _doEndCall(nouveauStatut);
  };

  const _doEndCall = async (nouveauStatut: string) => {
    clearInterval(timerRef.current);
    window.dispatchEvent(new Event("callEnded"));
    const duree = callSeconds;
    const hasChanges = Object.keys(callEditForm).some(k => callEditForm[k] !== callLead[k]);
    const updateData: any = { statut: nouveauStatut, statut_confirmation: nouveauStatut, duree_appel_total: (callLead.duree_appel_total || 0) + duree };
    if (hasChanges) Object.assign(updateData, callEditForm);
    await supabase.from("tentatives_appel").update({ duree_secondes: duree, statut_apres: nouveauStatut }).eq("lead_id", callLead.id).order("created_at", { ascending: false }).limit(1);
    await supabase.from("Leads").update(updateData).eq("id", callLead.id);
    await logAction(callLead.id, `Appel terminé (${formatTime(duree)})`, getStatutEffectif(callLead), nouveauStatut, hasChanges ? "Infos modifiées" : "");
    setShowActiveCall(false); setCallLead(null); setCallSeconds(0); setWebrtcStatus("idle");
    fetchData();
  };

  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;
  const formatDureeTotal = (sec: number) => { if (!sec) return "—"; return `${Math.floor(sec / 60)}min${sec % 60 > 0 ? ` ${sec % 60}s` : ""}`; };

  const exportExcel = () => {
    const data = leadsFiltres.filter(l => l.statut_livraison === "Livré");
    if (data.length === 0) { alert("Aucun lead livré."); return; }
    const rows = data.map(l => ({ "Tracking N°": l.tracking_number || "", "Client": l.nom_client || "", "Téléphone": l.telephone || "", "Produit": l.produit || "", "Qté": l.quantite || 1, "Prix unit.": l.prix_unitaire || 0, "Total": (l.prix_unitaire || 0) * (l.quantite || 1), "Marché": toCode(l.marche), "Ville": l.ville || "", "Statut confirmation": getStatutEffectif(l), "Statut livraison": l.statut_livraison || "", "Date livraison": l.date_livraison ? new Date(l.date_livraison).toLocaleDateString("fr-FR") : "", "Société livraison": l.ste_livraison || "", "Source": l.source_creation || "", "Date création": new Date(l.created_at).toLocaleDateString("fr-FR") }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Livrés");
    XLSX.writeFile(wb, `livres-${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  const villes = ["Tous", ...Array.from(new Set(leads.filter(l => filtreMarche === "Tous" || toCode(l.marche) === filtreMarche).map(l => l.ville ? initCap(l.ville) : null).filter(Boolean)))];
  const produitsNoms = ["Tous", ...Array.from(new Set(leads.map(l => l.produit).filter(Boolean)))];

  const leadsFiltres = leads.filter(l => {
    const statut = getStatutEffectif(l);
    if (filtreStatut !== "Tous") {
      if (filtreStatut === "Livré" && l.statut_livraison !== "Livré") return false;
      else if (filtreStatut !== "Livré" && statut !== filtreStatut) return false;
    }
    if (filtreMarche  !== "Tous" && toCode(l.marche) !== filtreMarche) return false;
    if (filtreVille   !== "Tous" && initCap(l.ville) !== filtreVille) return false;
    if (filtreSource  !== "Tous" && l.source_creation !== filtreSource) return false;
    if (filtreProduit !== "Tous" && l.produit !== filtreProduit) return false;
    if (filtreDateDebut && new Date(l.created_at) < new Date(filtreDateDebut)) return false;
    if (filtreDateFin  && new Date(l.created_at) > new Date(filtreDateFin + "T23:59:59")) return false;
    if (recherche && ![l.nom_client, l.telephone, l.produit, l.ville, l.tracking_number].some(v => v?.toLowerCase().includes(recherche.toLowerCase()))) return false;
    return true;
  });

  const stocksFiltres = stocks.filter(s => {
    if (filtreStockMarche !== "Tous" && toCode(s.marche) !== filtreStockMarche) return false;
    const dispo = getDispo(s);
    if (filtreStockStatut === "Rupture"    && dispo !== 0) return false;
    if (filtreStockStatut === "Faible"     && !(dispo > 0 && dispo <= s.seuil_alerte)) return false;
    if (filtreStockStatut === "Disponible" && dispo < s.seuil_alerte) return false;
    return true;
  });

  const totalLeads    = leads.length;
  const nbNonConf     = leads.filter(l => getStatutEffectif(l) === "Non confirmé").length;
  const nbConf        = leads.filter(l => getStatutEffectif(l) === "Confirmé").length;
  const nbLivre       = leads.filter(l => l.statut_livraison === "Livré").length;
  const nbAnnule      = leads.filter(l => getStatutEffectif(l) === "Annulé").length;
  const nbInjoignable = leads.filter(l => getStatutEffectif(l) === "Injoignable").length;
  const pctConf       = totalLeads ? Math.round(nbConf / totalLeads * 100) : 0;
  const pctLivraison  = totalLeads ? Math.round(nbLivre / totalLeads * 100) : 0;

  // ✅ Calculs dashboard filtrés par période
  const getDashLeads = () => {
    const now = new Date();
    let debut = new Date();
    if (dashPeriode === "aujourd'hui") debut.setHours(0, 0, 0, 0);
    else if (dashPeriode === "semaine") debut.setDate(now.getDate() - 7);
    else if (dashPeriode === "mois") debut.setMonth(now.getMonth() - 1);
    else debut.setFullYear(now.getFullYear() - 1);
    return leads.filter(l => new Date(l.created_at) >= debut);
  };
  const dashLeads    = getDashLeads();
  const dashTotal    = dashLeads.length;
  const dashConf     = dashLeads.filter(l => getStatutEffectif(l) === "Confirmé").length;
  const dashLivre    = dashLeads.filter(l => l.statut_livraison === "Livré").length;
  const dashAnnule   = dashLeads.filter(l => getStatutEffectif(l) === "Annulé").length;
  const dashInj      = dashLeads.filter(l => getStatutEffectif(l) === "Injoignable").length;
  const dashNonConf  = dashLeads.filter(l => getStatutEffectif(l) === "Non confirmé").length;
  const dashRelance  = dashLeads.reduce((s, l) => s + (l.nombre_relance || 0), 0);
  const dashPctConf  = dashTotal ? Math.round(dashConf / dashTotal * 100) : 0;
  const dashPctLiv   = dashConf  ? Math.round(dashLivre / dashConf * 100) : 0;

  const inputStyle: any = { padding: "8px 12px", border: "1.5px solid #E5E7EB", borderRadius: 8, fontSize: 13, outline: "none", background: "white", cursor: "pointer" };
  const fieldStyle: any = { width: "100%", padding: "10px 14px", border: "1.5px solid #E5E7EB", borderRadius: 8, fontSize: 13, outline: "none", boxSizing: "border-box" };
  const labelStyle: any = { fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 5 };
  const getRoleColor = (r: string) => ({ "CRC": "#DBEAFE", "CRL": "#F3E8FF", "Livreur": "#DCFCE7" }[r] || "#F3F4F6");
  const getRoleText  = (r: string) => ({ "CRC": "#1D4ED8", "CRL": "#6D28D9", "Livreur": "#166534" }[r] || "#374151");

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#F0F4F8" }}>
      <Sidebar role="crc" />
      <TopBar recherche={recherche} onRecherche={setRecherche} showRecherche={tab === "leads"} />

      <div style={{ marginLeft: 240, flex: 1, padding: 32, paddingTop: 80 }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: "#1E3A5F" }}>Confirmation des leads</h1>
          <div style={{ display: "flex", gap: 8 }}>
            {[
              { id: "dashboard", label: "📊 Dashboard" },
              { id: "leads",     label: `📋 Leads (${leads.length})` },
              { id: "stock",     label: "📦 Stock" },
              { id: "sku",       label: "🏷️ SKU" },
            ].map(t => (
              <button key={t.id} onClick={() => changeTab(t.id)}
                style={{ padding: "10px 20px", borderRadius: 8, border: "none", cursor: "pointer", fontWeight: 600, fontSize: 13, background: tab === t.id ? "#1E3A5F" : "white", color: tab === t.id ? "white" : "#374151", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* KPIs */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(8, 1fr)", gap: 12, marginBottom: 24 }}>
          {[
            { label: "Total",        value: totalLeads,         color: "#3B82F6", filtre: "Tous"         },
            { label: "Non confirmé", value: nbNonConf,          color: "#F97316", filtre: "Non confirmé" },
            { label: "Confirmé",     value: nbConf,             color: "#10B981", filtre: "Confirmé"     },
            { label: "Livré",        value: nbLivre,            color: "#064E3B", filtre: "Livré"        },
            { label: "Annulé",       value: nbAnnule,           color: "#EF4444", filtre: "Annulé"       },
            { label: "Injoignable",  value: nbInjoignable,      color: "#F59E0B", filtre: "Injoignable"  },
            { label: "% Conf.",      value: `${pctConf}%`,      color: "#6366F1", filtre: null           },
            { label: "% Livraison",  value: `${pctLivraison}%`, color: "#0EA5E9", filtre: null           },
          ].map(s => (
            <div key={s.label}
              onClick={() => { if (s.filtre) { setFiltreStatut(filtreStatut === s.filtre ? "Tous" : s.filtre); changeTab("leads"); } }}
              style={{ background: "white", borderRadius: 12, padding: "12px 14px", boxShadow: "0 1px 4px rgba(0,0,0,0.08)", borderTop: `3px solid ${s.color}`, cursor: s.filtre ? "pointer" : "default", outline: filtreStatut === s.filtre ? `2px solid ${s.color}` : "none" }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 10, color: "#6B7280", marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* ════ TAB DASHBOARD ════ */}
        {tab === "dashboard" && (
          <div>
            {/* ✅ Sélecteur période */}
            <div style={{ display: "flex", gap: 8, marginBottom: 20, alignItems: "center" }}>
              {[
                { id: "aujourd'hui", label: "Aujourd'hui" },
                { id: "semaine",     label: "7 jours"     },
                { id: "mois",        label: "30 jours"    },
                { id: "annee",       label: "Année"       },
              ].map(p => (
                <button key={p.id} onClick={() => setDashPeriode(p.id)}
                  style={{ padding: "7px 18px", borderRadius: 8, border: "none", cursor: "pointer", fontWeight: 600, fontSize: 13, background: dashPeriode === p.id ? "#1E3A5F" : "white", color: dashPeriode === p.id ? "white" : "#374151", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
                  {p.label}
                </button>
              ))}
              <span style={{ marginLeft: 8, fontSize: 12, color: "#9CA3AF" }}>
                {dashTotal} lead{dashTotal > 1 ? "s" : ""} sur la période
              </span>
            </div>

            {/* Bannière */}
            <div style={{ background: "linear-gradient(135deg, #1E3A5F, #2E6DA4)", borderRadius: 16, padding: "24px 28px", marginBottom: 24, color: "white" }}>
              <div style={{ fontSize: 22, fontWeight: 800 }}>Bonjour {currentProfile?.nom?.split(" ")[0] || "Agent"} 👋</div>
              <div style={{ fontSize: 14, opacity: 0.8, marginTop: 4 }}>
                {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
              </div>
              <div style={{ display: "flex", gap: 20, marginTop: 16, flexWrap: "wrap" }}>
                {[
                  { label: "Total leads",    value: dashTotal   },
                  { label: "Confirmés",      value: dashConf    },
                  { label: "Livrés",         value: dashLivre   },
                  { label: "Total relances", value: dashRelance },
                ].map(s => (
                  <div key={s.label} style={{ background: "rgba(255,255,255,0.15)", borderRadius: 10, padding: "12px 20px", minWidth: 130 }}>
                    <div style={{ fontSize: 28, fontWeight: 800 }}>{s.value}</div>
                    <div style={{ fontSize: 12, opacity: 0.8, marginTop: 4 }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
              {/* Répartition */}
              <div style={{ background: "white", borderRadius: 16, padding: 24, boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
                <h3 style={{ margin: "0 0 20px", fontSize: 16, color: "#1E3A5F" }}>📊 Répartition des statuts</h3>
                {(() => {
                  const data = [
                    { label: "Confirmé",     value: dashConf,    color: "#10B981" },
                    { label: "Non confirmé", value: dashNonConf, color: "#F97316" },
                    { label: "Annulé",       value: dashAnnule,  color: "#EF4444" },
                    { label: "Injoignable",  value: dashInj,     color: "#F59E0B" },
                    { label: "Livré",        value: dashLivre,   color: "#064E3B" },
                  ].filter(d => d.value > 0);
                  const total = data.reduce((s, d) => s + d.value, 0);
                  if (total === 0) return <div style={{ textAlign: "center", padding: "32px 0", color: "#9CA3AF" }}>Aucune donnée sur cette période</div>;
                  let cumul = 0;
                  const size = 200, cx = 100, cy = 100, r = 78, inner = 50;
                  const slices = data.map(d => {
                    const pct = d.value / total;
                    const start = cumul * 2 * Math.PI - Math.PI / 2;
                    cumul += pct;
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
                        <text x={cx} y={cy + 12} textAnchor="middle" fontSize={11} fill="#6B7280">leads</text>
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

              {/* Performances */}
              <div style={{ background: "white", borderRadius: 16, padding: 24, boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
                <h3 style={{ margin: "0 0 20px", fontSize: 16, color: "#1E3A5F" }}>🎯 Mes performances</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                  {[
                    { label: "Taux de confirmation", value: dashPctConf, color: "#10B981", detail: `${dashConf}/${dashTotal}`  },
                    { label: "Taux de livraison",    value: dashPctLiv,  color: "#0EA5E9", detail: `${dashLivre}/${dashConf}`  },
                    { label: "Taux d'annulation",    value: dashTotal ? Math.round(dashAnnule / dashTotal * 100) : 0, color: "#EF4444", detail: `${dashAnnule}/${dashTotal}` },
                    { label: "Taux injoignable",     value: dashTotal ? Math.round(dashInj    / dashTotal * 100) : 0, color: "#F59E0B", detail: `${dashInj}/${dashTotal}`    },
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

            {/* Évolution 7 jours — toujours fixe sur 7 jours */}
            <div style={{ background: "white", borderRadius: 16, padding: 24, boxShadow: "0 1px 4px rgba(0,0,0,0.08)", marginBottom: 20 }}>
              <h3 style={{ margin: "0 0 20px", fontSize: 16, color: "#1E3A5F" }}>📈 Évolution des 7 derniers jours</h3>
              {(() => {
                const days = Array.from({ length: 7 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - (6 - i)); return d; });
                const data = days.map(d => {
                  const dl = leads.filter(l => new Date(l.created_at).toDateString() === d.toDateString());
                  return { label: d.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric" }), total: dl.length, conf: dl.filter(l => getStatutEffectif(l) === "Confirmé").length, annule: dl.filter(l => getStatutEffectif(l) === "Annulé").length };
                });
                const maxVal = Math.max(...data.map(d => d.total), 1);
                const chartH = 140;
                return (
                  <div>
                    <div style={{ display: "flex", gap: 6, alignItems: "flex-end", height: chartH + 40 }}>
                      {data.map((d, i) => (
                        <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: "#1E3A5F" }}>{d.total > 0 ? d.total : ""}</div>
                          <div style={{ width: "100%", display: "flex", gap: 2, alignItems: "flex-end", height: chartH }}>
                            <div style={{ flex: 1, background: "#10B981", borderRadius: "4px 4px 0 0", height: `${(d.conf / maxVal) * chartH}px`, minHeight: d.conf > 0 ? 4 : 0 }} />
                            <div style={{ flex: 1, background: "#EF4444", borderRadius: "4px 4px 0 0", height: `${(d.annule / maxVal) * chartH}px`, minHeight: d.annule > 0 ? 4 : 0 }} />
                            <div style={{ flex: 1, background: "#E5E7EB", borderRadius: "4px 4px 0 0", height: `${((d.total - d.conf - d.annule) / maxVal) * chartH}px`, minHeight: (d.total - d.conf - d.annule) > 0 ? 4 : 0 }} />
                          </div>
                          <div style={{ fontSize: 10, color: "#9CA3AF", textAlign: "center" }}>{d.label}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{ display: "flex", gap: 16, marginTop: 12 }}>
                      {[{ color: "#10B981", label: "Confirmés" }, { color: "#EF4444", label: "Annulés" }, { color: "#E5E7EB", label: "Autres" }].map(l => (
                        <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <div style={{ width: 12, height: 12, borderRadius: 3, background: l.color }} />
                          <span style={{ fontSize: 12, color: "#6B7280" }}>{l.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Derniers leads — filtrés par période */}
            <div style={{ background: "white", borderRadius: 16, padding: 24, boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
              <h3 style={{ margin: "0 0 16px", fontSize: 16, color: "#1E3A5F" }}>🕐 Derniers leads traités</h3>
              {dashLeads.length === 0 ? (
                <div style={{ textAlign: "center", padding: "24px 0", color: "#9CA3AF", fontSize: 13 }}>Aucun lead sur cette période</div>
              ) : dashLeads.slice(0, 8).map((lead, i) => {
                const statut = getStatutEffectif(lead);
                return (
                  <div key={lead.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: i < Math.min(7, dashLeads.length - 1) ? "1px solid #F3F4F6" : "none" }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{lead.nom_client}</div>
                      <div style={{ fontSize: 12, color: "#6B7280" }}>{lead.produit} · {lead.ville} · <DrapeauBadge code={lead.marche} /></div>
                    </div>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <span style={{ background: `${getStatutColor(statut)}20`, color: getStatutColor(statut), padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600 }}>{statut}</span>
                      <span style={{ fontSize: 11, color: "#9CA3AF" }}>{timeAgo(lead.updated_at || lead.created_at)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ════ TAB LEADS ════ */}
        {tab === "leads" && (
          <div>
            <div style={{ background: "white", borderRadius: 12, padding: "14px 20px", marginBottom: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end", marginBottom: 12 }}>
                <div><div style={{ fontSize: 11, color: "#6B7280", fontWeight: 600, marginBottom: 4 }}>STATUT</div>
                  <select value={filtreStatut} onChange={e => setFiltreStatut(e.target.value)} style={inputStyle}>
                    {["Tous","Nouveau","Non confirmé","Confirmé","Annulé","Injoignable","Livré"].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div><div style={{ fontSize: 11, color: "#6B7280", fontWeight: 600, marginBottom: 4 }}>MARCHÉ</div>
                  <select value={filtreMarche} onChange={e => { setFiltreMarche(e.target.value); setFiltreVille("Tous"); }} style={inputStyle}>
                    <option value="Tous">🌍 Tous</option><option value="DZ">🇩🇿 Algérie</option><option value="MA">🇲🇦 Maroc</option><option value="TN">🇹🇳 Tunisie</option>
                  </select>
                </div>
                <div><div style={{ fontSize: 11, color: "#6B7280", fontWeight: 600, marginBottom: 4 }}>VILLE</div>
                  <select value={filtreVille} onChange={e => setFiltreVille(e.target.value)} style={inputStyle}>
                    {villes.map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>
                <div><div style={{ fontSize: 11, color: "#6B7280", fontWeight: 600, marginBottom: 4 }}>SOURCE</div>
                  <select value={filtreSource} onChange={e => setFiltreSource(e.target.value)} style={inputStyle}>
                    <option value="Tous">Toutes</option><option value="mb">MB</option><option value="crl">CRL</option><option value="crc">CRC</option>
                  </select>
                </div>
                <div><div style={{ fontSize: 11, color: "#6B7280", fontWeight: 600, marginBottom: 4 }}>PRODUIT</div>
                  <select value={filtreProduit} onChange={e => setFiltreProduit(e.target.value)} style={inputStyle}>
                    {produitsNoms.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <span style={{ fontSize: 11, color: "#6B7280", fontWeight: 600 }}>DU</span>
                <input type="date" value={filtreDateDebut} onChange={e => setFiltreDateDebut(e.target.value)} style={inputStyle} />
                <span style={{ fontSize: 11, color: "#6B7280", fontWeight: 600 }}>AU</span>
                <input type="date" value={filtreDateFin} onChange={e => setFiltreDateFin(e.target.value)} style={inputStyle} />
                <button onClick={() => { setFiltreStatut("Tous"); setFiltreMarche("Tous"); setFiltreVille("Tous"); setFiltreSource("Tous"); setFiltreProduit("Tous"); setFiltreDateDebut(""); setFiltreDateFin(""); setRecherche(""); }}
                  style={{ padding: "8px 16px", background: "#F3F4F6", color: "#374151", border: "none", borderRadius: 8, fontWeight: 600, fontSize: 12, cursor: "pointer" }}>🔄 Reset</button>
                <div style={{ marginLeft: "auto" }}>
                  <button onClick={exportExcel} style={{ padding: "8px 18px", background: "#064E3B", color: "white", border: "none", borderRadius: 8, fontWeight: 600, fontSize: 12, cursor: "pointer" }}>⬇️ Exporter livrés (.xlsx)</button>
                </div>
              </div>
            </div>

            <div style={{ background: "white", borderRadius: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.08)", overflow: "hidden" }}>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "#F9FAFB" }}>
                      {["","Créé","CRC","Tracking","Client","Téléphone","Produit","Qté","Prix","Total","Marché","Ville","Source","Confirmation","Livraison","Durée","Relances","Actions"].map(h => (
                        <th key={h} style={{ padding: "11px 12px", textAlign: "left", fontSize: 11, color: "#6B7280", fontWeight: 600, borderBottom: "1px solid #E5E7EB", whiteSpace: "nowrap" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {leadsFiltres.length === 0 ? (
                      <tr><td colSpan={18} style={{ padding: "48px", textAlign: "center", color: "#9CA3AF" }}><div style={{ fontSize: 40, marginBottom: 8 }}>📋</div>Aucun lead</td></tr>
                    ) : leadsFiltres.map((lead, i) => {
                      const statut = getStatutEffectif(lead);
                      const isLivre = lead.statut_livraison === "Livré";
                      const { ok: stockOk, dispo: stockDispo } = checkStock(lead);
                      const stockWarning = !stockOk && statut !== "Confirmé" && statut !== "Annulé";
                      const peutApp  = peutRelancer(lead);
                      const attente  = minutesAvantRelance(lead);
                      const nbRelance = lead.nombre_relance || 0;
                      const nbAppels  = lead.nombre_appels  || 0;
                      const crcNom = lead.crc_agent_nom || "—";
                      const sourceBoutique = lead.source || lead.source_creation || "—";
                      return (
                        <>
                          <tr key={lead.id} style={{ background: expandedRow === lead.id ? "#F0F9FF" : isLivre ? "#F0FDF4" : stockWarning ? "#FFF5F5" : i % 2 ? "#FAFAFA" : "white", borderBottom: expandedRow === lead.id ? "none" : "1px solid #F3F4F6" }}>
                            <td style={{ padding: "8px 6px", textAlign: "center" }}>
                              <button onClick={() => toggleRow(lead.id)} style={{ width: 22, height: 22, background: expandedRow === lead.id ? "#DBEAFE" : "#F3F4F6", border: "none", borderRadius: 4, cursor: "pointer", fontSize: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                {expandedRow === lead.id ? "▼" : "▶"}
                              </button>
                            </td>
                            <td style={{ padding: "8px 10px", minWidth: 80 }}>
                              <div style={{ fontSize: 11, fontWeight: 700, color: "#1E3A5F" }}>{timeAgo(lead.created_at)}</div>
                              <div style={{ fontSize: 10, color: "#6B7280", marginTop: 2 }}>{sourceBoutique}</div>
                            </td>
                            <td style={{ padding: "8px 10px", minWidth: 80 }}>
                              <div style={{ fontSize: 11, fontWeight: 700, color: "#374151" }}>{crcNom}</div>
                              <div style={{ fontSize: 10, color: "#9CA3AF", marginTop: 2 }}>{timeAgo(lead.assigned_at || lead.created_at)}</div>
                            </td>
                            <td style={{ padding: "8px 10px", fontSize: 11, fontWeight: 700, color: "#6366F1", whiteSpace: "nowrap" }}>
                              {lead.tracking_number || "—"}
                              {stockWarning && <div style={{ fontSize: 9, color: "#EF4444", fontWeight: 700, marginTop: 2 }}>🔴 Stock: {stockDispo}</div>}
                            </td>
                            <td style={{ padding: "8px 10px", fontWeight: 600, fontSize: 12, whiteSpace: "nowrap" }}>{lead.nom_client}</td>
                            <td style={{ padding: "8px 10px", fontSize: 11 }}>{lead.telephone}</td>
                            <td style={{ padding: "8px 10px", fontSize: 11 }}><div style={{ fontWeight: 600 }}>{lead.produit}</div></td>
                            <td style={{ padding: "8px 10px", fontSize: 11, textAlign: "center" }}>{lead.quantite}</td>
                            <td style={{ padding: "8px 10px", fontSize: 11 }}>{lead.prix_unitaire}</td>
                            <td style={{ padding: "8px 10px", fontSize: 12, fontWeight: 700, color: "#1E3A5F", whiteSpace: "nowrap" }}>{((lead.prix_unitaire || 0) * (lead.quantite || 1)).toLocaleString()}</td>
                            <td style={{ padding: "8px 10px" }}><DrapeauBadge code={lead.marche} /></td>
                            <td style={{ padding: "8px 10px", fontSize: 11 }}>{lead.ville ? initCap(lead.ville) : "—"}</td>
                            <td style={{ padding: "8px 10px" }}><SourceBadge src={lead.source_creation} /></td>
                            <td style={{ padding: "8px 10px", minWidth: 140 }}>
                              <span style={{ background: `${getStatutColor(statut)}20`, color: getStatutColor(statut), padding: "3px 8px", borderRadius: 20, fontSize: 10, fontWeight: 600, display: "inline-block" }}>{statut}</span>
                              {nbAppels > 0 && <div style={{ marginTop: 3 }}><span style={{ background: nbAppels >= 3 ? "#FEF2F2" : "#FFF7ED", color: nbAppels >= 3 ? "#EF4444" : "#F97316", padding: "1px 5px", borderRadius: 4, fontSize: 9, fontWeight: 700 }}>{nbAppels} appel{nbAppels > 1 ? "s" : ""}</span></div>}
                              {lead.notes_crc && <div style={{ fontSize: 10, color: "#6B7280", marginTop: 3, fontStyle: "italic", maxWidth: 130, wordBreak: "break-word" }}>💬 {lead.notes_crc}</div>}
                            </td>
                            <td style={{ padding: "8px 10px", minWidth: 140 }}>
                              {lead.statut_livraison ? <span style={{ background: `${getStatutLivColor(lead.statut_livraison)}20`, color: getStatutLivColor(lead.statut_livraison), padding: "3px 8px", borderRadius: 20, fontSize: 10, fontWeight: 600, display: "inline-block" }}>{lead.statut_livraison}</span> : <span style={{ color: "#D1D5DB", fontSize: 10 }}>—</span>}
                              {lead.notes_livraison && <div style={{ fontSize: 10, color: "#6B7280", marginTop: 3, fontStyle: "italic", maxWidth: 130, wordBreak: "break-word" }}>💬 {lead.notes_livraison}</div>}
                            </td>
                            <td style={{ padding: "8px 10px", fontSize: 10, color: "#6B7280" }}>{formatDureeTotal(lead.duree_appel_total || 0)}</td>
                            <td style={{ padding: "8px 10px", textAlign: "center" }}>
                              <span style={{ background: nbRelance >= 9 ? "#FEF2F2" : nbRelance >= 6 ? "#FFFBEB" : "#F0FDF4", color: nbRelance >= 9 ? "#EF4444" : nbRelance >= 6 ? "#F59E0B" : "#10B981", padding: "3px 8px", borderRadius: 8, fontSize: 11, fontWeight: 700 }}>{nbRelance}</span>
                            </td>
                            <td style={{ padding: "8px 10px" }}>
                              <div style={{ display: "flex", gap: 5 }}>
                                <button onClick={() => copyLead(lead)} style={{ width: 28, height: 28, background: copiedId === lead.id ? "#ECFDF5" : "#F0FDF4", border: "none", borderRadius: 6, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13 }}>{copiedId === lead.id ? "✅" : "📋"}</button>
                                {!isLivre && <button onClick={() => openEdit(lead)} style={{ width: 28, height: 28, background: "#FFFBEB", border: "none", borderRadius: 6, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13 }}>✏️</button>}
                                {!isLivre && (
                                  <button onClick={() => { if (peutApp) openCall(lead); }} title={!peutApp ? `Attendre ${attente}min` : "Appeler"}
                                    style={{ width: 28, height: 28, background: !peutApp ? "#F3F4F6" : "#ECFDF5", border: "none", borderRadius: 6, cursor: peutApp ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, opacity: !peutApp ? 0.5 : 1 }}>
                                    {!peutApp ? `⏳${attente}` : "📞"}
                                  </button>
                                )}
                                {isLivre && <span style={{ fontSize: 11, color: "#10B981", fontWeight: 700, display: "flex", alignItems: "center" }}>🔒</span>}
                              </div>
                            </td>
                          </tr>
                          {expandedRow === lead.id && (
                            <tr key={`hist-${lead.id}`}>
                              <td colSpan={18} style={{ padding: "0 16px 16px 36px", background: "#F0F9FF", borderBottom: "1px solid #BFDBFE" }}>
                                <div style={{ borderLeft: "3px solid #3B82F6", paddingLeft: 16, paddingTop: 12 }}>
                                  <div style={{ fontSize: 12, fontWeight: 700, color: "#1D4ED8", marginBottom: 10 }}>📋 Historique</div>
                                  {!historiques[lead.id] ? <div style={{ fontSize: 12, color: "#9CA3AF" }}>Chargement...</div>
                                  : historiques[lead.id].length === 0 ? <div style={{ fontSize: 12, color: "#9CA3AF" }}>Aucun historique</div>
                                  : historiques[lead.id].map((h, idx) => (
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
                        </>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ════ TAB STOCK ════ */}
        {tab === "stock" && (
          <div style={{ background: "white", borderRadius: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.08)", overflow: "hidden" }}>
            <div style={{ padding: "14px 20px", borderBottom: "1px solid #E5E7EB", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              <h2 style={{ margin: 0, fontSize: 16, color: "#1E3A5F" }}>📦 Stock disponible</h2>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div>
                  <div style={{ fontSize: 11, color: "#6B7280", fontWeight: 600, marginBottom: 4 }}>MARCHÉ</div>
                  <select value={filtreStockMarche} onChange={e => setFiltreStockMarche(e.target.value)} style={inputStyle}>
                    <option value="Tous">🌍 Tous</option><option value="DZ">🇩🇿 Algérie</option><option value="MA">🇲🇦 Maroc</option><option value="TN">🇹🇳 Tunisie</option>
                  </select>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: "#6B7280", fontWeight: 600, marginBottom: 4 }}>STATUT</div>
                  <select value={filtreStockStatut} onChange={e => setFiltreStockStatut(e.target.value)} style={inputStyle}>
                    <option value="Tous">📦 Tous</option><option value="Disponible">✅ Disponible</option><option value="Faible">⚠️ Faible</option><option value="Rupture">🔴 Rupture</option>
                  </select>
                </div>
                <button onClick={() => { setFiltreStockMarche("Tous"); setFiltreStockStatut("Tous"); }}
                  style={{ padding: "8px 14px", background: "#F3F4F6", color: "#374151", border: "none", borderRadius: 8, fontWeight: 600, fontSize: 12, cursor: "pointer", marginTop: 18 }}>
                  🔄 Reset
                </button>
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
                  const dispo = getDispo(s);
                  const isRupture = dispo === 0;
                  const isFaible  = dispo > 0 && dispo <= s.seuil_alerte;
                  return (
                    <tr key={s.id} style={{ background: i % 2 ? "#FAFAFA" : "white", borderBottom: "1px solid #F3F4F6" }}>
                      <td style={{ padding: "12px 16px", fontWeight: 600, fontSize: 13 }}>{s.produit}</td>
                      <td style={{ padding: "12px 16px" }}><DrapeauBadge code={s.marche} /></td>
                      <td style={{ padding: "12px 16px", textAlign: "center" }}><span style={{ fontWeight: 800, fontSize: 14, color: isRupture ? "#EF4444" : isFaible ? "#F59E0B" : "#10B981" }}>{dispo}</span></td>
                      <td style={{ padding: "12px 16px" }}>
                        <span style={{ background: isRupture ? "#FEF2F2" : isFaible ? "#FFFBEB" : "#ECFDF5", color: isRupture ? "#EF4444" : isFaible ? "#F59E0B" : "#10B981", padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600 }}>
                          {isRupture ? "🔴 Rupture" : isFaible ? "⚠️ Faible" : "✅ OK"}
                        </span>
                      </td>
                      <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 600 }}>
                        {isRupture ? <span style={{ color: "#EF4444" }}>🚫 Ne pas confirmer</span> : isFaible ? <span style={{ color: "#F59E0B" }}>⚠️ Prudence</span> : <span style={{ color: "#10B981" }}>✅ OK</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ════ TAB SKU ════ */}
        {tab === "sku" && (
          <div style={{ background: "white", borderRadius: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.08)", overflow: "hidden" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid #E5E7EB" }}>
              <h2 style={{ margin: 0, fontSize: 16, color: "#1E3A5F" }}>🏷️ Catalogue ({produits.length})</h2>
            </div>
            {produits.length === 0 ? (
              <div style={{ textAlign: "center", padding: "48px 0", color: "#9CA3AF" }}><div style={{ fontSize: 48, marginBottom: 12 }}>🏷️</div><div>Aucun produit</div></div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 20, padding: 24 }}>
                {produits.map(p => (
                  <div key={p.id} style={{ border: "1px solid #E5E7EB", borderRadius: 12, overflow: "hidden", opacity: p.actif ? 1 : 0.6 }}>
                    {p.photo_url ? <img src={p.photo_url} alt={p.nom} style={{ width: "100%", height: 150, objectFit: "cover" }} /> : <div style={{ width: "100%", height: 100, background: "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36 }}>🏷️</div>}
                    <div style={{ padding: 14 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: "#111827", marginBottom: 4 }}>{p.nom}</div>
                      <div style={{ fontSize: 12, color: "#6B7280", marginBottom: 8 }}>{p.description}</div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ fontWeight: 800, fontSize: 15, color: "#1E3A5F" }}>{p.prix_unitaire}</div>
                        <DrapeauBadge code={p.marche} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ════ MODAL MODIFIER ════ */}
        {showEditModal && editLead && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ background: "white", borderRadius: 16, padding: 28, width: "85vw", maxWidth: 860, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <h2 style={{ margin: 0, fontSize: 18, color: "#1E3A5F" }}>✏️ Modifier la commande</h2>
                <button onClick={() => setShowEditModal(false)} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#9CA3AF" }}>✕</button>
              </div>
              <div style={{ background: "#F0F9FF", borderRadius: 10, padding: "12px 16px", marginBottom: 20, borderLeft: "4px solid #3B82F6" }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: "#1E3A5F" }}>{editLead.nom_client}</div>
                <div style={{ fontSize: 12, color: "#6B7280", marginTop: 4 }}>📞 {editLead.telephone} · {toCode(editLead.marche)} · {editLead.ville}</div>
                {editLead.tracking_number && <div style={{ fontSize: 11, color: "#6366F1", fontWeight: 700, marginTop: 4 }}>🔖 {editLead.tracking_number}</div>}
                {editLead.statut_livraison && (
                  <div style={{ marginTop: 8, display: "flex", gap: 8, alignItems: "center" }}>
                    <span style={{ fontSize: 11, color: "#6B7280" }}>Livraison :</span>
                    <span style={{ background: `${getStatutLivColor(editLead.statut_livraison)}20`, color: getStatutLivColor(editLead.statut_livraison), padding: "2px 8px", borderRadius: 6, fontSize: 11, fontWeight: 700 }}>{editLead.statut_livraison}</span>
                    <span style={{ fontSize: 10, color: "#9CA3AF" }}>(géré par CRL/Livreur)</span>
                  </div>
                )}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
                {([["Nom client","nom_client","text"],["Téléphone","telephone","text"],["Produit","produit","text"],["Quantité","quantite","number"],["Prix unitaire","prix_unitaire","number"],["Ville","ville","text"],["Source","source","text"]] as [string,string,string][]).map(([label,key,type]) => (
                  <div key={key}><label style={labelStyle}>{label}</label><input type={type} value={editForm[key]} onChange={e => setEditForm({...editForm,[key]:e.target.value})} style={fieldStyle} /></div>
                ))}
                <div><label style={labelStyle}>Marché</label>
                  <select value={editForm.marche} onChange={e => setEditForm({...editForm,marche:e.target.value})} style={fieldStyle}>
                    <option value="DZ">🇩🇿 Algérie</option><option value="MA">🇲🇦 Maroc</option><option value="TN">🇹🇳 Tunisie</option>
                  </select>
                </div>
                <div><label style={labelStyle}>Statut confirmation</label>
                  <select value={editForm.statut_confirmation} onChange={e => setEditForm({...editForm,statut_confirmation:e.target.value})} style={fieldStyle}>
                    {["Nouveau","Non confirmé","Confirmé","Annulé","Injoignable"].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div style={{ gridColumn: "1 / -1" }}><label style={labelStyle}>💬 Commentaire CRC</label>
                  <input value={editForm.notes_crc} onChange={e => setEditForm({...editForm,notes_crc:e.target.value})} placeholder="Ex: Client rappellera demain matin..." style={fieldStyle} />
                </div>
              </div>
              {editForm.quantite && editForm.prix_unitaire && (
                <div style={{ marginTop: 12, background: "#EFF6FF", borderRadius: 8, padding: "10px 14px", fontSize: 14, color: "#1E3A5F", fontWeight: 700 }}>
                  💰 Total : {Number(editForm.quantite) * Number(editForm.prix_unitaire)}
                </div>
              )}
              <div style={{ marginTop: 20, display: "flex", gap: 12 }}>
                <button onClick={saveEdit} style={{ flex: 1, padding: "12px", background: "#1E3A5F", color: "white", border: "none", borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: "pointer" }}>💾 Sauvegarder</button>
                <button onClick={() => setShowEditModal(false)} style={{ padding: "12px 20px", background: "#F3F4F6", color: "#374151", border: "none", borderRadius: 10, fontWeight: 600, cursor: "pointer" }}>Annuler</button>
              </div>
            </div>
          </div>
        )}

        {/* ════ MODAL APPEL ════ */}
        {showCallModal && callLead && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ background: "white", borderRadius: 16, padding: 28, width: "85vw", maxWidth: 860, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <h2 style={{ margin: 0, fontSize: 18, color: "#1E3A5F" }}>📞 Préparer l'appel</h2>
                <button onClick={() => setShowCallModal(false)} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#9CA3AF" }}>✕</button>
              </div>
              <div style={{ background: "#EFF6FF", borderRadius: 10, padding: "10px 16px", marginBottom: 16, fontSize: 12, color: "#1D4ED8" }}>
                📋 <strong>Process :</strong> 3 tentatives × 30min = 1 appel. 3 appels sans réponse → Injoignable.
                <div style={{ marginTop: 4 }}>Tentatives aujourd'hui : <strong>{callLead.nombre_appels_jour||0}/3</strong> | Appels : <strong>{callLead.nombre_appels||0}/3</strong> | Relances : <strong>{callLead.nombre_relance||0}</strong></div>
              </div>
              {!peutRelancer(callLead) && (
                <div style={{ background: "#FEF2F2", border: "1px solid #EF4444", borderRadius: 10, padding: "10px 16px", marginBottom: 16, fontSize: 13, color: "#EF4444", fontWeight: 600 }}>
                  ⏳ Encore {minutesAvantRelance(callLead)} minutes avant de pouvoir relancer
                </div>
              )}
              {(() => { const { ok, dispo } = checkStock(callLead); return !ok ? (<div style={{ background: "#FEF2F2", border: "1px solid #EF4444", borderRadius: 10, padding: "10px 16px", marginBottom: 16, fontSize: 13, color: "#EF4444", fontWeight: 600 }}>🔴 Stock insuffisant : {dispo} dispo / {callLead.quantite} demandés</div>) : null; })()}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                <div>
                  <div style={{ background: "#F0FDF4", borderRadius: 12, padding: 20, marginBottom: 16 }}>
                    <div style={{ fontSize: 13, color: "#6B7280", marginBottom: 4 }}>Client à appeler</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: "#1E3A5F" }}>{callLead.telephone}</div>
                    <div style={{ fontSize: 13, color: "#6B7280", marginTop: 4 }}>{callLead.nom_client} · {callLead.ville}</div>
                    <div style={{ marginTop: 8, background: (callLead.nombre_appels||0)>=2?"#FEF2F2":"#F0FDF4", borderRadius: 8, padding: "6px 12px", fontSize: 12, fontWeight: 700, color: (callLead.nombre_appels||0)>=2?"#EF4444":"#10B981" }}>
                      📞 Appels : {callLead.nombre_appels||0}/3
                    </div>
                  </div>
                  <div style={{ background: "#F9FAFB", borderRadius: 10, padding: 14 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                      {[["Produit",callLead.produit],["Qté",callLead.quantite],["Prix",callLead.prix_unitaire],["Total",(callLead.prix_unitaire||0)*(callLead.quantite||1)],["Marché",toCode(callLead.marche)],["Confirmation",getStatutEffectif(callLead)],["Livraison",callLead.statut_livraison||"—"]].map(([k,v]) => (
                        <div key={k as string}><div style={{ fontSize: 10, color: "#9CA3AF", fontWeight: 600 }}>{k}</div><div style={{ fontSize: 12, fontWeight: 700 }}>{v}</div></div>
                      ))}
                    </div>
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 10 }}>✏️ Modifier si nécessaire</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    {([["Nom client","nom_client","text"],["Téléphone","telephone","text"],["Produit","produit","text"],["Quantité","quantite","number"],["Prix unitaire","prix_unitaire","number"],["Ville","ville","text"]] as [string,string,string][]).map(([label,key,type]) => (
                      <div key={key}><label style={labelStyle}>{label}</label><input type={type} value={callEditForm[key]} onChange={e => setCallEditForm({...callEditForm,[key]:e.target.value})} style={fieldStyle} /></div>
                    ))}
                    <div><label style={labelStyle}>Marché</label>
                      <select value={callEditForm.marche} onChange={e => setCallEditForm({...callEditForm,marche:e.target.value})} style={fieldStyle}>
                        <option value="DZ">🇩🇿 Algérie</option><option value="MA">🇲🇦 Maroc</option><option value="TN">🇹🇳 Tunisie</option>
                      </select>
                    </div>
                  </div>
                  {callEditForm.quantite && callEditForm.prix_unitaire && (
                    <div style={{ marginTop: 10, background: "#EFF6FF", borderRadius: 8, padding: "8px 12px", fontSize: 13, color: "#1E3A5F", fontWeight: 700 }}>
                      💰 {Number(callEditForm.quantite)*Number(callEditForm.prix_unitaire)}
                    </div>
                  )}
                </div>
              </div>
                    <div style={{ marginTop: 20 }}>
                <button
                  onClick={startCall}
                  disabled={!peutRelancer(callLead)}
                  style={{ width: "100%", padding: "14px", background: peutRelancer(callLead) ? "#10B981" : "#9CA3AF", color: "white", border: "none", borderRadius: 12, fontWeight: 800, fontSize: 16, cursor: peutRelancer(callLead) ? "pointer" : "not-allowed" }}>
                  📞 Appeler {callLead.telephone}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ════ ÉCRAN APPEL EN COURS ════ */}
        {showActiveCall && callLead && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ background: "white", borderRadius: 20, padding: 32, width: "85vw", maxWidth: 860, boxShadow: "0 20px 60px rgba(0,0,0,0.4)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 24 }}>
                <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#10B981" }} />
                <span style={{ fontSize: 16, fontWeight: 700, color: "#1E3A5F" }}>Appel en cours</span>
                <span style={{ fontSize: 28, fontWeight: 800, color: "#10B981" }}>{formatTime(callSeconds)}</span>
                <span style={{
                  background: webrtcStatus === "active" ? "#ECFDF5" : webrtcStatus === "failed" ? "#FEF2F2" : "#FFF7ED",
                  color: webrtcStatus === "active" ? "#10B981" : webrtcStatus === "failed" ? "#EF4444" : "#F97316",
                  padding: "4px 10px", borderRadius: 8, fontSize: 12, fontWeight: 700
                }}>
                  {webrtcStatus === "connecting" && "🔄 Connexion..."}
                  {webrtcStatus === "ringing" && "📳 Sonnerie..."}
                  {webrtcStatus === "active" && "🟢 En ligne"}
                  {webrtcStatus === "ended" && "📴 Terminé"}
                  {webrtcStatus === "failed" && "❌ Échec"}
                  {webrtcStatus === "idle" && "—"}
                </span>
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
                    {([["Nom client","nom_client","text"],["Téléphone","telephone","text"],["Produit","produit","text"],["Quantité","quantite","number"],["Prix unitaire","prix_unitaire","number"],["Ville","ville","text"]] as [string,string,string][]).map(([label,key,type]) => (
                      <div key={key}><label style={{...labelStyle,fontSize:11}}>{label}</label><input type={type} value={callEditForm[key]} onChange={e => setCallEditForm({...callEditForm,[key]:e.target.value})} style={{...fieldStyle,padding:"8px 10px",fontSize:12}} /></div>
                    ))}
                  </div>
                  {callEditForm.quantite && callEditForm.prix_unitaire && (
                    <div style={{ marginTop: 8, background: "#EFF6FF", borderRadius: 8, padding: "8px 12px", fontSize: 13, color: "#1E3A5F", fontWeight: 700 }}>
                      💰 {Number(callEditForm.quantite)*Number(callEditForm.prix_unitaire)}
                    </div>
                  )}
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 12 }}>TERMINER L'APPEL :</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {[
                      { statut: "Confirmé",     bg: "#ECFDF5", color: "#10B981", border: "#10B981", label: "✅ Confirmer" },
                      { statut: "Non confirmé", bg: "#FFF7ED", color: "#F97316", border: "#F97316", label: "⏰ Non confirmé — relancer dans 30min" },
                      { statut: "Annulé",       bg: "#FEF2F2", color: "#EF4444", border: "#EF4444", label: "❌ Annuler" },
                    ].map(btn => (
                      <button key={btn.statut} onClick={() => endCall(btn.statut)}
                        style={{ padding: "12px 16px", background: btn.bg, color: btn.color, border: `1.5px solid ${btn.border}40`, borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: "pointer", textAlign: "left" }}>
                        {btn.label}
                      </button>
                    ))}
                  </div>
                  <button onClick={() => endCall(getStatutEffectif(callLead))} style={{ width: "100%", marginTop: 16, padding: "12px", background: "#EF4444", color: "white", border: "none", borderRadius: 12, fontWeight: 800, fontSize: 15, cursor: "pointer" }}>
                    📵 Raccrocher sans changer le statut
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ════ MODAL ALERTE STOCK ════ */}
        {showStockAlert && stockAlertInfo && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 3000, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ background: "white", borderRadius: 16, padding: 32, width: 460, boxShadow: "0 20px 60px rgba(0,0,0,0.4)" }}>
              <div style={{ textAlign: "center", marginBottom: 24 }}>
                <div style={{ fontSize: 52, marginBottom: 12 }}>🔴</div>
                <h2 style={{ margin: 0, fontSize: 20, color: "#EF4444", fontWeight: 800 }}>Stock insuffisant !</h2>
              </div>
              <div style={{ background: "#FEF2F2", borderRadius: 12, padding: 20, marginBottom: 24 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div><div style={{ fontSize: 10, color: "#9CA3AF", fontWeight: 600 }}>Produit</div><div style={{ fontSize: 13, fontWeight: 700 }}>{stockAlertInfo.lead?.produit}</div></div>
                  <div><div style={{ fontSize: 10, color: "#9CA3AF", fontWeight: 600 }}>Marché</div><div style={{ fontSize: 13, fontWeight: 700 }}>{toCode(stockAlertInfo.lead?.marche)}</div></div>
                  <div><div style={{ fontSize: 10, color: "#9CA3AF", fontWeight: 600 }}>Demandé</div><div style={{ fontSize: 18, fontWeight: 800, color: "#EF4444" }}>{stockAlertInfo.lead?.quantite}</div></div>
                  <div><div style={{ fontSize: 10, color: "#9CA3AF", fontWeight: 600 }}>Disponible</div><div style={{ fontSize: 18, fontWeight: 800, color: "#F59E0B" }}>{stockAlertInfo.dispo}</div></div>
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {pendingConfirmAction && (
                  <button onClick={() => { setShowStockAlert(false); pendingConfirmAction(); setPendingConfirmAction(null); setStockAlertInfo(null); }}
                    style={{ padding: "12px", background: "#FEF2F2", color: "#EF4444", border: "2px solid #EF444440", borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                    ⚠️ Confirmer quand même
                  </button>
                )}
                <button onClick={() => { setShowStockAlert(false); setPendingConfirmAction(null); setStockAlertInfo(null); }}
                  style={{ padding: "12px", background: "#1E3A5F", color: "white", border: "none", borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
                  ← Retour
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default withAuth(Confirmation, "crc");