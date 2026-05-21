"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";

export default function MediaBuyer() {
  const [tab, setTab] = useState("Leads");
  const [Leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState({
    nom_client: "",
    telephone: "",
    produit: "",
    quantite: "",
    prix: "",
    ville: "",
    marche: "DZ",
    source: "",
  });

  const fetchLeads = async () => {
    const { data } = await supabase
      .from("Leads")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setLeads(data);
  };

  useEffect(() => {
    fetchLeads();
  }, []);

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
    if (!error) {console.log("Lead ajouté:", data);
      setSuccess("✅ Lead ajouté avec succès !");
      setForm({ nom_client: "", telephone: "", produit: "", quantite: "", prix: "", ville: "", marche: "DZ", source: "" });
      fetchLeads();
      setTimeout(() => setSuccess(""), 3000);
    }
    setLoading(false);
  };

  const getStatutColor = (statut: string) => {
    const colors: any = {
      "Nouveau": "#3B82F6",
      "En appel": "#F59E0B",
      "Confirmé": "#10B981",
      "Annulé": "#EF4444",
      "En livraison": "#8B5CF6",
      "Livré": "#064E3B",
    };
    return colors[statut] || "#6B7280";
  };

  return (
    <div style={{ minHeight: "100vh", background: "#F3F4F6", fontFamily: "Arial, sans-serif" }}>
      <div style={{
        background: "linear-gradient(135deg, #1E3A5F, #2E6DA4)",
        padding: "20px 32px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 28 }}>🌍</span>
          <h1 style={{ color: "white", margin: 0, fontSize: 22, fontWeight: 800 }}>Valor Africa</h1>
        </div>
        <span style={{ color: "white", fontSize: 14 }}>📊 Media Buyer</span>
      </div>

      <div style={{ padding: "24px 32px 0" }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
          {[
            { id: "Leads", label: `📋 Mes Leads (${Leads.length})` },
            { id: "upload", label: "➕ Nouveau Lead" },
          ].map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              padding: "10px 20px", borderRadius: 8, border: "none", cursor: "pointer",
              fontWeight: 600, fontSize: 13,
              background: tab === t.id ? "#6366F1" : "white",
              color: tab === t.id ? "white" : "#374151",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
            }}>{t.label}</button>
          ))}
        </div>

        {tab === "Leads" && (
          <div style={{ background: "white", borderRadius: 16, padding: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
            <h2 style={{ margin: "0 0 20px", color: "#1E3A5F" }}>📋 Mes Leads</h2>
            {Leads.length === 0 ? (
              <div style={{ textAlign: "center", padding: "48px 0", color: "#9CA3AF" }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
                <div>Aucun lead pour le moment</div>
                <div style={{ fontSize: 13, marginTop: 8 }}>Clique sur "Nouveau Lead" pour commencer</div>
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
                  {Leads.map((lead, i) => (
                    <tr key={lead.id} style={{ background: i % 2 ? "#FAFAFA" : "white" }}>
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

        {tab === "upload" && (
          <div style={{ background: "white", borderRadius: 16, padding: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
            <h2 style={{ margin: "0 0 20px", color: "#1E3A5F" }}>➕ Nouveau Lead</h2>
            {success && (
              <div style={{ background: "#ECFDF5", border: "1px solid #10B981", borderRadius: 8, padding: "12px 16px", marginBottom: 16, color: "#10B981", fontWeight: 600 }}>
                {success}
              </div>
            )}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              {[
                ["Nom complet", "nom_client", "text", "Ex: Karim Benali"],
                ["Téléphone", "telephone", "text", "Ex: +213 555 0101"],
                ["Produit", "produit", "text", "Ex: Chaussures X3"],
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
                    style={{ width: "100%", padding: "10px 14px", border: "2px solid #E5E7EB", borderRadius: 8, fontSize: 14, outline: "none", boxSizing: "border-box" }}
                  />
                </div>
              ))}
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Marché</label>
                <select
                  value={form.marche}
                  onChange={(e) => setForm({ ...form, marche: e.target.value })}
                  style={{ width: "100%", padding: "10px 14px", border: "2px solid #E5E7EB", borderRadius: 8, fontSize: 14, outline: "none", boxSizing: "border-box" }}
                >
                  <option value="DZ">🇩🇿 Algérie</option>
                  <option value="MA">🇲🇦 Maroc</option>
                  <option value="TN">🇹🇳 Tunisie</option>
                </select>
              </div>
            </div>
            <button onClick={handleSubmit} disabled={loading} style={{
              marginTop: 24, padding: "12px 32px",
              background: loading ? "#9CA3AF" : "#6366F1",
              color: "white", border: "none", borderRadius: 10,
              fontWeight: 700, fontSize: 14, cursor: loading ? "not-allowed" : "pointer"
            }}>
              {loading ? "Ajout en cours..." : "➕ Ajouter le lead"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}