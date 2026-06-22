export const concatModels = [
  {
    id: "prompt-concatenator",
    name: "Prompt Concatenator",
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
  }
];
