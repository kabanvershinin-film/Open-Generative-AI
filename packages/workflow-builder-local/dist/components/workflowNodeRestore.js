"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.buildRestoredNode = buildRestoredNode;
exports.getCategoryFromStoredNode = getCategoryFromStoredNode;
exports.getModelIdFromStoredNode = getModelIdFromStoredNode;
exports.getModelObjStatic = getModelObjStatic;
exports.getNodeTypeFromStoredNode = getNodeTypeFromStoredNode;
exports.getWorkflowNodesList = getWorkflowNodesList;

var _apiNodeModels = require("./model-registry/apiNodeModels.js");

var SPECIAL_MODEL_NAMES = {
  "text-passthrough": "Текст",
  "image-passthrough": "Изображение",
  "video-passthrough": "Видео",
  "audio-passthrough": "Аудио",
  "doubao-seedance-2-0-260128": "Seedance 2.0",
  "doubao-seedance-2-0-fast-260128": "Seedance 2.0 Fast"
};

var formatName = function formatName(id) {
  return id.replace(/-/g, " ").split(" ").map(function (word) {
    return word.charAt(0).toUpperCase() + word.slice(1);
  }).join(" ");
};

function getCategoryFromStoredNode() {
  var node = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
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

function getNodeTypeFromStoredNode() {
  var node = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
  if (node.type) return node.type;
  var category = getCategoryFromStoredNode(node);
  if (category === "utility") {
    return node.model === "video-combiner" ? "vidConcatNode" : "concatNode";
  }
  return category ? "".concat(category, "Node") : null;
}

function getModelIdFromStoredNode() {
  var node = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
  if (node.model) return node.model;
  if (node.data && node.data.modelId) return node.data.modelId;
  if (node.data && node.data.selectedModel && node.data.selectedModel.id) return node.data.selectedModel.id;
  var category = getCategoryFromStoredNode(node);
  if (!category) return null;
  if (node.type === "vidConcatNode") return "video-combiner";
  if (node.type === "concatNode") return "prompt-concatenator";
  if (category === "character") return "character-passthrough";
  if (category === "seedancePrompt") return "text-passthrough";
  return "".concat(category, "-passthrough");
}

function getModelObjStatic(category, modelId, nodeSchemas) {
  var _nodeSchemas$categori2;
  if (category === "seedancePrompt") {
    return {
      id: modelId || "text-passthrough",
      name: "Seedance Промпт"
    };
  }
  if (category === "api") {
    var _nodeSchemas$categori;
    var apiModelsFromBackend = nodeSchemas !== null && nodeSchemas !== void 0 && (_nodeSchemas$categori = nodeSchemas.categories) !== null && _nodeSchemas$categori !== void 0 && (_nodeSchemas$categori = _nodeSchemas$categori.api) !== null && _nodeSchemas$categori !== void 0 && _nodeSchemas$categori.models ? Object.keys(nodeSchemas.categories.api.models) : [];
    var filtered = _apiNodeModels.apiNodeModels.filter(function (model) {
      return apiModelsFromBackend.includes(model.id);
    });
    return filtered.find(function (model) {
      return model.id === modelId;
    }) || null;
  }
  if (!modelId || !(nodeSchemas !== null && nodeSchemas !== void 0 && nodeSchemas.categories)) return null;
  var rawModel = (_nodeSchemas$categori2 = nodeSchemas.categories[category]) === null || _nodeSchemas$categori2 === void 0 || (_nodeSchemas$categori2 = _nodeSchemas$categori2.models) === null || _nodeSchemas$categori2 === void 0 ? void 0 : _nodeSchemas$categori2[modelId];
  if (!rawModel) return null;
  return Object.assign({}, rawModel, {
    id: modelId,
    name: SPECIAL_MODEL_NAMES[modelId] || formatName(modelId)
  });
}

function getWorkflowNodesList() {
  var workflowData = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
  var nestedNodes = workflowData !== null && workflowData !== void 0 && workflowData.data ? workflowData.data.nodes : undefined;
  if (Array.isArray(nestedNodes)) return nestedNodes;
  return Array.isArray(workflowData === null || workflowData === void 0 ? void 0 : workflowData.nodes) ? workflowData.nodes : [];
}

function buildRestoredNode() {
  var node = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
  var _ref = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
    nodeSchemas = _ref.nodeSchemas,
    workflowData = _ref.workflowData,
    getModelObj = _ref.getModelObj;
  var category = getCategoryFromStoredNode(node);
  var type = getNodeTypeFromStoredNode(node);
  var modelId = getModelIdFromStoredNode(node);
  var runtimeData = node.data || {};
  var fallbackGetModel = typeof getModelObj === "function" ? getModelObj : function (cat, model) {
    return getModelObjStatic(cat, model, nodeSchemas);
  };
  return {
    id: node.id,
    type: type,
    position: {
      x: node.position && node.position.x !== undefined ? node.position.x : 350,
      y: node.position && node.position.y !== undefined ? node.position.y : 0
    },
    data: Object.assign({}, runtimeData, {
      nodeSchemas: nodeSchemas,
      modelId: modelId,
      selectedModel: runtimeData.selectedModel || fallbackGetModel(category, modelId),
      outputs: runtimeData.outputs || node.output_params && node.output_params.outputs || [],
      resultUrl: runtimeData.resultUrl || node.output_params && node.output_params.resultUrl || null,
      formValues: runtimeData.formValues || node.input_params || node.params || {},
      outputHistory: (runtimeData.outputHistory || workflowData && workflowData.run_history && workflowData.run_history[node.id] || []).slice().sort(function (a, b) {
        return new Date(a.started_at) - new Date(b.started_at);
      })
    })
  };
}
