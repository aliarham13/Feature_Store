import { fmt2, fmtInt } from "./format";

export type FieldKind = "int" | "money" | "ratio";

// Funnel first, then value, then breadth: the order an analyst reads them in.
export const WINDOW_FIELDS: [string, string, FieldKind][] = [
  ["event_count", "Events", "int"],
  ["view_count", "Views", "int"],
  ["cart_count", "Added to cart", "int"],
  ["purchase_count", "Purchases", "int"],
  ["cart_conversion", "Cart → purchase", "ratio"],
  ["spend", "Spend", "money"],
  ["avg_order_value", "Avg order value", "money"],
  ["refund_amount", "Refunds", "money"],
  ["distinct_products", "Distinct products", "int"],
  ["distinct_categories", "Distinct categories", "int"],
];

export const WINDOW_SUFFIXES = [
  ["_5m", "Last 5 minutes"],
  ["_1h", "Last hour"],
] as const;

export const PROFILE_FIELDS: [string, string][] = [
  ["last_event_type", "Last event"],
  ["last_category", "Last category"],
  ["last_product_id", "Last product"],
  ["last_device", "Last device"],
];

export function fmtValue(v: number | string | undefined, kind: FieldKind): string {
  if (v === undefined) return "—";
  if (typeof v === "string") return v;
  if (kind === "money") return `$${fmt2(v)}`;
  if (kind === "ratio") return `${Math.round(v * 100)}%`;
  return fmtInt(v);
}

export function fmtFreshness(ms: number | null): string {
  return ms != null ? `${(ms / 1000).toFixed(1)}s ago` : "—";
}
