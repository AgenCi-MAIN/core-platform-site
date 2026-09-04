export type MCPConnectionState =
  | "connected"
  | "disconnected"
  | "error"
  | "unknown";

export type MCPAuthState =
  | "authenticated"
  | "needs_auth"
  | "unknown";

export interface MCPStatus {
  connection: {
    state: MCPConnectionState;
    label: string;
    verified: boolean;
  };
  authentication: {
    state: MCPAuthState;
    label: string;
    verified: boolean;
  };
  permissions: {
    readOnly: boolean;
    label: string;
    verified: boolean;
  };
  tools?: {
    count: number;
    verified: boolean;
  };
  lastVerified?: {
    timestamp: string;
    verified: boolean;
  };
}

function StateIndicator({ state, label, verified }: { state: string; label: string; verified: boolean }) {
  const statusClass = state === "connected" || state === "authenticated"
    ? "mcp-status-ok"
    : state === "unknown"
    ? "mcp-status-unknown"
    : "mcp-status-error";

  const verificationLabel = verified ? "Verified" : "Unknown";

  return (
    <div className="mcp-state-row">
      <span className={`mcp-indicator ${statusClass}`} />
      <span className="mcp-label">{label}</span>
      <span className={`mcp-verification mcp-verification-${verified ? "verified" : "unknown"}`}>
        {verificationLabel}
      </span>
    </div>
  );
}

export function MCPStatusPanel({ status, lastRefreshTime }: { status: MCPStatus; lastRefreshTime?: string }) {
  return (
    <article className="fcc-panel fcc-mcp-status" aria-labelledby="mcp-status-title">
      <header className="fcc-panel-head">
        <div>
          <p>MCP Integration</p>
          <h2 id="mcp-status-title">n8n MCP Server Status</h2>
        </div>
        <span className="fcc-mcp-status-chip" aria-label={`Connection: ${status.connection.label}`}>
          {status.connection.state === "connected" ? "● Connected" : "○ Not Connected"}
        </span>
      </header>

      <div className="mcp-status-content">
        <section className="mcp-status-section">
          <h3>Connection State</h3>
          <StateIndicator
            state={status.connection.state}
            label={status.connection.label}
            verified={status.connection.verified}
          />
        </section>

        <section className="mcp-status-section">
          <h3>Authentication</h3>
          <StateIndicator
            state={status.authentication.state}
            label={status.authentication.label}
            verified={status.authentication.verified}
          />
        </section>

        <section className="mcp-status-section">
          <h3>Permissions</h3>
          <StateIndicator
            state={status.permissions.readOnly ? "readonly" : "unknown"}
            label={status.permissions.label}
            verified={status.permissions.verified}
          />
        </section>

        {status.tools ? (
          <section className="mcp-status-section">
            <h3>Available Tools</h3>
            <div className="mcp-state-row">
              <span className="mcp-value">{status.tools.count}</span>
              <span className="mcp-label">tools</span>
              <span className={`mcp-verification mcp-verification-${status.tools.verified ? "verified" : "unknown"}`}>
                {status.tools.verified ? "Verified" : "Unknown"}
              </span>
            </div>
          </section>
        ) : null}

        {status.lastVerified ? (
          <section className="mcp-status-section">
            <h3>Last Verified</h3>
            <div className="mcp-state-row">
              <span className="mcp-value">{status.lastVerified.timestamp}</span>
              <span className={`mcp-verification mcp-verification-${status.lastVerified.verified ? "verified" : "unknown"}`}>
                {status.lastVerified.verified ? "Verified" : "Unknown"}
              </span>
            </div>
          </section>
        ) : null}

        {lastRefreshTime ? (
          <p className="mcp-refresh-note">Status checked at {lastRefreshTime}</p>
        ) : null}
      </div>

      <p className="mcp-status-note">
        This panel displays the read-only connection state of the n8n MCP server.
        No write operations are available from this surface. All tool counts and timestamps are verified or explicitly marked as unknown.
      </p>
    </article>
  );
}
