import React, { Component } from "react";
export class ChartBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <p className="chart-unavailable" role="status">
        {this.props.fallback}
      </p>
    ) : (
      this.props.children
    );
  }
}
