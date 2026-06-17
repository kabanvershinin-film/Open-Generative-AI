import React, { useState, useRef, useMemo } from "react";
import { Handle, Position, useReactFlow, useStore } from "reactflow";
import { toast } from "react-hot-toast";

// Style presets (label → English style string) — ported from creator-club.
const STYLE_PRESETS = [
  { label: "🎬 Кино",        value: "Cinematic, 4K, anamorphic lens, film grain, professional color grading" },
  { label: "✨ Реализм",     value: "Ultra-realistic, photorealistic, 8K, natural lighting, physically accurate" },
  { label: "🌙 Ночь",        value: "Night scene, neon lights, urban atmosphere, dramatic shadows, moody lighting" },
  { label: "🌅 Золотой час", value: "Golden hour, warm tones, soft directional light, atmospheric haze, cinematic depth" },
  { label: "🎭 Драма",       value: "Dramatic, high contrast, emotional intensity, Rembrandt lighting, close-up details" },
  { label: "🌊 Природа",     value: "Nature documentary, 8K, macro details, atmospheric perspective, fluid camera movements" },
];

const DURATIONS = ["6 секунд", "8 секунд", "10 секунд", "15 секунд", "20 секунд", "30 секунд", "60 секунд"];

// Reads the prompt from a node wired into the teal "camera" input handle.
function getConnectedCameraPrompt(nodeId, getNodes, getEdges) {
  const edges = getEdges();
  const nodes = getNodes();
  const camEdge = edges.find((e) => e.target === nodeId && e.targetHandle === "camera");
  if (!camEdge) return "";
  const camNode = nodes.find((n) => n.id === camEdge.source);
  const d = camNode?.data || {};
  return d.prompt || d.resultUrl || (d.formValues && d.formValues.prompt) || "";
}

const SeedancePromptNode = ({ id, data }) => {
  const { getNodes, getEdges, setNodes, setEdges } = useReactFlow();
  const ideaRef = useRef(null);
  const edges = useStore((s) => s.edges);

  // Auto-detect references wired into the video/image node this prompt node feeds,
  // and surface them as clickable @-chips (с миниатюрами) — like creator-club.
  // E.g. a Character "Жека" → @Жека, a connected image → @изображение1.
  // reactflow v11 keeps nodes in nodeInternals (no store.nodes), so read them via
  // getNodes(); `edges` in the dep array drives recompute when a wire changes.
  const availableTags = useMemo(() => {
    const allNodes = getNodes() || [];
    const genIds = new Set(
      edges.filter((e) => e.source === id)
        .map((e) => e.target)
        .filter((tid) => {
          const n = allNodes.find((nn) => nn.id === tid);
          return n && (n.type === "videoNode" || n.type === "imageNode");
        }),
    );
    if (!genIds.size) return [];
    const out = [];
    const seen = new Set();
    const counters = { images: 0, video: 0, audio: 0 };
    for (const e of edges) {
      if (!genIds.has(e.target) || e.source === id || seen.has(e.source)) continue;
      seen.add(e.source);
      const n = allNodes.find((nn) => nn.id === e.source);
      if (!n) continue;
      const d = n.data || {};
      const fvN = d.formValues || {};
      const rawThumb = fvN.character_photo || d.thumbnail || d.previewUrl || d.resultUrl
        || (Array.isArray(d.outputs) && d.outputs[0]?.value) || fvN.image_url;
      const url = (typeof rawThumb === "string" && !rawThumb.startsWith("asset://") && !rawThumb.startsWith("data:image/svg")) ? rawThumb : undefined;
      if (n.type === "characterNode") {
        counters.images += 1;
        out.push({ id: n.id, label: `图片${counters.images}`, kind: "character", url, name: (fvN.character_name || "角色").trim() });
      } else if (n.type === "videoNode") {
        counters.video += 1;
        out.push({ id: n.id, label: `视频${counters.video}`, kind: "video", url });
      } else if (n.type === "audioNode") {
        counters.audio += 1;
        out.push({ id: n.id, label: `音频${counters.audio}`, kind: "audio", url });
      } else {
        counters.images += 1;
        out.push({ id: n.id, label: `图片${counters.images}`, kind: "images", url });
      }
    }
    return out;
  }, [edges, id]);

  // On reload the saved state arrives in data.formValues (input_params); fall back to it.
  const fv = data.formValues || {};
  const [idea, setIdea]           = useState(data.idea ?? fv.idea ?? "");
  const [style, setStyle]         = useState(data.style ?? fv.style ?? "");
  const [duration, setDuration]   = useState(data.duration ?? fv.duration ?? "15 секунд");
  const [photoRefs, setPhotoRefs] = useState(data.photoRefs ?? fv.photoRefs ?? 0);
  const [videoRefs, setVideoRefs] = useState(data.videoRefs ?? fv.videoRefs ?? 0);
  const [audioRefs, setAudioRefs] = useState(data.audioRefs ?? fv.audioRefs ?? 0);
  const [loading, setLoading]     = useState(false);
  const [result, setResult]       = useState(data.prompt ?? fv.prompt ?? "");
  const [error, setError]         = useState("");

  const outputConnected = edges.some((e) => e.source === id && e.sourceHandle === "textOutput");
  const cameraConnected = edges.some((e) => e.target === id && e.targetHandle === "camera");

  // Persist into the node. We pose as a `text-passthrough` under the hood so the
  // server run emits the generated prompt as this node's output — that's what
  // lets the output handle feed a connected video node's prompt input.
  const persist = (patch) => {
    const next = { idea, style, duration, photoRefs, videoRefs, audioRefs, ...patch };
    const prompt = patch.prompt ?? result;
    // Store the UI state inside formValues so it survives save+reload (it becomes
    // input_params on the server). `prompt` doubles as the text-passthrough output.
    data.onDataChange?.(id, {
      idea: next.idea, style: next.style, duration: next.duration,
      photoRefs: next.photoRefs, videoRefs: next.videoRefs, audioRefs: next.audioRefs,
      prompt,
      selectedModel: { id: "text-passthrough", name: "Seedance Промпт" },
      formValues: {
        prompt,
        idea: next.idea, style: next.style, duration: next.duration,
        photoRefs: next.photoRefs, videoRefs: next.videoRefs, audioRefs: next.audioRefs,
      },
      outputs: prompt ? [{ type: "text", value: prompt }] : [],
      resultUrl: prompt || null,
    });
  };

  const insertTag = (tag) => {
    const ta = ideaRef.current;
    const insert = `@${tag} `;
    if (!ta) { setIdea((idea || "") + insert); return; }
    const start = ta.selectionStart ?? idea.length;
    const end = ta.selectionEnd ?? idea.length;
    const nextVal = idea.slice(0, start) + insert + idea.slice(end);
    setIdea(nextVal);
    requestAnimationFrame(() => { ta.focus(); const pos = start + insert.length; ta.setSelectionRange(pos, pos); });
  };

  const generate = async () => {
    if (!idea.trim() || loading) return;
    setLoading(true);
    setError("");
    try {
      const cameraPrompt = getConnectedCameraPrompt(id, getNodes, getEdges);
      const res = await fetch("/api/seedance-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idea, style, duration, photoRefs, videoRefs, audioRefs, cameraPrompt }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (json.error === "insufficient_funds") {
          toast.error("Недостаточно средств для генерации промпта");
        }
        throw new Error(json.error || `Ошибка ${res.status}`);
      }
      const generated = json.prompt || "";
      setResult(generated);
      persist({ prompt: generated });
    } catch (e) {
      setError(e.message || "Ошибка генерации");
    } finally {
      setLoading(false);
    }
  };

  const deleteNode = () => {
    setNodes((nds) => nds.filter((n) => n.id !== id));
    setEdges((eds) => eds.filter((e) => e.source !== id && e.target !== id));
  };

  const refRows = [
    { label: "🖼 Фото", value: photoRefs, set: setPhotoRefs, max: 9, key: "photoRefs" },
    { label: "🎬 Видео", value: videoRefs, set: setVideoRefs, max: 3, key: "videoRefs" },
    { label: "🎵 Аудио", value: audioRefs, set: setAudioRefs, max: 3, key: "audioRefs" },
  ];

  return (
    <div
      className="nowheel rounded-2xl shadow-xl"
      style={{
        background: "linear-gradient(135deg, #1a0f2e 0%, #1e1040 100%)",
        border: "1px solid rgba(139,92,246,0.4)",
        minWidth: 280, maxWidth: 320,
        boxShadow: "0 4px 24px rgba(0,0,0,0.5), inset 0 1px 0 rgba(139,92,246,0.12)",
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-3 pt-3 pb-2 border-b border-purple-500/10">
        <span className="text-base">✨</span>
        <span className="text-xs font-bold text-purple-300 tracking-wide uppercase">Seedance Промпт</span>
        <span className="ml-auto text-[9px] text-purple-400/50 bg-purple-900/30 px-1.5 py-0.5 rounded-full">AI 2.0</span>
        {cameraConnected && (
          <span className="text-[9px] text-teal-300 bg-teal-900/30 px-1.5 py-0.5 rounded-full">🎬 камера</span>
        )}
        <button
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => { e.stopPropagation(); deleteNode(); }}
          className="nodrag p-1 rounded-lg text-purple-400/40 hover:text-red-400 hover:bg-red-400/10 transition-all cursor-pointer"
          title="Удалить ноду"
        >🗑</button>
      </div>

      <div className="p-3 flex flex-col gap-2">
        {/* Idea */}
        <div>
          <label className="text-[9px] text-purple-400/60 uppercase tracking-wider mb-1 block">💡 Ваша идея</label>
          {availableTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-1 nodrag">
              {availableTags.map((t) => (
                <button
                  key={`${t.id}-${t.label}`}
                  type="button"
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={() => insertTag(t.label)}
                  title={`Вставить @${t.label} в промпт`}
                  className="flex items-center gap-1.5 pl-1 pr-2 py-0.5 rounded-lg bg-purple-500/15 hover:bg-purple-500/30 border border-purple-500/30 text-purple-200 transition-colors"
                >
                  {t.url ? (
                    t.kind === "video" ? (
                      <video 
                        src={t.url} 
                        className="w-6 h-6 rounded object-cover flex-shrink-0" 
                        muted 
                        preload="none"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    ) : (
                      <img 
                        src={t.url} 
                        alt={t.label} 
                        className="w-6 h-6 rounded object-cover flex-shrink-0" 
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    )
                  ) : (
                    <span className="w-6 h-6 rounded bg-purple-500/20 flex items-center justify-center text-[11px] flex-shrink-0">
                      {t.kind === "video" ? "🎬" : t.kind === "audio" ? "🎵" : t.kind === "character" ? "🧑" : "🖼"}
                    </span>
                  )}
                  <span className="text-[10px]">@{t.label}</span>
                </button>
              ))}
            </div>
          )}
          <textarea
            ref={ideaRef}
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            onBlur={() => persist({})}
            onMouseDown={(e) => e.stopPropagation()}
            onKeyDown={(e) => { e.stopPropagation(); if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) generate(); }}
            placeholder="Опишите сцену... (Ctrl+Enter для генерации)"
            rows={4}
            className="w-full min-h-[80px] bg-black/30 border border-purple-500/20 rounded-lg px-2 py-1.5 text-xs text-white placeholder-purple-300/30 focus:outline-none focus:border-purple-500/50 resize nodrag nowheel"
          />
        </div>

        {/* Style */}
        <div>
          <label className="text-[9px] text-purple-400/60 uppercase tracking-wider mb-1 block">🎨 Стиль</label>
          <div className="flex flex-wrap gap-1">
            {STYLE_PRESETS.map((s) => (
              <button
                key={s.label}
                onMouseDown={(e) => e.stopPropagation()}
                onClick={() => { const v = style === s.value ? "" : s.value; setStyle(v); persist({ style: v }); }}
                className={`px-1.5 py-0.5 rounded-md text-[9px] transition-all nodrag cursor-pointer ${
                  style === s.value
                    ? "bg-purple-600 text-white shadow-[0_0_6px_rgba(139,92,246,0.4)]"
                    : "bg-black/30 text-purple-300/60 border border-purple-500/15 hover:border-purple-500/40"
                }`}
              >{s.label}</button>
            ))}
          </div>
        </div>

        {/* Duration */}
        <div>
          <label className="text-[9px] text-purple-400/60 uppercase tracking-wider mb-1 block">⏱ Длительность</label>
          <select
            value={duration}
            onChange={(e) => { setDuration(e.target.value); persist({ duration: e.target.value }); }}
            onMouseDown={(e) => e.stopPropagation()}
            style={{ colorScheme: "dark" }}
            className="w-full bg-black/30 border border-purple-500/20 rounded-lg px-2 py-1 text-xs text-white focus:outline-none nodrag [&>option]:bg-[#1a0f2e]"
          >
            {DURATIONS.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>

        {/* References */}
        <div>
          <label className="text-[9px] text-purple-400/60 uppercase tracking-wider mb-1 block">📎 Референсы</label>
          <div className="grid grid-cols-3 gap-1">
            {refRows.map(({ label, value, set, max, key }) => (
              <div key={label} className="bg-black/30 border border-purple-500/15 rounded-lg px-1.5 py-1 text-center">
                <div className="text-[9px] text-purple-300/50 mb-0.5">{label}</div>
                <div className="flex items-center justify-center gap-1">
                  <button onMouseDown={(e) => e.stopPropagation()} onClick={() => { const v = Math.max(0, value - 1); set(v); persist({ [key]: v }); }}
                    className="text-purple-400/60 hover:text-purple-300 nodrag cursor-pointer text-[10px] w-4">−</button>
                  <span className="text-xs text-white font-medium w-3 text-center">{value}</span>
                  <button onMouseDown={(e) => e.stopPropagation()} onClick={() => { const v = Math.min(max, value + 1); set(v); persist({ [key]: v }); }}
                    className="text-purple-400/60 hover:text-purple-300 nodrag cursor-pointer text-[10px] w-4">+</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Generate */}
        <button
          onMouseDown={(e) => e.stopPropagation()}
          onClick={generate}
          disabled={loading || !idea.trim()}
          className="w-full py-1.5 rounded-lg text-xs font-semibold transition-all nodrag cursor-pointer disabled:opacity-40"
          style={{ background: loading ? "#4c1d95" : "linear-gradient(90deg, #7c3aed, #6d28d9)", color: "white" }}
        >
          {loading ? "⏳ Генерирую..." : "✨ Сгенерировать промпт"}
        </button>

        {error && <p className="text-[9px] text-red-400">{error}</p>}

        {/* Result */}
        {result && (
          <div className="rounded-lg overflow-hidden" style={{ border: "1px solid rgba(139,92,246,0.25)" }}>
            <div className="flex items-center justify-between px-2 py-1" style={{ background: "rgba(139,92,246,0.15)" }}>
              <span className="text-[9px] text-purple-300/70 font-medium">✅ Промпт готов</span>
              <button
                onMouseDown={(e) => e.stopPropagation()}
                onClick={() => { navigator.clipboard.writeText(result); toast.success("Скопировано"); }}
                className="text-[9px] text-purple-300 hover:text-white bg-purple-600/30 hover:bg-purple-600/60 px-2 py-0.5 rounded transition-all nodrag cursor-pointer"
              >📋 Копировать</button>
            </div>
            <div className="px-2 py-2 overflow-y-auto nodrag nowheel" style={{ background: "rgba(0,0,0,0.4)", maxHeight: 260 }}>
              <p className="text-[9px] text-purple-200/80 leading-relaxed whitespace-pre-wrap">{result}</p>
            </div>
          </div>
        )}
      </div>

      {/* Camera input (teal, left) */}
      <Handle type="target" position={Position.Left} id="camera" style={{ top: "50%" }} className="!bg-teal-500 !w-3 !h-3" title="🎬 Подключи ноду Камера" />
      {/* Prompt output — uses textOutput id so it reads as a blue text output and
          connects to a video/image node's prompt input via the standard edge map. */}
      <Handle type="source" position={Position.Right} id="textOutput" className={`!w-3 !h-3 ${outputConnected ? "!bg-purple-400" : "!bg-purple-500"}`} />
    </div>
  );
};

export default SeedancePromptNode;
