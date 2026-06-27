export const DEFAULT_IMAGE_NODE_SIZE = Object.freeze({
  width: 280,
  height: 320,
});

export const MIN_IMAGE_NODE_SIZE = Object.freeze({
  width: 240,
  height: 260,
});

export const MAX_IMAGE_NODE_SIZE = Object.freeze({
  width: 720,
  height: 920,
});

const toFiniteNumber = (value, fallback) => {
  const nextValue = Number(value);
  return Number.isFinite(nextValue) ? nextValue : fallback;
};

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

export function normalizeImageNodeSize(nodeSize = {}) {
  const width = clamp(
    toFiniteNumber(nodeSize?.width, DEFAULT_IMAGE_NODE_SIZE.width),
    MIN_IMAGE_NODE_SIZE.width,
    MAX_IMAGE_NODE_SIZE.width,
  );
  const height = clamp(
    toFiniteNumber(nodeSize?.height, DEFAULT_IMAGE_NODE_SIZE.height),
    MIN_IMAGE_NODE_SIZE.height,
    MAX_IMAGE_NODE_SIZE.height,
  );

  return { width, height };
}

export function buildWorkflowNodeData(nodeType, data = {}) {
  const nextData = { ...data };

  if (nodeType === "imageNode") {
    nextData.nodeSize = normalizeImageNodeSize(data?.nodeSize);
  }

  return nextData;
}
