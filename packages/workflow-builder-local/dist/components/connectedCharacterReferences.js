"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.collectConnectedCharacterReferences = collectConnectedCharacterReferences;
function _toConsumableArray(r) { return _arrayWithoutHoles(r) || _iterableToArray(r) || _unsupportedIterableToArray(r) || _nonIterableSpread(); }
function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _iterableToArray(r) { if ("undefined" != typeof Symbol && null != r[Symbol.iterator] || null != r["@@iterator"]) return Array.from(r); }
function _arrayWithoutHoles(r) { if (Array.isArray(r)) return _arrayLikeToArray(r); }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
function buildCharacterReference(node) {
  var _node$data;
  var formValues = (node === null || node === void 0 || (_node$data = node.data) === null || _node$data === void 0 ? void 0 : _node$data.formValues) || {};
  var asset = formValues.face_asset || null;
  var photo = formValues.character_photo || formValues.face_thumbnail || (!String(asset || "").startsWith("asset://") ? asset : null) || null;
  return {
    nodeId: node.id,
    name: formValues.character_name || "Персонаж",
    asset: asset,
    photo: photo
  };
}
function collectConnectedCharacterReferences(_ref) {
  var nodeId = _ref.nodeId,
    _ref$nodes = _ref.nodes,
    nodes = _ref$nodes === void 0 ? [] : _ref$nodes,
    _ref$edges = _ref.edges,
    edges = _ref$edges === void 0 ? [] : _ref$edges;
  var _findCharacters = function findCharacters(currentNodeId) {
    var visited = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : new Set();
    if (visited.has(currentNodeId)) return [];
    visited.add(currentNodeId);
    var incomingEdges = edges.filter(function (edge) {
      return edge.target === currentNodeId;
    });
    var characters = [];
    incomingEdges.forEach(function (edge) {
      var sourceNode = nodes.find(function (node) {
        return node.id === edge.source;
      });
      if (!sourceNode) return;
      if (sourceNode.type === "characterNode") {
        characters.push(sourceNode);
        return;
      }
      if (["concatNode", "seedancePromptNode"].includes(sourceNode.type)) {
        characters = [].concat(_toConsumableArray(characters), _toConsumableArray(_findCharacters(sourceNode.id, visited)));
      }
    });
    return characters;
  };
  var connectedChars = _findCharacters(nodeId);
  var uniqueChars = [];
  var seen = new Set();
  connectedChars.forEach(function (node) {
    var _node$data2;
    var formValues = (node === null || node === void 0 || (_node$data2 = node.data) === null || _node$data2 === void 0 ? void 0 : _node$data2.formValues) || {};
    var uniqueId = formValues.face_asset || formValues.character_photo || node.id;
    if (seen.has(uniqueId)) return;
    seen.add(uniqueId);
    uniqueChars.push(buildCharacterReference(node));
  });
  return uniqueChars;
}