const ALLOWED_WORKFLOW_IMAGE_MODELS = new Set([
  "gpt-image-2",
  "gemini-3.1-flash-image-preview",
  "gemini-3-pro-image-preview",
]);

const GEMINI_WORKFLOW_AR = ["1:1", "16:9", "9:16", "4:3", "3:4", "2:3", "3:2", "4:5", "5:4", "1:4", "4:1", "1:8", "8:1", "21:9"];
const WORKFLOW_ROUTING = ["default", "nitro", "floor", "stable"];
const REF_IMAGES_FIELD = { type: "array", items: { type: "string" }, title: "Reference Images", field: "images_list", maxItems: 16 };
const GEMINI_WORKFLOW_PROPS = {
  prompt: { type: "string", title: "Prompt" },
  images_list: REF_IMAGES_FIELD,
  aspect_ratio: { type: "string", title: "Aspect Ratio", enum: GEMINI_WORKFLOW_AR, default: "1:1" },
  imageSize: { type: "string", title: "Resolution", enum: ["1K", "2K", "4K", "512"], default: "1K" },
  routing: { type: "string", title: "Routing", enum: WORKFLOW_ROUTING, default: "default" },
};

const WORKFLOW_IMAGE_SCHEMA_PROPS = {
  "gpt-image-2": {
    prompt: { type: "string", title: "Prompt" },
    images_list: REF_IMAGES_FIELD,
    size: { type: "string", title: "Size", enum: ["1024x1024", "1536x1024", "1024x1536", "2048x2048", "2048x1152", "3840x2160", "2160x3840"], default: "1024x1024" },
    quality: { type: "string", title: "Quality", enum: ["auto", "high", "medium", "low"], default: "auto" },
    format: { type: "string", title: "Format", enum: ["jpeg", "png", "webp"], default: "jpeg" },
    background: { type: "string", title: "Background", enum: ["auto", "transparent", "opaque"], default: "auto" },
    moderation: { type: "string", title: "Moderation", enum: ["auto", "low"], default: "auto" },
    routing: { type: "string", title: "Routing", enum: WORKFLOW_ROUTING, default: "default" },
  },
  "gemini-3.1-flash-image-preview": GEMINI_WORKFLOW_PROPS,
  "gemini-3-pro-image-preview": GEMINI_WORKFLOW_PROPS,
};

function isAllowedWorkflowVideoModel(id, model) {
  const hay = `${id} ${model?.name || ""} ${model?.title || ""}`;
  const isSeedance = /seedance/i.test(hay);
  const isSeedance2 = isSeedance && /(^|[^0-9])2[._\- ]?0([^0-9]|$)/.test(hay);
  const isSeedanceMini = isSeedance && /\bmini\b/i.test(hay);
  const isSeedanceLite = isSeedance && /\blite\b/i.test(hay);

  return id.includes("passthrough") || isSeedance2 || isSeedanceMini || isSeedanceLite;
}

export function filterWorkflowSchemas(schemas) {
  const models = schemas?.categories?.image?.models;
  if (!models || typeof models !== "object") return schemas;

  const kept = {};
  for (const [id, model] of Object.entries(models)) {
    if (id.includes("passthrough")) {
      kept[id] = model;
      continue;
    }
    if (!ALLOWED_WORKFLOW_IMAGE_MODELS.has(id)) continue;
    const props = WORKFLOW_IMAGE_SCHEMA_PROPS[id];
    kept[id] = props
      ? {
          ...model,
          input_schema: {
            ...(model.input_schema || {}),
            schemas: {
              ...(model.input_schema?.schemas || {}),
              input_data: { type: "object", properties: props, required: ["prompt"] },
            },
          },
        }
      : model;
  }

  const result = {
    ...schemas,
    categories: {
      ...schemas.categories,
      image: { ...schemas.categories.image, models: kept },
    },
  };

  const videoModels = schemas?.categories?.video?.models;
  if (videoModels && typeof videoModels === "object") {
    const keptVideo = {};
    for (const [id, model] of Object.entries(videoModels)) {
      if (isAllowedWorkflowVideoModel(id, model)) {
        keptVideo[id] = model;
      }
    }
    result.categories.video = { ...schemas.categories.video, models: keptVideo };
  }

  return result;
}

export { isAllowedWorkflowVideoModel };
