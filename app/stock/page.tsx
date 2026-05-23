"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import Sidebar from "../components/Sidebar";
import withAuth from "../components/withAuth";

function Stock() {
  const [stocks, setStocks] = useState<any[]>([]);
  const [tab, setTab] = useState("stock");
  const [form, setForm] = useState({ produit: "", marche: "DZ", stock_total: "", seuil_alerte: "", notes: "" });
  const [success, setSuccess] = useState("");

  const fetchStock = async () => {
    const { data } = await supabase.from("Stocks").select("*").order("created_at", { ascending: false });
    if (data) setStocks(data);
  };

  useEffect(() => { fetchStock(); }, []);

  const handleSubmit = async () => {
    const { error } = await supabase.from("Stocks").insert([{
      produit: form.produit,
      marche: form.marche,
      stock_total: Number(form.stock_total),
      stock_reserve: 0,
      stock_livre: 0,
      stock_retour: 0,
      seuil_alerte: Number(form.seuil_alerte),
      notes: form.notes,
    }]);
    if (!error) {
      setSuccess("✅ Produit ajouté !");
      setForm({ produit: "", marche: "DZ", stock_total: "", seuil_alerte: "", notes: "" });
      fetchStock();
      setTimeout(() => setSuccess(""), 3000);
    }
  };

  const alertes = stocks.filter(s => (s.stock_total - s.stock_reserve - s.stock_livre + s.stock_retour) < s.seuil_alerte);

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#F0F4F8" }}>
      <Sidebar role="📦 Équipe Stock" />

      <div style={{ marginLeft: 240, flex: 1, padding: 32 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: "#1E3A5F" }}>Gestion du Stock</h1>
            <p style={{ margin: "4px 0 0", color: "#6B7280", fontSize: 14 }}>Suivi des produits par marché</p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {[
              { id: "stock", label: "📦 Stock" },
              { id: "ajouter", label: "➕ Ajouter" },
              { id: "alertes", label: `⚠️ Alertes (${alertes.length})` },
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

        {tab === "stock" && (
          <div style={{ background: "white", borderRadius: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.08)", overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#F9FAFB" }}>
                  {["Produit", "Marché", "Total", "Réservé", "Livré", "Retour", "Disponible", "Seuil", "Statut", "Notes"].map(h => (
                    <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, color: "#6B7280", fontWeight: 600, borderBottom: "1px solid #E5E7EB" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {stocks.length === 0 ? (
                  <tr><td colSpan={10} style={{ padding: "48px", textAlign: "center", color: "#9CA3AF" }}>
                    <div style={{ fontSize: 48, marginBottom: 12 }}>📦</div>
                    Aucun produit en stock
                  </td></tr>
                ) : stocks.map((s, i) => {
                  const dispo = s.stock_total - s.stock_reserve - s.stock_livre + s.stock_retour;
                  const isRupture = dispo === 0;
                  const isFaible = dispo < s.seuil_alerte && dispo > 0;
                  return (
                    <tr key={s.id} style={{ background: i % 2 ? "#FAFAFA" : "white", borderBottom: "1px solid #F3F4F6" }}>
                      <td style={{ padding: "12px 16px", fontWeight: 600, fontSize: 13 }}>{s.produit}</td>
                      <td style={{ padding: "12px 16px", fontSize: 13 }}>{s.marche}</td>
                      <td style={{ padding: "12px 16px", fontSize: 13, textAlign: "center" }}>{s.stock_total}</td>
                      <td style={{ padding: "12px 16px", fontSize: 13, textAlign: "center", color: "#F59E0B" }}>{s.stock_reserve}</td>
                      <td style={{ padding: "12px 16px", fontSize: 13, textAlign: "center", color: "#10B981" }}>{s.stock_livre}</td>
                      <td style={{ padding: "12px 16px", fontSize: 13, textAlign: "center", color: "#F97316" }}>{s.stock_retour}</td>
                      <td style={{ padding: "12px 16px", textAlign: "center" }}>
                        <span style={{ fontWeight: 800, fontSize: 14, color: isRupture ? "#EF4444" : isFaible ? "#F59E0B" : "#10B981" }}>{dispo}</span>
                      </td>
                      <td style={{ padding: "12px 16px", fontSize: 13, textAlign: "center" }}>{s.seuil_alerte}</td>
                      <td style={{ padding: "12px 16px" }}>
                        <span style={{
                          background: isRupture ? "#FEF2F2" : isFaible ? "#FFFBEB" : "#ECFDF5",
                          color: isRupture ? "#EF4444" : isFaible ? "#F59E0B" : "#10B981",
                          padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600
                        }}>
                          {isRupture ? "🔴 Rupture" : isFaible ? "⚠️ Faible" : "✅ OK"}
                        </span>
                      </td>
                      <td style={{ padding: "12px 16px", fontSize: 12, color: "#6B7280" }}>{s.notes}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {tab === "ajouter" && (
          <div style={{ background: "white", borderRadius: 16, padding: 28, boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
            <h2 style={{ margin: "0 0 24px", fontSize: 16, color: "#1E3A5F" }}>➕ Ajouter un produit</h2>
            {success && <div style={{ background: "#ECFDF5", border: "1px solid #10B981", borderRadius: 8, padding: "12px 16px", marginBottom: 20, color: "#10B981", fontWeight: 600 }}>{success}</div>}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              {[
                ["Nom du produit", "produit", "text", "Ex: Chaussures X3"],
                ["Stock total", "stock_total", "number", "Ex: 200"],
                ["Seuil alerte", "seuil_alerte", "number", "Ex: 20"],
                ["Notes", "notes", "text", "Ex: Réappro prévue le..."],
              ].map(([label, key, type, placeholder]) => (
                <div key={key as string}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>{label as string}</label>
                  <input type={type as string} placeholder={placeholder as string} value={(form as any)[key as string]}
                    onChange={(e) => setForm({ ...form, [key as string]: e.target.value })}
                    style={{ width: "100%", padding: "11px 14px", border: "1.5px solid #E5E7EB", borderRadius: 8, fontSize: 14, outline: "none", boxSizing: "border-box" }} />
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
            <button onClick={handleSubmit} style={{ marginTop: 24, padding: "12px 32px", background: "#1E3A5F", color: "white", border: "none", borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
              ➕ Ajouter le produit
            </button>
          </div>
        )}

        {tab === "alertes" && (
          <div style={{ background: "white", borderRadius: 16, padding: 24, boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
            <h2 style={{ margin: "0 0 20px", color: "#1E3A5F" }}>⚠️ Alertes Stock</h2>
            {alertes.length === 0 ? (
              <div style={{ textAlign: "center", padding: "48px 0", color: "#9CA3AF" }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
                <div>Aucune alerte stock</div>
              </div>
            ) : alertes.map((s) => {
              const dispo = s.stock_total - s.stock_reserve - s.stock_livre + s.stock_retour;
              const isRupture = dispo === 0;
              return (
                <div key={s.id} style={{ padding: "16px 20px", background: isRupture ? "#FEF2F2" : "#FFFBEB", borderRadius: 12, marginBottom: 12, borderLeft: `4px solid ${isRupture ? "#EF4444" : "#F59E0B"}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>{s.produit} — {s.marche}</div>
                      <div style={{ fontSize: 13, color: "#6B7280", marginTop: 4 }}>Stock disponible : <strong style={{ color: isRupture ? "#EF4444" : "#F59E0B" }}>{dispo}</strong> / Seuil : {s.seuil_alerte}</div>
                    </div>
                    <span style={{ fontWeight: 800, fontSize: 16, color: isRupture ? "#EF4444" : "#F59E0B" }}>
                      {isRupture ? "🔴 RUPTURE" : "⚠️ FAIBLE"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default withAuth(Stock, "stock");