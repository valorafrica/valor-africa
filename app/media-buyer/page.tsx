"use client";
import { useState, useEffect, useMemo, useRef } from "react";
import * as XLSX from "xlsx";
import { supabase } from "../../lib/supabase";
import Sidebar from "../components/Sidebar";
import withAuth from "../components/withAuth";

const PAYS = [
  { code: "MA", label: "Maroc",              bg: "#C1272D" },
  { code: "CG", label: "Congo-Brazzaville",  bg: "#009A44" },
  { code: "CD", label: "Congo-Kinshasa",     bg: "#007FFF" },
  { code: "GA", label: "Gabon",              bg: "#009E60" },
  { code: "TD", label: "Tchad",              bg: "#002664" },
  { code: "MG", label: "Madagascar",         bg: "#FC3D32" },
  { code: "TZ", label: "Tanzanie",           bg: "#1EB53A" },
  { code: "AO", label: "Angola",             bg: "#CC0000" },
  { code: "ML", label: "Mali",               bg: "#009A00" },
  { code: "GQ", label: "Guinée Éq.",         bg: "#3E9A00" },
  { code: "NG", label: "Nigeria",            bg: "#008751" },
  { code: "KE", label: "Kenya",              bg: "#006600" },
  { code: "CI", label: "Côte d'Ivoire",      bg: "#F77F00" },
  { code: "TG", label: "Togo",               bg: "#006A4E" },
  { code: "BJ", label: "Bénin",              bg: "#008751" },
];

const PAYS_MAP: Record<string, typeof PAYS[number]> = Object.fromEntries(PAYS.map(p => [p.code, p]));

const toPaysCode = (raw: string): string => {
  if (!raw) return "";
  const val = raw.trim().toLowerCase();
  const map: Record<string, string> = {
    "ma": "MA", "maroc": "MA", "morocco": "MA",
    "cg": "CG", "congo": "CG", "congo-brazzaville": "CG", "republic of the congo": "CG",
    "cd": "CD", "rdc": "CD", "congo-kinshasa": "CD", "drc": "CD", "democratic republic of the congo": "CD",
    "ga": "GA", "gabon": "GA",
    "td": "TD", "tchad": "TD", "chad": "TD",
    "mg": "MG", "madagascar": "MG",
    "tz": "TZ", "tanzanie": "TZ", "tanzania": "TZ",
    "ao": "AO", "angola": "AO",
    "ml": "ML", "mali": "ML",
    "gq": "GQ", "guinée équatoriale": "GQ", "guinee equatoriale": "GQ", "equatorial guinea": "GQ",
    "ng": "NG", "nigeria": "NG",
    "ke": "KE", "kenya": "KE",
    "ci": "CI", "côte d'ivoire": "CI", "cote d'ivoire": "CI", "civ": "CI", "ivory coast": "CI",
    "tg": "TG", "togo": "TG",
    "bj": "BJ", "bénin": "BJ", "benin": "BJ",
  };
  return map[val] || raw.trim().toUpperCase();
};

const nomPays = (code: string) => PAYS_MAP[toPaysCode(code)]?.label || code;

function MediaBuyer() {
  const getTabFromURL = () => {
    if (typeof window === "undefined") return "leads";
    return new URLSearchParams(window.location.search).get("tab") || "leads";
  };

  const [tab, setTab] = useState(getTabFromURL);
  const [leads, setLeads] = useState<any[]>([]);
  const [stocks, setStocks] = useState<any[]>([]);
  const [produits, setProduits] = useState<any[]>([]);
  const [importing, setImporting] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterMarche, setFilterMarche] = useState("Tous");
  const [filterStatut, setFilterStatut] = useState("Tous");
  const [filterSource, setFilterSource] = useState("Tous");
  const [filterProduit, setFilterProduit] = useState("Tous");
  const [filterStock, setFilterStock] = useState("Tous");
  const [filterDateDebut, setFilterDateDebut] = useState("");
  const [filterDateFin, setFilterDateFin] = useState("");
  const [detailLead, setDetailLead] = useState<any | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentProfile, setCurrentProfile] = useState<any>(null);
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const [showProfil, setShowProfil] = useState(false);
  const sessionRef = useRef<any>(null);

  // ✅ State historique
  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  const [historiques, setHistoriques] = useState<{ [key: number]: any[] }>({});
  const [detailHistorique, setDetailHistorique] = useState<any[]>([]);
  const [loadingHistorique, setLoadingHistorique] = useState(false);

  const fetchData = async () => {
    const { data: leadsData }    = await supabase.from("Leads").select("*").order("created_at", { ascending: false });
    const { data: stocksData }   = await supabase.from("Stocks").select("*");
    const { data: produitsData } = await supabase.from("produits").select("*").eq("actif", true).order("nom");
    if (leadsData)    setLeads(leadsData);
    if (stocksData)   setStocks(stocksData);
    if (produitsData) setProduits(produitsData);
  };

  useEffect(() => {
    fetchData();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setCurrentUser(user);
      if (user) supabase.from("Profiles").select("*").eq("id", user.id).single().then(({ data }) => setCurrentProfile(data));
    });
    sessionRef.current = setInterval(() => setSessionSeconds(s => s + 1), 1000);
    return () => clearInterval(sessionRef.current);
  }, []);

  useEffect(() => {
    const handlePopState = () => setTab(getTabFromURL());
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const changeTab = (newTab: string) => {
    setTab(newTab);
    window.history.pushState({}, "", newTab === "leads" ? "/media-buyer" : `/media-buyer?tab=${newTab}`);
  };

  const formatSession = (s: number) =>
    `${Math.floor(s/3600).toString().padStart(2,"0")}:${Math.floor((s%3600)/60).toString().padStart(2,"0")}:${(s%60).toString().padStart(2,"0")}`;

  // ✅ Fetch historique pour une ligne du tableau
  const fetchHistorique = async (leadId: number) => {
    const { data } = await supabase.from("historique").select("*").eq("lead_id", leadId).order("created_at", { ascending: false });
    if (data) setHistoriques(prev => ({ ...prev, [leadId]: data }));
  };

  const toggleRow = async (leadId: number) => {
    if (expandedRow === leadId) { setExpandedRow(null); return; }
    setExpandedRow(leadId);
    if (!historiques[leadId]) await fetchHistorique(leadId);
  };

  // ✅ Fetch historique pour la modal détail
  const openDetail = async (lead: any) => {
    setDetailLead(lead);
    setLoadingHistorique(true);
    const { data } = await supabase.from("historique").select("*").eq("lead_id", lead.id).order("created_at", { ascending: false });
    setDetailHistorique(data || []);
    setLoadingHistorique(false);
  };

  const DrapeauBadge = ({ code }: { code: string }) => {
    const c = toPaysCode(code);
    const cfg = PAYS_MAP[c] || { code: c || "?", label: c || "?", bg: "#6B7280" };
    return <span style={{ background: cfg.bg, color: "white", padding: "2px 7px", borderRadius: 6, fontSize: 11, fontWeight: 800 }}>{(cfg as any).code || c}</span>;
  };

  const SourceBadge = ({ src }: { src: string }) => {
    const config: any = {
      mb:  { label: "MB",  bg: "#EEF2FF", color: "#6366F1" },
      crl: { label: "CRL", bg: "#FEF3C7", color: "#D97706" },
      crc: { label: "CRC", bg: "#FCE7F3", color: "#DB2777" },
    };
    const cfg = config[src] || { label: src?.toUpperCase() || "—", bg: "#F3F4F6", color: "#6B7280" };
    return <span style={{ background: cfg.bg, color: cfg.color, padding: "3px 8px", borderRadius: 12, fontSize: 11, fontWeight: 700 }}>{cfg.label}</span>;
  };

  const getRoleColor = (r: string) => ({ "CRC": "#DBEAFE", "CRL": "#F3E8FF", "Livreur": "#DCFCE7" }[r] || "#F3F4F6");
  const getRoleText  = (r: string) => ({ "CRC": "#1D4ED8", "CRL": "#6D28D9", "Livreur": "#166534" }[r] || "#374151");

  const getStatutColor = (statut: string) => ({
    "Nouveau": "#3B82F6", "En appel": "#F59E0B", "Confirmé": "#10B981",
    "Annulé": "#EF4444", "Assignée": "#6366F1", "En cours": "#8B5CF6",
    "Livré": "#064E3B", "Retour": "#F97316", "Refusé": "#DC2626",
    "Non confirmé": "#F97316", "Injoignable": "#F59E0B", "Pas de réponse": "#F59E0B",
  }[statut] || "#6B7280");

  const sourceLabel = (s: string) => ({ mb: "MB", crl: "CRL", crc: "CRC" }[s] || s?.toUpperCase() || "—");

  const timeAgo = (date: string) => {
    if (!date) return "—";
    const diff = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (diff < 60) return `${diff}s`;
    if (diff < 3600) return `${Math.floor(diff / 60)}min`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}j`;
    return `${Math.floor(diff / 604800)}sem`;
  };

  const generateTrackingNumber = () => {
    const d = new Date();
    return `TRK-${d.getFullYear()}${String(d.getMonth()+1).padStart(2,"0")}${String(d.getDate()).padStart(2,"0")}-${Math.floor(1000+Math.random()*9000)}`;
  };

  const parseRow = (row: any) => {
    const get = (keys: string[]) => {
      for (const k of keys) {
        const found = Object.keys(row).find(rk => rk?.toLowerCase().replace(/[\s_-]/g,"").includes(k.toLowerCase().replace(/[\s_-]/g,"")));
        if (found && row[found] !== undefined && row[found] !== "") return String(row[found]).trim();
      }
      return "";
    };
    const rawCountry = get(["country","pays","marche","marché","market"]);
    const marche = toPaysCode(rawCountry) || "MA";
    const metaId = get(["id","lead_id","leadid"]);
    const qte = Number(get(["quantite","qty","qté","quantity"])) || 1;
    const prixUnit = Number(get(["prix_unitaire","prix","price","pu"])) || 0;
    return {
      tracking_number: metaId ? `META-${metaId}` : generateTrackingNumber(),
      nom_client: get(["full_name","fullname","nom_client","nom","name","client","prénom","prenom"]),
      telephone:  get(["phone_number","phonenumber","telephone","tel","phone","mobile","gsm","numéro","numero"]),
      produit:    get(["produit","product","article","item"]),
      quantite: qte, prix_unitaire: prixUnit, prix_total: qte*prixUnit, prix: qte*prixUnit,
      ville:   get(["city","ville","wilaya","region","cité","cite"]),
      marche,
      source:  get(["ad_name","adname"]) || get(["campaign_name","campaignname","campagne","campaign"]) || get(["source","utm","ad"]) || "",
      statut: "Nouveau", m_b: "Media Buyer", source_creation: "mb",
    };
  };

  const handleFile = async (file: File) => {
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext === "csv") await handleCSV(file);
    else if (ext === "xlsx" || ext === "xls") await handleExcel(file);
    else alert("Format non supporté.");
  };

  const handleCSV = async (file: File) => {
    setImporting(true);
    try {
      const text = await file.text();
      const sep = text.includes(";") ? ";" : ",";
      const lines = text.trim().split(/\r?\n/);
      const headers = lines[0].split(sep).map(h => h.trim().replace(/^"|"$/g,""));
      const leadsToInsert = lines.slice(1).map(row => {
        const values = row.split(sep).map(v => v.trim().replace(/^"|"$/g,""));
        const obj: any = {};
        headers.forEach((h,i) => { obj[h] = values[i]||""; });
        return parseRow(obj);
      }).filter(l => l.nom_client && l.telephone);
      await insertLeads(leadsToInsert, file.name);
    } catch (e: any) { alert("Erreur CSV : " + e.message); }
    setImporting(false);
  };

  const handleExcel = async (file: File) => {
    setImporting(true);
    try {
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer, { type: "array" });
      const jsonData: any[] = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: "" });
      await insertLeads(jsonData.map(row => parseRow(row)).filter(l => l.nom_client && l.telephone), file.name);
    } catch (e: any) { alert("Erreur Excel : " + e.message); }
    setImporting(false);
  };

  const insertLeads = async (leadsToInsert: any[], filename: string) => {
    if (leadsToInsert.length === 0) { alert("Aucun lead valide trouvé."); return; }
    const { error } = await supabase.from("Leads").insert(leadsToInsert);
    if (!error) { alert(`✅ ${leadsToInsert.length} leads importés depuis "${filename}" !`); fetchData(); changeTab("leads"); }
    else alert("Erreur Supabase : " + error.message);
  };

  const exportLivres = () => {
    const livres = filteredLeads.filter(l => l.statut === "Livré");
    if (livres.length === 0) { alert("Aucun lead livré dans la sélection actuelle."); return; }
    const rows = livres.map(l => ({
      "Tracking N°": l.tracking_number || "", "Source": sourceLabel(l.source_creation),
      "Client": l.nom_client || "", "Téléphone": l.telephone || "", "Produit": l.produit || "",
      "Qté": l.quantite||1, "Prix unit.": l.prix_unitaire||0, "Total": l.prix_total||l.prix||0,
      "Pays": nomPays(l.marche), "Ville": l.ville||"", "Statut": l.statut||"",
      "Date création": new Date(l.created_at).toLocaleDateString("fr-FR"),
      "Date livraison": l.date_livraison ? new Date(l.date_livraison).toLocaleDateString("fr-FR") : "—",
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wbOut = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wbOut, ws, "Livrés");
    XLSX.writeFile(wbOut, `leads-livres-${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  const copierCommande = (lead: any) => {
    navigator.clipboard.writeText(
      `Tracking: ${lead.tracking_number||"—"}\nSource: ${sourceLabel(lead.source_creation)}\nClient: ${lead.nom_client}\nTéléphone: ${lead.telephone}\nProduit: ${lead.produit} x${lead.quantite}\nTotal: ${lead.prix_total||lead.prix}\nPays: ${nomPays(lead.marche)}\nVille: ${lead.ville}\nStatut: ${lead.statut}\nDate création: ${new Date(lead.created_at).toLocaleDateString("fr-FR")}\nDate livraison: ${lead.date_livraison ? new Date(lead.date_livraison).toLocaleDateString("fr-FR") : "—"}`
    ).then(() => alert("✅ Commande copiée !"));
  };

  const getDispo = (s: any) => Math.max(0, s.stock_total - s.stock_reserve - s.stock_livre + s.stock_retour);
  const alertesStock = stocks.filter(s => getDispo(s) < s.seuil_alerte);

  const filteredLeads = useMemo(() => leads.filter(l => {
    if (filterSource !== "Tous") {
      if (filterSource === "MB"  && l.source_creation !== "mb")  return false;
      if (filterSource === "CRL" && l.source_creation !== "crl") return false;
      if (filterSource === "CRC" && l.source_creation !== "crc") return false;
    }
    if (filterMarche  !== "Tous" && toPaysCode(l.marche) !== filterMarche) return false;
    if (filterStatut  !== "Tous" && l.statut !== filterStatut)              return false;
    if (filterProduit !== "Tous" && l.produit !== filterProduit)            return false;
    if (filterDateDebut && new Date(l.created_at) < new Date(filterDateDebut)) return false;
    if (filterDateFin  && new Date(l.created_at) > new Date(filterDateFin+"T23:59:59")) return false;
    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      if (![l.nom_client, l.telephone, l.produit, l.tracking_number, l.ville].some(v => v?.toLowerCase().includes(s))) return false;
    }
    return true;
  }), [leads, filterSource, filterMarche, filterStatut, filterProduit, filterDateDebut, filterDateFin, searchTerm]);

  const statutsDisponibles  = useMemo(() => ["Tous", ...Array.from(new Set(filteredLeads.map(l => l.statut).filter(Boolean)))], [filteredLeads]);
  const paysDisponibles     = useMemo(() => ["Tous", ...Array.from(new Set(leads.map(l => toPaysCode(l.marche)).filter(Boolean)))], [leads]);
  const produitsDisponibles = useMemo(() => ["Tous", ...Array.from(new Set(leads.map(l => l.produit).filter(Boolean)))], [leads]);

  const stocksFiltres = useMemo(() => stocks.filter(s => {
    const dispo = getDispo(s);
    if (filterStock  === "Rupture"    && dispo !== 0)                             return false;
    if (filterStock  === "Faible"     && !(dispo > 0 && dispo < s.seuil_alerte)) return false;
    if (filterStock  === "Disponible" && !(dispo >= s.seuil_alerte))              return false;
    if (filterMarche !== "Tous"       && toPaysCode(s.marche) !== filterMarche)   return false;
    return true;
  }), [stocks, filterStock, filterMarche]);

  const kpiTotal     = filteredLeads.length;
  const kpiConfirmes = filteredLeads.filter(l => l.statut === "Confirmé").length;
  const kpiLivres    = filteredLeads.filter(l => l.statut === "Livré").length;
  const kpiAnnules   = filteredLeads.filter(l => l.statut === "Annulé").length;
  const kpiTauxLiv   = kpiTotal ? Math.round(kpiLivres/kpiTotal*100)+"%" : "0%";
  const hasFiltre    = searchTerm || filterStatut !== "Tous" || filterMarche !== "Tous" || filterDateDebut || filterDateFin || filterSource !== "Tous" || filterProduit !== "Tous";
  const resetFiltres = () => { setSearchTerm(""); setFilterStatut("Tous"); setFilterMarche("Tous"); setFilterSource("Tous"); setFilterProduit("Tous"); setFilterDateDebut(""); setFilterDateFin(""); };

  const initiales = currentProfile?.nom
    ? currentProfile.nom.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0,2)
    : currentUser?.email?.[0]?.toUpperCase() || "MB";

  const inputStyle: any  = { padding: "8px 12px", border: "1.5px solid #E5E7EB", borderRadius: 8, fontSize: 13, outline: "none", background: "white" };
  const selectStyle: any = { ...inputStyle, cursor: "pointer" };

  // ✅ Composant historique réutilisable
  const HistoriqueList = ({ items, loading }: { items: any[], loading?: boolean }) => {
    if (loading) return <div style={{ fontSize: 12, color: "#9CA3AF", padding: "8px 0" }}>Chargement...</div>;
    if (items.length === 0) return <div style={{ fontSize: 12, color: "#9CA3AF", padding: "8px 0" }}>Aucun historique</div>;
    return (
      <>
        {items.map((h, idx) => (
          <div key={idx} style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 10 }}>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#6366F1", marginTop: 5, flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: "#1E3A5F" }}>{h.action}</span>
                {h.ancien_statut && h.nouveau_statut && h.ancien_statut !== h.nouveau_statut && (
                  <span style={{ fontSize: 11, color: "#6B7280", display: "flex", alignItems: "center", gap: 4 }}>
                    <span style={{ background: `${getStatutColor(h.ancien_statut)}20`, color: getStatutColor(h.ancien_statut), padding: "1px 6px", borderRadius: 4, fontWeight: 600 }}>{h.ancien_statut}</span>
                    <span>→</span>
                    <span style={{ background: `${getStatutColor(h.nouveau_statut)}20`, color: getStatutColor(h.nouveau_statut), padding: "1px 6px", borderRadius: 4, fontWeight: 600 }}>{h.nouveau_statut}</span>
                  </span>
                )}
                {h.agent_role && (
                  <span style={{ background: getRoleColor(h.agent_role), color: getRoleText(h.agent_role), padding: "1px 6px", borderRadius: 4, fontSize: 10, fontWeight: 700 }}>{h.agent_role}</span>
                )}
                <span style={{ fontSize: 10, color: "#9CA3AF" }}>{h.agent_nom} • {new Date(h.created_at).toLocaleString("fr-FR")}</span>
              </div>
              {h.commentaire && <div style={{ fontSize: 11, color: "#6B7280", marginTop: 3, fontStyle: "italic" }}>{h.commentaire}</div>}
            </div>
          </div>
        ))}
      </>
    );
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#F0F4F8" }}>
      <Sidebar role="media_buyer" />
      <div style={{ marginLeft: 240, flex: 1, display: "flex", flexDirection: "column" }}>

        {/* ── TOPBAR ── */}
        <div style={{ position: "sticky", top: 0, zIndex: 50, background: "white", borderBottom: "1px solid #E5E7EB", padding: "0 32px", height: 56, display: "flex", alignItems: "center", gap: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 12, color: "#6B7280", fontWeight: 600 }}>MB</span>
            <span style={{ fontSize: 12, color: "#D1D5DB" }}>—</span>
            <span style={{ fontSize: 12, color: "#9CA3AF" }}>{currentProfile?.nom || currentUser?.email?.split("@")[0] || "—"}</span>
          </div>
          <div style={{ flex: 1, maxWidth: 480 }}>
            <div style={{ display: "flex", alignItems: "center", background: "#F9FAFB", border: "1.5px solid #E5E7EB", borderRadius: 8, padding: "6px 12px", gap: 8 }}>
              <span style={{ fontSize: 14, color: "#9CA3AF" }}>🔍</span>
              <input placeholder="Rechercher un client, téléphone, produit, tracking..." value={searchTerm}
                onChange={e => { setSearchTerm(e.target.value); if (tab !== "leads") changeTab("leads"); }}
                style={{ flex: 1, border: "none", outline: "none", fontSize: 13, background: "transparent", color: "#111827" }} />
              {searchTerm && <button onClick={() => setSearchTerm("")} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, color: "#9CA3AF" }}>✕</button>}
            </div>
          </div>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#F0F9FF", borderRadius: 8, padding: "5px 10px" }}>
              <span style={{ fontSize: 12 }}>⏱</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#1D4ED8", fontFamily: "monospace" }}>Session {formatSession(sessionSeconds)}</span>
            </div>
            <div style={{ position: "relative", cursor: "pointer" }} title={alertesStock.length > 0 ? `${alertesStock.length} alerte(s) stock` : "Aucune alerte"}>
              <span style={{ fontSize: 20 }}>🔔</span>
              {alertesStock.length > 0 && (
                <span style={{ position: "absolute", top: -4, right: -4, background: "#EF4444", color: "white", borderRadius: "50%", width: 16, height: 16, fontSize: 9, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center" }}>{alertesStock.length}</span>
              )}
            </div>
            <div style={{ position: "relative" }}>
              <button onClick={() => setShowProfil(!showProfil)} style={{ width: 34, height: 34, borderRadius: "50%", background: "linear-gradient(135deg, #6366F1, #8B5CF6)", color: "white", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {initiales}
              </button>
              {showProfil && (
                <div style={{ position: "absolute", right: 0, top: 42, background: "white", borderRadius: 12, padding: 16, width: 220, boxShadow: "0 8px 32px rgba(0,0,0,0.15)", border: "1px solid #E5E7EB", zIndex: 100 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "#1E3A5F", marginBottom: 4 }}>{currentProfile?.nom || "Media Buyer"}</div>
                  <div style={{ fontSize: 12, color: "#9CA3AF", marginBottom: 12 }}>{currentUser?.email}</div>
                  <div style={{ fontSize: 11, marginBottom: 16 }}><span style={{ background: "#EEF2FF", color: "#6366F1", padding: "2px 8px", borderRadius: 6, fontWeight: 700 }}>📊 Media Buyer</span></div>
                  <button onClick={async () => { await supabase.auth.signOut(); window.location.href = "/"; }} style={{ width: "100%", padding: "8px", background: "#FEF2F2", color: "#EF4444", border: "1px solid #FEE2E2", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 12 }}>
                    🚪 Se déconnecter
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── CONTENU ── */}
        <div style={{ flex: 1, padding: 32 }}>

          {alertesStock.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              {alertesStock.map(s => {
                const dispo = getDispo(s);
                const isRupture = dispo === 0;
                return (
                  <div key={s.id} style={{ background: isRupture ? "#FEF2F2" : "#FFFBEB", border: `1px solid ${isRupture ? "#EF4444" : "#F59E0B"}`, borderRadius: 10, padding: "12px 20px", marginBottom: 8, fontSize: 13, fontWeight: 600, color: isRupture ? "#EF4444" : "#F59E0B" }}>
                    {isRupture ? "🔴" : "⚠️"} {isRupture ? "RUPTURE" : "STOCK FAIBLE"} : {s.produit} ({nomPays(s.marche)}) — {dispo} restants
                  </div>
                );
              })}
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: "#1E3A5F" }}>Mes Leads</h1>
            <div style={{ display: "flex", gap: 8 }}>
              {[
                { id: "leads", label: `📋 Mes Leads (${leads.length})`, color: "#1E3A5F" },
                { id: "csv",   label: "📂 Importer fichier",             color: "#F59E0B" },
                { id: "stock", label: "📦 Stock",                        color: "#8B5CF6" },
                { id: "sku",   label: "🏷️ SKU",                          color: "#0EA5E9" },
              ].map(t => (
                <button key={t.id} onClick={() => changeTab(t.id)} style={{ padding: "10px 20px", borderRadius: 8, border: "none", cursor: "pointer", fontWeight: 600, fontSize: 13, background: tab === t.id ? t.color : "white", color: tab === t.id ? "white" : "#374151", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 16, marginBottom: 24 }}>
            {[
              { label: "Total leads",       value: kpiTotal,     color: "#3B82F6" },
              { label: "Confirmés",         value: kpiConfirmes, color: "#10B981" },
              { label: "Livrés",            value: kpiLivres,    color: "#064E3B" },
              { label: "Annulés",           value: kpiAnnules,   color: "#EF4444" },
              { label: "Taux de livraison", value: kpiTauxLiv,   color: "#F59E0B" },
            ].map(s => (
              <div key={s.label} style={{ background: "white", borderRadius: 12, padding: "20px", boxShadow: "0 1px 4px rgba(0,0,0,0.08)", borderTop: `3px solid ${s.color}` }}>
                <div style={{ fontSize: 28, fontWeight: 800, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: 13, color: "#6B7280", marginTop: 4 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* ════ LEADS ════ */}
          {tab === "leads" && (
            <div style={{ background: "white", borderRadius: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.08)", overflow: "hidden" }}>
              <div style={{ padding: "16px 24px", borderBottom: "1px solid #E5E7EB" }}>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginBottom: 10 }}>
                  <select value={filterSource} onChange={e => setFilterSource(e.target.value)} style={selectStyle}>
                    <option value="Tous">🌐 Toutes sources</option>
                    <option value="MB">MB</option><option value="CRL">CRL</option><option value="CRC">CRC</option>
                  </select>
                  <select value={filterStatut} onChange={e => setFilterStatut(e.target.value)} style={selectStyle}>
                    {statutsDisponibles.map(s => <option key={s} value={s}>{s === "Tous" ? "📊 Tous statuts" : s}</option>)}
                  </select>
                  <select value={filterMarche} onChange={e => setFilterMarche(e.target.value)} style={selectStyle}>
                    <option value="Tous">🌍 Tous pays</option>
                    {paysDisponibles.filter(p => p !== "Tous").map(code => (
                      <option key={code} value={code}>{code} — {PAYS_MAP[code]?.label || code}</option>
                    ))}
                  </select>
                  <select value={filterProduit} onChange={e => setFilterProduit(e.target.value)} style={selectStyle}>
                    {produitsDisponibles.map(p => <option key={p} value={p}>{p === "Tous" ? "📦 Tous produits" : p}</option>)}
                  </select>
                  {hasFiltre && <button onClick={resetFiltres} style={{ padding: "8px 12px", background: "#F3F4F6", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 12, color: "#374151", fontWeight: 600 }}>🔄 Reset</button>}
                  <button onClick={exportLivres} style={{ marginLeft: "auto", padding: "8px 16px", background: "#064E3B", color: "white", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 600, whiteSpace: "nowrap" }}>⬇️ Exporter livrés (.xlsx)</button>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 12, color: "#6B7280", fontWeight: 600 }}>Date création :</span>
                  <span style={{ fontSize: 12, color: "#6B7280" }}>Du</span>
                  <input type="date" value={filterDateDebut} onChange={e => setFilterDateDebut(e.target.value)} style={{ ...inputStyle, fontSize: 12 }} />
                  <span style={{ fontSize: 12, color: "#6B7280" }}>au</span>
                  <input type="date" value={filterDateFin} onChange={e => setFilterDateFin(e.target.value)} style={{ ...inputStyle, fontSize: 12 }} />
                </div>
              </div>

              {filteredLeads.length === 0 ? (
                <div style={{ textAlign: "center", padding: "48px 0", color: "#9CA3AF" }}><div style={{ fontSize: 48, marginBottom: 12 }}>📋</div><div>Aucun lead trouvé</div></div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ background: "#F9FAFB" }}>
                        {/* ✅ Colonne expand ajoutée */}
                        {["","Tracking N°","Source","Client","Téléphone","Produit","Qté","Prix unit.","Total","Pays","Ville","Source pub","Statut","Date création","Date livraison"].map(h => (
                          <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, color: "#6B7280", fontWeight: 600, borderBottom: "1px solid #E5E7EB", whiteSpace: "nowrap" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredLeads.map((lead, i) => (
                        <>
                          <tr key={lead.id} style={{ background: expandedRow === lead.id ? "#F5F3FF" : i % 2 ? "#FAFAFA" : "white", borderBottom: expandedRow === lead.id ? "none" : "1px solid #F3F4F6" }}>
                            {/* ✅ Bouton expand */}
                            <td style={{ padding: "8px 6px", textAlign: "center", width: 32 }}>
                              <button onClick={() => toggleRow(lead.id)}
                                style={{ width: 22, height: 22, background: expandedRow === lead.id ? "#EDE9FE" : "#F3F4F6", border: "none", borderRadius: 4, cursor: "pointer", fontSize: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                {expandedRow === lead.id ? "▼" : "▶"}
                              </button>
                            </td>
                            <td style={{ padding: "10px 16px", verticalAlign: "top" }}>
                              <div style={{ fontWeight: 700, fontSize: 12, color: "#6366F1", whiteSpace: "nowrap", marginBottom: 6 }}>{lead.tracking_number || "—"}</div>
                              <div style={{ display: "flex", gap: 4 }}>
                                {/* ✅ Bouton détail appelle openDetail au lieu de setDetailLead */}
                                <button title="Voir le détail" onClick={() => openDetail(lead)} style={{ width: 26, height: 26, borderRadius: 6, border: "1px solid #E5E7EB", background: "#EFF6FF", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13 }}>🔍</button>
                                <button title="Copier" onClick={() => copierCommande(lead)} style={{ width: 26, height: 26, borderRadius: 6, border: "1px solid #E5E7EB", background: "#F0FDF4", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13 }}>📋</button>
                              </div>
                            </td>
                            <td style={{ padding: "10px 16px" }}><SourceBadge src={lead.source_creation} /></td>
                            <td style={{ padding: "10px 16px", fontWeight: 600, fontSize: 13 }}>{lead.nom_client}</td>
                            <td style={{ padding: "10px 16px", fontSize: 13 }}>{lead.telephone}</td>
                            <td style={{ padding: "10px 16px", fontSize: 13 }}>{lead.produit}</td>
                            <td style={{ padding: "10px 16px", fontSize: 13, textAlign: "center" }}>{lead.quantite}</td>
                            <td style={{ padding: "10px 16px", fontSize: 13 }}>{lead.prix_unitaire}</td>
                            <td style={{ padding: "10px 16px", fontSize: 13, fontWeight: 700, color: "#1E3A5F" }}>{lead.prix_total || lead.prix}</td>
                            <td style={{ padding: "10px 16px" }}>
                              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                                <DrapeauBadge code={lead.marche} />
                                <span style={{ fontSize: 10, color: "#6B7280" }}>{nomPays(lead.marche)}</span>
                              </div>
                            </td>
                            <td style={{ padding: "10px 16px", fontSize: 13 }}>{lead.ville}</td>
                            <td style={{ padding: "10px 16px", fontSize: 12, color: "#6B7280" }}>{lead.source}</td>
                            <td style={{ padding: "10px 16px" }}>
                              <span style={{ background: `${getStatutColor(lead.statut)}20`, color: getStatutColor(lead.statut), padding: "4px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600 }}>{lead.statut}</span>
                            </td>
                            <td style={{ padding: "10px 16px", fontSize: 12, color: "#9CA3AF", whiteSpace: "nowrap" }}>{new Date(lead.created_at).toLocaleDateString("fr-FR")}</td>
                            <td style={{ padding: "10px 16px", fontSize: 12, whiteSpace: "nowrap", fontWeight: lead.date_livraison ? 600 : 400, color: lead.date_livraison ? "#10B981" : "#9CA3AF" }}>
                              {lead.date_livraison ? new Date(lead.date_livraison).toLocaleDateString("fr-FR") : "—"}
                            </td>
                          </tr>

                          {/* ✅ Ligne historique expandable */}
                          {expandedRow === lead.id && (
                            <tr key={`hist-${lead.id}`}>
                              <td colSpan={15} style={{ padding: "0 16px 16px 48px", background: "#F5F3FF", borderBottom: "1px solid #DDD6FE" }}>
                                <div style={{ borderLeft: "3px solid #6366F1", paddingLeft: 16, paddingTop: 14 }}>
                                  <div style={{ fontSize: 12, fontWeight: 700, color: "#6366F1", marginBottom: 12 }}>📋 Historique</div>
                                  <HistoriqueList items={historiques[lead.id] || []} loading={!historiques[lead.id]} />
                                </div>
                              </td>
                            </tr>
                          )}
                        </>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ✅ Modal détail AVEC historique */}
          {detailLead && (
            <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setDetailLead(null)}>
              <div style={{ background: "white", borderRadius: 16, padding: 32, width: 560, boxShadow: "0 20px 60px rgba(0,0,0,0.2)", maxHeight: "90vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                  <h2 style={{ margin: 0, fontSize: 17, color: "#1E3A5F", fontWeight: 800 }}>🔍 Détail de la commande</h2>
                  <button onClick={() => setDetailLead(null)} style={{ background: "#F3F4F6", border: "none", borderRadius: 8, width: 32, height: 32, cursor: "pointer", fontSize: 16, fontWeight: 700 }}>×</button>
                </div>

                {/* Infos lead */}
                {[
                  ["Tracking N°",    detailLead.tracking_number||"—"],
                  ["Source",         sourceLabel(detailLead.source_creation)],
                  ["Client",         detailLead.nom_client],
                  ["Téléphone",      detailLead.telephone],
                  ["Produit",        detailLead.produit],
                  ["Quantité",       detailLead.quantite],
                  ["Prix unitaire",  detailLead.prix_unitaire],
                  ["Total",          detailLead.prix_total||detailLead.prix],
                  ["Pays",           `${toPaysCode(detailLead.marche)} — ${nomPays(detailLead.marche)}`],
                  ["Ville",          detailLead.ville],
                  ["Source pub",     detailLead.source||"—"],
                  ["Statut",         detailLead.statut],
                  ["Date création",  new Date(detailLead.created_at).toLocaleDateString("fr-FR")],
                  ["Date livraison", detailLead.date_livraison ? new Date(detailLead.date_livraison).toLocaleDateString("fr-FR") : "—"],
                  ["Notes",          detailLead.notes||"—"],
                ].map(([label, value]) => (
                  <div key={label as string} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #F3F4F6" }}>
                    <span style={{ fontSize: 13, color: "#6B7280", fontWeight: 600 }}>{label}</span>
                    <span style={{ fontSize: 13, fontWeight: label === "Statut" ? 700 : 400, color: label === "Statut" ? getStatutColor(value as string) : "#111827" }}>{value}</span>
                  </div>
                ))}

                {/* ✅ Historique dans la modal */}
                <div style={{ marginTop: 20, background: "#F5F3FF", borderRadius: 12, padding: 16 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#6366F1", marginBottom: 12 }}>📋 Historique</div>
                  <HistoriqueList items={detailHistorique} loading={loadingHistorique} />
                </div>

                <button onClick={() => setDetailLead(null)} style={{ marginTop: 20, width: "100%", padding: "11px", background: "#1E3A5F", color: "white", border: "none", borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: "pointer" }}>Fermer</button>
              </div>
            </div>
          )}

          {/* ════ IMPORTER ════ */}
          {tab === "csv" && (
            <div style={{ background: "white", borderRadius: 16, padding: 28, boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
              <h2 style={{ margin: "0 0 24px", fontSize: 16, color: "#1E3A5F" }}>📂 Importer des leads</h2>
              <div style={{ border: `2px dashed ${dragOver ? "#6366F1" : "#D1D5DB"}`, borderRadius: 12, padding: "52px 24px", textAlign: "center", background: dragOver ? "#EEF2FF" : "#F9FAFB", transition: "all 0.2s" }}
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={e => { e.preventDefault(); setDragOver(false); const file = e.dataTransfer.files[0]; if (file) handleFile(file); }}>
                {importing ? (
                  <><div style={{ fontSize: 48, marginBottom: 12 }}>⏳</div><div style={{ fontSize: 15, fontWeight: 600, color: "#6366F1" }}>Import en cours…</div></>
                ) : (
                  <>
                    <div style={{ fontSize: 48, marginBottom: 16 }}>📂</div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: "#374151", marginBottom: 20 }}>Glisser-déposer votre fichier ici</div>
                    <label style={{ cursor: "pointer" }}>
                      <input type="file" accept=".csv,.xlsx,.xls" style={{ display: "none" }} onChange={e => { const file = e.target.files?.[0]; if (file) handleFile(file); (e.target as HTMLInputElement).value = ""; }} />
                      <span style={{ display: "inline-block", padding: "11px 28px", background: "#6366F1", color: "white", borderRadius: 8, fontWeight: 600, fontSize: 13 }}>📁 Choisir un fichier</span>
                    </label>
                  </>
                )}
              </div>
            </div>
          )}

          {/* ════ STOCK ════ */}
          {tab === "stock" && (
            <div style={{ background: "white", borderRadius: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.08)", overflow: "hidden" }}>
              <div style={{ padding: "20px 24px", borderBottom: "1px solid #E5E7EB", display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                <h2 style={{ margin: 0, fontSize: 16, color: "#1E3A5F", flex: 1 }}>📦 Stock disponible</h2>
                <select value={filterMarche} onChange={e => setFilterMarche(e.target.value)} style={selectStyle}>
                  <option value="Tous">🌍 Tous pays</option>
                  {PAYS.map(p => <option key={p.code} value={p.code}>{p.code} — {p.label}</option>)}
                </select>
                <select value={filterStock} onChange={e => setFilterStock(e.target.value)} style={selectStyle}>
                  <option value="Tous">📦 Tous</option>
                  <option value="Disponible">✅ Disponible</option>
                  <option value="Faible">⚠️ Stock faible</option>
                  <option value="Rupture">🔴 Rupture</option>
                </select>
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#F9FAFB" }}>
                    {["Produit","Pays","Disponible","Statut","Action recommandée"].map(h => (
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
                    const isFaible  = dispo > 0 && dispo < s.seuil_alerte;
                    return (
                      <tr key={s.id} style={{ background: i%2 ? "#FAFAFA" : "white", borderBottom: "1px solid #F3F4F6" }}>
                        <td style={{ padding: "12px 16px", fontWeight: 600, fontSize: 13 }}>{s.produit}</td>
                        <td style={{ padding: "12px 16px" }}>
                          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                            <DrapeauBadge code={s.marche} />
                            <span style={{ fontSize: 10, color: "#6B7280" }}>{nomPays(s.marche)}</span>
                          </div>
                        </td>
                        <td style={{ padding: "12px 16px", textAlign: "center" }}><span style={{ fontWeight: 800, fontSize: 16, color: isRupture ? "#EF4444" : isFaible ? "#F59E0B" : "#10B981" }}>{dispo}</span></td>
                        <td style={{ padding: "12px 16px" }}>
                          <span style={{ background: isRupture ? "#FEF2F2" : isFaible ? "#FFFBEB" : "#ECFDF5", color: isRupture ? "#EF4444" : isFaible ? "#F59E0B" : "#10B981", padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600 }}>
                            {isRupture ? "🔴 Rupture" : isFaible ? "⚠️ Faible" : "✅ OK"}
                          </span>
                        </td>
                        <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 600, color: isRupture ? "#EF4444" : isFaible ? "#F59E0B" : "#10B981" }}>
                          {isRupture ? "❌ Ne pas lancer" : isFaible ? "⚠️ Lancer avec prudence" : "✅ Lancer la campagne"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* ════ SKU ════ */}
          {tab === "sku" && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#1E3A5F" }}>🏷️ Catalogue produits (SKU)</h2>
              </div>
              {produits.length === 0 ? (
                <div style={{ background: "white", borderRadius: 16, padding: 48, textAlign: "center", color: "#9CA3AF", boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>🏷️</div>
                  <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>Aucun produit dans le catalogue</div>
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 20 }}>
                  {produits.map(p => (
                    <div key={p.id} style={{ background: "white", borderRadius: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.08)", overflow: "hidden" }}>
                      <div style={{ width: "100%", height: 180, background: "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                        {p.photo_url ? <img src={p.photo_url} alt={p.nom} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontSize: 48 }}>📦</span>}
                      </div>
                      <div style={{ padding: 16 }}>
                        <div style={{ fontWeight: 700, fontSize: 14, color: "#1E3A5F", marginBottom: 4 }}>{p.nom}</div>
                        {p.marche && (
                          <div style={{ marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
                            <DrapeauBadge code={p.marche} />
                            <span style={{ fontSize: 12, color: "#6B7280" }}>{nomPays(p.marche)}</span>
                          </div>
                        )}
                        {p.description && <div style={{ fontSize: 12, color: "#9CA3AF", marginBottom: 8, lineHeight: 1.4 }}>{p.description}</div>}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
                          <div style={{ fontSize: 18, fontWeight: 800, color: "#10B981" }}>{p.prix_unitaire ? p.prix_unitaire.toLocaleString("fr-FR") : "—"}</div>
                          <span style={{ fontSize: 11, background: "#ECFDF5", color: "#10B981", padding: "3px 8px", borderRadius: 12, fontWeight: 600 }}>Prix unitaire</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

export default withAuth(MediaBuyer, "media_buyer");