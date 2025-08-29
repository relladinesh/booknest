import React from "react";

interface HomePostCardProps {
  title: string;
  description: string;
  imageUrl: string;
  onApply: () => void;
  onMoreDetails: () => void;
  boughtYear?: string;
  username?: string;
  subject?: string;
  isApplied?: boolean;
}

const HomePostCard: React.FC<HomePostCardProps> = ({
  title,
  description,
  imageUrl,
  onApply,
  onMoreDetails,
  boughtYear,
  username,
  subject,
  isApplied = false,
}) => (
  <div
    style={{
      background: "#FFFFFF",
      boxShadow: "0 4px 24px #6D28D914",
      borderRadius: 20,
      overflow: "hidden",
      display: "flex",
      flexDirection: "column",
      position: "relative",
      border: "1px solid #E5E7EB",
      transition: "box-shadow 0.2s, transform 0.2s",
    }}
    className="group hover:shadow-2xl hover:-translate-y-1"
  >
    <img
      src={imageUrl}
      alt={title}
      style={{
        width: "100%",
        height: 240,
        objectFit: "cover",
        background: "#F3F6FF",
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
      }}
    />
    <div style={{ padding: 22, display: "flex", flexDirection: "column", flex: 1 }}>
      <h4 style={{
        fontWeight: 700,
        fontSize: 22,
        marginBottom: 8,
        color: "#232946",
        letterSpacing: 0.3,
      }}>
        {title}
      </h4>
      {subject && (
        <div
          style={{
            fontSize: 13,
            color: "#6D28D9",
            background: "#E9EAFE",
            display: "inline-block",
            padding: "4px 14px",
            borderRadius: 12,
            marginBottom: 10,
            fontWeight: 600,
            letterSpacing: 0.5,
          }}
        >
          {subject}
        </div>
      )}
      <p style={{
        color: "#232946",
        marginBottom: 12,
        fontSize: 15,
        flex: 1,
        minHeight: 48,
      }}>
        {description}
      </p>
      <div style={{ fontSize: 13, color: "#78716C", marginBottom: 14, display: "flex", flexWrap: "wrap", gap: 8, fontWeight: 500 }}>
        {boughtYear && (
          <span
            style={{
              background: "#E9EAFE",
              color: "#5B21B6",
              padding: "2px 10px",
              borderRadius: 999,
              fontSize: 13,
            }}
          >
            Bought Year: {boughtYear}
          </span>
        )}
        {username && (
          <span
            style={{
              background: "#FFFDEB",
              color: "#6D28D9",
              padding: "2px 10px",
              borderRadius: 999,
              fontSize: 13,
            }}
          >
            Seller: {username}
          </span>
        )}
      </div>
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 13, color: "#78716C" }}>
          <span style={{ fontWeight: 700, color: "#6D28D9" }}>More Details:</span>{" "}
          This seller is verified and the book is available for prompt delivery. Click 'More Details' to view the full description, contact info, and book status.
        </div>
      </div>
      <div style={{ display: "flex", gap: 10, marginTop: "auto" }}>
        <button
          onClick={onApply}
          style={{
            background: isApplied ? "#B7A1E2" : "#6D28D9",
            color: "#FFFFFF",
            padding: "10px 0",
            borderRadius: 8,
            fontWeight: 700,
            fontSize: 16,
            border: "none",
            cursor: isApplied ? "not-allowed" : "pointer",
            opacity: isApplied ? 0.8 : 1,
            flex: 1,
            transition: "background 0.2s, opacity 0.2s",
          }}
          disabled={isApplied}
        >
          {isApplied ? "Applied" : "Apply"}
        </button>
        <button
          onClick={onMoreDetails}
          style={{
            background: "#F3F6FF",
            color: "#6D28D9",
            padding: "10px 0",
            borderRadius: 8,
            fontWeight: 700,
            fontSize: 16,
            border: "1px solid #E5E7EB",
            flex: 1,
            transition: "background 0.2s, color 0.2s",
            cursor: "pointer",
          }}
        >
          More Details
        </button>
      </div>
    </div>
  </div>
);

export default HomePostCard;