import React, { useEffect, useMemo, useRef, useState } from "react";
import { Handle, Position, useReactFlow, useStore, useUpdateNodeInternals } from "reactflow";
import { FaAngleLeft, FaAngleRight } from "react-icons/fa6";
import { downloadFile } from "./file/downloadFile.js";
import { imageModels } from "./model-registry/imageModels.js";
import { stableStringify } from "./stableStringify.js";
import { getRunId, getWorkflowId } from "./WorkflowStore";
import axios from "axios";
import { toast } from "react-hot-toast";
import { IoClose, IoImageOutline, IoTrashOutline } from "react-icons/io5";
import UploadNode from "./UploadNode";
import { SlOptions } from "react-icons/sl";
import { MdOutlineFileDownload } from "react-icons/md";
import { HiOutlineViewGrid } from "react-icons/hi";
import NodeSendButton from "./NodeSendButton";
import NodeOptionsMenu from "./NodeOptionsMenu";
import { useGenerationCost } from "./useGenerationCost";
import {
  MAX_IMAGE_NODE_SIZE,
  MIN_IMAGE_NODE_SIZE,
  normalizeImageNodeSize,
} from "./imageNodeSizing.js";

const inputHandles = [
  "imageInput",
  "imageInput2",
  "imageInput3"
];

const outputHandles = [
  "imageOutput",
];

const ImageGeneration = ({ id, data, selected }) => {
  const models = useMemo(() => {
    return data.nodeSchemas?.categories?.image?.models 
      ? Object.values(data.nodeSchemas.categories.image.models) 
      : [];
  }, [data.nodeSchemas]);
  
  const [selectedModel, setSelectedModel] = useState(data.selectedModel || models[1] || models[0] || {});
  const [connectedInputs, setConnectedInputs] = useState({});
  const [connectedOutputs, setConnectedOutputs] = useState({});
  const [formValues, setFormValues] = useState(data.formValues || {});
  const [dropDown, setDropDown] = useState(0);
  const [loading, setLoading] = useState(0);
  const [currentHistoryIndex, setCurrentHistoryIndex] = useState(-1);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageMetadata, setImageMetadata] = useState({ width: 0, height: 0, size: null });
  const [nodeSize, setNodeSize] = useState(() => normalizeImageNodeSize(data.nodeSize));
  const outputHistory = data.outputHistory || [];
  const prevHistoryLengthRef = useRef(outputHistory.length);
  const resizeCleanupRef = useRef(null);
  const containerRef = useRef(null);
  const workflowId = getWorkflowId();
  const runId = data.runId ?? getRunId();
  const nodeSchemas = data.nodeSchemas || {};
  const { setNodes, setEdges } = useReactFlow();
  const updateNodeInternals = useUpdateNodeInternals();
  const edges = useStore((state) => state.edges);
  const selectedModelId = selectedModel?.id || "";
  const properties = nodeSchemas?.categories?.image?.models?.[selectedModelId]?.input_schema?.schemas?.input_data?.properties;
  const { generationCost, isRefreshingCost } = useGenerationCost(selectedModel, formValues);
  
  useEffect(() => {
    if (data.cost !== generationCost) {
      data.onDataChange?.(id, { cost: generationCost });
    }
  }, [id, generationCost, data.cost]);

  const initializeFormData = (schemaProperties) => {
    const initialData = {};
    const fieldEntries = Object.entries(schemaProperties || {});

    fieldEntries.forEach(([fieldName, fieldSchema]) => {
      if (fieldSchema.type === "array") {
        if (fieldSchema.items?.type === "object") {
          const examples = fieldSchema.examples;
          if (Array.isArray(examples) && examples.length > 0) {
            initialData[fieldName] = examples.map((ex) => ({ ...ex }));
          } else {
            initialData[fieldName] = [];
          }
        } else {
          initialData[fieldName] = fieldSchema.examples || [];
        }

      } else if (fieldSchema.type === "object") {
        const nestedProps = fieldSchema.properties || {};
        initialData[fieldName] = initializeFormData(nestedProps);

      } else if (fieldSchema.default !== undefined) {
        initialData[fieldName] = fieldSchema.default;

      } else if (fieldSchema.examples && fieldSchema.examples.length > 0) {
        initialData[fieldName] = fieldSchema.examples[0];

      } else {
        switch (fieldSchema.type) {
          case "boolean":
            initialData[fieldName] = false;
            break;
          case "int":
          case "number":
            initialData[fieldName] = 0;
            break;
          default:
            initialData[fieldName] = "";
        }
      }
    });

    return initialData;
  };

  const addFormValuesInTaskData = (properties) => {
    const defaults = initializeFormData(properties);

    const validKeys = Object.keys(properties);
    const filteredFormValues = Object.entries(data.formValues || {}).reduce((acc, [key, val]) => {
      if (validKeys.includes(key)) acc[key] = val;
      return acc;
    }, {});

    const merged = Object.entries({ ...defaults, ...filteredFormValues }).reduce(
      (acc, [key, val]) => {
        const meta = properties[key];
        if (meta?.enum && !meta.enum.includes(val)) {
          acc[key] = meta.default ?? meta.enum[0] ?? "";
        } else {
          acc[key] = val;
        }
        return acc;
      },
      {}
    );

    // Preserve UI-only flags that are not part of the model schema
    const UI_KEYS = ["make_output", "make_input"];
    UI_KEYS.forEach((k) => {
      if (data.formValues?.[k] !== undefined) merged[k] = data.formValues[k];
    });

    setFormValues((prev) => (
      stableStringify(prev) === stableStringify(merged) ? prev : merged
    ));
  };

  useEffect(() => {
    setLoading(1);
    if (properties) {
      addFormValuesInTaskData(properties);
    }
    setLoading(0);
  }, [selectedModelId]);

  useEffect(() => {
    if (data.selectedModel?.id && data.selectedModel.id !== selectedModelId) {
      setSelectedModel(data.selectedModel);
    }

    if (data.triggerRun) {
      handleRunSingleNode();
      data.onDataChange(id, { triggerRun: false });
    }

    if (data.outputHistory && data.outputHistory.length > 0) {
      if (currentHistoryIndex === -1) {
        setCurrentHistoryIndex(data.outputHistory.length - 1);
        setCurrentImageIndex(0);
      } else if (data.outputHistory.length > prevHistoryLengthRef.current) {
        setCurrentHistoryIndex(data.outputHistory.length - 1);
        setCurrentImageIndex(0);
      }
    }
    prevHistoryLengthRef.current = data.outputHistory ? data.outputHistory.length : 0;
  }, [data.selectedModel, data.triggerRun, data.outputHistory, selectedModelId]);

  useEffect(() => {
    updateNodeInternals(id);
  }, [formValues, id, nodeSize, updateNodeInternals]);

  useEffect(() => {
    const nextSize = normalizeImageNodeSize(data.nodeSize);
    setNodeSize((prev) => (
      prev.width === nextSize.width && prev.height === nextSize.height
        ? prev
        : nextSize
    ));
  }, [data.nodeSize]);

  useEffect(() => () => {
    resizeCleanupRef.current?.();
    resizeCleanupRef.current = null;
  }, []);

  const handleChange = (key, value) => {
    setFormValues(prev => ({ ...prev, [key]: value }));
    setDropDown(-1);
  };

  const handleResizeStart = (event) => {
    event.preventDefault();
    event.stopPropagation();

    resizeCleanupRef.current?.();

    const startSize = normalizeImageNodeSize(nodeSize);
    const startWidth = containerRef.current?.offsetWidth || startSize.width;
    const startHeight = containerRef.current?.offsetHeight || startSize.height;
    const startX = event.clientX;
    const startY = event.clientY;
    let lastSize = startSize;

    const handlePointerMove = (moveEvent) => {
      const nextSize = normalizeImageNodeSize({
        width: startWidth + (moveEvent.clientX - startX),
        height: startHeight + (moveEvent.clientY - startY),
      });
      lastSize = nextSize;
      setNodeSize(nextSize);
    };

    const finishResize = () => {
      resizeCleanupRef.current?.();
      resizeCleanupRef.current = null;
      setNodeSize(lastSize);
      data.onDataChange?.(id, { nodeSize: lastSize });
      updateNodeInternals(id);
    };

    const cleanup = () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", finishResize);
      window.removeEventListener("pointercancel", finishResize);
    };

    resizeCleanupRef.current = cleanup;
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", finishResize);
    window.addEventListener("pointercancel", finishResize);
  };

  useEffect(() => {
    if (!data.formValues) return;
    // Key-order-independent compare so a parent rebuild with the same content
    // doesn't look "different" and pull us into a sync loop.
    if (stableStringify(data.formValues) === stableStringify(formValues)) return;

    const timer = setTimeout(() => {
      if (Object.entries(data.formValues || {}).length > 0) {
        setFormValues(data.formValues);
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [data.formValues]);

  const lastSentRef = useRef(null);
  useEffect(() => {
    if (!data?.onDataChange || data?.selectedModel?.id === "image-passthrough") return;

    const localSig = stableStringify(formValues);
    const parentSig = stableStringify(data.formValues || {});
    const sameModel = (selectedModel?.id) === (data.selectedModel?.id);

    // Echo suppression: if the parent already holds exactly this state, sending
    // it back would just bounce through onDataChange ⇄ formValues forever
    // (React error #185 — the array field images_list churns its reference).
    if (sameModel && localSig === parentSig) {
      lastSentRef.current = localSig;
      return;
    }
    // Don't re-send the same payload we just sent.
    if (sameModel && localSig === lastSentRef.current) return;

    lastSentRef.current = localSig;
    data.onDataChange(id, { selectedModel, formValues, loading });
  }, [selectedModel, formValues, loading, data.formValues, data.selectedModel]);
  
  // Сохраняем картинку в Галерею (как Студия и VideoNode) — /api/gallery сам
  // зеркалирует в TOS и добавляет запись gallery/{userId}/entries/{id}.json.
  // Серверный /run тоже пытается это сделать, но если он не смог опознать
  // пользователя (нет токена в контексте запроса), запись не создаётся —
  // картинка попадает только в общее хранилище images/, но не в галерею.
  // Поэтому, как и VideoNode, зовём явно из браузера (cookie sb_access_token
  // едет автоматически). keepalive:true — запрос переживёт уход на другую
  // страницу (напр. сразу в «Галерею»), иначе fire-and-forget POST прервётся.
  const saveImageToGallery = (url) => {
    if (!url || typeof url !== "string") return;
    fetch("/api/gallery", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      keepalive: true,
      body: JSON.stringify({
        url,
        type: "image",
        model: selectedModel?.id || data.selectedModel?.id || "",
        prompt: formValues?.prompt || data.formValues?.prompt || "",
      }),
    })
      .then(async (r) => {
        if (!r.ok) {
          const err = await r.json().catch(() => ({}));
          toast.error("Не удалось сохранить в галерею: " + (err.error || r.status), { duration: 4000 });
        }
      })
      .catch((e) => {
        toast.error("Не удалось сохранить в галерею: " + (e.message || "ошибка"), { duration: 4000 });
      });
  };

  // Called on a successful generation. Most builder runs now already receive a
  // permanent TOS url from the server; save the workflow immediately so a quick
  // refresh cannot lose it. The background upload path remains as a fallback for
  // older/raw image values.
  const finalizeImage = (val) => {
    if (!val || typeof val !== "string") return;
    if (val.includes(".volces.com")) {
      data.handleSaveWorkFlow?.();
      saveImageToGallery(val);
      updateWorkflowThumbnail(val);
      return;
    }
    const payload = val.startsWith("data:") ? { image: val } : { url: val };
    axios.post("/api/upload-file", payload)
      .then((r) => {
        const tosUrl = r.data?.url;
        if (!tosUrl) { saveImageToGallery(val); return; }
        const tosOut = [{ type: "image_url", value: tosUrl }];
        const tosHistory = (data.outputHistory || []).map((h) => {
          const o = h.result?.outputs?.[0];
          return o && o.value === val
            ? { ...h, result: { ...h.result, outputs: tosOut } }
            : h;
        });
        data.onDataChange?.(id, { outputs: tosOut, resultUrl: tosUrl, outputHistory: tosHistory });
        data.handleSaveWorkFlow?.();
        saveImageToGallery(tosUrl);
        updateWorkflowThumbnail(tosUrl);
      })
      .catch(() => { saveImageToGallery(val); });
  };

  const pollNodeStatus = (run_id) => {
    let interval; const _check = () => {
      axios.get(`/api/workflow/run/${run_id}/status`)
      .then((response) => {
        const nodesInRes = response.data.nodes || {};
        const nodeData = nodesInRes[id] || Object.entries(nodesInRes).find(([key]) => 
          key.toLowerCase().replace(/\s+/g, '') === id.toLowerCase().replace(/\s+/g, '')
        )?.[1];
        if (!nodeData || nodeData.length === 0) return;
        const latest = nodeData[nodeData.length - 1];
        if (latest.status === "succeeded" || latest.status === "completed") {
          const output = latest.result.outputs;
          const val = output[0]?.value || "";
          
          const currentHistory = data.outputHistory || [];
          const result = latest.result;
          const isAlreadyInHistory = currentHistory.some(h => h.result?.id === result.id);
          const newHistory = isAlreadyInHistory 
            ? currentHistory.map(h => h.result?.id === result.id ? latest : h)
            : [...currentHistory, latest];

          data?.onDataChange?.(id, { outputs: output, resultUrl: val, isLoading: false, errorMsg: null, outputHistory: newHistory });
          setCurrentHistoryIndex(newHistory.length - 1);
          setCurrentImageIndex(0);
          finalizeImage(val);
          clearInterval(interval);
        }

        if (latest.status === "failed") {
          const outputs = latest?.result?.outputs;
          let errorMsg = "Ошибка генерации";

          if (outputs && outputs[0]?.value?.error) {
            errorMsg = outputs[0].value.error; 
          }
          toast.error(`Нода ${id} ошибка`);
          
          const currentHistory = data.outputHistory || [];
          data.onDataChange(id, { isLoading: false, errorMsg, outputHistory: currentHistory });
          clearInterval(interval);
        }
      })
      .catch((error) => {
        console.log(error);
        clearInterval(interval);
        data.onDataChange(id, { isLoading: false });
        toast.error(`Не удалось получить статус Image ${id.replace(/^\D+/g, "")}`);
      });
    }; _check(); interval = setInterval(_check, 500);
  };

  const handleRunSingleNode = async () => {
    try {
      data.onDataChange(id, { isLoading: true });
      const workflow_id = await data.handleSaveWorkFlow();

      if (!workflow_id) {
        toast.error("Не удалось сохранить воркфлоу перед запуском ноды");
        data.onDataChange(id, { isLoading: false });
        return;
      }

      const modelSchema = nodeSchemas?.categories?.image?.models[selectedModel.id]?.input_schema?.schemas?.input_data;
      if (!modelSchema || !modelSchema.properties) {
        toast.error("Схема входных данных для этой модели не найдена");
        data.onDataChange(id, { isLoading: false });
        return;
      }
      const params = {};
      const inputSchema = modelSchema.properties;
      const localSources = formValues || {};
      for (const [key, meta] of Object.entries(inputSchema)) {
        if (localSources.hasOwnProperty(key)) {
          params[key] = localSources[key];
        } else {
          params[key] = meta.default ?? null;
        }
      }

      const response = await axios.post(`/api/workflow/${workflow_id}/node/${id}/run`, {
        run_id: runId,
        model: selectedModel.id,
        params: params,
        cost: generationCost,
        node_id: "AI Image"
      });
      { var _r = response.data; var _nd = _r && _r.nodes && (_r.nodes[id] || Object.values(_r.nodes)[0]); var _lt = _nd && _nd[_nd.length - 1]; if (_lt && (_lt.status === "succeeded" || _lt.status === "completed") && _lt.result && _lt.result.outputs) { var _o = _lt.result.outputs; var _val = (_o[0] && _o[0].value) || ""; data && data.onDataChange && data.onDataChange(id, { outputs: _o, resultUrl: _val, isLoading: false, errorMsg: null, outputHistory: (data.outputHistory || []).concat([_lt]) }); finalizeImage(_val); } else if (_lt && _lt.status === "failed") { data && data.onDataChange && data.onDataChange(id, { isLoading: false, errorMsg: "Ошибка генерации" }); } else { pollNodeStatus(_r.run_id); } }
    } catch(error) {
      data.onDataChange(id, { isLoading: false });
      toast.error(error.response?.data?.detail || "Ошибка при запуске ноды");
      console.error(error);
    };
  };

  const handleDeleteNode = () => {
    if (window.confirm(`Вы уверены, что хотите удалить ноду ${id}?`)) {
      setNodes((nds) => nds.filter((n) => n.id !== id));
      setEdges((eds) => eds.filter((e) => e.source !== id && e.target !== id));
      toast.success(`Нода ${id} удалена`);
    };
  };

  const hasPrompt = properties && "prompt" in properties && !data.selectedModel?.id.includes("passthrough");
  const hasImagesList = properties && "images_list" in properties && !data.selectedModel?.id.includes("passthrough");
  const hasImageUrl = properties && "image_url" in properties && !data.selectedModel?.id.includes("passthrough");

  useEffect(() => {
    const timeout = setTimeout(() => {
      const validHandles = [
        hasPrompt && "imageInput",
        hasImageUrl && "imageInput3",
        hasImagesList && "imageInput2",
      ].filter(Boolean);

      setEdges((prevEdges) =>
        prevEdges.filter((edge) => {
          if (edge.target !== id) return true;
          return validHandles.includes(edge.targetHandle);
        })
      );
    }, 2000);
    return () => clearTimeout(timeout);
  }, [hasPrompt, hasImageUrl, hasImagesList, id, setEdges]);

  useEffect(() => {
    const connectedInputs = {};
    inputHandles.forEach((h) => {
      connectedInputs[h] = edges.some(
        (e) => e.target === id && e.targetHandle === h
      );
    });

    const connectedOutputs = {};
    outputHandles.forEach((h) => {
      connectedOutputs[h] = edges.some(
        (e) => e.source === id && e.sourceHandle === h
      );
    });

    setConnectedInputs(connectedInputs);
    setConnectedOutputs(connectedOutputs);
  }, [edges, id]);

  const handlePrev = (e) => {
    e.stopPropagation();
    if (currentHistoryIndex > 0) {
      const newIndex = currentHistoryIndex - 1;
      setCurrentHistoryIndex(newIndex);
      setCurrentImageIndex(0);
      const viewing = outputHistory[newIndex]?.result?.outputs?.[0]?.value;
      setNodes((nds) => nds.map((n) => {
        if (n.id === id) {
          return { ...n, data: { ...n.data, viewingOutput: viewing } };
        }
        return n;
      }));
    }
  };

  const handleNext = (e) => {
    e.stopPropagation();
    if (currentHistoryIndex < outputHistory.length - 1) {
      const newIndex = currentHistoryIndex + 1;
      setCurrentHistoryIndex(newIndex);
      setCurrentImageIndex(0);
      const viewing = outputHistory[newIndex]?.result?.outputs?.[0]?.value;
      setNodes((nds) => nds.map((n) => {
        if (n.id === id) {
          return { ...n, data: { ...n.data, viewingOutput: viewing } };
        }
        return n;
      }));
    }
  };

  const handleDeleteHistory = async (e) => {
    e.stopPropagation();
    const currentHistory = outputHistory[currentHistoryIndex];
    if (!currentHistory || !currentHistory.node_run_id) return;

    if (window.confirm("Вы уверены, что хотите удалить эту запись из истории?")) {
      try {
        await axios.delete(`/api/workflow/node-run/${currentHistory.node_run_id}`);
        const newHistory = outputHistory.filter((_, i) => i !== currentHistoryIndex);
        
        data?.onDataChange?.(id, { 
          outputHistory: newHistory,
          ...(newHistory.length === 0 ? { outputs: [], resultUrl: null } : {})
        });

        if (newHistory.length === 0) {
          setCurrentHistoryIndex(-1);
        } else {
          setCurrentHistoryIndex(Math.max(0, currentHistoryIndex - 1));
        }
        toast.success("Запись удалена");
      } catch (error) {
        toast.error(error.response?.data?.detail || "Не удалось удалить запись");
        console.error(error);
      }
    }
  };

  const currentOutputList = currentHistoryIndex !== -1 && outputHistory[currentHistoryIndex]
    ? outputHistory[currentHistoryIndex]?.result?.outputs || []
    : (data.outputs || []);

  const currentOutput = currentOutputList.length > 0
    ? currentOutputList[currentImageIndex]?.value || currentOutputList[0]?.value || data.resultUrl
    : data.resultUrl;

  // Show a small resized preview (TOS image-processing) instead of the full
  // multi-MB original — a big speedup since the bucket lives in a far region.
  // Only rewrites TOS-hosted images; onError on the <img> falls back to the
  // original if the bucket doesn't have image-processing enabled.
  const toThumb = (u) => {
    if (!u || typeof u !== "string" || u.startsWith("data:") || !u.includes(".volces.com")) return u;
    return u + (u.includes("?") ? "&" : "?") + "x-tos-process=image/resize,w_640";
  };

  useEffect(() => {
    if (currentOutput) {
      const img = new Image();
      img.onload = () => {
        setImageMetadata(prev => ({ 
          ...prev, 
          width: img.naturalWidth, 
          height: img.naturalHeight 
        }));
      };
      img.src = currentOutput;
      
      if (currentOutput.startsWith('http://') || currentOutput.startsWith('https://')) {
        fetch(currentOutput, { method: 'HEAD' })
          .then(res => {
            const size = res.headers.get('content-length');
            if (size) {
              const sizeInMB = (parseInt(size) / (1024 * 1024)).toFixed(2);
              setImageMetadata(prev => ({ ...prev, size: sizeInMB + ' MB' }));
            } else {
              setImageMetadata(prev => ({ ...prev, size: null }));
            }
          })
          .catch(() => {
            setImageMetadata(prev => ({ ...prev, size: null }));
          });
      }
    } else {
      setImageMetadata({ width: 0, height: 0, size: null });
    }
  }, [currentOutput]);

  const updateWorkflowThumbnail = async (thumbnail) => {
    const workflow_id = await data.handleSaveWorkFlow();
    if (!workflow_id) {
      toast.error("Workflow id not found");
      return;
    }

    if (!thumbnail) {
      toast.error("Thumbnail URL is required");
      return;
    }
    try { 
      const response = await axios.post(`/api/workflow/${workflow_id}/thumbnail`, { 
        thumbnail 
      });
      if (response.data.success) toast.success("Обложка успешно обновлена");
    } catch(error) {
      toast.error(error.response?.data?.detail || "Не удалось сохранить обложку");
      console.error(error);
    };
  };

  return (
    <div 
      ref={containerRef}
      style={{
        minHeight: MIN_IMAGE_NODE_SIZE.height,
        minWidth: MIN_IMAGE_NODE_SIZE.width,
        maxWidth: MAX_IMAGE_NODE_SIZE.width,
        maxHeight: MAX_IMAGE_NODE_SIZE.height,
        width: nodeSize.width,
        height: nodeSize.height,
        '--loader-color': '#10b981',
      }} 
      className={`
        nowheel group flex flex-col flex-1
        rounded-t-2xl rounded-b-none border-2 relative transition-all duration-300 ease-in-out 
        ${selected 
          ? "border-emerald-500 shadow-[0_0_25px_rgba(16,185,129,0.3)] scale-[1.02] ring-1 ring-emerald-500/20" 
          : "border-zinc-800 hover:border-zinc-700 shadow-lg"} 
        bg-[#0c0d0f]
      `}
    >
      {data.isLoading && (
        <div className="loader-border" />
      )}
      <div className="flex items-center gap-2 absolute -top-5 left-0">
        <h3 className="text-zinc-400 text-[10px] font-medium tracking-wider uppercase">
          Изображение {id.replace(/^\D+/g, "")}
        </h3>
        {generationCost !== null && !selectedModel?.id.includes("passthrough") && (
          <span className="text-xs text-green-500 -mt-0.5 font-medium flex items-center gap-1 opacity-80">
            {isRefreshingCost ? (
              <span className="flex items-center gap-1 italic text-emerald-200">
                <div className="w-2 h-2 border-[1.5px] border-emerald-200/30 border-t-emerald-400 rounded-full animate-spin"></div>
              </span>
            ) : (
              <span>
                {generationCost === 0 ? 'Бесплатно' : (`≈ ${generationCost.toFixed(2)} ₽`)}
              </span>
            )}
          </span>
        )}
      </div>
      <div className="flex flex-col">
        <div className="flex items-center justify-between bg-gradient-to-r from-[#151618] to-[#1c1e21] rounded-t-2xl border-b border-zinc-800 p-3">
          <div className="workflow-node-drag-handle flex min-w-0 flex-1 cursor-grab items-center gap-2.5 active:cursor-grabbing">
            <div className={`p-1.5 rounded-lg ${selected ? "bg-emerald-600 text-white" : "bg-zinc-800 text-zinc-400"} transition-colors`}>
              <IoImageOutline size={14} />
            </div>
            <h3 className="truncate text-xs font-bold text-zinc-100">
              {selectedModel.name}
            </h3>
          </div>
          {outputHistory.length > 0 && (
            <div className="absolute -top-10 right-0 bg-[#0c0d0f] flex items-center gap-1 p-1 border border-white/10 rounded-full ml-auto">
              <button 
                type="button"
                suppressHydrationWarning={true}
                onClick={handlePrev}
                disabled={currentHistoryIndex <= 0}
                className="w-5 h-5 flex items-center justify-center rounded-full hover:bg-white/10 text-white/70 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="Назад"
              >
                <FaAngleLeft size={10} />
              </button>
              <div className="flex items-center gap-1.5 px-0.5">
                <span className="text-[9px] font-medium text-white/90 tabular-nums tracking-wide">
                  {currentHistoryIndex + 1}/{outputHistory.length}
                </span>
                <div className="w-[1px] h-2.5 bg-white/10" />
                <button 
                  type="button"
                  suppressHydrationWarning={true}
                  onClick={handleDeleteHistory}
                  className="p-1 hover:bg-red-500/10 rounded-full text-zinc-400 hover:text-red-500 transition-colors flex items-center justify-center"
                  title="Удалить историю"
                >
                  <IoTrashOutline size={10} />
                </button>
                <div className="w-[1px] h-2.5 bg-white/10" />
                <NodeSendButton 
                  id={id} 
                  data={data} 
                  outputHistory={outputHistory} 
                  currentHistoryIndex={currentHistoryIndex} 
                  currentOutputIndex={currentImageIndex}
                />
              </div>
              <button 
                type="button"
                suppressHydrationWarning={true}
                onClick={handleNext}
                disabled={currentHistoryIndex >= outputHistory.length - 1}
                className="w-5 h-5 flex items-center justify-center rounded-full hover:bg-white/10 text-white/70 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="Вперед"
              >
                <FaAngleRight size={10} />
              </button>
            </div>
          )}
          <NodeOptionsMenu 
            nodeId={id}
            onDuplicate={data.duplicateNode}
            onDelete={handleDeleteNode}
            downloadUrl={currentOutput}
            showThumbnailOption={true}
            onSetThumbnail={() => updateWorkflowThumbnail(currentOutput)}
          />
        </div>
      </div>
      {data.selectedModel?.id === "image-passthrough" ? (
        <div className="w-full h-full flex-1">
          <UploadNode id={id} data={data} formValues={formValues} setFormValues={setFormValues} selectedModel={selectedModel} loading={loading} uploadType="upload" acceptType="image" />
        </div>
      ) : (
        <div className="flex flex-col flex-grow w-full rounded-b-none overflow-hidden transition-all duration-500">
          {data.isLoading ? (
            <div className="flex items-center justify-center w-full h-full overflow-hidden aspect-[1/1] bg-white/5 animate-pulse rounded-b-none">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-[10px] font-bold text-emerald-500 tracking-wider uppercase">Генерация...</span>
              </div>
            </div>
          ) : data.errorMsg ? (
            <div className="text-red-400 text-xs font-medium p-3 bg-red-500/10 rounded-xl border border-red-500/20 m-3 w-full">
              {data.errorMsg || "Ошибка генерации"}
            </div>
          ) : currentOutput && !data.isLoading ? (
            <div className="h-full w-full relative overflow-hidden rounded-b-none group/image">
              {currentOutputList.length > 1 && (
                <>
                  <button
                    type="button"
                    suppressHydrationWarning={true}
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentImageIndex((prev) => (prev > 0 ? prev - 1 : currentOutputList.length - 1));
                    }}
                    className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-black/50 text-white opacity-0 group-hover/image:opacity-100 transition-opacity hover:bg-black/70"
                  >
                    <FaAngleLeft size={16} />
                  </button>
                  <button
                    type="button"
                    suppressHydrationWarning={true}
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentImageIndex((prev) => (prev < currentOutputList.length - 1 ? prev + 1 : 0));
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-black/50 text-white opacity-0 group-hover/image:opacity-100 transition-opacity hover:bg-black/70"
                  >
                    <FaAngleRight size={16} />
                  </button>
                </>
              )}
              <img
                key={currentOutput}
                src={toThumb(currentOutput)}
                alt="Generated"
                loading="lazy"
                decoding="async"
                onError={(e) => { if (currentOutput && e.currentTarget.src !== currentOutput) e.currentTarget.src = currentOutput; }}
                className="w-full h-full object-contain rounded-b-none animate-in fade-in duration-500"
              />
              <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover/image:opacity-100 transition-opacity duration-300 pointer-events-none rounded-b-xl flex flex-col justify-end">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] text-white/50 uppercase tracking-tighter font-semibold">Разрешение</span>
                    <span className="text-xs text-white font-medium tabular-nums">
                      {imageMetadata.width} × {imageMetadata.height}
                    </span>
                  </div>
                  {imageMetadata.size && (
                    <div className="flex flex-col items-end gap-0.5">
                      <span className="text-[10px] text-white/50 uppercase tracking-tighter font-semibold">Размер файла</span>
                      <span className="text-xs text-white font-medium tabular-nums">{imageMetadata.size}</span>
                    </div>
                  )}
                </div>
              </div>
              {currentOutputList.length > 1 && (
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 z-10">
                  {currentOutputList.map((_, idx) => (
                    <div
                      key={idx}
                      className={`w-1.5 h-1.5 rounded-full transition-all ${
                        idx === currentImageIndex ? "bg-white scale-125" : "bg-white/40"
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-zinc-400 gap-2">
              <IoImageOutline size={32} />
              <span className="text-[10px] italic">Результат появится здесь...</span>
            </div>
          )}
        </div>
      )}
      <Handle 
        type="target" 
        position={Position.Left} 
        id="imageInput" 
        style={{ 
          top: 100,
          opacity: hasPrompt ? 1 : 0,
          pointerEvents: hasPrompt ? 'auto' : 'none',
          width: 12,
          height: 12,
          transition: 'all 0.2s ease-in-out',
        }} 
        className={`
          !rounded-full !border-[3px] !left-[-8px] transition-all
          ${connectedInputs.imageInput 
            ? '!bg-blue-600 !border-zinc-900 shadow-[0_0_15px_rgba(37,99,235,0.8)]' 
            : '!bg-zinc-900 !border-blue-600/50 hover:!border-blue-600 shadow-sm'
          }
        `}
        data-type="blue"
      />
      {hasPrompt && (
        <p 
          className={`absolute text-xs text-blue-500 transition-opacity duration-200 pointer-events-none whitespace-nowrap ${
            data.activeHandleColor === "blue"
              ? "opacity-100"
              : "opacity-0 group-hover:opacity-100"
          }`}
          style={{ top: 100, left: -40 }}
        > 
          Текст 
        </p>
      )}
      
      <Handle 
        type="target" 
        position={Position.Left} 
        id="imageInput2" 
        style={{ 
          top: 150,
          opacity: hasImagesList ? 1 : 0,
          pointerEvents: hasImagesList ? 'auto' : 'none',
          width: 12,
          height: 12,
          transition: 'all 0.2s ease-in-out',
        }} 
        className={`!rounded-full !border-[3px] !left-[-8px] transition-all
          ${connectedInputs.imageInput2 
            ? '!bg-emerald-600 !border-zinc-900 shadow-[0_0_15px_rgba(16,185,129,0.8)]' 
            : '!bg-zinc-900 !border-emerald-600/50 hover:!border-emerald-600 shadow-sm'
          }
        `}
        data-type="green"
      />
      {hasImagesList && (
        <p 
          className={`absolute text-xs text-green-500 transition-opacity duration-200 pointer-events-none whitespace-nowrap ${
            data.activeHandleColor === "green"
              ? "opacity-100" 
              : "opacity-0 group-hover:opacity-100"
          }`}
          style={{ top: 150, left: -45 }}
        > 
          Изображение 
        </p>
      )}
      
      <Handle 
        type="target" 
        position={Position.Left} 
        id="imageInput3" 
        style={{ 
          top: 200,
          opacity: hasImageUrl ? 1 : 0,
          pointerEvents: hasImageUrl ? 'auto' : 'none',
          width: 12,
          height: 12,
          transition: 'all 0.2s ease-in-out',
        }} 
        className={`!rounded-full !border-[3px] !left-[-8px] transition-all
          ${connectedInputs.imageInput3 
            ? '!bg-emerald-600 !border-zinc-900 shadow-[0_0_15px_rgba(16,185,129,0.8)]' 
            : '!bg-zinc-900 !border-emerald-600/50 hover:!border-emerald-600 shadow-sm'
          }
        `}
        data-type="green"
      />
      {hasImageUrl && (
        <p 
          className={`absolute text-xs text-green-500 transition-opacity duration-200 pointer-events-none whitespace-nowrap ${
            data.activeHandleColor === "green"
              ? "opacity-100" 
              : "opacity-0 group-hover:opacity-100"
          }`}
          style={{ top: 200, left: -45 }}
        > 
          Изображение 
        </p>
      )}   
      <Handle 
        type="source" 
        position={Position.Right} 
        id="imageOutput" 
        style={{ 
          top: 100,
          width: 16,
          height: 16,
          transition: 'all 0.2s ease-in-out',
        }} 
        className={`!rounded-full !border-[3px] !right-[-10px] transition-all
          ${connectedOutputs.imageOutput 
            ? '!bg-emerald-600 !border-zinc-900 shadow-[0_0_15px_rgba(16,185,129,0.8)]' 
            : '!bg-zinc-900 !border-emerald-600/50 hover:!border-emerald-600 shadow-sm'
          }
        `}
        data-type="green"
      />
      <p 
        className={`absolute text-xs text-green-500 transition-opacity duration-200 pointer-events-none whitespace-nowrap ${
          data.activeHandleColor === "green"
            ? "opacity-100" 
            : "opacity-0 group-hover:opacity-100"
        }`}
        style={{ top: 100, right: -45 }}
      > 
        Изображение 
      </p>
      <button
        type="button"
        onPointerDown={handleResizeStart}
        className="nodrag absolute bottom-2 right-2 z-20 h-4 w-4 cursor-se-resize rounded-sm border border-white/15 bg-black/70 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-black/90"
        title="Изменить размер"
      >
        <span className="pointer-events-none absolute bottom-0.5 right-0.5 h-2 w-2 border-b border-r border-white/70" />
      </button>
    </div>
  );
};

export default ImageGeneration;
