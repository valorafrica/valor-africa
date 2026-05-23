"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import Sidebar from "../components/Sidebar";

export default function Equipe() {
  const [membres, setMembres] = useState<any[]>([]);
  const [tab, setTab] = useState("liste");
  const [form, setForm] = useState({ email: "", nom: "", role: "crc", marche: "DZ" });
  const [password, setPassword] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchMembres = async () => {
    const { data } = await supabase.from("Profiles").select("*").order("created_at", { ascending: false });
    if (data) setMembres(data);
  };

  useEffect(() => { fetchMembres(); }, []);

  const handleAddMembre = async () => {
    if (!form.email || !form.nom || !password) {
      alert("Remplis tous les champs !");
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.auth.admin.createUser({
      email: form.email,
      password: password,
      email_confirm: true,
    });
    if (error) {
      alert("Erreur création compte: " + error.message);
      setLoading(false);
      return;
    }
    const { error: profileError } = await supabase.from("Profiles").insert([{
      email: form.email,
      nom: form.nom,
      role: form.role,
      marche: form.marche,
    }]);
    if (!profileError) {
      setSuccess("✅ Membre ajouté avec succès !");
      setForm({ email: "", nom: "", role: "crc", marche: "DZ" });
      setPassword("");
      fetchMembres();
      setTimeout(() => setSuccess(""), 3000);
    }
    setLoading(false);
  };

  const getRoleLabel = (role: string) => {
    const roles: any = {
      "manager": "👑 Manager",
      "media_buyer": "📊 Media Buyer",
      "crc": "📞 Agent Confirmation",
      "crl": "🚚 Agent Logistique",
      "livreur": "🚗 Livreur",
      "stock": "📦 Équipe Stock",
      "comptable": "💰 Comptable",
    };
    return roles[role] || role;
  };

  const getRoleColor = (role: string) => {
    const colors: any = {
      "manager": "#1E3A5F",
      "media_buyer": "#6366F1",
      "crc": "#F59E0B",
      "crl": "#10B981",
      "livreur": "#3B82F6",
      "stock": "#8B5CF6",
      "comptable": "#EF4444",
    };
    return colors[role] || "#6B7280";
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#F0F4F8" }}>
      <Sidebar role="👑 Manager" />
      <div style={{ marginLeft: 240, flex: 1, padding: 32 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: "#1E3A5F" }}>Gestion Équipe</h1>
            <p style={{ margin: "4px 0 0", color: "#6B7280", fontSize: 14 }}>Gérer les membres et leurs accès</p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {[
              { id: "liste", label: `👥 Équipe (${membres.length})` },
              { id: "ajouter", label: "➕ Ajouter membre" },
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

        {/* Stats par rôle */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
          {[
            { label: "Media Buyers", role: "media_buyer", color: "#6366F1" },
            { label: "Agents CRC", role: "crc", color: "#F59E0B" },
            { label: "Agents CRL", role: "crl", color: "#10B981" },
            { label: "Livreurs", role: "livreur", color: "#3B82F6" },
          ].map(s => (
            <div key={s.role} style={{ background: "white", borderRadius: 12, padding: "16px 20px", boxShadow: "0 1px 4px rgba(0,0,0,0.08)", borderTop: `3px solid ${s.color}` }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: s.color }}>{membres.filter(m => m.role === s.role).length}</div>
              <div style={{ fontSize: 13, color: "#6B7280", marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {tab === "liste" && (
          <div style={{ background: "white", borderRadius: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.08)", overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#F9FAFB" }}>
                  {["Nom", "Email", "Rôle", "Marché", "Statut"].map(h => (
                    <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, color: "#6B7280", fontWeight: 600, borderBottom: "1px solid #E5E7EB" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {membres.length === 0 ? (
                  <tr><td colSpan={5} style={{ padding: "48px", textAlign: "center", color: "#9CA3AF" }}>
                    <div style={{ fontSize: 48, marginBottom: 12 }}>👥</div>
                    Aucun membre dans l'équipe
                  </td></tr>
                ) : membres.map((m, i) => (
                  <tr key={m.id} style={{ background: i % 2 ? "#FAFAFA" : "white", borderBottom: "1px solid #F3F4F6" }}>
                    <td style={{ padding: "14px 16px", fontWeight: 600, fontSize: 13 }}>{m.nom}</td>
                    <td style={{ padding: "14px 16px", fontSize: 13, color: "#6B7280" }}>{m.email}</td>
                    <td style={{ padding: "14px 16px" }}>
                      <span style={{
                        background: `${getRoleColor(m.role)}15`,
                        color: getRoleColor(m.role),
                        padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600
                      }}>{getRoleLabel(m.role)}</span>
                    </td>
                    <td style={{ padding: "14px 16px", fontSize: 13 }}>{m.marche}</td>
                    <td style={{ padding: "14px 16px" }}>
                      <span style={{ background: "#ECFDF5", color: "#10B981", padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
                        ✅ Actif
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === "ajouter" && (
          <div style={{ background: "white", borderRadius: 16, padding: 28, boxShadow: "0 1px 4px rgba(0,0,0,0.08)", maxWidth: 600 }}>
            <h2 style={{ margin: "0 0 24px", fontSize: 16, color: "#1E3A5F" }}>➕ Ajouter un membre</h2>
            {success && (
              <div style={{ background: "#ECFDF5", border: "1px solid #10B981", borderRadius: 8, padding: "12px 16px", marginBottom: 20, color: "#10B981", fontWeight: 600 }}>
                {success}
              </div>
            )}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Nom complet</label>
                <input value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })}
                  placeholder="Ex: Sara Benali"
                  style={{ width: "100%", padding: "11px 14px", border: "1.5px solid #E5E7EB", borderRadius: 8, fontSize: 14, outline: "none", boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Email</label>
                <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="sara@valorafrica.com" type="email"
                  style={{ width: "100%", padding: "11px 14px", border: "1.5px solid #E5E7EB", borderRadius: 8, fontSize: 14, outline: "none", boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Mot de passe</label>
                <input value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 8 caractères" type="password"
                  style={{ width: "100%", padding: "11px 14px", border: "1.5px solid #E5E7EB", borderRadius: 8, fontSize: 14, outline: "none", boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Rôle</label>
                <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}
                  style={{ width: "100%", padding: "11px 14px", border: "1.5px solid #E5E7EB", borderRadius: 8, fontSize: 14, outline: "none", boxSizing: "border-box" }}>
                  <option value="media_buyer">📊 Media Buyer</option>
                  <option value="crc">📞 Agent Confirmation</option>
                  <option value="crl">🚚 Agent Logistique</option>
                  <option value="livreur">🚗 Livreur</option>
                  <option value="stock">📦 Équipe Stock</option>
                  <option value="comptable">💰 Comptable</option>
                  <option value="manager">👑 Manager</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Marché</label>
                <select value={form.marche} onChange={(e) => setForm({ ...form, marche: e.target.value })}
                  style={{ width: "100%", padding: "11px 14px", border: "1.5px solid #E5E7EB", borderRadius: 8, fontSize: 14, outline: "none", boxSizing: "border-box" }}>
                  <option value="DZ">🇩🇿 Algérie</option>
                  <option value="MA">🇲🇦 Maroc</option>
                  <option value="TN">🇹🇳 Tunisie</option>
                  <option value="global">🌍 Global</option>
                </select>
              </div>
            </div>
            <button onClick={handleAddMembre} disabled={loading} style={{
              marginTop: 24, padding: "12px 32px",
              background: loading ? "#9CA3AF" : "#1E3A5F",
              color: "white", border: "none", borderRadius: 10,
              fontWeight: 700, fontSize: 14, cursor: loading ? "not-allowed" : "pointer"
            }}>
              {loading ? "Ajout en cours..." : "➕ Ajouter le membre"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}