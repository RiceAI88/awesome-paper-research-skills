import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "antd/dist/reset.css";
import "./styles.css";
class ErrorBoundary extends React.Component {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <main style={{ padding: 32 }}>
        <h1>页面暂时无法显示 / Unable to display the page</h1>
        <p>请刷新页面后重试。 / Please refresh and try again.</p>
        <a href="https://github.com/RiceAI88/awesome-paper-research-skills">
          GitHub
        </a>
      </main>
    ) : (
      this.props.children
    );
  }
}
createRoot(document.getElementById("root")).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>,
);
