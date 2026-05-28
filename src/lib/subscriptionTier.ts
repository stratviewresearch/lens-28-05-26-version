export type Tier = "enterprise" | "individual" | "unknown";

/**
 * Look up the access tier for a given dashboard from the user's subscription list.
 * The backend may attach a `tier` field on each subscription entry. If absent or
 * unrecognized, we default to "unknown" (view-only).
 */
export const getDashboardTier = (subs: any[] | undefined | null, dashboardSlug: string): Tier => {
  if (!subs || !dashboardSlug) return "unknown";
  const match = subs.find((s: any) => {
    const slug = s?.dashboard_slug ?? s?.dashboardSlug ?? s?.dashboardId ?? s?.dashboard_id;
    return String(slug) === String(dashboardSlug);
  });
  const tier = String(match?.tier ?? "").toLowerCase();
  if (tier === "enterprise") return "enterprise";
  if (tier === "individual") return "individual";
  return "unknown";
};