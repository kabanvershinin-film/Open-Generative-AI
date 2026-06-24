export function filterVisibleOwnerWorkflows(allIndex, userId) {
    return (Array.isArray(allIndex) ? allIndex : []).filter((entry) => {
        if (!entry || !userId) return false;
        if (entry.owner_id === userId) return true;
        return entry.owner_id === null;
    });
}
