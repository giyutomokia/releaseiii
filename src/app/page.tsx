"use client";

import { useMemo, useState } from "react";
import { RELEASE_FIELDS, ReleasePackage } from "@/lib/types";

const emptyPackage: ReleasePackage = {
  completedFeatures: [],
  bugFixes: [],
  changedBehaviour: [],
  qaSummary: [],
  knownLimitations: [],
  migrationNotes: [],
  affectedUserGroups: []
};

export default function Home() {
  const [releaseName, setReleaseName] = useState("Customer Portal 3.2");
  const [pkg, setPkg] = useState<ReleasePackage>(emptyPackage);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [saved, setSaved] = useState<any>(null);
  const [tab, setTab] = useState<"internal" | "client">("internal");
  const [internalBrief, setInternalBrief] = useState("");
  const [clientBrief, setClientBrief] = useState("");
  const [message, setMessage] = useState("");

  const validationCount = useMemo(
    () => result?.validation?.filter((x: any) => x.passed).length ?? 0,
    [result]
  );

  function update(key: keyof ReleasePackage, value: string) {
    setPkg((old) => ({
      ...old,
      [key]: value.split("\n").map((x) => x.trim()).filter(Boolean)
    }));
  }

  async function analyze() {
    setLoading(true);
    setMessage("");
    setSaved(null);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pkg)
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Analysis failed");

      setResult(data);
      setInternalBrief(data.analysis.internalBrief);
      setClientBrief(data.analysis.clientBrief);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Analysis failed");
    } finally {
      setLoading(false);
    }
  }

  async function saveRelease() {
    if (!result) return;

    setSaveLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/releases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: releaseName,
          packageData: pkg,
          aiAnalysis: {
            ...result.analysis,
            internalBrief,
            clientBrief
          }
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Save failed");

      setSaved(data);
      setMessage(`Saved as Version ${data.version.version_number}.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Save failed");
    } finally {
      setSaveLoading(false);
    }
  }

  async function review(status: "APPROVED" | "REJECTED" | "UNDER_REVIEW") {
    if (!saved?.version?.id) {
      setMessage("Save the release first.");
      return;
    }

    const response = await fetch(`/api/versions/${saved.version.id}/review`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status,
        internalBrief,
        clientBrief
      })
    });

    const data = await response.json();

    if (!response.ok) {
      setMessage(data.error || "Review action failed");
      return;
    }

    setSaved((old: any) => ({ ...old, version: data }));
    setMessage(`Review status changed to ${status}.`);
  }

  function loadDemo() {
    setReleaseName("Customer Portal 3.2");
    setPkg({
      completedFeatures: [
        "Added bulk invoice upload",
        "Added invoice search by customer",
        "Added CSV export"
      ],
      bugFixes: [
        "Fixed invoice PDF download failure",
        "Fixed incorrect invoice date formatting",
        "Fixed session timeout issue"
      ],
      changedBehaviour: [
        "Invoice search now requires at least 3 characters"
      ],
      qaSummary: [
        "Bulk invoice upload tested with 100 records",
        "CSV export tested successfully",
        "Invoice PDF download tested on Chrome and Edge",
        "Session timeout tested with expired sessions"
      ],
      knownLimitations: [
        "Bulk upload currently supports CSV only",
        "Maximum upload size is 10 MB"
      ],
      migrationNotes: [
        "No database migration required",
        "New environment variable INVOICE_EXPORT_BUCKET is required"
      ],
      affectedUserGroups: [
        "Finance administrators",
        "Customer support agents",
        "Customers using invoice search"
      ]
    });
    setResult(null);
    setSaved(null);
    setMessage("Demo data loaded.");
  }

  return (
    <main className="container">
      <div className="header">
        <div className="brand">
          <h1>Release Communication & Readiness Assistant</h1>
          <p>Grounded release analysis with deterministic checks and human approval.</p>
        </div>
        <button className="btn btn-muted" onClick={loadDemo}>Load demo data</button>
      </div>

      <div className="grid">
        <section className="card">
          <h2 className="section-title">1. Release package</h2>

          <input
            className="release-name"
            value={releaseName}
            onChange={(e) => setReleaseName(e.target.value)}
            placeholder="Release name"
          />

          {RELEASE_FIELDS.map(([key, label]) => (
            <div className="field" key={key}>
              <label>{label}</label>
              <textarea
                value={pkg[key].join("\n")}
                onChange={(e) => update(key, e.target.value)}
                placeholder={`One item per line...`}
              />
              <div className="small">One item per line.</div>
            </div>
          ))}

          <div className="actions">
            <button className="btn btn-primary" disabled={loading} onClick={analyze}>
              {loading ? "Analyzing..." : "Analyze release"}
            </button>
            {result && (
              <button className="btn btn-success" disabled={saveLoading} onClick={saveRelease}>
                {saveLoading ? "Saving..." : "Save version"}
              </button>
            )}
          </div>

          {message && <p className="small">{message}</p>}
        </section>

        <section className="card">
          <h2 className="section-title">2. Readiness analysis</h2>

          {!result && (
            <p className="small">
              Enter the release package and select “Analyze release”.
            </p>
          )}

          {result && (
            <>
              <div className="item">
                <strong>Deterministic required-section checks</strong>
                <div className="small">
                  {validationCount}/7 required sections supplied
                </div>

                {result.validation.map((item: any) => (
                  <div className="check" key={item.section}>
                    <span>{item.section}</span>
                    <span className={item.passed ? "ok" : "warn"}>
                      {item.passed ? "✓ Complete" : "⚠ Missing"}
                    </span>
                  </div>
                ))}
              </div>

              <div className="panel">
                <h3>User impact</h3>
                {result.analysis.impactClassification.map((item: any, i: number) => (
                  <div className="item" key={i}>
                    <span className="badge">{item.category}</span>
                    <p>{item.reason}</p>
                    <div className="small">
                      Affected: {item.affectedGroups.join(", ") || "Not specified"}
                    </div>
                  </div>
                ))}
              </div>

              <div className="panel">
                <h3>Missing information</h3>
                {result.analysis.missingInformation.length === 0 ? (
                  <p className="ok">No obvious missing information detected.</p>
                ) : (
                  result.analysis.missingInformation.map((x: string) => (
                    <div className="item" key={x}>⚠ {x}</div>
                  ))
                )}
              </div>

              <div className="panel">
                <h3>Unsupported claims</h3>
                {result.analysis.unsupportedClaims.length === 0 ? (
                  <p className="ok">No unsupported claims detected.</p>
                ) : (
                  result.analysis.unsupportedClaims.map((x: any) => (
                    <div className="item" key={x.claim}>
                      <strong>{x.claim}</strong>
                      <p className="small">{x.reason}</p>
                    </div>
                  ))
                )}
              </div>

              <div className="panel">
                <h3>Known risks</h3>
                {result.analysis.risks.length === 0 ? (
                  <p className="ok">No additional risks identified.</p>
                ) : (
                  result.analysis.risks.map((x: string) => (
                    <div className="item" key={x}>⚠ {x}</div>
                  ))
                )}
              </div>

              <div className="panel">
                <h3>Generated briefs</h3>

                <div className="tabs">
                  <button
                    className={`tab ${tab === "internal" ? "active" : ""}`}
                    onClick={() => setTab("internal")}
                  >
                    Internal technical
                  </button>
                  <button
                    className={`tab ${tab === "client" ? "active" : ""}`}
                    onClick={() => setTab("client")}
                  >
                    Client / stakeholder
                  </button>
                </div>

                {tab === "internal" ? (
                  <textarea
                    className="brief"
                    value={internalBrief}
                    onChange={(e) => setInternalBrief(e.target.value)}
                  />
                ) : (
                  <textarea
                    className="brief"
                    value={clientBrief}
                    onChange={(e) => setClientBrief(e.target.value)}
                  />
                )}
              </div>

              <div className="panel">
                <h3>Evidence map</h3>
                {result.analysis.evidence.map((item: any, i: number) => (
                  <div className="item" key={i}>
                    <strong>{item.supported ? "✓ Supported" : "⚠ Needs review"}</strong>
                    <p>{item.statement}</p>
                    <div className="small">
                      Evidence IDs: {item.evidenceIds.join(", ") || "None"}
                    </div>
                    <div className="small">{item.reason}</div>
                  </div>
                ))}
              </div>

              <div className="panel">
                <h3>Human review</h3>
                <p className="small">
                  AI cannot approve this release. Approval is a separate human-controlled action.
                </p>
                <div className="actions">
                  <button className="btn btn-muted" onClick={() => review("UNDER_REVIEW")}>
                    Mark under review
                  </button>
                  <button className="btn btn-danger" onClick={() => review("REJECTED")}>
                    Reject
                  </button>
                  <button className="btn btn-success" onClick={() => review("APPROVED")}>
                    Approve final brief
                  </button>
                </div>
                {saved?.version?.status && (
                  <p>
                    Current status: <span className="badge">{saved.version.status}</span>
                  </p>
                )}
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}