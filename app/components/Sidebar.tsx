"use client";
import { useState } from "react";

const menus: any = {
  manager: [
    { label: "Dashboard", icon: "📊", href: "/dashboard" },
    { label: "Tous les leads", icon: "📋", href: "/media-buyer" },
    { label: "Confirmation", icon: "📞", href: "/confirmation" },
    { label: "Logistique", icon: "🚚", href: "/logistique" },
    { label: "Livreurs", icon: "🚗", href: "/livreur" },
    { label: "Stock", icon: "📦", href: "/stock" },
    { label: "Comptable", icon: "💰", href: "/comptable" },
    { label: "Équipe", icon: "👥", href: "/equipe" },
  ],
  media_buyer: [
    { label: "Mes Leads", icon: "📋", href: "/media-buyer" },
  ],
  crc: [
    { label: "Leads à confirmer", icon: "📞", href: "/confirmation" },
  ],
  crl: [
    { label: "Logistique", icon: "🚚", href: "/logistique" },
  ],
  livreur: [
    { label: "Mes Livraisons", icon: "🚗", href: "/livreur" },
  ],
  stock: [
    { label: "Gestion Stock", icon: "📦", href: "/stock" },
  ],
  comptable: [
    { label: "Comptabilité", icon: "💰", href: "/comptable" },
  ],
};

const roleLabels: any = {
  manager: "👑 Manager",
  media_buyer: "📊 Media Buyer",
  crc: "📞 Agent Confirmation",
  crl: "🚚 Agent Logistique",
  livreur: "🚗 Livreur",
  stock: "📦 Équipe Stock",
  comptable: "💰 Comptable",
};

export default function Sidebar({ role }: { role: string }) {
  const [collapsed, setCollapsed] = useState(false);
  const items = menus[role] || menus.manager;

  return (
    <div style={{
      width: collapsed ? 60 : 240,
      minHeight: "100vh",
      background: "linear-gradient(180deg, #1E3A5F 0%, #152D4A 100%)",
      display: "flex",
      flexDirection: "column",
      transition: "width 0.3s",
      position: "fixed",
      left: 0, top: 0, bottom: 0,
      zIndex: 100,
      boxShadow: "2px 0 8px rgba(0,0,0,0.2)"
    }}>
      {/* Logo */}
      <div style={{
        padding: collapsed ? "16px 8px" : "16px 20px",
        borderBottom: "1px solid rgba(255,255,255,0.1)",
        display: "flex",
        alignItems: "center",
        justifyContent: collapsed ? "center" : "space-between"
      }}>
        {!collapsed && (
          <img src="/logo.svg" alt="Valor Africa" style={{ height: 45, width: "auto" }} />
        )}
        {collapsed && <span style={{ fontSize: 24 }}>🌍</span>}
        <button onClick={() => setCollapsed(!collapsed)} style={{
          background: "none", border: "none", cursor: "pointer",
          color: "white", fontSize: 18, padding: 4
        }}>
          {collapsed ? "→" : "←"}
        </button>
      </div>

      {/* Role badge */}
      {!collapsed && (
        <div style={{
          margin: "12px 16px",
          padding: "8px 12px",
          background: "rgba(255,255,255,0.1)",
          borderRadius: 8,
          color: "#A8C8E8",
          fontSize: 12,
          fontWeight: 600
        }}>
          {roleLabels[role] || role}
        </div>
      )}

      {/* Menu */}
      <nav style={{ flex: 1, padding: "8px 0" }}>
        {items.map((item: any) => {
          const isActive = typeof window !== "undefined" && window.location.pathname === item.href;
          return (
            <a key={item.href} href={item.href} style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: collapsed ? "14px 18px" : "14px 20px",
              color: isActive ? "#F5C518" : "#A8C8E8",
              textDecoration: "none",
              fontSize: 14,
              fontWeight: isActive ? 700 : 400,
              background: isActive ? "rgba(245,197,24,0.1)" : "transparent",
              borderLeft: isActive ? "3px solid #F5C518" : "3px solid transparent",
              transition: "all 0.2s"
            }}>
              <span style={{ fontSize: 18 }}>{item.icon}</span>
              {!collapsed && <span>{item.label}</span>}
            </a>
          );
        })}
      </nav>

      {/* Déconnexion */}
      {!collapsed && (
        <div style={{ padding: "16px 20px", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
          <button onClick={() => { window.location.href = "/"; }} style={{
            width: "100%", padding: "10px", background: "rgba(239,68,68,0.15)",
            color: "#FCA5A5", border: "1px solid rgba(239,68,68,0.3)",
            borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 13
          }}>
            🚪 Se déconnecter
          </button>
        </div>
      )}
    </div>
  );
}