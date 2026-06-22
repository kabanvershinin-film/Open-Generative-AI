export const textModels = [
  {
    id: "text-passthrough",
    name: "Input Text",
    input_params: {
      properties: {
        "prompt": {
          "examples": [
            ""
          ],
          "description": "Text prompt describing the image.",
          "type": "string",
          "title": "Prompt",
          "name": "prompt"
        }
      },
      required: ["prompt"],
    }
  },
  {
    id: "any-llm",
    name: "Any Llm",
    input_params: {}
  },
  {
    id: "openrouter-vision",
    name: "Openrouter Vision",
    input_params: {}
  },
  {
    id: "gpt-5-nano",
    name: "GPT5 Nano",
    input_params: {}
  },
  {
    id: "gpt-5-mini",
    name: "GPT5 Mini",
    input_params: {}
  }
];
