import { useEffect, useRef, useState } from "react";
import { api } from "../api";
import { PROFILE_FIELDS, WINDOW_FIELDS, WINDOW_SUFFIXES, fmtFreshness, fmtValue, type FieldKind } from "../featureFields";
import { fmtMs } from "../format";
import type { FeatureVector } from "../types";

const MIN_USERS = 2;
const MAX_USERS = 3;

type State =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "done"; vectors: FeatureVector[] }
  | { kind: "error"; message: string };

interface Row {
  key: string;
  label: string;
  kind: FieldKind | "text";
}

const SECTIONS: { title: string; rows: Row[] }[] = [
  ...WINDOW_SUFFIXES.map(([suffix, title]) => ({
    title,
    rows: WINDOW_FIELDS.map(([key, label, kind]) => ({ key: key + suffix, label, kind })),
  })),
  { title: "Profile", rows: PROFILE_FIELDS.map(([key, label]) => ({ key, label, kind: "text" as const })) },
];

function display(v: number | string | undefined, kind: Row["kind"]): string {
  if (kind === "text") return v === undefined ? "—" : String(v);
  return fmtValue(v, kind);
}

/** A row differs when the users that have features disagree on its value (missing counts as a value). */
function differs(vectors: FeatureVector[], key: string): boolean {
  const found = vectors.filter((v) => v.found);
  if (found.length < 2) return false;
  return new Set(found.map((v) => JSON.stringify(v.features[key] ?? null))).size > 1;
}

interface Props {
  /** User ids with live features, offered as one-click picks. */
  active: string[];
  /** Pre-fills the first slot, e.g. with the user the single lookup was showing. */
  seed?: string;
}

export function FeatureCompare({ active, seed }: Props) {
  const [slots, setSlots] = useState<string[]>(() => [seed ?? "", ""]);
  const [state, setState] = useState<State>({ kind: "idle" });
  const [onlyDiff, setOnlyDiff] = useState(false);
  const controller = useRef<AbortController | null>(null);

  useEffect(() => () => controller.current?.abort(), []);

  const ids = slots.map((s) => s.trim()).filter(Boolean);
  const duplicate = new Set(ids).size !== ids.length;
  const canCompare = ids.length >= MIN_USERS && !duplicate && state.kind !== "loading";

  const setSlot = (i: number, value: string) => setSlots((prev) => prev.map((s, j) => (j === i ? value : s)));

  const pick = (userId: string) =>
    setSlots((prev) => {
      if (prev.some((s) => s.trim() === userId)) return prev;
      const empty = prev.findIndex((s) => !s.trim());
      if (empty >= 0) return prev.map((s, j) => (j === empty ? userId : s));
      return prev.length < MAX_USERS ? [...prev, userId] : prev;
    });

  const compare = async () => {
    if (!canCompare) return;
    controller.current?.abort();
    const ctrl = new AbortController();
    controller.current = ctrl;
    setState({ kind: "loading" });
    try {
      const vectors = await api.featuresBatch(ids, ctrl.signal);
      setState({ kind: "done", vectors });
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return;
      setState({ kind: "error", message: "The feature API did not respond." });
    }
  };

  const vectors = state.kind === "done" ? state.vectors : null;
  const diffCount = vectors ? SECTIONS.reduce((n, s) => n + s.rows.filter((r) => differs(vectors, r.key)).length, 0) : 0;
  const totalRows = SECTIONS.reduce((n, s) => n + s.rows.length, 0);
  const foundCount = vectors?.filter((v) => v.found).length ?? 0;

  return (
    <>
      <form
        className="compare-form"
        onSubmit={(e) => {
          e.preventDefault();
          compare();
        }}
      >
        {slots.map((value, i) => (
          <div key={i} className="search compare-slot">
            <label htmlFor={`cmp-${i}`} className="mono-label">
              User {String.fromCharCode(65 + i)}
            </label>
            <input
              id={`cmp-${i}`}
              value={value}
              onChange={(e) => setSlot(i, e.target.value)}
              placeholder="e.g. u000000"
              autoComplete="off"
              spellCheck={false}
            />
            {slots.length > MIN_USERS && (
              <button
                type="button"
                className="pill sm"
                aria-label={`Remove user ${String.fromCharCode(65 + i)}`}
                onClick={() => setSlots((prev) => prev.filter((_, j) => j !== i))}
              >
                Remove
              </button>
            )}
          </div>
        ))}
        <div className="compare-actions">
          {slots.length < MAX_USERS && (
            <button type="button" className="pill" onClick={() => setSlots((prev) => [...prev, ""])}>
              Add a third user
            </button>
          )}
          {duplicate && <span className="caption warn-text">Each user can only appear once.</span>}
          <button className="pill primary" type="submit" disabled={!canCompare}>
            {state.kind === "loading" ? "Comparing…" : "Compare"}
          </button>
        </div>
      </form>

      <div className="chip-row">
        <span className="mono-label">Active now</span>
        {active.length ? (
          active.map((u) => (
            <button
              key={u}
              type="button"
              className={`pill sm${ids.includes(u) ? " selected" : ""}`}
              aria-pressed={ids.includes(u)}
              onClick={() => pick(u)}
            >
              {u}
            </button>
          ))
        ) : (
          <span className="caption">No users yet. Features appear about a minute after the stream starts.</span>
        )}
      </div>

      {state.kind === "idle" && (
        <div className="empty card">
          <div className="mono-label">Side by side</div>
          <p>
            Pick two or three users to line up their 5-minute, 1-hour and profile features in one table. Rows where
            the users disagree are highlighted, which makes drift and unusual behaviour easy to spot.
          </p>
        </div>
      )}
      {state.kind === "error" && (
        <div className="empty card warn" role="alert">
          <div className="mono-label">Comparison failed</div>
          <p>{state.message}</p>
        </div>
      )}

      {vectors && (
        <>
          <div className="result-meta">
            <span className="mono-label">
              <strong>{diffCount}</strong> of {totalRows} features differ
            </span>
            <span className="mono-label">
              Served {vectors.length} users in {fmtMs(Math.max(...vectors.map((v) => v.latency_ms)))}
            </span>
            <button
              type="button"
              className={`pill sm${onlyDiff ? " selected" : ""}`}
              aria-pressed={onlyDiff}
              onClick={() => setOnlyDiff((v) => !v)}
            >
              Only differences
            </button>
          </div>
          {foundCount < 2 && (
            <div className="empty card" role="status">
              <div className="mono-label">Not enough data</div>
              <p>
                Fewer than two of these users have events in the current windows, so there is nothing to diff yet. Try
                the active users above.
              </p>
            </div>
          )}
          <div className="card compare-wrap">
            <table className="compare-table">
              <thead>
                <tr>
                  <th scope="col">
                    <span className="mono-label">Feature</span>
                  </th>
                  {vectors.map((v) => (
                    <th key={v.user_id} scope="col">
                      <div className="compare-user">{v.user_id}</div>
                      <div className="mono-label">
                        {v.found ? `Last event ${fmtFreshness(v.freshness_ms)}` : "No features"}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              {SECTIONS.map((section) => {
                const rows = section.rows.filter((r) => !onlyDiff || differs(vectors, r.key));
                return (
                  <tbody key={section.title}>
                    <tr className="compare-section">
                      <th scope="colgroup" colSpan={vectors.length + 1}>
                        <span className="mono-label">{section.title}</span>
                      </th>
                    </tr>
                    {rows.length === 0 ? (
                      <tr>
                        <td colSpan={vectors.length + 1} className="caption">
                          All users match here.
                        </td>
                      </tr>
                    ) : (
                      rows.map((r) => {
                        const diff = differs(vectors, r.key);
                        return (
                          <tr key={r.key} className={diff ? "differs" : undefined}>
                            <th scope="row">
                              {r.label}
                              {diff && <span className="visually-hidden"> (values differ)</span>}
                            </th>
                            {vectors.map((v) => (
                              <td key={v.user_id}>{v.found ? display(v.features[r.key], r.kind) : "—"}</td>
                            ))}
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                );
              })}
            </table>
          </div>
        </>
      )}
    </>
  );
}
