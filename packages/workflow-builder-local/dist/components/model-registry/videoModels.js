"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.videoModels = void 0;
var videoModels = exports.videoModels = [{
  id: "video-passthrough",
  name: "Input Video",
  input_params: {
    properties: {
      "video_url": {
        "examples": [],
        "description": "URL of the input video.",
        "field": "video",
        "type": "string",
        "title": "Video URL",
        "name": "video_url"
      }
    },
    required: ["video_url"]
  }
}, {
  id: "seedance-lite-i2v",
  name: "Seedance Lite I2V",
  input_params: {}
}, {
  id: "seedance-lite-t2v",
  name: "Seedance Lite T2V",
  input_params: {}
}, {
  id: "seedance-pro-t2v",
  name: "Seedance Pro T2V",
  input_params: {}
}, {
  id: "seedance-pro-i2v",
  name: "Seedance Pro I2V",
  input_params: {}
}, {
  id: "seedance-pro-t2v-fast",
  name: "Seedance Pro T2V Fast",
  input_params: {}
}, {
  id: "seedance-pro-i2v-fast",
  name: "Seedance Pro I2V Fast",
  input_params: {}
}, {
  id: "seedance-v1.5-pro-i2v",
  name: "Seedance v1.5 Pro I2V",
  input_params: {}
}, {
  id: "seedance-v1.5-pro-t2v",
  name: "Seedance v1.5 Pro T2V",
  input_params: {}
}, {
  id: "seedance-v1.5-pro-i2v-fast",
  name: "Seedance v1.5 Pro I2V Fast",
  input_params: {}
}, {
  id: "seedance-v1.5-pro-t2v-fast",
  name: "Seedance v1.5 Pro T2V Fast",
  input_params: {}
}, {
  id: "seedance-v1.5-pro-video-extend",
  name: "Seedance v1.5 Pro Video Extend",
  input_params: {}
}, {
  id: "seedance-v1.5-pro-video-extend-fast",
  name: "Seedance v1.5 Pro Video Extend Fast",
  input_params: {}
}, {
  id: "veo3.1-image-to-video",
  name: "Veo3.1 I2V",
  input_params: {}
}, {
  id: "veo3.1-text-to-video",
  name: "Veo3.1 T2V",
  input_params: {}
}, {
  id: "veo3.1-fast-image-to-video",
  name: "Veo3.1 Fast I2V",
  input_params: {}
}, {
  id: "veo3.1-fast-text-to-video",
  name: "Veo3.1 Fast T2V",
  input_params: {}
}, {
  id: "wan2.2-text-to-video",
  name: "Wan 2.2 T2V",
  input_params: {}
}, {
  id: "wan2.2-image-to-video",
  name: "Wan 2.2 I2V",
  input_params: {}
}, {
  id: "wan2.2-5b-fast-t2v",
  name: "Wan 2.2 5B Fast T2V",
  input_params: {}
}, {
  id: "wan2.2-animate",
  name: "Wan 2.2 Animate",
  input_params: {}
}, {
  id: "wan2.2-edit-video",
  name: "Wan 2.2 Video Edit",
  input_params: {}
}, {
  id: "wan2.2-spicy-image-to-video",
  name: "Wan 2.2 Spicy I2V",
  input_params: {}
}, {
  id: "wan2.2-spicy-video-extend",
  name: "Wan 2.2 Spicy Extend",
  input_params: {}
}, {
  id: "wan2.5-text-to-video",
  name: "Wan 2.5 T2V",
  input_params: {}
}, {
  id: "wan2.5-image-to-video",
  name: "Wan 2.5 I2V",
  input_params: {}
}, {
  id: "wan2.5-text-to-video-fast",
  name: "Wan 2.5 Fast T2V",
  input_params: {}
}, {
  id: "wan2.5-image-to-video-fast",
  name: "Wan 2.5 Fast I2V",
  input_params: {}
}, {
  id: "wan2.6-text-to-video",
  name: "Wan 2.6 T2V",
  input_params: {}
}, {
  id: "wan2.6-image-to-video",
  name: "Wan 2.6 I2V",
  input_params: {}
}, {
  id: "openai-sora",
  name: "OpenAI Sora",
  input_params: {}
}, {
  id: "openai-sora-2-text-to-video",
  name: "Sora 2 T2V",
  input_params: {}
}, {
  id: "openai-sora-2-image-to-video",
  name: "Sora 2 I2V",
  input_params: {}
}, {
  id: "openai-sora-2-pro-text-to-video",
  name: "Sora 2 Pro T2V",
  input_params: {}
}, {
  id: "openai-sora-2-pro-image-to-video",
  name: "Sora 2 Pro I2V",
  input_params: {}
}, {
  id: "kling-v2.5-turbo-pro-t2v",
  name: "Kling v2.5 Turbo Pro T2V",
  input_params: {}
}, {
  id: "kling-v2.5-turbo-pro-i2v",
  name: "Kling v2.5 Turbo Pro I2V",
  input_params: {}
}, {
  id: "kling-v2.5-turbo-std-i2v",
  name: "Kling v2.5 Turbo Std I2V",
  input_params: {}
}, {
  id: "kling-v2.6-pro-t2v",
  name: "Kling v2.6 Pro T2V",
  input_params: {}
}, {
  id: "kling-v2.6-pro-i2v",
  name: "Kling v2.6 Pro I2V",
  input_params: {}
}, {
  id: "kling-v2.6-pro-motion-control",
  name: "Kling v2.6 Pro Motion Control",
  input_params: {}
}, {
  id: "kling-o1-text-to-video",
  name: "Kling O1 T2V",
  input_params: {}
}, {
  id: "kling-o1-image-to-video",
  name: "Kling O1 I2V",
  input_params: {}
}, {
  id: "kling-o1-video-edit",
  name: "Kling O1 Video Edit",
  input_params: {}
}, {
  id: "kling-o1-video-edit-fast",
  name: "Kling O1 Video Edit Fast",
  input_params: {}
}, {
  id: "kling-o1-reference-to-video",
  name: "Kling O1 Reference",
  input_params: {}
}, {
  id: "kling-o1-standard-image-to-video",
  name: "Kling O1 Standard I2V",
  input_params: {}
}, {
  id: "kling-o1-standard-reference-to-video",
  name: "Kling O1 Standard Reference",
  input_params: {}
}, {
  id: "kling-o1-standard-video-edit",
  name: "Kling O1 Standard Video Edit",
  input_params: {}
}, {
  id: "grok-imagine-text-to-video",
  name: "Grok Imagine T2V",
  input_params: {}
}, {
  id: "grok-imagine-image-to-video",
  name: "Grok Imagine I2V",
  input_params: {}
}, {
  id: "hunyuan-text-to-video",
  name: "Hunyuan T2V",
  input_params: {}
}, {
  id: "hunyuan-fast-text-to-video",
  name: "Hunyuan Fast T2V",
  input_params: {}
}, {
  id: "hunyuan-image-to-video",
  name: "Hunyuan I2V",
  input_params: {}
}, {
  id: "midjourney-v7-image-to-video",
  name: "Midjourney v7 I2V",
  input_params: {}
}, {
  id: "vidu-q2-turbo-start-end-video",
  name: "Vidu Q2 Turbo Start/End",
  input_params: {}
}, {
  id: "vidu-q2-pro-start-end-video",
  name: "Vidu Q2 Pro Start/End",
  input_params: {}
}, {
  id: "vidu-q2-reference",
  name: "Vidu Q2 Reference",
  input_params: {}
}, {
  id: "luma-modify-video",
  name: "Luma Modify Video",
  input_params: {}
}, {
  id: "luma-flash-reframe",
  name: "Luma Flash Reframe",
  input_params: {}
}, {
  id: "video-combiner",
  name: "Video Combiner",
  input_params: {}
}];