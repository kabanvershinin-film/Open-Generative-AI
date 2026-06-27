export const WORKFLOW_FIT_MIN_ZOOM = 0.02;

export function normalizeWorkflowNodePositions(nodes, margin = 120) {
  if (!Array.isArray(nodes) || nodes.length === 0) return [];

  const validNodes = nodes.filter((node) =>
    Number.isFinite(node?.position?.x) && Number.isFinite(node?.position?.y),
  );
  if (validNodes.length === 0) return nodes;

  const minX = Math.min(...validNodes.map((node) => node.position.x));
  const minY = Math.min(...validNodes.map((node) => node.position.y));
  const offsetX = minX < margin ? margin - minX : 0;
  const offsetY = minY < margin ? margin - minY : 0;

  if (!offsetX && !offsetY) return nodes;

  return nodes.map((node) => ({
    ...node,
    position: {
      x: (node?.position?.x ?? 0) + offsetX,
      y: (node?.position?.y ?? 0) + offsetY,
    },
  }));
}
