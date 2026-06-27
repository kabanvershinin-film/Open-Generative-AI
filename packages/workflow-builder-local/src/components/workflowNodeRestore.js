import { apiNodeModels } from "./model-registry/apiNodeModels.js";

const SPECIAL_MODEL_NAMES = {
  "text-passthrough": "Текст",
  "image-passthrough": "Изображение",
  "video-passthrough": "Видео",
  "audio-passthrough": "Аудио",
  "doubao-seedance-2-0-260128": "Seedance 2.0",
  "doubao-seedance-2-0-fast-260128": "Seedance 2.0 Fast",
};

const formatName = (id) => id.replace(/-/g, " ").split(" ").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");

export function getCategoryFromStoredNode(node = {}) {
  if (node.category) return node.category;

  switch (node.type) {
    case "textNode":
      return "text";
    case "imageNode":
      return "image";
    case "videoNode":
      return "video";
    case "audioNode":
      return "audio";
    case "apiNode":
      return "api";
    case "characterNode":
      return "character";
    case "seedancePromptNode":
      return "seedancePrompt";
    case "skylarkNode":
      return "agent";
    case "concatNode":
    case "vidConcatNode":
      return "utility";
    default:
      return null;
  }
}

export function getNodeTypeFromStoredNode(node = {}) {
  if (node.type) return node.type;

  const category = getCategoryFromStoredNode(node);
  if (category === "utility") {
    return node.model === "video-combiner" ? "vidConcatNode" : "concatNode";
  }

  return category ? `${category}Node` : null;
}

export function getModelIdFromStoredNode(node = {}) {
  if (node.model) return node.model;
  if (node.data?.modelId) return node.data.modelId;
  if (node.data?.selectedModel?.id) return node.data.selectedModel.id;

  const category = getCategoryFromStoredNode(node);
  if (!category) return null;
  if (node.type === "vidConcatNode") return "video-combiner";
  if (node.type === "concatNode") return "prompt-concatenator";
  if (category === "character") return "character-passthrough";
  if (category === "seedancePrompt") return "text-passthrough";

  return `${category}-passthrough`;
}

export function getModelObjStatic(category, modelId, nodeSchemas) {
  if (category === "seedancePrompt") {
    return { id: modelId || "text-passthrough", name: "Seedance Промпт" };
  }

  if (category === "api") {
    const apiModelsFromBackend = nodeSchemas?.categories?.api?.models
      ? Object.keys(nodeSchemas.categories.api.models)
      : [];
    const filtered = apiNodeModels.filter((model) => apiModelsFromBackend.includes(model.id));
    return filtered.find((model) => model.id === modelId) || null;
  }

  if (!modelId || !nodeSchemas?.categories) return null;

  const rawModel = nodeSchemas.categories[category]?.models?.[modelId];
  if (!rawModel) return null;

  return {
    ...rawModel,
    id: modelId,
    name: SPECIAL_MODEL_NAMES[modelId] || formatName(modelId),
  };
}

export function getWorkflowNodesList(workflowData = {}) {
  const nestedNodes = workflowData?.data?.nodes;
  if (Array.isArray(nestedNodes)) return nestedNodes;
  return Array.isArray(workflowData?.nodes) ? workflowData.nodes : [];
}

export function buildRestoredNode(node = {}, { nodeSchemas, workflowData, getModelObj } = {}) {
  const category = getCategoryFromStoredNode(node);
  const type = getNodeTypeFromStoredNode(node);
  const modelId = getModelIdFromStoredNode(node);
  const runtimeData = node.data || {};
  const fallbackGetModel = typeof getModelObj === "function"
    ? getModelObj
    : (cat, model) => getModelObjStatic(cat, model, nodeSchemas);

  return {
    id: node.id,
    type,
    position: {
      x: node.position?.x ?? 350,
      y: node.position?.y ?? 0,
    },
    data: {
      ...runtimeData,
      nodeSchemas,
      modelId,
      selectedModel: runtimeData.selectedModel || fallbackGetModel(category, modelId),
      outputs: runtimeData.outputs || node.output_params?.outputs || [],
      resultUrl: runtimeData.resultUrl || node.output_params?.resultUrl || null,
      formValues: runtimeData.formValues || node.input_params || node.params || {},
      outputHistory: (runtimeData.outputHistory || workflowData?.run_history?.[node.id] || [])
        .slice()
        .sort((a, b) => new Date(a.started_at) - new Date(b.started_at)),
    },
  };
}
