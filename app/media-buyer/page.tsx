"use client";
import { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import { supabase } from "../../lib/supabase";
import Sidebar from "../components/Sidebar";
import withAuth from "../components/withAuth";

function MediaBuyer() {
  const [tab, setTab] = useState("leads");
  const [leads, setLeads] = useState<any[]>([]);
  const [stocks, setStocks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [success, setSuccess] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [form, setForm] = useState({
    nom_client: "", telephone: "", produit: "",
    quantite: "", prix_unitaire: "", ville: "", marche: "DZ", source: "",
  });

  const fetchLeads = async () => {
    const { data } = await supabase.from("Leads").select("*").order("created_at", { ascending: false });
    if (data) setLeads(data);
  };

  const fetchStock = async () => {
    const { data } = await supabase.from("Stocks").select("*").order("created_at", { ascending: false });
    if (data) setStocks(data);
  };

  useEffect(() => { fetchLeads(); fetchStock(); }, []);

  const getStatutColor = (statut: string) => {
    const colors: any = {
      "Nouveau": "#3B82F6", "En appel": "#F59E0B",
      "Confirmé": "#10B981", "Annulé": "#EF4444",
      "En cours": "#8B5CF6", "Livré": "#064E3B",
    };
    return colors[statut] || "#6B7280";
  };

  // Génère un tracking number unique : TRK-YYYYMMDD-XXXX
  const generateTrackingNumber = () => {
    const date = new Date();
    const dateStr = date.getFullYear().toString() +
      String(date.getMonth() + 1).padStart(2, "0") +
      String(date.getDate()).padStart(2, "0");
    const random = Math.floor(1000 + Math.random() * 9000);
    return `TRK-${dateStr}-${random}`;
  };

  const handleSubmit = async () => {
    if (!form.nom_client || !form.telephone || !form.produit) {
      alert("Remplis au moins le nom, téléphone et produit !");
      return;
    }
    setLoading(true);
    const qte = Number(form.quantite) || 1;
    const pu = Number(form.prix_unitaire) || 0;
    const { error } = await supabase.from("Leads").insert([{
      tracking_number: generateTrackingNumber(),
      nom_client: form.nom_client,
      telephone: form.telephone,
      produit: form.produit,
      quantite: qte,
      prix_unitaire: pu,
      ville: form.ville,
      marche: form.marche,
      source: form.source,
      statut: "Nouveau",
      m_b: "Media Buyer",
    }]);
    if (!error) {
      setSuccess("✅ Lead ajouté avec succès !");
      setForm({ nom_client: "", telephone: "", produit: "", quantite: "", prix_unitaire: "", ville: "", marche: "DZ", source: "" });
      fetchLeads();
      setTimeout(() => setSuccess(""), 3000);
    } else {
      alert("Erreur: " + error.message);
    }
    setLoading(false);
  };

  const parseRow = (row: any) => {
    const get = (keys: string[]) => {
      for (const k of keys) {
        const found = Object.keys(row).find(rk =>
          rk?.toLowerCase().replace(/[\s_-]/g, "").includes(k.toLowerCase().replace(/[\s_-]/g, ""))
        );
        if (found && row[found] !== undefined && row[found] !== "") return String(row[found]).trim();
      }
      return "";
    };

    const rawCountry = get(["country", "pays", "marche", "marché", "market"]);
    const marcheMap: any = {
      "algeria": "DZ", "algérie": "DZ", "algerie": "DZ", "dz": "DZ",
      "morocco": "MA", "maroc": "MA", "ma": "MA",
      "tunisia": "TN", "tunisie": "TN", "tn": "TN",
    };
    const marche = marcheMap[rawCountry.toLowerCase()] || rawCountry.toUpperCase() || "DZ";

    const source =
      get(["ad_name", "adname"]) ||
      get(["campaign_name", "campaignname", "campagne", "campaign"]) ||
      get(["adset_name", "adsetname"]) ||
      get(["source", "utm", "ad"]) || "";

    // Récupère l'ID Meta s'il existe, sinon génère un tracking number
    const metaId = get(["id", "lead_id", "leadid"]);

    return {
      tracking_number: metaId ? `META-${metaId}` : generateTrackingNumber(),
      nom_client:      get(["full_name", "fullname", "nom_client", "nom", "name", "client", "prénom", "prenom"]),
      telephone:       get(["phone_number", "phonenumber", "telephone", "tel", "phone", "mobile", "gsm", "numéro", "numero"]),
      produit:         get(["produit", "product", "article", "item"]),
      quantite:        Number(get(["quantite", "qty", "qté", "quantity"])) || 1,
      prix_unitaire:   Number(get(["prix_unitaire", "prix", "price", "pu"])) || 0,
      ville:           get(["city", "ville", "wilaya", "region", "cité", "cite"]),
      marche,
      source,
      statut:          "Nouveau",
      m_b:             "Media Buyer",
    };
  };

  const handleFile = async (file: File) => {
    if (!file) return;
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext === "csv") await handleCSV(file);
    else if (ext === "xlsx" || ext === "xls") await handleExcel(file);
    else alert("Format non supporté. Utilise un fichier .csv, .xlsx ou .xls");
  };

  const handleCSV = async (file: File) => {
    setImporting(true);
    try {
      const text = await file.text();
      const sep = text.includes(";") ? ";" : ",";
      const lines = text.trim().split(/\r?\n/);
      const headers = lines[0].split(sep).map(h => h.trim().replace(/^"|"$/g, ""));
      const leadsToInsert = lines.slice(1)
        .map(row => {
          const values = row.split(sep).map(v => v.trim().replace(/^"|"$/g, ""));
          const obj: any = {};
          headers.forEach((h, i) => { obj[h] = values[i] || ""; });
          return parseRow(obj);
        })
        .filter(l => l.nom_client && l.telephone);
      await insertLeads(leadsToInsert, file.name);
    } catch (e: any) {
      alert("Erreur lecture CSV : " + e.message);
    }
    setImporting(false);
  };

  const handleExcel = async (file: File) => {
    setImporting(true);
    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData: any[] = XLSX.utils.sheet_to_json(sheet, { defval: "" });
      const leadsToInsert = jsonData.map(row => parseRow(row)).filter(l => l.nom_client && l.telephone);
      await insertLeads(leadsToInsert, file.name);
    } catch (e: any) {
      alert("Erreur lecture Excel : " + e.message);
    }
    setImporting(false);
  };

  const insertLeads = async (leadsToInsert: any[], filename: string) => {
    if (leadsToInsert.length === 0) {
      alert("Aucun lead valide trouvé.\nVérifie que le fichier contient : full_name et phone_number (Meta) ou nom_client et telephone.");
      return;
    }
    const { error } = await supabase.from("Leads").insert(leadsToInsert);
    if (!error) {
      alert(`✅ ${leadsToInsert.length} leads importés depuis "${filename}" !`);
      fetchLeads();
      setTab("leads");
    } else {
      alert("Erreur Supabase : " + error.message);
    }
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#F0F4F8" }}>
      <Sidebar role="📊 Media Buyer" />
      <div style={{ marginLeft: 240, flex: 1, padding: 32 }}>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: "#1E3A5F" }}>Mes Leads</h1>
            <p style={{ margin: "4px 0 0", color: "#6B7280", fontSize: 14 }}>Gestion et upload des leads</p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {[
              { id: "leads",  label: `📋 Mes Leads (${leads.length})` },
              { id: "upload", label: "➕ Nouveau Lead" },
              { id: "csv",    label: "📂 Importer fichier" },
              { id: "stock",  label: "📦 Stock" },
            ].map((t) => (
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
            { label: "Total leads",  value: leads.length, color: "#3B82F6" },
            { label: "Confirmés",    value: leads.filter(l => l.statut === "Confirmé").length, color: "#10B981" },
            { label: "Annulés",      value: leads.filter(l => l.statut === "Annulé").length, color: "#EF4444" },
            { label: "Taux conf.",   value: leads.length ? Math.round(leads.filter(l => l.statut === "Confirmé").length / leads.length * 100) + "%" : "0%", color: "#F59E0B" },
          ].map(s => (
            <div key={s.label} style={{ background: "white", borderRadius: 12, padding: "16px 20px", boxShadow: "0 1px 4px rgba(0,0,0,0.08)", borderTop: `3px solid ${s.color}` }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 13, color: "#6B7280", marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {tab === "leads" && (
          <div style={{ background: "white", borderRadius: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.08)", overflow: "hidden" }}>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid #E5E7EB" }}>
              <h2 style={{ margin: 0, fontSize: 16, color: "#1E3A5F" }}>📋 Liste des leads</h2>
            </div>
            {leads.length === 0 ? (
              <div style={{ textAlign: "center", padding: "48px 0", color: "#9CA3AF" }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
                <div>Aucun lead pour le moment</div>
                <button onClick={() => setTab("upload")} style={{ marginTop: 16, padding: "10px 24px", background: "#1E3A5F", color: "white", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600 }}>
                  ➕ Ajouter un lead
                </button>
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "#F9FAFB" }}>
                      {["Tracking N°", "Client", "Téléphone", "Produit", "Qté", "Prix unit.", "Total", "Marché", "Ville", "Source", "Statut", "Date"].map(h => (
                        <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, color: "#6B7280", fontWeight: 600, borderBottom: "1px solid #E5E7EB", whiteSpace: "nowrap" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {leads.map((lead, i) => (
                      <tr key={lead.id} style={{ background: i % 2 ? "#FAFAFA" : "white", borderBottom: "1px solid #F3F4F6" }}>
                        <td style={{ padding: "12px 16px", fontSize: 12, fontWeight: 700, color: "#6366F1", whiteSpace: "nowrap" }}>
                          {lead.tracking_number || "—"}
                        </td>
                        <td style={{ padding: "12px 16px", fontWeight: 600, fontSize: 13 }}>{lead.nom_client}</td>
                        <td style={{ padding: "12px 16px", fontSize: 13 }}>{lead.telephone}</td>
                        <td style={{ padding: "12px 16px", fontSize: 13 }}>{lead.produit}</td>
                        <td style={{ padding: "12px 16px", fontSize: 13, textAlign: "center" }}>{lead.quantite}</td>
                        <td style={{ padding: "12px 16px", fontSize: 13 }}>{lead.prix_unitaire}</td>
                        <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 700, color: "#1E3A5F" }}>{(lead.prix_unitaire || 0) * (lead.quantite || 1)}</td>
                        <td style={{ padding: "12px 16px", fontSize: 13 }}>{lead.marche}</td>
                        <td style={{ padding: "12px 16px", fontSize: 13 }}>{lead.ville}</td>
                        <td style={{ padding: "12px 16px", fontSize: 12, color: "#6B7280" }}>{lead.source}</td>
                        <td style={{ padding: "12px 16px" }}>
                          <span style={{
                            background: `${getStatutColor(lead.statut)}20`,
                            color: getStatutColor(lead.statut),
                            padding: "4px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600
                          }}>{lead.statut}</span>
                        </td>
                        <td style={{ padding: "12px 16px", fontSize: 12, color: "#9CA3AF", whiteSpace: "nowrap" }}>
                          {new Date(lead.created_at).toLocaleDateString("fr-FR")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {tab === "upload" && (
          <div style={{ background: "white", borderRadius: 16, padding: 28, boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
            <h2 style={{ margin: "0 0 24px", fontSize: 16, color: "#1E3A5F" }}>➕ Nouveau Lead</h2>
            {success && (
              <div style={{ background: "#ECFDF5", border: "1px solid #10B981", borderRadius: 8, padding: "12px 16px", marginBottom: 20, color: "#10B981", fontWeight: 600 }}>
                {success}
              </div>
            )}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              {([
                ["Nom complet *",   "nom_client",    "text",   "Ex: Karim Benali"],
                ["Téléphone *",     "telephone",     "text",   "Ex: +213 555 0101"],
                ["Produit *",       "produit",       "text",   "Ex: Chaussures X3"],
                ["Quantité",        "quantite",      "number", "Ex: 2"],
                ["Prix unitaire",   "prix_unitaire", "number", "Ex: 1500"],
                ["Ville / Wilaya",  "ville",         "text",   "Ex: Oran"],
                ["Source campagne", "source",        "text",   "Ex: Facebook - Camp. Mai"],
              ] as [string, string, string, string][]).map(([label, key, type, placeholder]) => (
                <div key={key}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>{label}</label>
                  <input
                    type={type} placeholder={placeholder} value={(form as any)[key]}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    style={{ width: "100%", padding: "11px 14px", border: "1.5px solid #E5E7EB", borderRadius: 8, fontSize: 14, outline: "none", boxSizing: "border-box" }}
                  />
                </div>
              ))}
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Marché</label>
                <select value={form.marche} onChange={(e) => setForm({ ...form, marche: e.target.value })}
                  style={{ width: "100%", padding: "11px 14px", border: "1.5px solid #E5E7EB", borderRadius: 8, fontSize: 14, outline: "none", boxSizing: "border-box" }}>
                  <option value="DZ">🇩🇿 Algérie</option>
                  <option value="MA">🇲🇦 Maroc</option>
                  <option value="TN">🇹🇳 Tunisie</option>
                </select>
              </div>
            </div>
            {form.quantite && form.prix_unitaire && (
              <div style={{ marginTop: 16, background: "#EFF6FF", borderRadius: 10, padding: "12px 16px", fontSize: 14, color: "#1E3A5F", fontWeight: 600 }}>
                💰 Total : {Number(form.quantite) * Number(form.prix_unitaire)}
              </div>
            )}
            <div style={{ marginTop: 24, display: "flex", gap: 12 }}>
              <button onClick={handleSubmit} disabled={loading} style={{
                padding: "12px 32px", background: loading ? "#9CA3AF" : "#1E3A5F",
                color: "white", border: "none", borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: loading ? "not-allowed" : "pointer"
              }}>
                {loading ? "Ajout en cours..." : "➕ Ajouter le lead"}
              </button>
              <button onClick={() => setTab("leads")} style={{
                padding: "12px 24px", background: "#F3F4F6", color: "#374151", border: "none", borderRadius: 10, fontWeight: 600, fontSize: 14, cursor: "pointer"
              }}>Annuler</button>
            </div>
          </div>
        )}

        {tab === "csv" && (
          <div style={{ background: "white", borderRadius: 16, padding: 28, boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
            <h2 style={{ margin: "0 0 4px", fontSize: 16, color: "#1E3A5F" }}>📂 Importer des leads</h2>
            <p style={{ margin: "0 0 8px", fontSize: 13, color: "#6B7280" }}>
              Formats acceptés : <strong>.csv</strong>, <strong>.xlsx</strong>, <strong>.xls</strong>
            </p>
            <p style={{ margin: "0 0 24px", fontSize: 12, color: "#9CA3AF" }}>
              Colonnes Meta reconnues : full_name · phone_number · city · country · ad_name · campaign_name · id → Tracking N°
            </p>
            <div
              style={{
                border: `2px dashed ${dragOver ? "#6366F1" : "#D1D5DB"}`,
                borderRadius: 12, padding: "52px 24px", textAlign: "center",
                background: dragOver ? "#EEF2FF" : "#F9FAFB", transition: "all 0.2s",
              }}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setDragOver(false); const file = e.dataTransfer.files[0]; if (file) handleFile(file); }}
            >
              {importing ? (
                <>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>⏳</div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: "#6366F1" }}>Import en cours…</div>
                </>
              ) : (
                <>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>📂</div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: "#374151" }}>Glisser-déposer votre fichier ici</div>
                  <div style={{ fontSize: 13, color: "#9CA3AF", margin: "6px 0 20px" }}>CSV, Excel (.xlsx, .xls)</div>
                  <label style={{ cursor: "pointer" }}>
                    <input
                      type="file"
                      accept=".csv,.xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv"
                      style={{ display: "none" }}
                      onChange={(e) => { const file = e.target.files?.[0]; if (file) handleFile(file); e.target.value = ""; }}
                    />
                    <span style={{ display: "inline-block", padding: "11px 28px", background: "#6366F1", color: "white", borderRadius: 8, fontWeight: 600, fontSize: 13 }}>
                      📁 Choisir un fichier
                    </span>
                  </label>
                </>
              )}
            </div>
            <div style={{ marginTop: 20, background: "#F0F9FF", borderRadius: 10, padding: "14px 18px", fontSize: 13, color: "#0369A1", lineHeight: 1.8 }}>
              <strong>💡 Tracking Number :</strong><br/>
              • Import Meta → <strong>META-123456789</strong> (basé sur l'ID Meta)<br/>
              • Ajout manuel → <strong>TRK-20240501-4832</strong> (généré automatiquement)<br/>
              • Permet de retrouver et suivre chaque lead facilement
            </div>
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

export default withAuth(MediaBuyer, "media_buyer");