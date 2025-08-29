import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../../supa/Supabaseclient";

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

const menu = [
  { path: "/dashboard", label: "Home", icon: <span className="text-lg">🏠</span> },
  { path: "/dashboard/profile", label: "Profile", icon: <span className="text-lg">👤</span> },
];

const Sidebar: React.FC<SidebarProps> = ({
  collapsed,
  onToggle,
  mobileOpen,
  onMobileClose,
}) => {
  const location = useLocation();
  const { session, signOut } = useAuth();
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!session?.user?.email) return;
      const { data } = await supabase
        .from("users")
        .select("name, email, avatar")
        .eq("email", session.user.email)
        .single();
      if (data) setProfile(data);
    };
    fetchProfile();
  }, [session?.user?.email]);

  const user = {
    avatar: profile?.avatar || session?.user?.avatar_url || session?.user?.user_metadata?.avatar_url || "https://ui-avatars.com/api/?name=User",
    name: profile?.name ||
      session?.user?.user_metadata?.name ||
      session?.user?.user_metadata?.full_name ||
      session?.user?.email?.split("@")[0] ||
      "User",
    email: profile?.email || session?.user?.email || "",
  };

  const profileSection = (
    <div className="flex items-center gap-3 mb-4 px-4 py-2">
      <img
        className="w-12 h-12 rounded-full border-2"
        style={{ borderColor: "#6D28D9" }}
        src={user.avatar}
        alt={user.name}
      />
      {!collapsed && (
        <div className="flex flex-col">
          <span className="text-base font-semibold" style={{ color: "#FFFDEB" }}>{user.name}</span>
          <span className="text-xs" style={{ color: "#B7A1E2" }}>{user.email}</span>
        </div>
      )}
    </div>
  );

  const logoutButton = (
    <button
      onClick={async () => {
        await signOut();
        window.location.href = "/";
      }}
      style={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "8px 16px",
        textAlign: "left",
        color: "#FFB300",
        background: "none",
        border: "none",
        borderRadius: 8,
        fontWeight: 600,
        marginBottom: 20,
        transition: "background 0.2s",
        cursor: "pointer",
      }}
      onMouseOver={e => (e.currentTarget.style.background = "#FFFDEB22")}
      onMouseOut={e => (e.currentTarget.style.background = "none")}
    >
      <span className="text-lg">📕</span>
      {!collapsed && <span>Logout</span>}
    </button>
  );

  // Desktop sidebar with BookNest palette
  const desktopSidebar = (
    <aside
      className={`
        hidden md:flex flex-col min-h-screen transition-all duration-300
        ${collapsed ? "w-16" : "w-64"}
        `}
      style={{
        background: "linear-gradient(90deg, #6D28D9 60%, #5B21B6 100%)",
        color: "#FFFDEB",
      }}
    >
      <div className="flex items-center justify-between p-4" style={{ borderBottom: "1px solid #5B21B6" }}>
        <span
          className={`font-bold text-2xl transition-opacity ${collapsed ? "opacity-0 pointer-events-none" : "opacity-100"}`}
          style={{ color: "#FFFDEB" }}
        >
          BookNest
        </span>
      </div>
      {profileSection}
      <nav className="flex-1 p-2 space-y-1">
        {menu.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "8px 16px",
              borderRadius: 10,
              color: location.pathname === item.path ? "#6D28D9" : "#FFFDEB",
              background: location.pathname === item.path ? "#FFFDEB" : "none",
              fontWeight: location.pathname === item.path ? 700 : 500,
              transition: "background 0.2s, color 0.2s",
              fontSize: 16,
              marginBottom: 4,
            }}
            onMouseOver={e => {
              if (location.pathname !== item.path) {
                e.currentTarget.style.background = "#5B21B6";
                e.currentTarget.style.color = "#FFFDEB";
              }
            }}
            onMouseOut={e => {
              if (location.pathname !== item.path) {
                e.currentTarget.style.background = "none";
                e.currentTarget.style.color = "#FFFDEB";
              }
            }}
          >
            {item.icon}
            <span className={`${collapsed ? "hidden" : "inline"}`}>{item.label}</span>
          </Link>
        ))}
      </nav>
      <div className="mt-auto px-2 pb-4">{logoutButton}</div>
    </aside>
  );

  // Mobile Sidebar (BookNest palette)
  const mobileSidebar = (
    <aside
      className={`
        fixed inset-0 z-40 bg-black bg-opacity-40 md:hidden
        ${mobileOpen ? "block" : "hidden"}
      `}
      onClick={onMobileClose}
    >
      <div
        className="w-64 min-h-screen flex flex-col"
        style={{
          background: "linear-gradient(90deg, #6D28D9 60%, #5B21B6 100%)",
          color: "#FFFDEB",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4" style={{ borderBottom: "1px solid #5B21B6" }}>
          <span className="font-bold text-2xl" style={{ color: "#FFFDEB" }}>BookNest</span>
          <button
            aria-label="Close Sidebar"
            className="p-2"
            style={{
              color: "#FFFDEB",
              background: "none",
              border: "none",
              borderRadius: 8,
              transition: "background 0.2s",
              marginLeft: "auto",
              cursor: "pointer",
            }}
            onClick={onMobileClose}
            onMouseOver={e => (e.currentTarget.style.background = "#5B21B6")}
            onMouseOut={e => (e.currentTarget.style.background = "none")}
          >
            ✖️
          </button>
        </div>
        {profileSection}
        <nav className="flex-1 p-2 space-y-1">
          {menu.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={onMobileClose}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "8px 16px",
                borderRadius: 10,
                color: location.pathname === item.path ? "#6D28D9" : "#FFFDEB",
                background: location.pathname === item.path ? "#FFFDEB" : "none",
                fontWeight: location.pathname === item.path ? 700 : 500,
                transition: "background 0.2s, color 0.2s",
                fontSize: 16,
                marginBottom: 4,
              }}
              onMouseOver={e => {
                if (location.pathname !== item.path) {
                  e.currentTarget.style.background = "#5B21B6";
                  e.currentTarget.style.color = "#FFFDEB";
                }
              }}
              onMouseOut={e => {
                if (location.pathname !== item.path) {
                  e.currentTarget.style.background = "none";
                  e.currentTarget.style.color = "#FFFDEB";
                }
              }}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
        <div className="mt-auto px-2 pb-4">{logoutButton}</div>
      </div>
    </aside>
  );

  return (
    <>
      {desktopSidebar}
      {mobileSidebar}
    </>
  );
};

export default Sidebar;