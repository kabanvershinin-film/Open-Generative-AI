"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  GEMINI_IMAGE_ASPECT_RATIOS,
  GEMINI_IMAGE_SIZE_PRESETS,
  GPT_IMAGE_ASPECT_RATIOS,
  GPT_IMAGE_SIZE_PRESETS,
} from "../imageModelSizing.js";
import {
  getTemplateWorkflows,
  getUserWorkflows,
  getPublishedWorkflows,
  createWorkflow,
  updateWorkflowName,
  deleteWorkflow,
  getAllNodeSchemas,
  getWorkflowData,
  executeWorkflow,
} from "../muapi.js";

// Only these image models are exposed in the workflow builder's Generate Image
// menu. Editing models are dropped entirely (Edit Image is disabled). Applied to
// the node schema here (studio rebuilds reliably) so it works regardless of the
// prebuilt workflow-builder package.
const ALLOWED_WORKFLOW_IMAGE_MODELS = new Set([
  "gpt-image-2",
  "gemini-3.1-flash-image-preview",
  "gemini-3-pro-image-preview",
]);

// Correct input parameters for each model's Properties panel (label = title,
// options = enum). These keys are honoured by the workflow proxy at run time.
const WORKFLOW_ROUTING = ["default", "nitro", "floor", "stable"];
// Reference images (optional, up to 16). A single images_list input replaces
// the old separate single-image field. Wiring it switches the model into
// editing/reference mode (handled by the workflow proxy).
const REF_IMAGES_FIELD = { type: "array", items: { type: "string" }, title: "Reference Images", field: "images_list", maxItems: 16 };
const GEMINI_WORKFLOW_PROPS = {
  prompt: { type: "string", title: "Prompt" },
  images_list: REF_IMAGES_FIELD,
  aspect_ratio: { type: "string", title: "Aspect Ratio", enum: GEMINI_IMAGE_ASPECT_RATIOS, default: "1:1" },
  imageSize: { type: "string", title: "Resolution", enum: GEMINI_IMAGE_SIZE_PRESETS, default: "1K" },
  routing: { type: "string", title: "Routing", enum: WORKFLOW_ROUTING, default: "default" },
};
const WORKFLOW_IMAGE_SCHEMA_PROPS = {
  "gpt-image-2": {
    prompt: { type: "string", title: "Prompt" },
    images_list: REF_IMAGES_FIELD,
    aspect_ratio: { type: "string", title: "Aspect Ratio", enum: GPT_IMAGE_ASPECT_RATIOS, default: "1:1" },
    imageSize: { type: "string", title: "Resolution", enum: GPT_IMAGE_SIZE_PRESETS, default: "1K" },
    quality: { type: "string", title: "Quality", enum: ["auto", "high", "medium", "low"], default: "auto" },
    format: { type: "string", title: "Format", enum: ["jpeg", "png", "webp"], default: "jpeg" },
    background: { type: "string", title: "Background", enum: ["auto", "opaque"], default: "auto" },
    moderation: { type: "string", title: "Moderation", enum: ["auto", "low"], default: "auto" },
    routing: { type: "string", title: "Routing", enum: WORKFLOW_ROUTING, default: "default" },
  },
  "gemini-3.1-flash-image-preview": GEMINI_WORKFLOW_PROPS,
  "gemini-3-pro-image-preview": GEMINI_WORKFLOW_PROPS,
};

function filterWorkflowImageModels(schemas) {
  const models = schemas?.categories?.image?.models;
  if (!models || typeof models !== "object") return schemas;
  const kept = {};
  for (const [id, model] of Object.entries(models)) {
    // Keep passthrough/input models (e.g. image-passthrough = "Input Image").
    if (id.includes("passthrough")) {
      kept[id] = model;
      continue;
    }
    if (!ALLOWED_WORKFLOW_IMAGE_MODELS.has(id)) continue;
    const props = WORKFLOW_IMAGE_SCHEMA_PROPS[id];
    kept[id] = props
      ? {
          ...model,
          input_schema: {
            ...(model.input_schema || {}),
            schemas: {
              ...(model.input_schema?.schemas || {}),
              input_data: { type: "object", properties: props, required: ["prompt"] },
            },
          },
        }
      : model;
  }
  const result = {
    ...schemas,
    categories: {
      ...schemas.categories,
      image: { ...schemas.categories.image, models: kept },
    },
  };

  // Video menu: keep only Seedance 2.0 and 2.0 Fast, plus the input/passthrough
  // node. Older Seedance (1.5, 1.0, Lite) and everything else (Veo, Sora, Grok,
  // Kling, Happyhorse…) is removed.
  const videoModels = schemas?.categories?.video?.models;
  if (videoModels && typeof videoModels === "object") {
    const keptVideo = {};
    for (const [id, model] of Object.entries(videoModels)) {
      // Match on id and display name/title so it works regardless of how the
      // backend keys the model. Keep only Seedance 2.0 / 2.0 Fast.
      const hay = `${id} ${model?.name || ""} ${model?.title || ""}`;
      // Version "2.0" / "2-0" / "2_0" / "2 0" bounded by non-digits so it never
      // matches the 6-digit date suffix (e.g. 260128).
      const isSeedance2 = /seedance/i.test(hay) && /(^|[^0-9])2[._\- ]?0([^0-9]|$)/.test(hay);
      if (id.includes("passthrough") || isSeedance2) {
        keptVideo[id] = model;
      }
    }
    result.categories.video = { ...schemas.categories.video, models: keptVideo };
  }

  return result;
}

async function publishWorkflow(apiKey, id, isPublished) {
  const r = await fetch(`/api/workflow/${id}/publish`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ is_published: isPublished }),
  });
  if (!r.ok) throw new Error('Publish failed');
  return await r.json();
}
import dynamic from "next/dynamic";

const WorkflowUI = dynamic(() => import("./WorkflowUI"), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-white/5 border-t-[#d946ef] rounded-full animate-spin" />
        <div className="text-[10px] font-black text-white/20 uppercase tracking-widest">
          Загрузка билдера...
        </div>
      </div>
    </div>
  ),
});

function WorkflowCard({ workflow, onClick, activeTab, onRename, onDelete, onPublish, onModerate }) {
  const [showOptions, setShowOptions] = useState(false);

  return (
    <div
      onClick={() => onClick(workflow)}
      className="group relative aspect-[3/4] rounded-lg overflow-hidden cursor-pointer border border-white/5 bg-[#0f0c18] transition-all hover:border-[#d946ef]/30 hover:scale-[1.02] shadow-2xl"
    >
      {workflow.thumbnail ? (
        <img
          src={workflow.thumbnail}
          alt={workflow.name}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 flex items-center justify-center">
          <svg
            width="40"
            height="40"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="1"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="opacity-20"
          >
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
          </svg>
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
      
      {/* Options Dropdown for My Workflows */}
      {activeTab === 'my-workflows' && (
        <div 
          className="absolute top-2 right-2 z-30"
          onClick={(e) => { e.stopPropagation(); }}
        >
          <button
            onClick={() => setShowOptions(!showOptions)}
            onBlur={() => setTimeout(() => setShowOptions(false), 200)}
            className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/60 hover:text-white transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="5" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="12" cy="19" r="1" />
            </svg>
          </button>
          
          {showOptions && (
            <div className="absolute top-10 right-0 w-32 bg-[#0f0c18] border border-white/10 rounded-lg shadow-2xl py-1 animate-in fade-in zoom-in duration-200">
              <button
                onClick={() => onRename(workflow)}
                className="w-full px-4 py-2 text-left text-[11px] font-bold text-white/70 hover:text-[#d946ef] hover:bg-white/5 transition-colors flex items-center gap-2"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
                Переименовать
              </button>
              <button
                onClick={() => onDelete(workflow.id)}
                className="w-full px-4 py-2 text-left text-[11px] font-bold text-red-500 hover:bg-red-500/10 transition-colors flex items-center gap-2"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                </svg>
                Удалить
              </button>
            </div>
          )}
        </div>
      )}

      {/* Published badge on my-workflows */}
      {activeTab === 'my-workflows' && workflow.is_published && (
        <div className="absolute top-2 left-2 z-20 px-2 py-1 bg-purple-500/20 border border-purple-500/40 rounded-full">
          <span className="text-[9px] font-black text-purple-300 uppercase tracking-widest">Опубликовано</span>
        </div>
      )}

      {/* Shared with you badge */}
      {activeTab === 'my-workflows' && workflow.is_owner === false && (
        <div className="absolute top-2 left-2 z-20 px-2 py-1 bg-amber-500/20 border border-amber-500/40 rounded-full">
          <span className="text-[9px] font-black text-amber-200 uppercase tracking-widest">Вам прислали процесс</span>
        </div>
      )}

      {/* Community nodes count */}
      {activeTab === 'published' && workflow.nodes_count > 0 && (
        <div className="absolute top-2 left-2 z-20 px-2 py-1 bg-black/40 backdrop-blur-md border border-white/10 rounded-full">
          <span className="text-[9px] font-black text-white/60 uppercase tracking-widest">{workflow.nodes_count} нод</span>
        </div>
      )}

      {/* "Yours" badge on community cards the current user published */}
      {activeTab === 'published' && workflow.is_mine && (
        <div className="absolute top-2 right-2 z-20 px-2 py-1 bg-purple-500/25 border border-purple-400/50 rounded-full backdrop-blur-md">
          <span className="text-[9px] font-black text-purple-200 uppercase tracking-widest">★ Ваш</span>
        </div>
      )}

      {/* Admin moderation: remove from community (top-right, below the badge) */}
      {activeTab === 'published' && workflow.can_moderate && (
        <button
          onClick={(e) => { e.stopPropagation(); if (window.confirm('Снять этот воркфлоу с публикации в Community?')) onModerate?.(workflow.id); }}
          title="Снять с публикации (админ)"
          className={`absolute right-2 z-30 grid place-items-center w-7 h-7 rounded-full bg-red-500/20 border border-red-500/40 text-red-300 hover:bg-red-500/40 hover:text-white transition-colors ${workflow.is_mine ? 'top-10' : 'top-2'}`}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
          </svg>
        </button>
      )}

      <div className="absolute inset-x-0 bottom-0 p-4">
        <div className="text-[10px] font-bold text-purple-400 uppercase tracking-wider mb-1 opacity-80">
          {workflow.category || "Общее"}
        </div>
        <h3 className="text-sm font-bold text-white truncate group-hover:text-purple-300 transition-colors">
          {workflow.name || "Без названия"}
        </h3>
        {activeTab === 'published' && workflow.can_moderate && (
          <p className="text-[10px] text-white/45 truncate mt-0.5" title={workflow.author_email || ''}>
            👤 {workflow.author_email || 'неизвестно'}
          </p>
        )}
      </div>
    </div>
  );
}

export default function WorkflowStudio({ apiKey, isHeaderVisible = true, onToggleHeader }) {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug || [];
  const idFromParams = params?.id;     // exists on /workflow/[id]/[tab] route
  const tabFromParams = params?.tab;   // exists on /workflow/[id]/[tab] route
  
  // Robustly extract ID and Tab from either route structure
  const getWorkflowInfo = useCallback(() => {
    // Priority 1: Dedicated /workflow/[id]/[tab] route  
    if (idFromParams) {
      return { id: idFromParams, tab: tabFromParams || null };
    }
    // Priority 2: Catch-all /studio/[[...slug]] route
    const wfIndex = slug.findIndex(s => s === 'workflows' || s === 'workflow');
    if (wfIndex === -1) return { id: null, tab: null };
    return {
      id: slug[wfIndex + 1] || null,
      tab: slug[wfIndex + 2] || null
    };
  }, [slug, idFromParams, tabFromParams]);

  const { id: urlWorkflowId, tab: urlTab } = getWorkflowInfo();

  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedWorkflow, setSelectedWorkflow] = useState(null);
  const [activeSubTab, setActiveSubTab] = useState("builder");
  const [activeMainTab, setActiveMainTab] = useState("my-workflows");
  const [renamingWorkflow, setRenamingWorkflow] = useState(null);
  const [newWorkflowName, setNewWorkflowName] = useState("");
  const [isDeletingId, setIsDeletingId] = useState(null);
  const [nodeSchemas, setNodeSchemas] = useState(null);
  const [workflowDef, setWorkflowDef] = useState(null);
  const [error, setError] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [runResult, setRunResult] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareInputType, setShareInputType] = useState("email"); // "email" or "id"
  const [shareEmail, setShareEmail] = useState("");
  const [shareUserId, setShareUserId] = useState("");
  const [workflowShares, setWorkflowShares] = useState([]);
  const [loadingShares, setLoadingShares] = useState(false);
  const isNavigatingRef = useRef(false);

  // Handlers defined early so they can be used in effects
  const handleSelectWorkflow = useCallback(
    async (wf, fromUrl = false) => {
      setSelectedWorkflow(wf);
      setError(null);

      const targetTab = "builder";
      setActiveSubTab(targetTab);

      if (!fromUrl) {
        isNavigatingRef.current = true;
        router.push(`/workflow/${wf.id}/builder`);
        setTimeout(() => { isNavigatingRef.current = false; }, 1500);
      }
    },
    [router],
  );

  // Load shares when opening a workflow
  useEffect(() => {
    if (selectedWorkflow?.id && showShareModal) {
      loadShares(selectedWorkflow.id);
    }
  }, [selectedWorkflow?.id, showShareModal]);

  // Dedicated data fetching effect for the active workflow
  useEffect(() => {
    if (!selectedWorkflow?.id || !apiKey) return;

    async function loadWorkflowDetails() {
      try {
        setLoading(true);
        const wfId = selectedWorkflow.id;

        const [nodes, rawDef] = await Promise.all([
          getAllNodeSchemas(apiKey, wfId).catch(() => []),
          getWorkflowData(apiKey, wfId).catch(() => ({ nodes: [], edges: [] })),
        ]);
        let def = rawDef;

        setNodeSchemas(filterWorkflowImageModels(nodes));

        // Inject a pending image from Photo Studio if the user navigated here via "Send to Workflow"
        let pendingImage;
        try { pendingImage = JSON.parse(localStorage.getItem("mf_pending_workflow_image")); } catch {}
        if (pendingImage?.url && pendingImage?.workflowId === wfId) {
          localStorage.removeItem("mf_pending_workflow_image");
          const injectedNode = {
            id: `image_${Date.now()}`,
            category: "image",
            model: "image-passthrough",
            position: { x: 50, y: 50 },
            input_params: { image_url: pendingImage.url },
            output_params: {},
          };
          def = { ...def, data: { ...def.data, nodes: [injectedNode, ...(def.data?.nodes || [])] } };
        }

        setWorkflowDef(def);

        // Sync selectedWorkflow with full data (especially is_owner and can_edit)
        setSelectedWorkflow(prev => {
          if (!prev || prev.id !== wfId) return prev;
          return {
            ...prev,
            name: def.name,
            is_owner: def.is_owner,
            is_published: def.is_published,
            can_edit: def.can_edit,
            thumbnail: def.thumbnail || prev.thumbnail
          };
        });
      } catch (err) {
        console.error("Error loading workflow:", err);
        setNodeSchemas([]);
        setWorkflowDef({ nodes: [], edges: [] });
      } finally {
        setLoading(false);
      }
    }

    loadWorkflowDetails();
  }, [selectedWorkflow?.id, apiKey]);

  const handleCreateWorkflow = useCallback(
    async (fromUrl = false) => {
      try {
        setLoading(true);
        if (!fromUrl) {
          const payload = {
            workflow_id: null,
            name: "Untitled Workflow",
            edges: [],
            data: { nodes: [] },
          };
          const response = await createWorkflow(apiKey, payload);
          // Route to /workflow/[id] so useParams().id works in the builder library
          router.push(`/workflow/${response.workflow_id}/builder`);
          return;
        }

        // Initialize state for the new flow
        setSelectedWorkflow({ id: null, name: "Untitled Workflow" });
        setNodeSchemas([]);
        setWorkflowDef({ nodes: [], edges: [] });
        setActiveSubTab("builder");
      } catch (err) {
        setError("Failed to initialize workflow: " + err.message);
      } finally {
        setLoading(false);
      }
    },
    [apiKey, router],
  );

  const handleRunWorkflow = async () => {
    if (isRunning || !selectedWorkflow?.id) return;
    setIsRunning(true);
    setRunResult(null);
    setShowResults(true);
    try {
      const data = await executeWorkflow(apiKey, selectedWorkflow.id, {});
      setRunResult(data);
    } catch (err) {
      setRunResult({ error: err.message });
    } finally {
      setIsRunning(false);
    }
  };

  const handlePublishWorkflow = async (wf, publish) => {
    console.log("handlePublishWorkflow called for wf:", wf.id, "publish:", publish, "activeSubTab:", activeSubTab);
    // If the builder is open for this workflow, let it handle publishing (with modal/saving)
    if (selectedWorkflow?.id === wf.id && activeSubTab === 'builder') {
      console.log("Builder is active, dispatching trigger-workflow-publish to window");
      window.dispatchEvent(new CustomEvent('trigger-workflow-publish'));
      return;
    }

    try {
      console.log("Builder not active or different wf, calling API directly");
      await publishWorkflow(apiKey, wf.id, publish);
      setWorkflows((prev) => prev.map((w) => w.id === wf.id ? { ...w, is_published: publish } : w));
      alert(publish ? "Воркфлоу опубликован" : "Воркфлоу снят с публикации");
    } catch (err) {
      console.error("Publish failed:", err);
      alert("Ошибка публикации");
    }
  };

  // Admin/owner: take a workflow down from the Community list.
  const handleModerate = async (wfId) => {
    try {
      await fetch(`/api/workflow/${wfId}/community-remove`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      });
      setWorkflows((prev) => prev.filter((w) => w.id !== wfId));
    } catch (err) {
      console.error('Moderate failed:', err);
      alert('Не удалось снять с публикации');
    }
  };

  const loadShares = async (wfId) => {
    if (!wfId) return;
    setLoadingShares(true);
    try {
      const r = await fetch(`/api/workflow/${wfId}/shares`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      if (r.ok) {
        const data = await r.json();
        setWorkflowShares(data);
      }
    } catch (err) {
      console.error('Failed to load shares:', err);
    } finally {
      setLoadingShares(false);
    }
  };

  const handleShare = async (e) => {
        e.preventDefault();
        if (!selectedWorkflow?.id) return;
        
        const value = shareInputType === "email" ? shareEmail.trim() : shareUserId.trim();
        if (!value) return;
        
        try {
            const body = shareInputType === "email" 
                ? { email: value, role: 'editor' } 
                : { userId: value, role: 'editor' };
                
            const r = await fetch(`/api/workflow/${selectedWorkflow.id}/share`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
                body: JSON.stringify(body),
            });
            if (r.ok) {
                setShareEmail("");
                setShareUserId("");
                await loadShares(selectedWorkflow.id);
                alert(`Пользователь добавлен! Отправь ему ссылку на воркфлоу: ${window.location.href}`);
            } else {
                const error = await r.text();
                alert(`Ошибка при поделиться: ${error}`);
            }
        } catch (err) {
            console.error('Share failed:', err);
            alert('Ошибка при поделиться');
        }
    };

  const handleRemoveShare = async (userId) => {
    if (!selectedWorkflow?.id || !userId) return;
    if (!window.confirm('Удалить доступ пользователю?')) return;
    try {
      const r = await fetch(`/api/workflow/${selectedWorkflow.id}/unshare`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({ userId }),
      });
      if (r.ok) {
        await loadShares(selectedWorkflow.id);
      } else {
        alert('Ошибка при удалении доступа');
      }
    } catch (err) {
      console.error('Unshare failed:', err);
      alert('Ошибка при удалении доступа');
    }
  };

  const handleDeleteWorkflow = async (wfId) => {
    if (!confirm("Are you sure you want to delete this workflow?")) return;
    setIsDeletingId(wfId);
    try {
      await deleteWorkflow(apiKey, wfId);
      setWorkflows((prev) => prev.filter((w) => w.id !== wfId));
    } catch (err) {
      console.error("Delete failed:", err);
      alert("Failed to delete workflow");
    } finally {
      setIsDeletingId(null);
    }
  };

  const handleRenameWorkflow = async (e) => {
    e?.preventDefault();
    if (!renamingWorkflow || !newWorkflowName.trim()) return;

    const wfId = renamingWorkflow.id;
    try {
      await updateWorkflowName(apiKey, wfId, newWorkflowName);
      setWorkflows((prev) =>
        prev.map((w) => (w.id === wfId ? { ...w, name: newWorkflowName } : w)),
      );
      if (selectedWorkflow?.id === wfId) {
        setSelectedWorkflow({ ...selectedWorkflow, name: newWorkflowName });
      }
      setRenamingWorkflow(null);
    } catch (err) {
      console.error("Rename failed:", err);
      alert("Failed to rename workflow");
    }
  };

  // KEY FIX: If the user is on /studio/workflows/[id], redirect to /workflow/[id]
  // so the builder library's useParams().id resolves correctly, preventing duplicate creation.
  useEffect(() => {
    if (typeof window !== 'undefined' && urlWorkflowId && urlWorkflowId !== 'new') {
      const path = window.location.pathname;
      if (path.startsWith('/studio/workflows/')) {
        const tab = urlTab || 'builder';
        router.replace(`/workflow/${urlWorkflowId}/${tab}`);
      }
    }
  }, [urlWorkflowId, urlTab, router]);

  // Sync state with URL on mount or URL change
  useEffect(() => {
    if (loading) return;

    if (urlWorkflowId) {
      if (urlWorkflowId === "new") {
        if (!selectedWorkflow || selectedWorkflow.id !== null) {
          handleCreateWorkflow(true);
        }
      } else {
        const found = workflows.find((wf) => wf.id === urlWorkflowId);
        if (found) {
          if (!selectedWorkflow || selectedWorkflow.id !== urlWorkflowId) {
            handleSelectWorkflow(found, true);
          }
        } else if (
          !selectedWorkflow ||
          selectedWorkflow.id !== urlWorkflowId
        ) {
          // Fallback for deep-linking: attempt to open even if not in the current tab's list
          // handleSelectWorkflow fetches official name/data anyway
          handleSelectWorkflow(
            { id: urlWorkflowId, name: "Loading..." },
            true,
          );
        }
      }
    } else if (selectedWorkflow && !isNavigatingRef.current) {
      setSelectedWorkflow(null);
    }
  }, [
    urlWorkflowId,
    workflows,
    loading,
    selectedWorkflow,
    handleCreateWorkflow,
    handleSelectWorkflow,
  ]);

  // Listen for publish state changes from the builder
  useEffect(() => {
    const handlePublishChange = (e) => {
      const { id, isPublished, name, thumbnail } = e.detail;
      setWorkflows((prev) => prev.map((w) => {
        if (w.id === id) {
          return { 
            ...w, 
            is_published: isPublished,
            ...(name ? { name } : {}),
            ...(thumbnail ? { thumbnail } : {})
          };
        }
        return w;
      }));
      if (selectedWorkflow?.id === id) {
        setSelectedWorkflow((prev) => ({ 
          ...prev, 
          is_published: isPublished,
          ...(name ? { name } : {}),
          ...(thumbnail ? { thumbnail } : {})
        }));
      }
    };
    window.addEventListener('workflow-publish-changed', handlePublishChange);
    return () => window.removeEventListener('workflow-publish-changed', handlePublishChange);
  }, [selectedWorkflow]);

  // Handle reload on exit to clear builder CSS
  useEffect(() => {
    const fromBuilder = sessionStorage.getItem("fromWorkflowBuilder");
    if (fromBuilder && (!urlWorkflowId || activeSubTab !== "builder")) {
      sessionStorage.removeItem("fromWorkflowBuilder");
      window.location.reload();
    }
  }, [urlWorkflowId, activeSubTab]);

  useEffect(() => {
    async function loadWorkflows() {
      try {
        setLoading(true);
        let data = [];
        if (activeMainTab === "templates") {
          data = await getTemplateWorkflows(apiKey);
        } else if (activeMainTab === "my-workflows") {
          data = await getUserWorkflows(apiKey);
        } else if (activeMainTab === "published") {
          data = await getPublishedWorkflows(apiKey);
        }
        setWorkflows(data);
      } catch (err) {
        console.error("Failed to load workflows:", err);
        setError("Failed to load workflows list.");
      } finally {
        setLoading(false);
      }
    }
    loadWorkflows();
  }, [apiKey, activeMainTab]);

  if (loading && !selectedWorkflow) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin text-[#d946ef] text-3xl">◌</div>
      </div>
    );
  }

  if (selectedWorkflow) {
    return (
      <div className="h-full flex flex-col bg-[#0a0714] text-white">
        {/* Immersive Sub-header / Floating Toggle */}
        {isHeaderVisible ? (
          <div className="flex-shrink-0 h-14 border-b border-purple-500/10 flex items-center justify-between px-6 bg-black/20 z-30">
            <div className="flex items-center gap-4 h-full">
              <button
                onClick={() => router.push("/studio/workflows")}
                className="flex items-center gap-2 text-xs font-bold text-white/50 hover:text-white transition-colors"
                type="button"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
                Мои процессы
              </button>
            </div>

            <div className="flex items-center gap-3">
              {selectedWorkflow.is_owner !== false && (
                <>
                  <button
                    onClick={() => handlePublishWorkflow(selectedWorkflow, !selectedWorkflow.is_published)}
                    className="flex items-center gap-2 px-4 py-1.5 border border-purple-500/30 bg-purple-600 text-white text-sm rounded-full hover:bg-fuchsia-500 hover:border-fuchsia-500/30 transition-all shadow-lg shadow-purple-900/20"
                    type="button"
                  >
                    {selectedWorkflow.is_published ? "Снять с публикации" : "Публикация"}
                  </button>
                  <button
                    onClick={() => setShowShareModal(true)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-[#d946ef]/10 hover:bg-[#d946ef]/20 border border-[#d946ef]/30 rounded-md text-[10px] font-black text-[#d946ef] uppercase tracking-widest transition-colors"
                    type="button"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M18 8a3 3 0 100-6 3 3 0 000 6zM6 15a3 3 0 100-6 3 3 0 000 6zM18 20a3 3 0 100-6 3 3 0 000 6zM8.59 13.51l6.83 3.98M8.59 6.51l6.83 3.98" />
                    </svg>
                    Поделиться
                  </button>
                </>
              )}
              <button
                onClick={() => onToggleHeader?.(false)}
                className="p-1.5 bg-white/5 hover:bg-white/10 rounded-md transition-colors text-white/40 hover:text-white"
                title="Enter Zen Mode"
                type="button"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
                </svg>
              </button>
            </div>
          </div>
        ) : (
          /* Floating Immersive Mode Controller */
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-4 px-4 py-2 bg-black/30 backdrop-blur-xl border border-purple-500/20 rounded-full shadow-2xl animate-fade-in-down">
            <button
               onClick={() => router.push("/studio/workflows")}
               className="p-1.5 text-white/40 hover:text-white transition-colors"
               title="Back to All Workflows"
               type="button"
            >
               <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            </button>

            <div className="h-4 w-[1px] bg-white/10" />

            <button
              onClick={() => onToggleHeader?.(true)}
              className="px-3 py-1 bg-white/10 hover:bg-white/20 text-[9px] font-black text-white uppercase tracking-widest rounded-lg transition-colors flex items-center gap-2"
              type="button"
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M4 14h6v6M20 10h-6V4M10 20l-7-7M14 4l7 7"/></svg>
              Exit Zen
            </button>
          </div>
        )}

        <div className="flex-1 overflow-hidden">
          <div className="flex-1 relative h-full bg-[#0a0714]">
            {nodeSchemas && workflowDef ? (
              <WorkflowUI
                workflowId={selectedWorkflow?.id}
                initialNodeSchemas={nodeSchemas}
                initialWorkflowData={{
                  ...workflowDef,
                  workflow_id: selectedWorkflow?.id
                }}
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-12 h-12 border-4 border-white/5 border-t-[#d946ef] rounded-full animate-spin" />
                  <div className="text-[10px] font-black text-white/20 uppercase tracking-widest">
                    Загрузка билдера...
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Results overlay */}
        {showResults && (
          <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-8">
            <div className="w-full max-w-3xl bg-[#0f0c18] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
                <span className="text-xs font-black text-white/50 uppercase tracking-widest">Results</span>
                <button onClick={() => setShowResults(false)} className="text-white/40 hover:text-white transition-colors" type="button">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
                </button>
              </div>
              <div className="p-6 overflow-y-auto max-h-[70vh]">
                {isRunning && (
                  <div className="flex flex-col items-center gap-4 py-12">
                    <div className="w-16 h-16 border-4 border-white/5 border-t-[#d946ef] rounded-full animate-spin" />
                    <span className="text-xs text-white/40 uppercase tracking-widest animate-pulse">Generating...</span>
                  </div>
                )}
                {runResult?.error && (
                  <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">{runResult.error}</div>
                )}
                {runResult?.outputs?.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {runResult.outputs.map((out, i) => (
                      <div key={i} className="rounded-xl overflow-hidden border border-white/10 bg-white/5">
                        {out.type === 'image_url' ? (
                          <img src={out.value} alt="output" className="w-full object-cover" />
                        ) : out.type === 'video_url' ? (
                          <video src={out.value} controls className="w-full" />
                        ) : out.type === 'audio_url' ? (
                          <audio src={out.value} controls className="w-full p-4" />
                        ) : (
                          <div className="p-4 text-white/70 text-sm italic">{out.value}</div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                {runResult && !runResult.error && (!runResult.outputs || runResult.outputs.length === 0) && (
                  <div className="text-center py-8 text-white/30 text-sm">No outputs returned</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Share Modal */}
        {showShareModal && (
          <div className="absolute inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-8">
            <div className="w-full max-w-lg bg-[#0f0c18] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
                <span className="text-sm font-black text-white uppercase tracking-widest">Поделиться воркфлоу</span>
                <button
                  onClick={() => setShowShareModal(false)}
                  className="text-white/40 hover:text-white transition-colors"
                  type="button"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="p-6 space-y-4">
                {/* Tabs */}
                <div className="flex gap-2 border border-white/10 rounded-lg overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setShareInputType("email")}
                    className={`flex-1 py-2 text-xs font-semibold transition-colors ${
                      shareInputType === "email"
                        ? "bg-[#d946ef]/20 text-[#d946ef]"
                        : "text-white/50 hover:text-white/70"
                    }`}
                  >
                    По почте
                  </button>
                  <button
                    type="button"
                    onClick={() => setShareInputType("id")}
                    className={`flex-1 py-2 text-xs font-semibold transition-colors ${
                      shareInputType === "id"
                        ? "bg-[#d946ef]/20 text-[#d946ef]"
                        : "text-white/50 hover:text-white/70"
                    }`}
                  >
                    По ID
                  </button>
                </div>

                <form onSubmit={handleShare} className="flex gap-2">
                  {shareInputType === "email" ? (
                    <input
                      type="email"
                      value={shareEmail}
                      onChange={(e) => setShareEmail(e.target.value)}
                      placeholder="Email пользователя"
                      className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#d946ef]/50"
                    />
                  ) : (
                    <input
                      type="text"
                      value={shareUserId}
                      onChange={(e) => setShareUserId(e.target.value)}
                      placeholder="User ID пользователя"
                      className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#d946ef]/50 font-mono"
                    />
                  )}
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#d946ef]/20 hover:bg-[#d946ef]/30 border border-[#d946ef]/40 rounded-lg text-sm font-black text-[#d946ef] uppercase tracking-widest transition-colors"
                  >
                    Пригласить
                  </button>
                </form>

                <div className="border-t border-white/5 pt-4">
                  <h3 className="text-xs font-black text-white/40 uppercase tracking-widest mb-3">Доступные пользователи</h3>
                  {loadingShares ? (
                    <div className="text-center py-4 text-white/30 text-sm">Загрузка...</div>
                  ) : workflowShares.length === 0 ? (
                    <div className="text-center py-4 text-white/30 text-sm">Нет пользователей с доступом</div>
                  ) : (
                    <div className="space-y-2">
                      {workflowShares.map((share) => (
                        <div key={share.id} className="flex items-center justify-between px-3 py-2 bg-white/5 rounded-lg">
                          <div>
                            <div className="text-sm text-white">{share.email || share.user_id}</div>
                            <div className="text-xs text-white/40">{share.role}</div>
                          </div>
                          <button
                            onClick={() => handleRemoveShare(share.user_id)}
                            className="text-red-400 hover:text-red-300 text-xs font-bold transition-colors"
                            type="button"
                          >
                            Удалить
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Render main workflow list
  return (
    <div className="h-full w-full flex flex-col p-8 overflow-y-auto custom-scrollbar">
      <div className="max-w-7xl mx-auto w-full">
        <div className="flex flex-col gap-6 mb-12">
          <div className="flex items-end justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">
                Процессы
              </h1>
              <p className="text-white/40 text-sm font-medium">
                Создавайте и управляйте своими ИИ-процессами
              </p>
            </div>
            <button
              onClick={() => handleCreateWorkflow()}
              className="px-6 py-3 bg-[#d946ef] text-black text-xs font-black uppercase tracking-widest rounded-lg hover:bg-white transition-all transform hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(34, 211, 238,0.3)] flex items-center gap-2"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              Создать процесс
            </button>
          </div>

          <div className="flex items-center gap-2 border-b border-white/5">
            <button
              onClick={() => setActiveMainTab("my-workflows")}
              className={`px-6 py-4 text-xs font-black uppercase tracking-[0.2em] transition-all border-b-2 ${
                activeMainTab === "my-workflows"
                  ? "text-[#d946ef] border-[#d946ef]"
                  : "text-white/30 border-transparent hover:text-white"
              }`}
            >
              Мои процессы
            </button>
            <button
              onClick={() => setActiveMainTab("published")}
              className={`px-6 py-4 text-xs font-black uppercase tracking-[0.2em] transition-all border-b-2 ${
                activeMainTab === "published"
                  ? "text-[#d946ef] border-[#d946ef]"
                  : "text-white/30 border-transparent hover:text-white"
              }`}
            >
              Сообщество
            </button>
          </div>
        </div>

        {loading ? (
          <div className="py-20 flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-white/5 border-t-[#d946ef] rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
            {workflows.map((wf) => (
              <WorkflowCard
                key={wf.id}
                workflow={wf}
                onClick={handleSelectWorkflow}
                activeTab={activeMainTab}
                onRename={(wf) => {
                   setRenamingWorkflow(wf);
                   setNewWorkflowName(wf.name);
                }}
                onDelete={handleDeleteWorkflow}
                onPublish={handlePublishWorkflow}
                onModerate={handleModerate}
              />
            ))}
            {!loading && workflows.length === 0 && (
              <div className="col-span-full py-24 text-center border-2 border-dashed border-white/5 rounded-2xl bg-white/[0.02]">
                <div className="text-white/20 text-sm font-medium italic">
                  В этом разделе пока нет процессов.
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Rename Modal */}
      {renamingWorkflow && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setRenamingWorkflow(null)} />
          <form 
            onSubmit={handleRenameWorkflow}
            className="relative w-full max-w-sm bg-[#0f0c18] border border-white/10 rounded-2xl p-8 shadow-2xl animate-in fade-in zoom-in duration-300"
          >
            <h3 className="text-xl font-bold text-white mb-2">Переименовать процесс</h3>
            <p className="text-white/40 text-sm mb-6">Введите новое название для процесса.</p>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-[#d946ef] uppercase tracking-widest">Название процесса</label>
                <input
                  autoFocus
                  type="text"
                  value={newWorkflowName}
                  onChange={(e) => setNewWorkflowName(e.target.value)}
                  placeholder="напр. Кинематографичный ролик"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#d946ef]/50 transition-colors"
                />
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setRenamingWorkflow(null)}
                  className="flex-1 px-4 py-3 text-xs font-black text-white/40 uppercase tracking-widest hover:text-white transition-colors"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-[#d946ef] text-black px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-white transition-all transform hover:scale-105 active:scale-95"
                >
                  Сохранить
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
