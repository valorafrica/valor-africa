"use client";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

const rolePages: any = {
  media_buyer: ["/media-buyer"],
  crc: ["/confirmation"],
  crl: ["/logistique"],
  livreur: ["/livreur"],
  stock: ["/stock"],
  comptable: ["/comptable"],
  manager: ["/dashboard", "/media-buyer", "/confirmation", "/logistique", "/livreur", "/stock", "/comptable", "/equipe"],
};

export default function withAuth(Component: any, allowedRole: string) {
  return function ProtectedPage(props: any) {
    const [loading, setLoading] = useState(true);
    const [authorized, setAuthorized] = useState(false);

    useEffect(() => {
      const checkAuth = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          window.location.href = "/";
          return;
        }
        const { data: profile } = await supabase
          .from("Profiles")
          .select("role")
          .eq("email", user.email)
          .single();

        if (!profile) {
          window.location.href = "/";
          return;
        }

        const currentPath = window.location.pathname;
        const allowedPaths = rolePages[profile.role] || [];

        if (profile.role === "manager" || allowedPaths.includes(currentPath)) {
          setAuthorized(true);
        } else {
          const redirectPath = allowedPaths[0] || "/";
          window.location.href = redirectPath;
        }
        setLoading(false);
      };
      checkAuth();
    }, []);

    if (loading) return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#F0F4F8" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🌍</div>
          <div style={{ fontSize: 16, color: "#6B7280" }}>Chargement...</div>
        </div>
      </div>
    );

    if (!authorized) return null;

    return <Component {...props} />;
  };
}