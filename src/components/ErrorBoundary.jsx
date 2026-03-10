import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log to console or send to monitoring
    // eslint-disable-next-line no-console
    console.error("App crashed:", error, errorInfo);
  }

  handleReload = () => {
    // Prefer soft navigation if available
    if (typeof window !== "undefined") window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          background: "#F8FAFF",
          padding: 24,
        }}>
          <div style={{
            maxWidth: 520,
            width: "100%",
            background: "white",
            border: "1px solid #E5EAF2",
            borderRadius: 16,
            padding: 24,
            boxShadow: "0 10px 30px rgba(0,0,0,0.05)",
            textAlign: "center",
          }}>
            <h1 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: "#0F172A" }}>
              Something went wrong
            </h1>
            <p style={{ color: "#475569", fontSize: 14, marginTop: 8 }}>
              The app hit an unexpected error. Try reloading the page.
            </p>
            <button
              onClick={this.handleReload}
              style={{
                marginTop: 16,
                padding: "10px 16px",
                background: "#2081C3",
                color: "#fff",
                borderRadius: 10,
                border: "none",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Reload
            </button>
            <pre style={{
              marginTop: 16,
              padding: 12,
              background: "#F8FAFF",
              border: "1px solid #E5EAF2",
              borderRadius: 8,
              textAlign: "left",
              color: "#64748B",
              fontSize: 12,
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
            }}>
              {String(this.state.error ?? "")} 
            </pre>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
