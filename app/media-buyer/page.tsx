"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import Sidebar from "../components/Sidebar";

export default function MediaBuyer() {
  const [tab, setTab] = useState("leads");
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState({
    nom_client: "", telephone: "", produit: "",
    quantite: "", prix: "", ville: "", marche: "DZ", source: "",
  });

  const fetchLeads = async () => {
    const { data } = await supabase
      .from("Leads")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setLeads(data);
  };

  useEffect(() => { fetchLeads(); }, []);

  const getStatutColor = (statut: string) => {
    const colors: any = {
      "Nouveau": "#3B82F6", "En appel": "#F59E0B",
      "Confirmé": "#10B981", "Annulé": "#EF4444",
      "En cours": "#8B5CF6", "Livré": "#064E3B",
    };
    return colors[statut] || "#6B7280";
  };

  const handleSubmit = async () => {
    if (!form.nom_client || !form.telephone || !form.produit) {
      alert("Remplis au moins le nom, téléphone et produit !");
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.from("Leads").insert([{
      nom_client: form.nom_client,
      telephone: form.telephone,
      produit: form.produit,
      quantite: Number(form.quantite),
      prix: Number(form.prix),
      ville: form.ville,
      marche: form.marche,
      source: form.source,
      statut: "Nouveau",
      m_b: "Media Buyer",
    }]);
    console.log("Résultat:", data, error);
    if (!error) {
      setSuccess("✅ Lead ajouté avec succès !");
      setForm({ nom_client: "", telephone: "", produit: "", quantite: "", prix: "", ville: "", marche: "DZ", source: "" });
      fetchLeads();
      setTimeout(() => setSuccess(""), 3000);
    } else {
      alert("Erreur: " + error.message);
    }
    setLoading(false);
  };

  const handleCSV = async (file: File) => {
    const text = await file.text();
    const lines = text.trim().split("\n");
    const rows = lines.slice(1);
    const leadsToInsert = rows.map(row => {
      const values = row.split(",");
      return {
        nom_client: values[0]?.trim(),
        telephone: values[1]?.trim(),
        produit: values[2]?.trim(),
        quantite: Number(values[3]?.trim()),
        prix: Number(values[4]?.trim()),
        ville: values[5]?.trim(),
        marche: values[6]?.trim(),
        source: values[7]?.trim(),
        statut: "Nouveau",
        m_b: "Media Buyer",
      };
    }).filter(l => l.nom_client && l.telephone);
    if (leadsToInsert.length > 0) {
      const { error } = await supabase.from("Leads").insert(leadsToInsert);
      if (!error) {
        alert(`✅ ${leadsToInsert.length} leads importés avec succès !`);
        fetchLeads();
        setTab("leads");
      } else {
        alert("Erreur: " + error.message);
      }
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
              { id: "leads", label: `📋 Mes Leads (${leads.length})` },
              { id: "upload", label: "➕ Nouveau Lead" },
              { id: "csv", label: "📂 Importer CSV" },
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

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
          {[
            { label: "Total leads", value: leads.length, color: "#3B82F6" },
            { label: "Confirmés", value: leads.filter(l => l.statut === "Confirmé").length, color: "#10B981" },
            { label: "Annulés", value: leads.filter(l => l.statut === "Annulé").length, color: "#EF4444" },
            { label: "Taux conf.", value: leads.length ? Math.round(leads.filter(l => l.statut === "Confirmé").length / leads.length * 100) + "%" : "0%", color: "#F59E0B" },
          ].map(s => (
            <div key={s.label} style={{ background: "white", borderRadius: 12, padding: "16px 20px", boxShadow: "0 1px 4px rgba(0,0,0,0.08)", borderTop: `3px solid ${s.color}` }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 13, color: "#6B7280", marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tab: Mes Leads */}
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
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#F9FAFB" }}>
                    {["Client", "Téléphone", "Produit", "Qté", "Prix", "Marché", "Ville", "Source", "Statut", "Date"].map(h => (
                      <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, color: "#6B7280", fontWeight: 600, borderBottom: "1px solid #E5E7EB" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {leads.map((lead, i) => (
                    <tr key={lead.id} style={{ background: i % 2 ? "#FAFAFA" : "white", borderBottom: "1px solid #F3F4F6" }}>
                      <td style={{ padding: "12px 16px", fontWeight: 600, fontSize: 13 }}>{lead.nom_client}</td>
                      <td style={{ padding: "12px 16px", fontSize: 13 }}>{lead.telephone}</td>
                      <td style={{ padding: "12px 16px", fontSize: 13 }}>{lead.produit}</td>
                      <td style={{ padding: "12px 16px", fontSize: 13, textAlign: "center" }}>{lead.quantite}</td>
                      <td style={{ padding: "12px 16px", fontSize: 13 }}>{lead.prix}</td>
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
                      <td style={{ padding: "12px 16px", fontSize: 12, color: "#9CA3AF" }}>
                        {new Date(lead.created_at).toLocaleDateString("fr-FR")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Tab: Nouveau Lead */}
        {tab === "upload" && (
          <div style={{ background: "white", borderRadius: 16, padding: 28, boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
            <h2 style={{ margin: "0 0 24px", fontSize: 16, color: "#1E3A5F" }}>➕ Nouveau Lead</h2>
            {success && (
              <div style={{ background: "#ECFDF5", border: "1px solid #10B981", borderRadius: 8, padding: "12px 16px", marginBottom: 20, color: "#10B981", fontWeight: 600 }}>
                {success}
              </div>
            )}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              {[
                ["Nom complet *", "nom_client", "text", "Ex: Karim Benali"],
                ["Téléphone *", "telephone", "text", "Ex: +213 555 0101"],
                ["Produit *", "produit", "text", "Ex: Chaussures X3"],
                ["Quantité", "quantite", "number", "Ex: 2"],
                ["Prix", "prix", "number", "Ex: 2900"],
                ["Ville / Wilaya", "ville", "text", "Ex: Oran"],
                ["Source campagne", "source", "text", "Ex: Facebook - Camp. Mai"],
              ].map(([label, key, type, placeholder]) => (
                <div key={key as string}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>{label as string}</label>
                  <input
                    type={type as string}
                    placeholder={placeholder as string}
                    value={(form as any)[key as string]}
                    onChange={(e) => setForm({ ...form, [key as string]: e.target.value })}
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
            <div style={{ marginTop: 24, display: "flex", gap: 12 }}>
              <button onClick={handleSubmit} disabled={loading} style={{
                padding: "12px 32px", background: loading ? "#9CA3AF" : "#1E3A5F",
                color: "white", border: "none", borderRadius: 10,
                fontWeight: 700, fontSize: 14, cursor: loading ? "not-allowed" : "pointer"
              }}>
                {loading ? "Ajout en cours..." : "➕ Ajouter le lead"}
              </button>
              <button onClick={() => setTab("leads")} style={{
                padding: "12px 24px", background: "#F3F4F6",
                color: "#374151", border: "none", borderRadius: 10,
                fontWeight: 600, fontSize: 14, cursor: "pointer"
              }}>
                Annuler
              </button>
            </div>
          </div>
        )}

        {/* Tab: Import CSV */}
        {tab === "csv" && (
          <div style={{ background: "white", borderRadius: 16, padding: 28, boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
            <h2 style={{ margin: "0 0 8px", fontSize: 16, color: "#1E3A5F" }}>📂 Importer des leads via CSV</h2>
            <p style={{ margin: "0 0 24px", fontSize: 13, color: "#6B7280" }}>
              Télécharge le template, remplis-le et uploade-le pour ajouter des centaines de leads en 1 clic.
            </p>
            <div style={{ background: "#F0F4F8", borderRadius: 12, padding: 20, marginBottom: 24 }}>
              <h3 style={{ margin: "0 0 8px", fontSize: 14, color: "#1E3A5F" }}>📋 Template CSV</h3>
              <p style={{ margin: "0 0 12px", fontSize: 13, color: "#6B7280" }}>
                Colonnes : nom_client, telephone, produit, quantite, prix, ville, marche, source
              </p>
              <button onClick={() => {
                const csv = "nom_client,telephone,produit,quantite,prix,ville,marche,source\nKarim Benali,+213555010,Chaussures X3,1,2900,Oran,DZ,Facebook\nFatima Zahra,+212661234,Sac Urban,1,350,Casablanca,MA,TikTok\n";
                const blob = new Blob([csv], { type: "text/csv" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "template_leads.csv";
                a.click();
              }} style={{
                padding: "10px 20px", background: "#1E3A5F", color: "white",
                border: "none", borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: "pointer"
              }}>
                ⬇️ Télécharger le template
              </button>
            </div>
            <div style={{
              border: "2px dashed #D1D5DB", borderRadius: 12, padding: "48px 24px",
              textAlign: "center", background: "#F9FAFB"
            }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); const file = e.dataTransfer.files[0]; if (file) handleCSV(file); }}
            >
              <div style={{ fontSize: 48, marginBottom: 12 }}>📂</div>
              <div style={{ fontSize: 15, fontWeight: 600, color: "#374151" }}>Glisser-déposer votre fichier CSV ici</div>
              <div style={{ fontSize: 13, color: "#9CA3AF", marginTop: 8 }}>ou</div>
              <label style={{ cursor: "pointer" }}>
                <input type="file" accept=".csv" style={{ display: "none" }}
                  onChange={(e) => { const file = e.target.files?.[0]; if (file) handleCSV(file); }} />
                <span style={{
                  display: "inline-block", marginTop: 12, padding: "10px 24px",
                  background: "#6366F1", color: "white", borderRadius: 8, fontWeight: 600, fontSize: 13
                }}>
                  📁 Choisir un fichier
                </span>
              </label>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}