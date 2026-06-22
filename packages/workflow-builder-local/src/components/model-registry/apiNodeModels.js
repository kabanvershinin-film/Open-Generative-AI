export const apiNodeModels = [
  {
    id: "wavespeed",
    name: "Wavespeed API",
    input_params: {
      properties: {
        "model_url": {
          "default": "",
          "description": "https://wavespeed.ai/models/wavespeed-ai/flux-schnell",
          "type": "string",
          "format": "text",
          "required": true
        },
        "api_key": {
          "examples": "",
          "description": "API Key of the wavespeed ai.",
          "type": "string",
          "format": "text",
          "required": true
        },
      },
      required: ["model_url", "api_key"],
    }
  },
  {
    id: "straico",
    name: "Straico API",
    input_params: {
      properties: {
        "model_name": {
          "enum": [],
          "description": "Name of the model (e.g. sd-xl)",
          "type": "string",
          "default": "",
          "required": true
        },
        "model_type": {
          "enum": ["chat", "image", "video", "audio"],
          "default": "chat",
          "description": "Type of the model (e.g. chat, image, video, audio)",
          "type": "string",
          "required": true
        },
        "api_key": {
          "examples": "",
          "description": "API Key for Straico.",
          "type": "string",
          "format": "text",
          "required": true
        },
      },
      required: ["model_name", "model_type", "api_key"],
    }
  },
  {
    id: "runware",
    name: "Runware API",
    input_params: {
      properties: {
        "api_key": {
          "description": "Runware API Key",
          "type": "string",
          "format": "text",
          "required": true
        },
        "task_type": {
          "enum": ["imageInference", "textToVideo", "imageToVideo", "upscale", "removeBackground"],
          "description": "Task type (e.g. imageInference, textToVideo, imageToVideo, upscale)",
          "type": "string",
          "default": "imageInference",
          "required": true
        },
        "model_name": {
          "enum": [],
          "description": "AIR identifier of the model",
          "type": "string",
          "default": "",
          "required": false
        }
      },
      required: ["task_type", "api_key"]
    }
  },
  {
    id: "genvr",
    name: "GenVR API",
    input_params: {
      properties: {
        "uid": {
          "description": "Your GenVR User ID",
          "type": "string",
          "format": "text",
          "required": true
        },
        "api_key": {
          "description": "GenVR API Key",
          "type": "string",
          "format": "text",
          "required": true
        },
        "category": {
          "description": "Model category (e.g. imagegen)",
          "type": "string",
          "format": "text",
          "required": true
        },
        "subcategory": {
          "description": "Model identifier (e.g. flux_dev)",
          "type": "string",
          "format": "text",
          "required": true
        }
      },
      required: ["uid", "api_key", "category", "subcategory"]
    }
  }
];
