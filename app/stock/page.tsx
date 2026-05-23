"use client";
import { useState, useEffect, useRef } from "react";
import { supabase } from "../../lib/supabase";
import Sidebar from "../components/Sidebar";
import withAuth from "../components/withAuth";

function Stock() {
  const [stocks, setStocks] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [societes, setSocietes] = useState<any[]>([]);
  const [tab, setTab] = useState("stock");
  const [success, setSuccess] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<any>({});

  // Formulaire ajout produit
  const [form, setForm] = useState({
    produit: "",
    marche: "DZ",
    stock_total: "",
    seuil_alerte: "",
    notes: "",
  });

  // Allocations par ville + société de livraison
  const [allocations, setAllocations] = useState<
    { ville: string; societe: string; quantite: string }[]
  >([{ ville: "", societe: "", quantite: "" }]);

  // Filtres
  const [filtreMarche, setFiltreMarche] = useState("Tous");
  const [filtreVille, setFiltreVille] = useState("Tous");
  const [filtreSociete, setFiltreSociete] = useState("Tous");
  const [filtreDateDebut, setFiltreDateDebut] = useState("");
  const [filtreDateFin, setFiltreDateFin] = useState("");

  const stocksRef = useRef<any[]>([]);
  useEffect(() => { stocksRef.current = stocks; }, [stocks]);

  const fetchData = async () => {
    const { data: stockData } = await supabase
      .from("Stocks")
      .select("*")
      .order("created_at", { ascending: false });
    const { data: leadsData } = await supabase.from("Leads").select("*");
    const { data: societesData } = await supabase
      .from("societes_livraison")
      .select("*");
    if (stockData) setStocks(stockData);
    if (leadsData) setLeads(leadsData);
    if (societesData) setSocietes(societesData);
  };

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    const channel = supabase
      .channel("leads-changes")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "Leads" },
        async (payload) => {
          const lead = payload.new as any;
          const oldLead = payload.old as any;
          const currentStocks = stocksRef.current;
          const stock = currentStocks.find(
            (s) => s.produit === lead.produit && s.marche === lead.marche
          );
          if (!stock) return;
          const qte = lead.quantite || 1;

          if (lead.statut === "Livré" && oldLead.statut !== "Livré") {
            await supabase
              .from("Stocks")
              .update({
                stock_livre: stock.stock_livre + qte,
                stock_reserve: Math.max(0, stock.stock_reserve - qte),
              })
              .eq("id", stock.id);
            fetchData();
          }
          if (
            (lead.statut === "Retour" || lead.statut === "Refusé") &&
            oldLead.statut !== "Retour" &&
            oldLead.statut !== "Refusé"
          ) {
            await supabase
              .from("Stocks")
              .update({
                stock_retour: stock.stock_retour + qte,
                stock_reserve: Math.max(0, stock.stock_reserve - qte),
              })
              .eq("id", stock.id);
            fetchData();
          }
          if (lead.statut === "Confirmé" && oldLead.statut !== "Confirmé") {
            await supabase
              .from("Stocks")
              .update({ stock_reserve: stock.stock_reserve + qte })
              .eq("id", stock.id);
            fetchData();
          }
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  // Gestion allocations
  const addAllocation = () =>
    setAllocations([...allocations, { ville: "", societe: "", quantite: "" }]);

  const removeAllocation = (index: number) =>
    setAllocations(allocations.filter((_, i) => i !== index));

  const updateAllocation = (index: number, field: string, value: string) => {
    const updated = [...allocations];
    updated[index] = { ...updated[index], [field]: value };
    setAllocations(updated);
  };

  const totalAlloue = allocations.reduce(
    (sum, a) => sum + (Number(a.quantite) || 0),
    0
  );
  const stockTotalNum = Number(form.stock_total) || 0;
  const resteNonAlloue = stockTotalNum - totalAlloue;

  const handleSubmit = async () => {
    if (!form.produit || !form.stock_total) {
      alert("Remplis au moins le produit et le stock total !");
      return;
    }
    if (totalAlloue > stockTotalNum) {
      alert(
        `Les allocations (${totalAlloue}) dépassent le stock total (${stockTotalNum}) !`
      );
      return;
    }

    // Insère le stock principal
    const { data: newStock, error } = await supabase
      .from("Stocks")
      .insert([
        {
          produit: form.produit,
          marche: form.marche,
          stock_total: stockTotalNum,
          stock_reserve: 0,
          stock_livre: 0,
          stock_retour: 0,
          seuil_alerte: Number(form.seuil_alerte) || 50,
          notes: form.notes,
        },
      ])
      .select()
      .single();

    if (error) {
      alert("Erreur: " + error.message);
      return;
    }

    // Insère les allocations si la table existe
    const allocationsValides = allocations.filter(
      (a) => a.ville && a.societe && Number(a.quantite) > 0
    );
    if (allocationsValides.length > 0 && newStock) {
      await supabase.from("stock_allocations").insert(
        allocationsValides.map((a) => ({
          stock_id: newStock.id,
          produit: form.produit,
          marche: form.marche,
          ville: a.ville,
          societe_livraison: a.societe,
          quantite: Number(a.quantite),
        }))
      );
    }

    setSuccess("✅ Produit ajouté avec ses allocations !");
    setForm({ produit: "", marche: "DZ", stock_total: "", seuil_alerte: "", notes: "" });
    setAllocations([{ ville: "", societe: "", quantite: "" }]);
    fetchData();
    setTimeout(() => setSuccess(""), 3000);
  };

  const handleUpdate = async (id: number) => {
    await supabase
      .from("Stocks")
      .update({
        stock_total: Number(editForm.stock_total),
        stock_reserve: Number(editForm.stock_reserve),
        stock_livre: Number(editForm.stock_livre),
        stock_retour: Number(editForm.stock_retour),
        seuil_alerte: Number(editForm.seuil_alerte),
        notes: editForm.notes,
      })
      .eq("id", id);
    setEditingId(null);
    fetchData();
  };

  const getDispo = (s: any) =>
    s.stock_total - s.stock_reserve - s.stock_livre + s.stock_retour;

  const alertes = stocks.filter((s) => getDispo(s) < s.seuil_alerte);
  const ruptures = stocks.filter((s) => getDispo(s) === 0);
  const alertesBanniere = stocks.filter(
    (s) => getDispo(s) <= 50 && getDispo(s) > 0
  );
  const leadsEnCours = leads.filter(
    (l) => l.statut === "Confirmé" || l.statut === "En cours"
  );
  const rupturesOperationnelles = stocks.filter((s) => {
    const dispo = getDispo(s);
    const demandes = leadsEnCours
      .filter((l) => l.produit === s.produit && l.marche === s.marche)
      .reduce((sum, l) => sum + (l.quantite || 1), 0);
    return dispo > 0 && dispo < demandes;
  });

  const villes = [
    "Tous",
    ...Array.from(new Set(leads.map((l) => l.ville).filter(Boolean))),
  ];
  const marches = ["Tous", "DZ", "MA", "TN"];
  const societesNoms = [
    "Tous",
    ...societes.map(
      (s) => s.nom || s.name || s.societe || s.libelle || Object.values(s)[1] || ""
    ).filter(Boolean),
  ];

  // Villes disponibles selon le marché sélectionné dans le formulaire
  const villesDuMarche = Array.from(
    new Set(
      leads
        .filter((l) => l.marche === form.marche)
        .map((l) => l.ville)
        .filter(Boolean)
    )
  );

  const resetFiltres = () => {
    setFiltreMarche("Tous");
    setFiltreVille("Tous");
    setFiltreSociete("Tous");
    setFiltreDateDebut("");
    setFiltreDateFin("");
  };

  const leadsFiltrés = leads.filter((l) => {
    if (filtreMarche !== "Tous" && l.marche !== filtreMarche) return false;
    if (filtreVille !== "Tous" && l.ville !== filtreVille) return false;
    if (filtreSociete !== "Tous" && l.ste_livraison !== filtreSociete) return false;
    if (filtreDateDebut && new Date(l.created_at) < new Date(filtreDateDebut))
      return false;
    if (
      filtreDateFin &&
      new Date(l.created_at) > new Date(filtreDateFin + "T23:59:59")
    )
      return false;
    return true;
  });

  const stocksFiltrés = stocks.filter((s) => {
    if (filtreMarche !== "Tous" && s.marche !== filtreMarche) return false;
    return true;
  });

  const top10Vendus = Object.values(
    leadsFiltrés
      .filter((l) => l.statut === "Livré")
      .reduce((acc: any, l) => {
        const key = `${l.produit}__${l.marche}`;
        if (!acc[key])
          acc[key] = { produit: l.produit, marche: l.marche, ventes: 0, ca: 0 };
        acc[key].ventes += l.quantite || 1;
        acc[key].ca +=
          (l.prix_unitaire || 0) *
          (l.quantite || 1) *
          (1 - (l.remise || 0) / 100);
        return acc;
      }, {})
  )
    .sort((a: any, b: any) => b.ventes - a.ventes)
    .slice(0, 10) as any[];

  const top10Commandes = Object.values(
    leadsFiltrés.reduce((acc: any, l) => {
      const key = `${l.produit}__${l.marche}`;
      if (!acc[key])
        acc[key] = { produit: l.produit, marche: l.marche, commandes: 0 };
      acc[key].commandes += 1;
      return acc;
    }, {})
  )
    .sort((a: any, b: any) => b.commandes - a.commandes)
    .slice(0, 10) as any[];

  const top10Stock = [...stocks]
    .map((s) => ({ ...s, dispo: getDispo(s) }))
    .sort((a, b) => b.dispo - a.dispo)
    .slice(0, 10);

  const inputStyle: any = {
    padding: "8px 12px",
    border: "1.5px solid #E5E7EB",
    borderRadius: 8,
    fontSize: 13,
    outline: "none",
    background: "white",
    cursor: "pointer",
  };

  const FiltresBar = () => (
    <div
      style={{
        background: "white",
        borderRadius: 12,
        padding: "14px 20px",
        marginBottom: 16,
        boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
        display: "flex",
        gap: 12,
        flexWrap: "wrap",
        alignItems: "flex-end",
      }}
    >
      <div>
        <div style={{ fontSize: 11, color: "#6B7280", fontWeight: 600, marginBottom: 4 }}>
          MARCHÉ
        </div>
        <select
          value={filtreMarche}
          onChange={(e) => setFiltreMarche(e.target.value)}
          style={inputStyle}
        >
          {marches.map((m) => (
            <option key={m} value={m}>
              {m === "Tous"
                ? "🌍 Tous"
                : m === "DZ"
                ? "🇩🇿 Algérie"
                : m === "MA"
                ? "🇲🇦 Maroc"
                : "🇹🇳 Tunisie"}
            </option>
          ))}
        </select>
      </div>
      <div>
        <div style={{ fontSize: 11, color: "#6B7280", fontWeight: 600, marginBottom: 4 }}>
          VILLE
        </div>
        <select
          value={filtreVille}
          onChange={(e) => setFiltreVille(e.target.value)}
          style={inputStyle}
        >
          {villes.map((v) => (
            <option key={v} value={v}>{v}</option>
          ))}
        </select>
      </div>
      <div>
        <div style={{ fontSize: 11, color: "#6B7280", fontWeight: 600, marginBottom: 4 }}>
          SOCIÉTÉ LIVRAISON
        </div>
        <select
          value={filtreSociete}
          onChange={(e) => setFiltreSociete(e.target.value)}
          style={inputStyle}
        >
          {societesNoms.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>
      <div>
        <div style={{ fontSize: 11, color: "#6B7280", fontWeight: 600, marginBottom: 4 }}>
          DATE DÉBUT
        </div>
        <input
          type="date"
          value={filtreDateDebut}
          onChange={(e) => setFiltreDateDebut(e.target.value)}
          style={inputStyle}
        />
      </div>
      <div>
        <div style={{ fontSize: 11, color: "#6B7280", fontWeight: 600, marginBottom: 4 }}>
          DATE FIN
        </div>
        <input
          type="date"
          value={filtreDateFin}
          onChange={(e) => setFiltreDateFin(e.target.value)}
          style={inputStyle}
        />
      </div>
      <button
        onClick={resetFiltres}
        style={{
          padding: "8px 16px",
          background: "#F3F4F6",
          color: "#374151",
          border: "none",
          borderRadius: 8,
          fontWeight: 600,
          fontSize: 12,
          cursor: "pointer",
        }}
      >
        🔄 Reset
      </button>
    </div>
  );

  const getMedalColor = (i: number) =>
    i === 0 ? "#F5C518" : i === 1 ? "#C0C0C0" : i === 2 ? "#CD7F32" : "#F3F4F6";
  const getMedalText = (i: number) => (i < 3 ? "white" : "#374151");

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#F0F4F8" }}>
      <Sidebar role="stock" />

      <div style={{ marginLeft: 240, flex: 1, padding: 32 }}>

        {/* Bannière alertes */}
        {(ruptures.length > 0 ||
          alertesBanniere.length > 0 ||
          rupturesOperationnelles.length > 0) && (
          <div
            style={{
              background: ruptures.length > 0 ? "#FEF2F2" : "#FFFBEB",
              border: `1px solid ${
                ruptures.length > 0 ? "#EF4444" : "#F59E0B"
              }`,
              borderRadius: 12,
              padding: "12px 20px",
              marginBottom: 20,
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            {ruptures.length > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 20 }}>🔴</span>
                <div style={{ fontWeight: 700, color: "#EF4444", fontSize: 13 }}>
                  {ruptures.length} produit(s) en RUPTURE :{" "}
                  {ruptures.map((s) => s.produit).join(", ")}
                </div>
              </div>
            )}
            {rupturesOperationnelles.length > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 20 }}>🟠</span>
                <div style={{ fontWeight: 700, color: "#F97316", fontSize: 13 }}>
                  {rupturesOperationnelles.length} produit(s) en RUPTURE
                  OPÉRATIONNELLE :{" "}
                  {rupturesOperationnelles.map((s) => s.produit).join(", ")}
                </div>
              </div>
            )}
            {alertesBanniere.length > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 20 }}>⚠️</span>
                <div style={{ fontWeight: 600, color: "#F59E0B", fontSize: 13 }}>
                  {alertesBanniere.length} produit(s) avec stock ≤ 50 :{" "}
                  {alertesBanniere
                    .map((s) => `${s.produit} (${getDispo(s)})`)
                    .join(", ")}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 24,
          }}
        >
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: "#1E3A5F" }}>
              Gestion du Stock
            </h1>
            <p style={{ margin: "4px 0 0", color: "#6B7280", fontSize: 14 }}>
              Suivi des produits par marché
            </p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {[
              { id: "stock", label: "📦 Stock" },
              { id: "ajouter", label: "➕ Ajouter" },
              { id: "alertes", label: `⚠️ Alertes (${alertes.length})` },
              { id: "top10", label: "🏆 Top 10" },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                style={{
                  padding: "10px 20px",
                  borderRadius: 8,
                  border: "none",
                  cursor: "pointer",
                  fontWeight: 600,
                  fontSize: 13,
                  background: tab === t.id ? "#1E3A5F" : "white",
                  color: tab === t.id ? "white" : "#374151",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* KPIs */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 16,
            marginBottom: 24,
          }}
        >
          {[
            { label: "Produits actifs", value: stocks.length, color: "#3B82F6" },
            { label: "Alertes stock", value: alertes.length, color: "#F59E0B" },
            { label: "Ruptures", value: ruptures.length, color: "#EF4444" },
            {
              label: "Produits livrés",
              value: leads.filter((l) => l.statut === "Livré").length,
              color: "#10B981",
            },
          ].map((s) => (
            <div
              key={s.label}
              style={{
                background: "white",
                borderRadius: 12,
                padding: "16px 20px",
                boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
                borderTop: `3px solid ${s.color}`,
              }}
            >
              <div style={{ fontSize: 28, fontWeight: 800, color: s.color }}>
                {s.value}
              </div>
              <div style={{ fontSize: 13, color: "#6B7280", marginTop: 4 }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>

        {/* ===== ONGLET STOCK ===== */}
        {tab === "stock" && (
          <div>
            <FiltresBar />
            <div
              style={{
                background: "white",
                borderRadius: 16,
                boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
                overflow: "hidden",
              }}
            >
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#F9FAFB" }}>
                    {[
                      "Produit","Marché","Total","Réservé","Livré",
                      "Retour","Disponible","Seuil","Statut","Notes","Actions",
                    ].map((h) => (
                      <th
                        key={h}
                        style={{
                          padding: "12px 16px",
                          textAlign: "left",
                          fontSize: 12,
                          color: "#6B7280",
                          fontWeight: 600,
                          borderBottom: "1px solid #E5E7EB",
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {stocksFiltrés.length === 0 ? (
                    <tr>
                      <td
                        colSpan={11}
                        style={{ padding: "48px", textAlign: "center", color: "#9CA3AF" }}
                      >
                        <div style={{ fontSize: 48, marginBottom: 12 }}>📦</div>
                        Aucun produit en stock
                      </td>
                    </tr>
                  ) : (
                    stocksFiltrés.map((s, i) => {
                      const dispo = getDispo(s);
                      const isRupture = dispo === 0;
                      const isFaible = dispo <= 50 && dispo > 0;
                      const demandesEnCours = leadsEnCours
                        .filter(
                          (l) => l.produit === s.produit && l.marche === s.marche
                        )
                        .reduce(
                          (sum: number, l: any) => sum + (l.quantite || 1),
                          0
                        );
                      const isRuptureOp = dispo > 0 && dispo < demandesEnCours;
                      const isEditing = editingId === s.id;
                      return (
                        <tr
                          key={s.id}
                          style={{
                            background: isRupture
                              ? "#FFF5F5"
                              : isRuptureOp
                              ? "#FFF7ED"
                              : i % 2
                              ? "#FAFAFA"
                              : "white",
                            borderBottom: "1px solid #F3F4F6",
                          }}
                        >
                          <td style={{ padding: "12px 16px", fontWeight: 600, fontSize: 13 }}>
                            {s.produit}
                          </td>
                          <td style={{ padding: "12px 16px", fontSize: 13 }}>
                            {s.marche}
                          </td>
                          {isEditing ? (
                            <>
                              {["stock_total","stock_reserve","stock_livre","stock_retour"].map(
                                (field) => (
                                  <td key={field} style={{ padding: "8px" }}>
                                    <input
                                      type="number"
                                      value={editForm[field]}
                                      onChange={(e) =>
                                        setEditForm({
                                          ...editForm,
                                          [field]: e.target.value,
                                        })
                                      }
                                      style={{
                                        width: 60,
                                        padding: "4px 8px",
                                        border: "1px solid #D1D5DB",
                                        borderRadius: 6,
                                        fontSize: 12,
                                      }}
                                    />
                                  </td>
                                )
                              )}
                              <td style={{ padding: "12px 16px", textAlign: "center" }}>
                                <span
                                  style={{
                                    fontWeight: 800,
                                    fontSize: 14,
                                    color: isRupture
                                      ? "#EF4444"
                                      : isFaible
                                      ? "#F59E0B"
                                      : "#10B981",
                                  }}
                                >
                                  {dispo}
                                </span>
                              </td>
                              <td style={{ padding: "8px" }}>
                                <input
                                  type="number"
                                  value={editForm.seuil_alerte}
                                  onChange={(e) =>
                                    setEditForm({
                                      ...editForm,
                                      seuil_alerte: e.target.value,
                                    })
                                  }
                                  style={{
                                    width: 60,
                                    padding: "4px 8px",
                                    border: "1px solid #D1D5DB",
                                    borderRadius: 6,
                                    fontSize: 12,
                                  }}
                                />
                              </td>
                            </>
                          ) : (
                            <>
                              <td style={{ padding: "12px 16px", fontSize: 13, textAlign: "center" }}>
                                {s.stock_total}
                              </td>
                              <td style={{ padding: "12px 16px", fontSize: 13, textAlign: "center", color: "#F59E0B" }}>
                                {s.stock_reserve}
                              </td>
                              <td style={{ padding: "12px 16px", fontSize: 13, textAlign: "center", color: "#10B981" }}>
                                {s.stock_livre}
                              </td>
                              <td style={{ padding: "12px 16px", fontSize: 13, textAlign: "center", color: "#F97316" }}>
                                {s.stock_retour}
                              </td>
                              <td style={{ padding: "12px 16px", textAlign: "center" }}>
                                <span
                                  style={{
                                    fontWeight: 800,
                                    fontSize: 14,
                                    color: isRupture
                                      ? "#EF4444"
                                      : isFaible
                                      ? "#F59E0B"
                                      : "#10B981",
                                  }}
                                >
                                  {dispo}
                                </span>
                              </td>
                              <td style={{ padding: "12px 16px", fontSize: 13, textAlign: "center" }}>
                                {s.seuil_alerte}
                              </td>
                            </>
                          )}
                          <td style={{ padding: "12px 16px" }}>
                            <span
                              style={{
                                background: isRupture
                                  ? "#FEF2F2"
                                  : isRuptureOp
                                  ? "#FFF7ED"
                                  : isFaible
                                  ? "#FFFBEB"
                                  : "#ECFDF5",
                                color: isRupture
                                  ? "#EF4444"
                                  : isRuptureOp
                                  ? "#F97316"
                                  : isFaible
                                  ? "#F59E0B"
                                  : "#10B981",
                                padding: "4px 10px",
                                borderRadius: 20,
                                fontSize: 11,
                                fontWeight: 600,
                              }}
                            >
                              {isRupture
                                ? "🔴 Rupture"
                                : isRuptureOp
                                ? "🟠 Rupture Op."
                                : isFaible
                                ? "⚠️ Faible"
                                : "✅ OK"}
                            </span>
                          </td>
                          <td style={{ padding: "12px 16px", fontSize: 12, color: "#6B7280" }}>
                            {isEditing ? (
                              <input
                                value={editForm.notes}
                                onChange={(e) =>
                                  setEditForm({ ...editForm, notes: e.target.value })
                                }
                                style={{
                                  width: 100,
                                  padding: "4px 8px",
                                  border: "1px solid #D1D5DB",
                                  borderRadius: 6,
                                  fontSize: 12,
                                }}
                              />
                            ) : (
                              s.notes
                            )}
                          </td>
                          <td style={{ padding: "12px 16px" }}>
                            {isEditing ? (
                              <div style={{ display: "flex", gap: 6 }}>
                                <button
                                  onClick={() => handleUpdate(s.id)}
                                  style={{
                                    padding: "5px 10px",
                                    background: "#10B981",
                                    color: "white",
                                    border: "none",
                                    borderRadius: 6,
                                    fontSize: 12,
                                    cursor: "pointer",
                                    fontWeight: 600,
                                  }}
                                >
                                  ✅
                                </button>
                                <button
                                  onClick={() => setEditingId(null)}
                                  style={{
                                    padding: "5px 10px",
                                    background: "#F3F4F6",
                                    color: "#374151",
                                    border: "none",
                                    borderRadius: 6,
                                    fontSize: 12,
                                    cursor: "pointer",
                                  }}
                                >
                                  ✕
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => {
                                  setEditingId(s.id);
                                  setEditForm(s);
                                }}
                                style={{
                                  padding: "5px 12px",
                                  background: "#EFF6FF",
                                  color: "#3B82F6",
                                  border: "1px solid #3B82F640",
                                  borderRadius: 6,
                                  fontSize: 12,
                                  cursor: "pointer",
                                  fontWeight: 600,
                                }}
                              >
                                ✏️ Modifier
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ===== ONGLET AJOUTER ===== */}
        {tab === "ajouter" && (
          <div
            style={{
              background: "white",
              borderRadius: 16,
              padding: 28,
              boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
            }}
          >
            <h2 style={{ margin: "0 0 24px", fontSize: 18, color: "#1E3A5F", fontWeight: 800 }}>
              ➕ Ajouter un produit
            </h2>

            {success && (
              <div
                style={{
                  background: "#ECFDF5",
                  border: "1px solid #10B981",
                  borderRadius: 8,
                  padding: "12px 16px",
                  marginBottom: 20,
                  color: "#10B981",
                  fontWeight: 600,
                }}
              >
                {success}
              </div>
            )}

            {/* Infos générales */}
            <div
              style={{
                background: "#F8FAFC",
                borderRadius: 12,
                padding: 20,
                marginBottom: 24,
                border: "1px solid #E5E7EB",
              }}
            >
              <h3 style={{ margin: "0 0 16px", fontSize: 14, color: "#374151", fontWeight: 700 }}>
                📋 Informations générales
              </h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>
                    Nom du produit *
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Chaussures X3"
                    value={form.produit}
                    onChange={(e) => setForm({ ...form, produit: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "11px 14px",
                      border: "1.5px solid #E5E7EB",
                      borderRadius: 8,
                      fontSize: 14,
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>
                    Marché
                  </label>
                  <select
                    value={form.marche}
                    onChange={(e) => {
                      setForm({ ...form, marche: e.target.value });
                      setAllocations([{ ville: "", societe: "", quantite: "" }]);
                    }}
                    style={{
                      width: "100%",
                      padding: "11px 14px",
                      border: "1.5px solid #E5E7EB",
                      borderRadius: 8,
                      fontSize: 14,
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  >
                    <option value="DZ">🇩🇿 Algérie</option>
                    <option value="MA">🇲🇦 Maroc</option>
                    <option value="TN">🇹🇳 Tunisie</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>
                    Stock total *
                  </label>
                  <input
                    type="number"
                    placeholder="Ex: 200"
                    value={form.stock_total}
                    onChange={(e) => setForm({ ...form, stock_total: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "11px 14px",
                      border: "1.5px solid #E5E7EB",
                      borderRadius: 8,
                      fontSize: 14,
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>
                    Seuil alerte (défaut: 50)
                  </label>
                  <input
                    type="number"
                    placeholder="Ex: 50"
                    value={form.seuil_alerte}
                    onChange={(e) => setForm({ ...form, seuil_alerte: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "11px 14px",
                      border: "1.5px solid #E5E7EB",
                      borderRadius: 8,
                      fontSize: 14,
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>
                    Notes
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Réappro prévue le..."
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "11px 14px",
                      border: "1.5px solid #E5E7EB",
                      borderRadius: 8,
                      fontSize: 14,
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Allocations par ville + société */}
            <div
              style={{
                background: "#F8FAFC",
                borderRadius: 12,
                padding: 20,
                marginBottom: 24,
                border: "1px solid #E5E7EB",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 16,
                }}
              >
                <div>
                  <h3 style={{ margin: 0, fontSize: 14, color: "#374151", fontWeight: 700 }}>
                    🏙️ Allocation par ville & société de livraison
                  </h3>
                  <p style={{ margin: "4px 0 0", fontSize: 12, color: "#6B7280" }}>
                    Définissez combien d'unités sont envoyées à chaque société dans chaque ville
                  </p>
                </div>
                <button
                  onClick={addAllocation}
                  style={{
                    padding: "8px 16px",
                    background: "#1E3A5F",
                    color: "white",
                    border: "none",
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  + Ajouter une ligne
                </button>
              </div>

              {/* En-tête tableau */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 120px 40px",
                  gap: 10,
                  marginBottom: 8,
                  padding: "0 4px",
                }}
              >
                {["VILLE", "SOCIÉTÉ DE LIVRAISON", "QUANTITÉ", ""].map((h) => (
                  <div
                    key={h}
                    style={{ fontSize: 11, color: "#6B7280", fontWeight: 700 }}
                  >
                    {h}
                  </div>
                ))}
              </div>

              {/* Lignes allocations */}
              {allocations.map((alloc, index) => (
                <div
                  key={index}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 120px 40px",
                    gap: 10,
                    marginBottom: 10,
                    alignItems: "center",
                  }}
                >
                  {/* Ville */}
                  <select
                    value={alloc.ville}
                    onChange={(e) => updateAllocation(index, "ville", e.target.value)}
                    style={{
                      padding: "10px 12px",
                      border: "1.5px solid #E5E7EB",
                      borderRadius: 8,
                      fontSize: 13,
                      outline: "none",
                      background: "white",
                      color: alloc.ville ? "#111827" : "#9CA3AF",
                    }}
                  >
                    <option value="">Sélectionner une ville</option>
                    {villesDuMarche.length > 0 ? (
                      villesDuMarche.map((v: string) => (
                        <option key={v} value={v}>{v}</option>
                      ))
                    ) : (
                      // Si pas de villes dans les leads, afficher villes génériques selon marché
                      (form.marche === "DZ"
                        ? ["Alger","Oran","Constantine","Annaba","Blida","Sétif","Tlemcen","Batna","Sidi Bel Abbès","Béjaïa"]
                        : form.marche === "MA"
                        ? ["Casablanca","Rabat","Marrakech","Fès","Tanger","Agadir","Meknès","Oujda","Kenitra","Tétouan"]
                        : ["Tunis","Sfax","Sousse","Kairouan","Bizerte","Gabès","Ariana","Gafsa","Monastir","Nabeul"]
                      ).map((v) => (
                        <option key={v} value={v}>{v}</option>
                      ))
                    )}
                  </select>

                  {/* Société */}
                  <select
                    value={alloc.societe}
                    onChange={(e) => updateAllocation(index, "societe", e.target.value)}
                    style={{
                      padding: "10px 12px",
                      border: "1.5px solid #E5E7EB",
                      borderRadius: 8,
                      fontSize: 13,
                      outline: "none",
                      background: "white",
                      color: alloc.societe ? "#111827" : "#9CA3AF",
                    }}
                  >
                    <option value="">Sélectionner une société</option>
                    {societes.map((s: any) => {
                      const nom = s.nom || s.name || s.societe || s.libelle || Object.values(s)[1] || "";
                      return nom ? (
                        <option key={s.id || nom} value={nom}>{nom}</option>
                      ) : null;
                    })}
                  </select>

                  {/* Quantité */}
                  <input
                    type="number"
                    placeholder="Qté"
                    min="0"
                    value={alloc.quantite}
                    onChange={(e) => updateAllocation(index, "quantite", e.target.value)}
                    style={{
                      padding: "10px 12px",
                      border: "1.5px solid #E5E7EB",
                      borderRadius: 8,
                      fontSize: 13,
                      outline: "none",
                      textAlign: "center",
                    }}
                  />

                  {/* Supprimer */}
                  {allocations.length > 1 && (
                    <button
                      onClick={() => removeAllocation(index)}
                      style={{
                        width: 32,
                        height: 32,
                        background: "#FEF2F2",
                        color: "#EF4444",
                        border: "none",
                        borderRadius: 8,
                        fontSize: 16,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}

              {/* Récapitulatif allocation */}
              {stockTotalNum > 0 && (
                <div
                  style={{
                    marginTop: 16,
                    padding: "12px 16px",
                    borderRadius: 10,
                    background: resteNonAlloue < 0
                      ? "#FEF2F2"
                      : resteNonAlloue === 0
                      ? "#ECFDF5"
                      : "#FFFBEB",
                    border: `1px solid ${
                      resteNonAlloue < 0
                        ? "#EF4444"
                        : resteNonAlloue === 0
                        ? "#10B981"
                        : "#F59E0B"
                    }`,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>
                    Total alloué :{" "}
                    <span
                      style={{
                        color: resteNonAlloue < 0 ? "#EF4444" : "#1E3A5F",
                        fontWeight: 800,
                      }}
                    >
                      {totalAlloue}
                    </span>{" "}
                    / {stockTotalNum} unités
                  </div>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: resteNonAlloue < 0
                        ? "#EF4444"
                        : resteNonAlloue === 0
                        ? "#10B981"
                        : "#F59E0B",
                    }}
                  >
                    {resteNonAlloue < 0
                      ? `⚠️ Dépassement de ${Math.abs(resteNonAlloue)} unités !`
                      : resteNonAlloue === 0
                      ? "✅ Tout le stock est alloué"
                      : `📦 ${resteNonAlloue} unités non allouées`}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={handleSubmit}
              style={{
                padding: "13px 36px",
                background: "#1E3A5F",
                color: "white",
                border: "none",
                borderRadius: 10,
                fontWeight: 700,
                fontSize: 15,
                cursor: "pointer",
              }}
            >
              ➕ Ajouter le produit
            </button>
          </div>
        )}

        {/* ===== ONGLET ALERTES ===== */}
        {tab === "alertes" && (
          <div>
            <FiltresBar />

            {ruptures.length > 0 && (
              <div
                style={{
                  background: "#FEF2F2",
                  border: "2px solid #EF4444",
                  borderRadius: 16,
                  padding: 20,
                  marginBottom: 20,
                }}
              >
                <h3 style={{ margin: "0 0 12px", color: "#EF4444", fontSize: 15 }}>
                  🔴 RUPTURES — Stock à zéro !
                </h3>
                {ruptures.map((s) => (
                  <div
                    key={s.id}
                    style={{
                      padding: "12px 16px",
                      background: "white",
                      borderRadius: 10,
                      marginBottom: 8,
                      borderLeft: "4px solid #EF4444",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 14 }}>
                          {s.produit} — {s.marche}
                        </div>
                        <div style={{ fontSize: 12, color: "#6B7280" }}>
                          Stock disponible :{" "}
                          <strong style={{ color: "#EF4444" }}>0</strong>
                        </div>
                      </div>
                      <span style={{ fontWeight: 800, color: "#EF4444" }}>🔴 RUPTURE</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {rupturesOperationnelles.length > 0 && (
              <div
                style={{
                  background: "#FFF7ED",
                  border: "2px solid #F97316",
                  borderRadius: 16,
                  padding: 20,
                  marginBottom: 20,
                }}
              >
                <h3 style={{ margin: "0 0 4px", color: "#F97316", fontSize: 15 }}>
                  🟠 RUPTURES OPÉRATIONNELLES
                </h3>
                <p style={{ margin: "0 0 12px", color: "#9A3412", fontSize: 12 }}>
                  Du stock est disponible, mais les demandes confirmées dépassent la
                  quantité disponible.
                </p>
                {rupturesOperationnelles.map((s) => {
                  const dispo = getDispo(s);
                  const demandes = leadsEnCours
                    .filter(
                      (l) => l.produit === s.produit && l.marche === s.marche
                    )
                    .reduce(
                      (sum: number, l: any) => sum + (l.quantite || 1),
                      0
                    );
                  return (
                    <div
                      key={s.id}
                      style={{
                        padding: "12px 16px",
                        background: "white",
                        borderRadius: 10,
                        marginBottom: 8,
                        borderLeft: "4px solid #F97316",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 14 }}>
                            {s.produit} — {s.marche}
                          </div>
                          <div style={{ fontSize: 12, color: "#6B7280", marginTop: 4 }}>
                            Stock dispo :{" "}
                            <strong style={{ color: "#F97316" }}>{dispo}</strong> |
                            Demandes en cours :{" "}
                            <strong style={{ color: "#EF4444" }}>{demandes}</strong> |
                            Manque :{" "}
                            <strong style={{ color: "#EF4444" }}>
                              {demandes - dispo}
                            </strong>{" "}
                            unité(s)
                          </div>
                        </div>
                        <span style={{ fontWeight: 800, color: "#F97316" }}>
                          🟠 RUPTURE OP.
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div
              style={{
                background: "white",
                borderRadius: 16,
                padding: 24,
                boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
              }}
            >
              <h2 style={{ margin: "0 0 20px", color: "#1E3A5F" }}>
                ⚠️ Stocks ≤ 50 unités
              </h2>
              {alertesBanniere.length === 0 ? (
                <div
                  style={{ textAlign: "center", padding: "32px 0", color: "#9CA3AF" }}
                >
                  <div style={{ fontSize: 40, marginBottom: 8 }}>✅</div>
                  <div>Tous les stocks sont au-dessus de 50 unités</div>
                </div>
              ) : (
                alertesBanniere.map((s) => {
                  const dispo = getDispo(s);
                  return (
                    <div
                      key={s.id}
                      style={{
                        padding: "16px 20px",
                        background: "#FFFBEB",
                        borderRadius: 12,
                        marginBottom: 12,
                        borderLeft: "4px solid #F59E0B",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 14 }}>
                            {s.produit} — {s.marche}
                          </div>
                          <div style={{ fontSize: 13, color: "#6B7280", marginTop: 4 }}>
                            Disponible :{" "}
                            <strong style={{ color: "#F59E0B" }}>{dispo}</strong> /
                            Seuil : {s.seuil_alerte}
                          </div>
                        </div>
                        <span style={{ fontWeight: 800, color: "#F59E0B" }}>
                          ⚠️ FAIBLE
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ===== ONGLET TOP 10 ===== */}
        {tab === "top10" && (
          <div>
            <FiltresBar />
            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 20 }}>

              <div
                style={{
                  background: "white",
                  borderRadius: 16,
                  padding: 24,
                  boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
                }}
              >
                <h2 style={{ margin: "0 0 20px", fontSize: 16, color: "#1E3A5F" }}>
                  🏆 Top 10 — Produits les plus vendus
                </h2>
                {top10Vendus.length === 0 ? (
                  <div
                    style={{
                      textAlign: "center",
                      padding: "32px 0",
                      color: "#9CA3AF",
                    }}
                  >
                    <div style={{ fontSize: 40, marginBottom: 8 }}>📦</div>
                    <div>Aucune vente avec ces filtres</div>
                  </div>
                ) : (
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ background: "#F9FAFB" }}>
                        {["#","Produit","Marché","Unités vendues","CA généré","Performance"].map((h) => (
                          <th
                            key={h}
                            style={{
                              padding: "12px 16px",
                              textAlign: "left",
                              fontSize: 12,
                              color: "#6B7280",
                              fontWeight: 600,
                              borderBottom: "1px solid #E5E7EB",
                            }}
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {top10Vendus.map((p, i) => {
                        const pct = Math.round(
                          (p.ventes / top10Vendus[0].ventes) * 100
                        );
                        return (
                          <tr
                            key={i}
                            style={{
                              background: i % 2 ? "#FAFAFA" : "white",
                              borderBottom: "1px solid #F3F4F6",
                            }}
                          >
                            <td style={{ padding: "14px 16px" }}>
                              <span
                                style={{
                                  width: 28,
                                  height: 28,
                                  borderRadius: "50%",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  fontWeight: 800,
                                  fontSize: 13,
                                  background: getMedalColor(i),
                                  color: getMedalText(i),
                                }}
                              >
                                {i + 1}
                              </span>
                            </td>
                            <td style={{ padding: "14px 16px", fontWeight: 700, fontSize: 14 }}>
                              {p.produit}
                            </td>
                            <td style={{ padding: "14px 16px", fontSize: 13 }}>
                              {p.marche}
                            </td>
                            <td style={{ padding: "14px 16px", fontSize: 14, fontWeight: 700, color: "#1E3A5F" }}>
                              {p.ventes} unités
                            </td>
                            <td style={{ padding: "14px 16px", fontSize: 14, fontWeight: 700, color: "#10B981" }}>
                              {Math.round(p.ca)}
                            </td>
                            <td style={{ padding: "14px 16px", minWidth: 150 }}>
                              <div
                                style={{
                                  background: "#F3F4F6",
                                  borderRadius: 20,
                                  height: 8,
                                  overflow: "hidden",
                                }}
                              >
                                <div
                                  style={{
                                    width: `${pct}%`,
                                    height: "100%",
                                    background: i === 0 ? "#F5C518" : "#1E3A5F",
                                    borderRadius: 20,
                                  }}
                                />
                              </div>
                              <div
                                style={{
                                  fontSize: 11,
                                  color: "#6B7280",
                                  marginTop: 4,
                                }}
                              >
                                {pct}%
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>

              <div
                style={{
                  background: "white",
                  borderRadius: 16,
                  padding: 24,
                  boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
                }}
              >
                <h2 style={{ margin: "0 0 20px", fontSize: 16, color: "#1E3A5F" }}>
                  📋 Top 10 — Produits les plus commandés
                </h2>
                {top10Commandes.length === 0 ? (
                  <div
                    style={{
                      textAlign: "center",
                      padding: "32px 0",
                      color: "#9CA3AF",
                    }}
                  >
                    <div style={{ fontSize: 40, marginBottom: 8 }}>📋</div>
                    <div>Aucune commande avec ces filtres</div>
                  </div>
                ) : (
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ background: "#F9FAFB" }}>
                        {["#","Produit","Marché","Nb commandes","Performance"].map((h) => (
                          <th
                            key={h}
                            style={{
                              padding: "12px 16px",
                              textAlign: "left",
                              fontSize: 12,
                              color: "#6B7280",
                              fontWeight: 600,
                              borderBottom: "1px solid #E5E7EB",
                            }}
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {top10Commandes.map((p, i) => {
                        const pct = Math.round(
                          (p.commandes / top10Commandes[0].commandes) * 100
                        );
                        return (
                          <tr
                            key={i}
                            style={{
                              background: i % 2 ? "#FAFAFA" : "white",
                              borderBottom: "1px solid #F3F4F6",
                            }}
                          >
                            <td style={{ padding: "14px 16px" }}>
                              <span
                                style={{
                                  width: 28,
                                  height: 28,
                                  borderRadius: "50%",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  fontWeight: 800,
                                  fontSize: 13,
                                  background: getMedalColor(i),
                                  color: getMedalText(i),
                                }}
                              >
                                {i + 1}
                              </span>
                            </td>
                            <td style={{ padding: "14px 16px", fontWeight: 700, fontSize: 14 }}>
                              {p.produit}
                            </td>
                            <td style={{ padding: "14px 16px", fontSize: 13 }}>
                              {p.marche}
                            </td>
                            <td style={{ padding: "14px 16px", fontSize: 14, fontWeight: 700, color: "#1E3A5F" }}>
                              {p.commandes} commandes
                            </td>
                            <td style={{ padding: "14px 16px", minWidth: 150 }}>
                              <div
                                style={{
                                  background: "#F3F4F6",
                                  borderRadius: 20,
                                  height: 8,
                                  overflow: "hidden",
                                }}
                              >
                                <div
                                  style={{
                                    width: `${pct}%`,
                                    height: "100%",
                                    background: i === 0 ? "#F5C518" : "#6366F1",
                                    borderRadius: 20,
                                  }}
                                />
                              </div>
                              <div
                                style={{
                                  fontSize: 11,
                                  color: "#6B7280",
                                  marginTop: 4,
                                }}
                              >
                                {pct}%
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>

              <div
                style={{
                  background: "white",
                  borderRadius: 16,
                  padding: 24,
                  boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
                }}
              >
                <h2 style={{ margin: "0 0 20px", fontSize: 16, color: "#1E3A5F" }}>
                  📦 Top 10 — Produits avec le plus de stock
                </h2>
                {top10Stock.length === 0 ? (
                  <div
                    style={{
                      textAlign: "center",
                      padding: "32px 0",
                      color: "#9CA3AF",
                    }}
                  >
                    <div style={{ fontSize: 40, marginBottom: 8 }}>📦</div>
                    <div>Aucun stock enregistré</div>
                  </div>
                ) : (
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ background: "#F9FAFB" }}>
                        {["#","Produit","Marché","Stock dispo","Total","Statut","Performance"].map((h) => (
                          <th
                            key={h}
                            style={{
                              padding: "12px 16px",
                              textAlign: "left",
                              fontSize: 12,
                              color: "#6B7280",
                              fontWeight: 600,
                              borderBottom: "1px solid #E5E7EB",
                            }}
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {top10Stock.map((s, i) => {
                        const pct = Math.round(
                          (s.dispo / top10Stock[0].dispo) * 100
                        );
                        const isRupture = s.dispo === 0;
                        const isFaible = s.dispo <= 50 && s.dispo > 0;
                        return (
                          <tr
                            key={i}
                            style={{
                              background: i % 2 ? "#FAFAFA" : "white",
                              borderBottom: "1px solid #F3F4F6",
                            }}
                          >
                            <td style={{ padding: "14px 16px" }}>
                              <span
                                style={{
                                  width: 28,
                                  height: 28,
                                  borderRadius: "50%",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  fontWeight: 800,
                                  fontSize: 13,
                                  background: getMedalColor(i),
                                  color: getMedalText(i),
                                }}
                              >
                                {i + 1}
                              </span>
                            </td>
                            <td style={{ padding: "14px 16px", fontWeight: 700, fontSize: 14 }}>
                              {s.produit}
                            </td>
                            <td style={{ padding: "14px 16px", fontSize: 13 }}>
                              {s.marche}
                            </td>
                            <td
                              style={{
                                padding: "14px 16px",
                                fontSize: 14,
                                fontWeight: 800,
                                color: isRupture
                                  ? "#EF4444"
                                  : isFaible
                                  ? "#F59E0B"
                                  : "#10B981",
                              }}
                            >
                              {s.dispo}
                            </td>
                            <td style={{ padding: "14px 16px", fontSize: 13, color: "#6B7280" }}>
                              {s.stock_total}
                            </td>
                            <td style={{ padding: "14px 16px" }}>
                              <span
                                style={{
                                  background: isRupture
                                    ? "#FEF2F2"
                                    : isFaible
                                    ? "#FFFBEB"
                                    : "#ECFDF5",
                                  color: isRupture
                                    ? "#EF4444"
                                    : isFaible
                                    ? "#F59E0B"
                                    : "#10B981",
                                  padding: "4px 10px",
                                  borderRadius: 20,
                                  fontSize: 11,
                                  fontWeight: 600,
                                }}
                              >
                                {isRupture
                                  ? "🔴 Rupture"
                                  : isFaible
                                  ? "⚠️ Faible"
                                  : "✅ OK"}
                              </span>
                            </td>
                            <td style={{ padding: "14px 16px", minWidth: 150 }}>
                              <div
                                style={{
                                  background: "#F3F4F6",
                                  borderRadius: 20,
                                  height: 8,
                                  overflow: "hidden",
                                }}
                              >
                                <div
                                  style={{
                                    width: `${pct}%`,
                                    height: "100%",
                                    background: i === 0 ? "#10B981" : "#1E3A5F",
                                    borderRadius: 20,
                                  }}
                                />
                              </div>
                              <div
                                style={{
                                  fontSize: 11,
                                  color: "#6B7280",
                                  marginTop: 4,
                                }}
                              >
                                {pct}%
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>

            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default withAuth(Stock, "stock");