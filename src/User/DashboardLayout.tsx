import React, { useEffect, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import Sidebar from "../Component/Sidebar";
import { BookOpen, MessageSquare } from "lucide-react";
import { supabase } from "../../supa/Supabaseclient"; // adjust import path as needed

const routeTitles = {
  "/dashboard": "Home",
  "/dashboard/profile": "Profile",
  "/dashboard/settings": "Settings",
  "/dashboard/posts": "Posts",
};

const Topbar = ({
  onMobileOpen,
  pageTitle,
  onBookRequestsClick,
  onBookRequestedByMeClick,
  bookRequestsCount,
  bookRequestedByMeCount,
}) => (
  <header
    style={{
      width: "100%",
      height: 64,
      background: "#FFFFFF",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "0 2rem",
      boxShadow: "0 2px 8px 0 rgba(91,33,182,0.08)",
      flexShrink: 0,
    }}
  >
    <button
      className="md:hidden p-2"
      style={{
        color: "#232946",
        background: "#F3F6FF",
        borderRadius: 8,
        border: "none",
        outline: "none",
        cursor: "pointer",
      }}
      onClick={onMobileOpen}
      aria-label="Open menu"
    >
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
      </svg>
    </button>
    <div style={{ color: "#232946", fontWeight: 600, fontSize: 20 }}>
      {pageTitle}
    </div>
    <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
      {/* Response icon with badge (requests for my posts) */}
      <div style={{ position: "relative" }}>
        <MessageSquare
          style={{
            width: 28, height: 28,
            color: "#6D28D9",
            cursor: "pointer",
          }}
          aria-label="Requests For My Posts"
          title="Requests For My Posts"
          onClick={onBookRequestsClick}
        />
        <span
          style={{
            position: "absolute",
            top: -10,
            right: -10,
            background: "#F59E42",
            color: "#232946",
            fontSize: 12,
            fontWeight: "bold",
            width: 20,
            height: 20,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "50%",
            border: "2px solid #FFFFFF",
            boxShadow: "0 1px 4px rgba(91,33,182,0.14)",
          }}
        >
          {bookRequestsCount}
        </span>
      </div>
      {/* Open Book icon with badge (books I applied for via applied_books) */}
      <div style={{ position: "relative" }}>
        <BookOpen
          style={{
            width: 28, height: 28,
            color: "#6D28D9",
            cursor: "pointer",
          }}
          aria-label="Books I Applied For"
          title="Books I Applied For"
          onClick={onBookRequestedByMeClick}
        />
        <span
          style={{
            position: "absolute",
            top: -10,
            right: -10,
            background: "#F59E42",
            color: "#232946",
            fontSize: 12,
            fontWeight: "bold",
            width: 20,
            height: 20,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "50%",
            border: "2px solid #FFFFFF",
            boxShadow: "0 1px 4px rgba(91,33,182,0.14)",
          }}
        >
          {bookRequestedByMeCount}
        </span>
      </div>
    </div>
  </header>
);

const DashboardLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [bookRequestsCount, setBookRequestsCount] = useState(0);
  const [bookRequestedByMeCount, setBookRequestedByMeCount] = useState(0);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCounts = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get current user profile
      const { data: userProfile } = await supabase
        .from("users")
        .select("id")
        .eq("email", user.email)
        .single();
      if (!userProfile) return;

      // 1. Get all post IDs owned by me
      const { data: myPosts } = await supabase
        .from("posts")
        .select("id")
        .eq("user_id", userProfile.id);

      const myPostIds = (myPosts || []).map((p) => p.id);

      // 2. Count requests for my posts (applied_books where post_id in my posts)
      let requestsForMyPosts = 0;
      if (myPostIds.length > 0) {
        const { count } = await supabase
          .from("applied_books")
          .select("id", { count: "exact", head: true })
          .in("post_id", myPostIds);
        requestsForMyPosts = count || 0;
      }

      // 3. Count books I applied for (applied_books where user_id is me)
      const { count: booksIAppliedFor } = await supabase
        .from("applied_books")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userProfile.id);

      setBookRequestsCount(requestsForMyPosts);
      setBookRequestedByMeCount(booksIAppliedFor || 0);
    };
    fetchCounts();
  }, []);

  const pageTitle =
    routeTitles[location.pathname] ||
    Object.entries(routeTitles).find(([path]) =>
      location.pathname.startsWith(path)
    )?.[1] ||
    "Dashboard";

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        height: "100vh",
        background: "#F3F6FF",
      }}
    >
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((v) => !v)}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
        <Topbar
          onMobileOpen={() => setMobileOpen(true)}
          pageTitle={pageTitle}
          onBookRequestsClick={() => navigate("/dashboard/RequestBook")}
          onBookRequestedByMeClick={() => navigate("/dashboard/BookRequestedByMe")}
          bookRequestsCount={bookRequestsCount}
          bookRequestedByMeCount={bookRequestedByMeCount}
        />
        <main style={{ flex: 1, overflow: "auto", padding: "1rem 2rem" }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;