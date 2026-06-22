import React, { useEffect, useMemo, useState, useRef } from "react";
import { Handle, Position, useReactFlow, useStore, useUpdateNodeInternals } from "reactflow";
import axios from "axios";
import { toast } from "react-hot-toast";
import { IoVideocamOutline, IoTrashOutline } from "react-icons/io5";
import { TfiText } from "react-icons/tfi";
import { FaAngleLeft, FaAngleRight, FaPlay } from "react-icons/fa6";
import { RiRobot2Line } from "react-icons/ri";
import { stableStringify } from "./stableStringify.js";
import VideoPlayer from "./VideoPlayer";
import NodeSendButton from "./NodeSendButton";
import NodeOptionsMenu from "./NodeOptionsMenu";

const RATIOS = ["auto", "16:9", "9:16", "4:3", "3:4"];
const DURATIONS = ["auto", "～15s", "～30s", "40～60s"];
const MODES = ["standard", "fast"];
const LANGUAGES = ["Chinese", "English", "Japanese", "Thai", "Russian", "French", "German", "Spanish"];

const SkylarkNode = ({ id, data, selected }) => {
  const { setNodes, setEdges } = useReactFlow();
  const updateNodeInternals = useUpdateNodeInternals();
  const edges = useStore((state) => state.edges);

  const [formValues, setFormValues] = useState(data.formValues || {
    prompt: "",
    img_url_list: [],
    video_url_list: [],
    ratio: "auto",
    duration: "auto",
    mode: "standard",
    language: "Russian",
    accent: "PuTongHua",
    enable_watermark: true
  });

  const [loading, setLoading] = useState(false);
  const [currentHistoryIndex, setCurrentHistoryIndex] = useState(-1);
  const outputHistory = data.outputHistory || [];
  const inFlightRef = useRef(false);

  // Sync with parent data
  useEffect(() => {
    if (data.formValues && stableStringify(data.formValues) !== stableStringify(formValues)) {
      setFormValues(data.formValues);
    }
  }, [data.formValues]);

  // Push changes to parent
  useEffect(() => {
    if (data.onDataChange && stableStringify(data.formValues) !== stableStringify(formValues)) {
      data.onDataChange(id, { formValues });
    }
  }, [formValues]);

  // Handle workflow-wide trigger
  useEffect(() => {
    if (data.triggerRun) {
      handleRunSkylark();
      if (data.onDataChange) {
        data.onDataChange(id, { triggerRun: false });
      }
    }
  }, [data.triggerRun]);

  const handleRunSkylark = async () => {
    if (inFlightRef.current || loading) return;
    if (!formValues?.prompt) {
      toast.error("Промпт обязателен для запуска Скайларк");
      return;
    }

    inFlightRef.current = true;
    setLoading(true);
    data.onDataChange(id, { isLoading: true });

    try {
      // 1. Submit Task
      const submitRes = await axios.post("/api/agents/skylark/submit", formValues);
      const taskId = submitRes.data.taskId;

      if (!taskId) throw new Error("Не удалось получить ID задачи");

      // 2. Poll Status
      let finishedUrl = null;
      for (let i = 0; i < 60; i++) { // Max 5 minutes
        await new Promise(r => setTimeout(r, 5000));
        const statusRes = await axios.post("/api/agents/skylark/status", { taskId });
        const { status, videoUrl } = statusRes.data;

        if (status === "done" && videoUrl) {
          finishedUrl = videoUrl;
          break;
        } else if (["failed", "error", "expired"].includes(status)) {
          throw new Error(`Ошибка генерации: ${status}`);
        }
      }

      if (!finishedUrl) throw new Error("Превышено время ожидания");

      const output = [{ type: "video_url", value: finishedUrl }];
      const newHistory = [...outputHistory, { status: "succeeded", result: { id: taskId, outputs: output } }];
      
      data.onDataChange(id, {
        outputs: output,
        resultUrl: finishedUrl,
        isLoading: false,
        errorMsg: null,
        outputHistory: newHistory
      });
      setCurrentHistoryIndex(newHistory.length - 1);
      toast.success("Видео успешно сгенерировано!");

    } catch (error) {
      console.error(error);
      const msg = error.response?.data?.error || error.message;
      data.onDataChange(id, { isLoading: false, errorMsg: msg });
      toast.error(msg);
    } finally {
      inFlightRef.current = false;
      setLoading(false);
    }
  };

  const currentOutput = outputHistory[currentHistoryIndex]?.result?.outputs?.[0]?.value || data.resultUrl;

  const connectedInputs = {
    prompt: edges.some(e => e.target === id && e.targetHandle === "prompt"),
    images: edges.some(e => e.target === id && e.targetHandle === "images"),
    videos: edges.some(e => e.target === id && e.targetHandle === "videos"),
  };

  return (
    <div className={`nowheel group flex flex-col w-80 rounded-2xl border-2 transition-all duration-300 bg-[#0c0d0f] ${selected ? "border-blue-500 shadow-[0_0_25px_rgba(59,130,246,0.3)]" : "border-zinc-800 shadow-lg"}`}>
      <div className="flex items-center gap-2 absolute -top-5 left-0">
        <h3 className="text-zinc-400 text-[10px] font-medium tracking-wider uppercase">Агент Гена</h3>
      </div>

      <div className="flex items-center justify-between bg-gradient-to-r from-[#151618] to-[#1c1e21] rounded-t-2xl border-b border-zinc-800 py-2 px-3">
        <div className="flex items-center gap-2.5">
          <div className={`p-1.5 rounded-lg ${selected ? "bg-blue-600 text-white" : "bg-zinc-800 text-zinc-400"}`}>
            <RiRobot2Line size={14} />
          </div>
          <h3 className="text-xs font-bold text-zinc-100">Агент Гена</h3>
        </div>
        <NodeOptionsMenu nodeId={id} onDuplicate={data.duplicateNode} onDelete={() => {
          if (window.confirm("Удалить агента Гена?")) {
            setNodes(nds => nds.filter(n => n.id !== id));
            setEdges(eds => eds.filter(e => e.source !== id && e.target !== id));
          }
        }} downloadUrl={currentOutput} />
      </div>

      {/* Preview Area */}
      <div className="p-3 flex flex-col gap-3">
        {connectedInputs.prompt && (
          <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 mb-3 animate-in fade-in slide-in-from-top-1 duration-300">
            <TfiText className="text-blue-400" size={12} />
            <div className="flex flex-col">
              <span className="text-[9px] text-blue-400 font-bold uppercase tracking-tight">Промпт подключен</span>
              <span className="text-[8px] text-blue-300/60 truncate max-w-[140px]">
                {data.formValues?.prompt || "Ожидание текста..."}
              </span>
            </div>
          </div>
        )}
        {data.isLoading ? (
          <div className="aspect-video bg-zinc-900 rounded-lg flex flex-col items-center justify-center gap-2">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-[10px] text-blue-500 font-bold uppercase">Агент думает...</span>
          </div>
        ) : currentOutput ? (
          <div className="aspect-video rounded-lg overflow-hidden border border-zinc-800 bg-black">
            <VideoPlayer src={currentOutput} accentColor="#3b82f6" />
          </div>
        ) : (
          <div className="aspect-video bg-zinc-900 rounded-lg flex flex-col items-center justify-center text-zinc-600 border border-dashed border-zinc-800">
            <IoVideocamOutline size={32} />
            <span className="text-[10px] italic">Готов к генерации</span>
          </div>
        )}

        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-[9px] text-zinc-500 uppercase block mb-1">Соотношение</label>
              <select value={formValues.ratio} onChange={e => setFormValues(v => ({ ...v, ratio: e.target.value }))} className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-[10px] text-white outline-none">
                {RATIOS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div className="flex-1">
              <label className="text-[9px] text-zinc-500 uppercase block mb-1">Длительность</label>
              <select value={formValues.duration} onChange={e => setFormValues(v => ({ ...v, duration: e.target.value }))} className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-[10px] text-white outline-none">
                {DURATIONS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[9px] text-zinc-500 uppercase block">Режим</label>
            <div className="flex bg-zinc-900 border border-zinc-800 rounded p-0.5">
              {MODES.map(m => (
                <button
                  key={m}
                  onClick={() => setFormValues(v => ({ ...v, mode: m }))}
                  className={`flex-1 py-1 text-[9px] uppercase font-bold rounded transition-all ${
                    formValues.mode === m 
                      ? "bg-blue-600 text-white shadow-sm" 
                      : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  {m === "standard" ? "Стандарт" : "Фаст"}
                </button>
              ))}
            </div>
          </div>

          <button onClick={handleRunSkylark} disabled={loading || data.isLoading} className="w-full py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2">
            {loading ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <FaPlay size={10} />}
            Запустить Гену
          </button>
        </div>
      </div>

      {/* Handles */}
      <Handle type="target" position={Position.Left} id="prompt" style={{ top: '40%' }} className={`!w-3 !h-3 !border-2 ${connectedInputs.prompt ? "!bg-blue-500 !border-white shadow-[0_0_15px_rgba(37,99,235,0.8)]" : "!bg-zinc-900 !border-blue-500 hover:!border-blue-400 shadow-sm"}`} title="Текст (Промпт)" />
      <p className={`absolute text-[11px] text-blue-500 transition-opacity duration-200 pointer-events-none whitespace-nowrap ${data.activeHandleColor === "blue" ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`} style={{ top: '40%', left: -40, transform: 'translateY(-50%)' }}>Текст</p>

      <Handle type="target" position={Position.Left} id="images" style={{ top: '60%' }} className={`!w-3 !h-3 !border-2 ${connectedInputs.images ? "!bg-emerald-500 !border-white shadow-[0_0_15px_rgba(16,185,129,0.8)]" : "!bg-zinc-900 !border-emerald-500 hover:!border-emerald-400 shadow-sm"}`} title="Изображения (Референсы)" />
      <p className={`absolute text-[11px] text-emerald-500 transition-opacity duration-200 pointer-events-none whitespace-nowrap ${data.activeHandleColor === "green" ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`} style={{ top: '60%', left: -75, transform: 'translateY(-50%)' }}>Изображения</p>

      <Handle type="target" position={Position.Left} id="videos" style={{ top: '80%' }} className={`!w-3 !h-3 !border-2 ${connectedInputs.videos ? "!bg-orange-500 !border-white shadow-[0_0_15px_rgba(249,115,22,0.8)]" : "!bg-zinc-900 !border-orange-500 hover:!border-orange-400 shadow-sm"}`} title="Видео (Референсы)" />
      <p className={`absolute text-[11px] text-orange-500 transition-opacity duration-200 pointer-events-none whitespace-nowrap ${data.activeHandleColor === "orange" ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`} style={{ top: '80%', left: -45, transform: 'translateY(-50%)' }}>Видео</p>
      
      <Handle type="source" position={Position.Right} id="videoOutput" style={{ top: '50%' }} className={`!w-3 !h-3 !border-2 ${outputHistory.length > 0 ? "!bg-orange-500 !border-white shadow-[0_0_15px_rgba(249,115,22,0.8)]" : "!bg-zinc-900 !border-orange-500 hover:!border-orange-400 shadow-sm"}`} title="Результат (Видео)" />
      <p className={`absolute text-[11px] text-orange-500 transition-opacity duration-200 pointer-events-none whitespace-nowrap ${data.activeHandleColor === "orange" ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`} style={{ top: '50%', right: -45, transform: 'translateY(-50%)' }}>Видео</p>
    </div>
  );
};

export default SkylarkNode;
