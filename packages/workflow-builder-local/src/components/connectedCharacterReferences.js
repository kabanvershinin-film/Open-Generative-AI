function buildCharacterReference(node) {
  const formValues = node?.data?.formValues || {};
  const asset = formValues.face_asset || null;
  const photo = formValues.character_photo
    || formValues.face_thumbnail
    || (!String(asset || "").startsWith("asset://") ? asset : null)
    || null;

  return {
    nodeId: node.id,
    name: formValues.character_name || "Персонаж",
    asset,
    photo,
  };
}

export function collectConnectedCharacterReferences({ nodeId, nodes = [], edges = [] }) {
  const findCharacters = (currentNodeId, visited = new Set()) => {
    if (visited.has(currentNodeId)) return [];
    visited.add(currentNodeId);

    const incomingEdges = edges.filter((edge) => edge.target === currentNodeId);
    let characters = [];

    incomingEdges.forEach((edge) => {
      const sourceNode = nodes.find((node) => node.id === edge.source);
      if (!sourceNode) return;

      if (sourceNode.type === "characterNode") {
        characters.push(sourceNode);
        return;
      }

      if (["concatNode", "seedancePromptNode"].includes(sourceNode.type)) {
        characters = [...characters, ...findCharacters(sourceNode.id, visited)];
      }
    });

    return characters;
  };

  const connectedChars = findCharacters(nodeId);
  const uniqueChars = [];
  const seen = new Set();

  connectedChars.forEach((node) => {
    const formValues = node?.data?.formValues || {};
    const uniqueId = formValues.face_asset || formValues.character_photo || node.id;
    if (seen.has(uniqueId)) return;
    seen.add(uniqueId);
    uniqueChars.push(buildCharacterReference(node));
  });

  return uniqueChars;
}
