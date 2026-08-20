"use client";

import { useState, useCallback } from "react";

type Gender = "male" | "female";
type TobaccoStatus = "non-tobacco" | "tobacco";
type HealthClass = "preferred" | "standard" | "graded" | "guaranteed";

interface QuoteResult {
  carrier: string;
  plan: string;
  healthClass: HealthClass;
  monthlyPremium: number;
  annualPremium: number;
  faceAmount: number;
}

const FACE_AMOUNTS = [5000, 7500, 10000, 15000, 20000, 25000, 30000, 35000, 40000];

const BASE_RATES: Record<HealthClass, number> = {
  preferred: 0.55,
  standard: 0.72,
  graded: 0.95,
  guaranteed: 1.18,
};

const TOBACCO_MULTIPLIER = 1.45;
const GENDER_FACTOR: Record<Gender, number> = { male: 1.0, female: 0.88 };

function computeRate(age: number, gender: Gender, tobacco: TobaccoStatus, healthClass: HealthClass, face: number): number {
  const base = BASE_RATES[healthClass];
  const ageFactor = 1 + (Math.max(age - 40, 0) * 0.028) + (Math.max(age - 60, 0) * 0.015) + (Math.max(age - 70, 0) * 0.022);
  const tobaccoFactor = tobacco === "tobacco" ? TOBACCO_MULTIPLIER : 1.0;
  const genderFactor = GENDER_FACTOR[gender];
  return Math.round(((face / 1000) * base * ageFactor * tobaccoFactor * genderFactor) * 100) / 100;
}

const CARRIERS = [
  { name: "CUNA Mutual", plan: "Final Expense Whole Life", classes: ["preferred", "standard", "graded"] as HealthClass[] },
  { name: "Mutual of Omaha", plan: "Living Promise", classes: ["standard", "graded", "guaranteed"] as HealthClass[] },
  { name: "AIG", plan: "Guaranteed Issue WL", classes: ["guaranteed"] as HealthClass[] },
  { name: "Transamerica", plan: "Final Expense", classes: ["preferred", "standard", "graded"] as HealthClass[] },
  { name: "Americo", plan: "Eagle Premier", classes: ["preferred", "standard"] as HealthClass[] },
];

const HEALTH_CLASS_LABELS: Record<HealthClass, string> = {
  preferred: "Preferred",
  standard: "Standard",
  graded: "Graded benefit",
  guaranteed: "Guaranteed issue",
};

export function QuoterTool() {
  const [age, setAge] = useState("");
  const [gender, setGender] = useState<Gender>("male");
  const [tobacco, setTobacco] = useState<TobaccoStatus>("non-tobacco");
  const [faceAmount, setFaceAmount] = useState(10000);
  const [results, setResults] = useState<QuoteResult[] | null>(null);

  const runQuote = useCallback(() => {
    const parsedAge = parseInt(age, 10);
    if (isNaN(parsedAge) || parsedAge < 20 || parsedAge > 85) return;

    const quotes: QuoteResult[] = [];
    for (const carrier of CARRIERS) {
      for (const hc of carrier.classes) {
        if (hc === "guaranteed" && parsedAge < 50) continue;
        if (hc === "preferred" && parsedAge > 75) continue;
        const monthly = computeRate(parsedAge, gender, tobacco, hc, faceAmount);
        quotes.push({
          carrier: carrier.name,
          plan: carrier.plan,
          healthClass: hc,
          monthlyPremium: monthly,
          annualPremium: Math.round(monthly * 11.2 * 100) / 100,
          faceAmount,
        });
      }
    }
    quotes.sort((a, b) => a.monthlyPremium - b.monthlyPremium);
    setResults(quotes);
  }, [age, gender, tobacco, faceAmount]);

  return (
    <div className="quoter-tool">
      <style>{`
        .quoter-tool {
          --qt-text: var(--portal-text, #241b10);
          --qt-muted: var(--portal-muted, #665b4b);
          --qt-panel: var(--portal-panel, #fffaf1);
          --qt-line: var(--portal-line, #e5dac8);
          --qt-soft: var(--portal-soft, #f5eedf);
          --qt-accent: var(--portal-accent, #6d42e5);
          --qt-radius: 12px;
        }
        .quoter-form {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 16px;
          padding: 24px;
          border: 1px solid var(--qt-line);
          border-radius: var(--qt-radius);
          background: var(--qt-panel);
          margin-bottom: 20px;
        }
        .quoter-field { display: flex; flex-direction: column; gap: 6px; }
        .quoter-field.full { grid-column: 1 / -1; }
        .quoter-label {
          font: 700 10px/1 system-ui, sans-serif;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--qt-muted);
        }
        .quoter-input, .quoter-select {
          padding: 10px 12px;
          border: 1px solid var(--qt-line);
          border-radius: 8px;
          background: var(--qt-soft);
          color: var(--qt-text);
          font: 400 14px/1.4 system-ui, sans-serif;
        }
        .quoter-input:focus, .quoter-select:focus {
          outline: 2px solid var(--qt-accent);
          outline-offset: 1px;
          border-color: transparent;
        }
        .quoter-actions { display: flex; gap: 10px; align-items: end; }
        .quoter-run {
          padding: 10px 24px;
          border: none;
          border-radius: 8px;
          background: var(--qt-accent);
          color: white;
          font: 700 14px/1 system-ui, sans-serif;
          cursor: pointer;
          transition: background 0.15s;
          white-space: nowrap;
        }
        .quoter-run:hover { filter: brightness(0.9); }
        .quoter-run:focus-visible { outline: 2px solid var(--qt-accent); outline-offset: 2px; }
        .quoter-run:disabled { opacity: 0.5; cursor: not-allowed; }

        .quoter-results {
          border: 1px solid var(--qt-line);
          border-radius: var(--qt-radius);
          overflow: hidden;
        }
        .quoter-results-head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          border-bottom: 1px solid var(--qt-line);
          background: var(--qt-panel);
        }
        .quoter-results-head h3 {
          margin: 0;
          font: 700 15px/1.2 system-ui, sans-serif;
          color: var(--qt-text);
        }
        .quoter-results-head small {
          color: var(--qt-muted);
          font: 500 11px/1 system-ui, sans-serif;
        }
        .quoter-table-wrap { overflow-x: auto; }
        .quoter-table {
          width: 100%;
          border-collapse: collapse;
          font: 400 13px/1.4 system-ui, sans-serif;
        }
        .quoter-table th {
          padding: 10px 16px;
          text-align: left;
          font: 700 10px/1 system-ui, sans-serif;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: var(--qt-muted);
          background: var(--qt-soft);
          border-bottom: 1px solid var(--qt-line);
          white-space: nowrap;
        }
        .quoter-table td {
          padding: 12px 16px;
          color: var(--qt-text);
          border-bottom: 1px solid var(--qt-line);
          white-space: nowrap;
        }
        .quoter-table tr:last-child td { border-bottom: none; }
        .quoter-table tr:hover td { background: var(--qt-soft); }
        .quoter-premium {
          font-weight: 800;
          font-variant-numeric: tabular-nums;
        }
        .quoter-class {
          display: inline-block;
          padding: 3px 8px;
          border-radius: 6px;
          font: 700 10px/1.2 system-ui, sans-serif;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }
        .quoter-class-preferred { background: #dcfce7; color: #15803d; }
        .quoter-class-standard { background: #dbeafe; color: #1d4ed8; }
        .quoter-class-graded { background: #fef3c7; color: #92400e; }
        .quoter-class-guaranteed { background: #fce7f3; color: #9d174d; }

        .quoter-disclaimer {
          margin-top: 16px;
          padding: 14px 18px;
          border: 1px solid var(--qt-line);
          border-radius: var(--qt-radius);
          background: var(--qt-soft);
          color: var(--qt-muted);
          font: 400 12px/1.5 system-ui, sans-serif;
        }
        .quoter-disclaimer strong { color: var(--qt-text); }

        @media (max-width: 600px) {
          .quoter-form { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="quoter-form">
        <div className="quoter-field">
          <label className="quoter-label" htmlFor="qt-age">Client age</label>
          <input
            id="qt-age"
            className="quoter-input"
            type="number"
            min={20}
            max={85}
            placeholder="20–85"
            value={age}
            onChange={(e) => setAge(e.target.value)}
          />
        </div>
        <div className="quoter-field">
          <label className="quoter-label" htmlFor="qt-gender">Gender</label>
          <select id="qt-gender" className="quoter-select" value={gender} onChange={(e) => setGender(e.target.value as Gender)}>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
        </div>
        <div className="quoter-field">
          <label className="quoter-label" htmlFor="qt-tobacco">Tobacco</label>
          <select id="qt-tobacco" className="quoter-select" value={tobacco} onChange={(e) => setTobacco(e.target.value as TobaccoStatus)}>
            <option value="non-tobacco">Non-tobacco</option>
            <option value="tobacco">Tobacco user</option>
          </select>
        </div>
        <div className="quoter-field">
          <label className="quoter-label" htmlFor="qt-face">Face amount</label>
          <select id="qt-face" className="quoter-select" value={faceAmount} onChange={(e) => setFaceAmount(parseInt(e.target.value, 10))}>
            {FACE_AMOUNTS.map((amt) => (
              <option key={amt} value={amt}>${amt.toLocaleString()}</option>
            ))}
          </select>
        </div>
        <div className="quoter-field quoter-actions">
          <button
            className="quoter-run"
            onClick={runQuote}
            disabled={!age || parseInt(age, 10) < 20 || parseInt(age, 10) > 85}
          >
            Get quotes
          </button>
        </div>
      </div>

      {results && (
        <>
          <div className="quoter-results">
            <div className="quoter-results-head">
              <h3>{results.length} quotes found</h3>
              <small>{gender === "male" ? "Male" : "Female"}, age {age}, {tobacco === "tobacco" ? "tobacco" : "non-tobacco"}, ${faceAmount.toLocaleString()} face</small>
            </div>
            <div className="quoter-table-wrap">
              <table className="quoter-table">
                <thead>
                  <tr>
                    <th>Carrier</th>
                    <th>Plan</th>
                    <th>Health class</th>
                    <th>Monthly</th>
                    <th>Annual</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((q, i) => (
                    <tr key={i}>
                      <td><strong>{q.carrier}</strong></td>
                      <td>{q.plan}</td>
                      <td>
                        <span className={`quoter-class quoter-class-${q.healthClass}`}>
                          {HEALTH_CLASS_LABELS[q.healthClass]}
                        </span>
                      </td>
                      <td className="quoter-premium">${q.monthlyPremium.toFixed(2)}</td>
                      <td className="quoter-premium">${q.annualPremium.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="quoter-disclaimer">
            <strong>Advisory only.</strong> These rates are estimates based on published rate tables and are not a binding quote.
            Final premiums depend on carrier underwriting. Health class eligibility is determined by the carrier's underwriting process.
            This tool does not submit applications or bind coverage.
          </div>
        </>
      )}
    </div>
  );
}
