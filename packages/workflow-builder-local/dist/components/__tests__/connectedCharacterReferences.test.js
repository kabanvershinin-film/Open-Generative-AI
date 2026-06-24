"use strict";

var _nodeTest = _interopRequireDefault(require("node:test"));
var _strict = _interopRequireDefault(require("node:assert/strict"));
var _connectedCharacterReferences = require("../connectedCharacterReferences.js");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { "default": e }; }
(0, _nodeTest["default"])("collectConnectedCharacterReferences finds direct and prompt-connected characters", function () {
  var nodes = [{
    id: "char-1",
    type: "characterNode",
    data: {
      formValues: {
        character_name: "Первый",
        face_asset: "asset://face-1",
        character_photo: "https://cdn.example.com/1.jpg"
      }
    }
  }, {
    id: "char-2",
    type: "characterNode",
    data: {
      formValues: {
        character_name: "Второй",
        face_asset: "asset://face-2",
        character_photo: "https://cdn.example.com/2.jpg"
      }
    }
  }, {
    id: "prompt-1",
    type: "seedancePromptNode",
    data: {}
  }, {
    id: "video-1",
    type: "videoNode",
    data: {}
  }];
  var edges = [{
    source: "char-1",
    target: "video-1"
  }, {
    source: "char-2",
    target: "prompt-1"
  }, {
    source: "prompt-1",
    target: "video-1"
  }];
  var refs = (0, _connectedCharacterReferences.collectConnectedCharacterReferences)({
    nodeId: "video-1",
    nodes: nodes,
    edges: edges
  });
  _strict["default"].strictEqual(refs.length, 2);
  _strict["default"].deepStrictEqual(refs.map(function (ref) {
    return ref.asset;
  }), ["asset://face-1", "asset://face-2"]);
});
(0, _nodeTest["default"])("collectConnectedCharacterReferences deduplicates the same character across multiple paths", function () {
  var nodes = [{
    id: "char-1",
    type: "characterNode",
    data: {
      formValues: {
        character_name: "Первый",
        face_asset: "asset://face-1",
        character_photo: "https://cdn.example.com/1.jpg"
      }
    }
  }, {
    id: "prompt-1",
    type: "seedancePromptNode",
    data: {}
  }, {
    id: "video-1",
    type: "videoNode",
    data: {}
  }];
  var edges = [{
    source: "char-1",
    target: "video-1"
  }, {
    source: "char-1",
    target: "prompt-1"
  }, {
    source: "prompt-1",
    target: "video-1"
  }];
  var refs = (0, _connectedCharacterReferences.collectConnectedCharacterReferences)({
    nodeId: "video-1",
    nodes: nodes,
    edges: edges
  });
  _strict["default"].strictEqual(refs.length, 1);
  _strict["default"].strictEqual(refs[0].asset, "asset://face-1");
});