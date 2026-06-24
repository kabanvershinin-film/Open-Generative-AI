"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.audioModels = void 0;
var audioModels = exports.audioModels = [{
  id: "audio-passthrough",
  name: "Input Audio",
  input_params: {
    properties: {
      "audio_url": {
        "examples": [],
        "description": "URL of the input audio.",
        "field": "audio",
        "type": "string",
        "title": "Audio URL",
        "name": "audio_url"
      }
    },
    required: ["audio_url"]
  }
}, {
  id: "suno-create-music",
  name: "Suno Create Music",
  input_params: {}
}, {
  id: "suno-extend-music",
  name: "Suno Extend Music",
  input_params: {}
}, {
  id: "suno-remix-music",
  name: "Suno Remix Music",
  input_params: {}
}, {
  id: "minimax-voice-clone",
  name: "Minimax Voice Clone",
  input_params: {}
}, {
  id: "minimax-speech-2.6-hd",
  name: "Minimax Speech 2.6 HD",
  input_params: {}
}, {
  id: "minimax-speech-2.6-turbo",
  name: "Minimax Speech 2.6 Turbo",
  input_params: {}
}];