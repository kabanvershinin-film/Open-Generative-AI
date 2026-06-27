export const WORKFLOW_FIT_MIN_ZOOM = 0.08;
export const WORKFLOW_MAX_VIEWPORT_WIDTH = 3200;
export const WORKFLOW_MAX_VIEWPORT_HEIGHT = 1800;

export function normalizeWorkflowNodePositions(nodes, margin = 120) {
  if (!Array.isArray(nodes) || nodes.length === 0) return [];

  const validNodes = nodes.filter((node) =>
    Number.isFinite(node?.position?.x) && Number.isFinite(node?.position?.y),
  );
  if (validNodes.length === 0) return nodes;

  const minX = Math.min(...validNodes.map((node) => node.position.x));
  const minY = Math.min(...validNodes.map((node) => node.position.y));
  const maxX = Math.max(...validNodes.map((node) => node.position.x));
  const maxY = Math.max(...validNodes.map((node) => node.position.y));
  const spanX = maxX - minX;
  const spanY = maxY - minY;
  const scaleX = spanX > WORKFLOW_MAX_VIEWPORT_WIDTH
    ? WORKFLOW_MAX_VIEWPORT_WIDTH / spanX
    : 1;
  const scaleY = spanY > WORKFLOW_MAX_VIEWPORT_HEIGHT
    ? WORKFLOW_MAX_VIEWPORT_HEIGHT / spanY
    : 1;
  const scale = Math.min(scaleX, scaleY);

  if (minX >= margin && minY >= margin && scale === 1) return nodes;

  return nodes.map((node) => ({
    ...node,
    position: {
      x: margin + ((node?.position?.x ?? minX) - minX) * scale,
      y: margin + ((node?.position?.y ?? minY) - minY) * scale,
    },
  }));
}
