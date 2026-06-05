// Cost display in the workflow builder is intentionally disabled: the per-node
// price badge ("$4", "$2.01", "Free") is no longer shown. Billing still happens
// server-side in /api/workflow/{id}/node/{id}/run via costForNode, so removing
// the client-side estimate has no effect on what the user is actually charged.
// Kept as a no-op hook so the node components don't need to change.
export const useGenerationCost = () => {
  return { generationCost: null, isRefreshingCost: false };
};
