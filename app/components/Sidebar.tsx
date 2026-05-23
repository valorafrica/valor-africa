"use client";
import { useState } from "react";

const menuItems = [
  { label: "Dashboard", icon: "📊", href: "/dashboard" },
  { label: "Leads", icon: "📋", href: "/media-buyer" },
  { label: "Confirmation", icon: "📞", href: "/confirmation" },
  { label: "Logistique", icon: "🚚", href: "/logistique" },
  { label: "Livreurs", icon: "🚗", href: "/livreur" },
  { label: "Stock", icon: "📦", href: "/stock" },
  { label: "Comptable", icon: "💰", href: "/comptable" },
  { label: "Équipe", icon: "👥", href: "/equipe" },
];

export default function Sidebar({ role }: { role?: string }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div style={{
      width: collapsed ? 60 : 240,
      minHeight: "100vh",
      background: "linear-gradient(180deg, #1E3A5F 0%, #152D4A 100%)",
      display: "flex",
      flexDirection: "column",
      transition: "width 0.3s",
      position: "fixed",
      left: 0,
      top: 0,
      bottom: 0,
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
      {!collapsed && role && (
        <div style={{
          margin: "12px 16px",
          padding: "8px 12px",
          background: "rgba(255,255,255,0.1)",
          borderRadius: 8,
          color: "#A8C8E8",
          fontSize: 12,
          fontWeight: 600
        }}>
          {role}
        </div>
      )}

      {/* Menu */}
      <nav style={{ flex: 1, padding: "8px 0" }}>
        {menuItems.map((item) => {
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

      {/* Footer */}
      {!collapsed && (
        <div style={{
          padding: "16px 20px",
          borderTop: "1px solid rgba(255,255,255,0.1)",
          color: "#A8C8E8",
          fontSize: 11
        }}>
          © 2026 Valor Africa
        </div>
      )}
    </div>
  );
}