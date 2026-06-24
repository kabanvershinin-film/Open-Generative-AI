"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.videoCombinerModels = void 0;
var videoCombinerModels = exports.videoCombinerModels = [{
  id: "video-combiner",
  name: "Video Combiner",
  input_params: {
    properties: {
      "videos_list": {
        "examples": ["https://d3adwkbyhxyrtq.cloudfront.net/webassets/videomodels/seedance-v2.0-i2v.mp4"],
        "description": "Upload the video clips you want to combine, in order. Each clip can be 5–60 seconds.",
        "field": "videos_list",
        "type": "array",
        "items": {
          "type": "string"
        },
        "title": "Video Clips",
        "name": "videos_list",
        "maxItems": 20
      },
      "aspect_ratio": {
        "enum": ["auto", "16:9", "9:16", "1:1", "4:3", "3:4", "21:9", "9:21"],
        "title": "Aspect Ratio",
        "name": "aspect_ratio",
        "type": "string",
        "default": "auto",
        "description": "Output aspect ratio. 'auto' uses the aspect ratio of the first uploaded clip."
      }
    },
    required: ["videos_list"]
  }
}];