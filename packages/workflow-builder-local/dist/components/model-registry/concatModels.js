"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.concatModels = void 0;
var concatModels = exports.concatModels = [{
  id: "prompt-concatenator",
  name: "Prompt Concatenator",
  input_params: {
    properties: {
      "prompt": {
        "examples": [""],
        "description": "Text prompt describing the image.",
        "type": "string",
        "title": "Prompt",
        "name": "prompt"
      }
    },
    required: ["prompt"]
  }
}];