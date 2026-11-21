import type { Contracts, DeadLetters, FeatureVector, Stats } from "./types";

async function getJson<T>(path: string, signal?: AbortSignal): Promise<T> {
  return request<T>(path, { cache: "no-store", signal });
}

async function postJson<T>(path: string, body: unknown, signal?: AbortSignal): Promise<T> {
  return request<T>(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
    signal,
  });
}

async function request<T>(path: string, init: RequestInit): Promise<T> {
  const res = await fetch(path, init);
  if (!res.ok) {
    const err = new Error(`${path} returned ${res.status}`) as Error & { status?: number };
    err.status = res.status;
    throw err;
  }
  return res.json() as Promise<T>;
}

export const api = {
  stats: (signal?: AbortSignal) => getJson<Stats>("/stats", signal),
  features: (userId: string, signal?: AbortSignal) =>
    getJson<FeatureVector>(`/features/${encodeURIComponent(userId)}`, signal),
  /** One round trip for several users; unknown ids come back with `found: false` instead of a 404. */
  featuresBatch: (userIds: string[], signal?: AbortSignal) =>
    postJson<FeatureVector[]>("/features/batch", { user_ids: userIds }, signal),
  sampleUsers: (n = 8) => getJson<{ user_ids: string[] }>(`/users/sample?n=${n}`),
  contracts: () => getJson<Contracts>("/contracts"),
  deadLetters: (limit = 8) => getJson<DeadLetters>(`/dlq?limit=${limit}`),
};
