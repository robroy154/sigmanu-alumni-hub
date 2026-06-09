import type * as React from "react";

// Shared inline style objects used across all email templates.
// All values must be email-safe — no CSS classes, no shorthand where clients
// are known to misparse (e.g. use borderTopWidth + borderTopColor rather than
// the `border` shorthand for dividers).

export const heading1: React.CSSProperties = {
  color: "#ffffff",
  fontSize: "22px",
  fontWeight: "bold",
  margin: "0 0 12px",
  lineHeight: "1.3",
  fontFamily: "Georgia, 'Times New Roman', serif",
};

export const bodyText: React.CSSProperties = {
  color: "rgba(255,255,255,0.75)",
  fontSize: "15px",
  lineHeight: "1.7",
  margin: "0 0 14px",
  fontFamily: "Arial, sans-serif",
};

export const ctaButton: React.CSSProperties = {
  display: "inline-block",
  backgroundColor: "#C6A75E",
  color: "#0B0B0C",
  fontFamily: "Arial, sans-serif",
  fontSize: "14px",
  fontWeight: "bold",
  padding: "12px 28px",
  borderRadius: "8px",
  textDecoration: "none",
  letterSpacing: "0.5px",
};

export const ctaSection: React.CSSProperties = {
  textAlign: "center",
  margin: "28px 0",
};

export const labelCell: React.CSSProperties = {
  color: "#C6A75E",
  fontSize: "11px",
  fontWeight: "bold",
  letterSpacing: "2px",
  textTransform: "uppercase",
  fontFamily: "Arial, sans-serif",
  paddingRight: "16px",
  paddingBottom: "10px",
  whiteSpace: "nowrap",
  verticalAlign: "top",
};

export const valueCell: React.CSSProperties = {
  color: "#ffffff",
  fontSize: "15px",
  fontFamily: "Arial, sans-serif",
  paddingBottom: "10px",
};

export const divider: React.CSSProperties = {
  borderTopWidth: "1px",
  borderTopStyle: "solid",
  borderTopColor: "rgba(198,167,94,0.2)",
  borderBottom: "none",
  borderLeft: "none",
  borderRight: "none",
  margin: "20px 0",
};

export const gold: React.CSSProperties = { color: "#C6A75E" };
export const white: React.CSSProperties = { color: "#ffffff" };

export const bulletRow: React.CSSProperties = {
  color: "rgba(255,255,255,0.7)",
  fontFamily: "Arial, sans-serif",
  fontSize: "14px",
  paddingBottom: "4px",
};
