"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.WORKFLOW_MAX_VIEWPORT_WIDTH = exports.WORKFLOW_MAX_VIEWPORT_HEIGHT = exports.WORKFLOW_FIT_MIN_ZOOM = void 0;
exports.normalizeWorkflowNodePositions = normalizeWorkflowNodePositions;
var WORKFLOW_FIT_MIN_ZOOM = exports.WORKFLOW_FIT_MIN_ZOOM = 0.08;
var WORKFLOW_MAX_VIEWPORT_WIDTH = exports.WORKFLOW_MAX_VIEWPORT_WIDTH = 3200;
var WORKFLOW_MAX_VIEWPORT_HEIGHT = exports.WORKFLOW_MAX_VIEWPORT_HEIGHT = 1800;
function normalizeWorkflowNodePositions(nodes) {
  var margin = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 120;
  if (!Array.isArray(nodes) || nodes.length === 0) return [];
  var validNodes = nodes.filter(function (node) {
    var position = node === null || node === void 0 ? void 0 : node.position;
    return Number.isFinite(position === null || position === void 0 ? void 0 : position.x) && Number.isFinite(position === null || position === void 0 ? void 0 : position.y);
  });
  if (validNodes.length === 0) return nodes;
  var minX = Math.min.apply(Math, validNodes.map(function (node) {
    return node.position.x;
  }));
  var minY = Math.min.apply(Math, validNodes.map(function (node) {
    return node.position.y;
  }));
  var maxX = Math.max.apply(Math, validNodes.map(function (node) {
    return node.position.x;
  }));
  var maxY = Math.max.apply(Math, validNodes.map(function (node) {
    return node.position.y;
  }));
  var spanX = maxX - minX;
  var spanY = maxY - minY;
  var scaleX = spanX > WORKFLOW_MAX_VIEWPORT_WIDTH ? WORKFLOW_MAX_VIEWPORT_WIDTH / spanX : 1;
  var scaleY = spanY > WORKFLOW_MAX_VIEWPORT_HEIGHT ? WORKFLOW_MAX_VIEWPORT_HEIGHT / spanY : 1;
  var scale = Math.min(scaleX, scaleY);
  if (minX >= margin && minY >= margin && scale === 1) return nodes;
  return nodes.map(function (node) {
    var _node$position$x, _node$position, _node$position$y, _node$position2;
    return Object.assign({}, node, {
      position: {
        x: margin + (((_node$position$x = (_node$position = node === null || node === void 0 ? void 0 : node.position) === null || _node$position === void 0 ? void 0 : _node$position.x) !== null && _node$position$x !== void 0 ? _node$position$x : minX) - minX) * scale,
        y: margin + (((_node$position$y = (_node$position2 = node === null || node === void 0 ? void 0 : node.position) === null || _node$position2 === void 0 ? void 0 : _node$position2.y) !== null && _node$position$y !== void 0 ? _node$position$y : minY) - minY) * scale
      }
    });
  });
}
