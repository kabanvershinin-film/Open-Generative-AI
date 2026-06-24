"use strict";

var _nodeTest = _interopRequireDefault(require("node:test"));
var _strict = _interopRequireDefault(require("node:assert/strict"));
var _seedanceWorkflowPayload = require("../seedanceWorkflowPayload.js");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { "default": e }; }
(0, _nodeTest["default"])('buildSeedanceWorkflowImages keeps two connected face assets', function () {
  var images = (0, _seedanceWorkflowPayload.buildSeedanceWorkflowImages)({
    connectedFaceAssets: [{
      uri: 'asset://face-1',
      thumbnail: 'https://cdn.example.com/face-1.jpg'
    }, {
      uri: 'asset://face-2',
      thumbnail: 'https://cdn.example.com/face-2.jpg'
    }]
  });
  _strict["default"].strictEqual(images.length, 2);
  _strict["default"].deepStrictEqual(images.map(function (image) {
    return image.url;
  }), ['asset://face-1', 'asset://face-2']);
});
(0, _nodeTest["default"])('buildSeedanceWorkflowImages keeps assets first and preserves extra image references', function () {
  var images = (0, _seedanceWorkflowPayload.buildSeedanceWorkflowImages)({
    connectedImages: [{
      url: 'https://cdn.example.com/base-1.jpg'
    }, {
      url: 'https://cdn.example.com/base-2.jpg'
    }, {
      url: 'https://cdn.example.com/base-3.jpg'
    }],
    connectedFaceAssets: [{
      uri: 'asset://face-1',
      thumbnail: 'https://cdn.example.com/face-1.jpg'
    }, {
      uri: 'asset://face-2',
      thumbnail: 'https://cdn.example.com/face-2.jpg'
    }]
  });
  _strict["default"].deepStrictEqual(images, [{
    url: 'asset://face-1',
    thumbnail: 'https://cdn.example.com/face-1.jpg'
  }, {
    url: 'asset://face-2',
    thumbnail: 'https://cdn.example.com/face-2.jpg'
  }, {
    url: 'https://cdn.example.com/base-1.jpg'
  }, {
    url: 'https://cdn.example.com/base-2.jpg'
  }, {
    url: 'https://cdn.example.com/base-3.jpg'
  }]);
});
(0, _nodeTest["default"])('ensureSeedanceFaceTags appends missing tags for all face references', function () {
  var prompt = (0, _seedanceWorkflowPayload.ensureSeedanceFaceTags)('Кинематографичная сцена 图片1', [{
    url: 'asset://face-1'
  }, {
    url: 'asset://face-2'
  }]);
  _strict["default"].strictEqual(prompt, 'Кинематографичная сцена 图片1 图片2');
});
(0, _nodeTest["default"])('buildSeedanceWorkflowBody avoids collapsing multiple face assets into one top-level face_asset', function () {
  var body = (0, _seedanceWorkflowPayload.buildSeedanceWorkflowBody)({
    fast: true,
    prompt: 'Два персонажа',
    connectedFaceAssets: [{
      uri: 'asset://face-1',
      thumbnail: 'https://cdn.example.com/face-1.jpg'
    }, {
      uri: 'asset://face-2',
      thumbnail: 'https://cdn.example.com/face-2.jpg'
    }],
    formValues: {
      resolution: '720p',
      duration: 5,
      aspect_ratio: '16:9'
    }
  });
  _strict["default"].strictEqual(body.image_urls.length, 2);
  _strict["default"].deepStrictEqual(body.image_urls.map(function (image) {
    return image.url;
  }), ['asset://face-1', 'asset://face-2']);
  _strict["default"].match(body.prompt, /图片1/);
  _strict["default"].match(body.prompt, /图片2/);
});