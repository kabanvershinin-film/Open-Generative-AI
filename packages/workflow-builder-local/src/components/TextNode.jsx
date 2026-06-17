import React, { useState, useEffect, useRef } from "react";
import { Handle, Position } from "reactflow";
import { TfiText } from "react-icons/tfi";
import { FaAngleLeft, FaAngleRight } from "react-icons/fa";
import { IoTrashOutline } from "react-icons/io5";
import { toast } from "react-hot-toast";
import axios from "axios";
import NodeOptionsMenu from "./NodeOptionsMenu";
import NodeSendButton from "./NodeSendButton";
import UploadNode from "./UploadNode";

const TextGeneration = ({ id, data, selected }) => {
  const formValues = data.formValues || {};
  const setFormValues = data.setFormValues || (() => {});
  const selectedModel = data.selectedModel || {};
  const loading = data.loading || false;
  
  const currentHistoryIndex = data.currentHistoryIndex !== undefined 
    ? data.currentHistoryIndex 
    : (data.outputHistory ? data.outputHistory.length - 1 : -1);
    
  const setCurrentHistoryIndex = (idx) => {
    if (data.updateNodeData) {
      data.updateNodeData(id, { currentHistoryIndex: idx });
    }
  };
  
  const currentOutputIndex = data.currentOutputIndex || 0;
  
  const setCurrentOutputIndex = (idx) => {
    if (data.updateNodeData) {
      data.updateNodeData(id, { currentOutputIndex: idx });
    }
  };
  
  const [isRefreshingCost, setIsRefreshingCost] = useState(false);
  const [generationCost, setGenerationCost] = useState(null);
  const textareaRef = useRef(null);

  const outputHistory = data.outputHistory || [];
  const connectedInputs = data.connectedInputs || {};
  const connectedOutputs = data.connectedOutputs || {};

  const properties = data.nodeSchemas?.categories?.text?.models?.[selectedModel.id]?.input_schema?.schemas?.input_data?.properties || 
                     data.nodeSchemas?.categories?.text?.models?.[selectedModel.id]?.input_params?.properties || {};

  const isPassthrough = selectedModel?.id?.includes("passthrough");

  const hasPrompt = data.hasPrompt !== false && !isPassthrough && ("prompt" in properties || Object.keys(properties).length === 0);
  const hasImageUrl = data.hasImageUrl !== false && !isPassthrough && "image_url" in properties;
  const hasImagesList = data.hasImagesList !== false && !isPassthrough && "images_list" in properties;
  const hasSystemPrompt = data.hasSystemPrompt !== false && !isPassthrough && "system_prompt" in properties;

  const handlePrev = (e) => {
    e.stopPropagation();
    const newIdx = currentHistoryIndex > 0 ? currentHistoryIndex - 1 : currentHistoryIndex;
    setCurrentHistoryIndex(newIdx);
    setCurrentOutputIndex(0);
  };

  const handleNext = (e) => {
    e.stopPropagation();
    const newIdx = currentHistoryIndex < outputHistory.length - 1 ? currentHistoryIndex + 1 : currentHistoryIndex;
    setCurrentHistoryIndex(newIdx);
    setCurrentOutputIndex(0);
  };

  const handleDeleteNode = () => {
    data.deleteNode(id);
  };

  const handleDeleteHistory = async (e) => {
    e.stopPropagation();
    if (window.confirm("Вы уверены, что хотите удалить эту запись из истории?")) {
      try {
        const itemToDelete = outputHistory[currentHistoryIndex];
        await axios.delete(`/api/workflow/history/${itemToDelete.id}`);
        const newHistory = outputHistory.filter((_, i) => i !== currentHistoryIndex);
        data.updateNodeData(id, { outputHistory: newHistory });
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
    ? currentOutputList[currentOutputIndex]?.value || currentOutputList[0]?.value || data.resultUrl
    : data.resultUrl;

  const { setNodes, setEdges } = data;

  useEffect(() => {
    if (!setEdges) return;
    const timeout = setTimeout(() => {
      const validHandles = [
        hasPrompt && "textInput",
        hasImageUrl && "textInput2",
        hasImagesList && "textInput3",
        hasSystemPrompt && "textInput4",
      ].filter(Boolean);

      setEdges((prevEdges) =>
        prevEdges.filter((edge) => {
          if (edge.target !== id) return true;
          return validHandles.includes(edge.targetHandle);
        })
      );
    }, 2000);
    return () => clearTimeout(timeout);
  }, [hasPrompt, hasImageUrl, hasImagesList, hasSystemPrompt, id, setEdges]);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "0px";
      const scrollHeight = textarea.scrollHeight;
      textarea.style.height = `${Math.max(scrollHeight, 210)}px`;
    }
  }, [currentOutput, currentHistoryIndex, selectedModel.name]);

  return (
    <div 
      style={{ minHeight: 280, '--loader-color': '#2563eb' }} 
      className={`
        nowheel group flex flex-col flex-1 w-80 
        rounded-2xl border-2 relative transition-all duration-300 ease-in-out 
        ${selected 
          ? "border-blue-600 shadow-[0_0_25px_rgba(37,99,235,0.3)] scale-[1.02] ring-1 ring-blue-500/20" 
          : "border-zinc-800 hover:border-zinc-700 shadow-lg"} 
        bg-[#0c0d0f]
      `}
    >
      {data.isLoading && (
        <div className="loader-border" />
      )}
      <div className="flex items-center gap-2 absolute -top-5 left-0">
        <h3 className="text-zinc-400 text-[10px] font-medium tracking-wider uppercase">
          Текст {id.replace(/^\D+/g, "")}
        </h3>
        {generationCost !== null && !selectedModel?.id.includes("passthrough") && (
          <span className="text-xs text-blue-500 -mt-0.5 font-medium flex items-center gap-1 opacity-80">
            {isRefreshingCost ? (
              <span className="flex items-center gap-1 italic text-blue-200">
                <div className="w-2 h-2 border-[1.5px] border-blue-200/30 border-t-blue-400 rounded-full animate-spin"></div>
              </span>
            ) : (
              <span>
                {generationCost === 0 ? 'Бесплатно' : `≈ ${generationCost.toFixed(2)} ₽`}
              </span>
            )}
          </span>
        )}
      </div>
      <div className="flex flex-col">
        <div className="flex items-center justify-between bg-gradient-to-r from-[#151618] to-[#1c1e21] rounded-t-2xl border-b border-zinc-800 py-2 px-3">
          <div className="flex items-center gap-2.5">
            <div className={`p-1.5 rounded-lg ${selected ? "bg-blue-600 text-white" : "bg-zinc-800 text-zinc-400"} transition-colors`}>
              <TfiText size={14} />
            </div>
            <h3 className="text-xs font-bold text-zinc-100">
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
                className="w-5 h-5 flex items-center justify-center rounded-full hover:bg-white/10 text-zinc-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                title="Назад"
              >
                <FaAngleLeft size={10} />
              </button>
                
              <div className="flex items-center gap-1.5 px-1">
                <span className="text-[9px] font-bold text-white/90 tabular-nums tracking-wide">
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
                  currentOutputIndex={currentOutputIndex}
                />
              </div>
              <button 
                type="button"
                suppressHydrationWarning={true}
                onClick={handleNext}
                disabled={currentHistoryIndex >= outputHistory.length - 1}
                className="w-5 h-5 flex items-center justify-center rounded-full hover:bg-white/10 text-zinc-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
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
          />
        </div>
      </div>
      {data.selectedModel?.id === "text-passthrough" ? (
        <div className="w-full h-full flex-1 flex flex-col">
          <UploadNode id={id} data={data} formValues={formValues} setFormValues={setFormValues} selectedModel={selectedModel} loading={loading} uploadType="text" acceptType="text" />
        </div>
      ) : (
        <div className="flex flex-col flex-1 w-full h-full bg-black/20">
          {connectedInputs.textInput && (
            <div className="mx-3 mt-3 flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 animate-in fade-in slide-in-from-top-1 duration-300">
              {formValues.face_thumbnail ? (
                <div className="w-6 h-6 rounded border border-purple-500/50 overflow-hidden flex-shrink-0 bg-black shadow-sm shadow-purple-500/20">
                  <img src={formValues.face_thumbnail} alt="character" className="w-full h-full object-cover" />
                </div>
              ) : (
                <TfiText className="text-blue-400" size={12} />
              )}
              <div className="flex flex-col overflow-hidden">
                <span className="text-[9px] text-blue-400 font-bold uppercase tracking-tight">
                  {formValues.face_thumbnail ? "Персонаж подключен" : "Входящий текст подключен"}
                </span>
                <span className="text-[8px] text-blue-300/60 truncate max-w-[200px]">
                  {formValues.prompt || "Ожидание данных..."}
                </span>
              </div>
            </div>
          )}
          
          <div className="flex items-center justify-center flex-1 w-full h-full p-3">
            {data.isLoading ? (
              <div className="flex flex-col gap-2.5 w-full h-full overflow-hidden animate-pulse">
                <div className="h-2.5 bg-white/5 rounded-full w-full"></div>
                <div className="h-2.5 bg-white/5 rounded-full w-[90%]"></div>
                <div className="h-2.5 bg-white/5 rounded-full w-[75%]"></div>
                <div className="my-1"/>
                <div className="h-2.5 bg-white/5 rounded-full w-full"></div>
                <div className="h-2.5 bg-white/5 rounded-full w-[85%]"></div>
                <div className="h-2.5 bg-white/5 rounded-full w-[60%]"></div>
              </div>
            ) : data.errorMsg ? (
              <div className="text-red-400 text-xs font-medium p-3 bg-red-500/10 rounded-xl border border-red-500/20 w-full">
                {data.errorMsg || "Ошибка генерации"}
              </div>
            ) : currentOutput && !data.isLoading ? ( 
              <div className="relative flex flex-col gap-2 bg-zinc-900/30 rounded-xl border border-zinc-800/50 w-full h-full p-2">
                <textarea
                  ref={textareaRef}
                  readOnly
                  value={currentOutput || ""}
                  placeholder="Результат появится здесь..."
                  className="w-full h-full max-h-96 text-xs leading-relaxed outline-none bg-transparent resize-none text-zinc-100 overflow-hidden font-medium placeholder:italic placeholder:opacity-50"
                />
                {currentOutputList.length > 1 && (
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black px-2 py-0.5 rounded-full border border-white/10 opacity-0 group-hover/text:opacity-100 transition-opacity">
                    <button
                      type="button"
                      suppressHydrationWarning={true}
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentOutputIndex((prev) => (prev > 0 ? prev - 1 : currentOutputList.length - 1));
                      }}
                      className="text-white hover:text-blue-400 p-0.5"
                    >
                      <FaAngleLeft size={12} />
                    </button>
                    <span className="text-[10px] text-white/80 tabular-nums">
                      {currentOutputIndex + 1}/{currentOutputList.length}
                    </span>
                    <button
                      type="button"
                      suppressHydrationWarning={true}
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentOutputIndex((prev) => (prev < currentOutputList.length - 1 ? prev + 1 : 0));
                      }}
                      className="text-white hover:text-blue-400 p-0.5"
                    >
                      <FaAngleRight size={12} />
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-2">
                {/* Connected images & characters — shown together as one gallery */}
                {(() => {
                  const extra = Array.isArray(formValues.images_list) ? formValues.images_list.filter(Boolean) : [];
                  const all = [
                    ...(formValues.image_url ? [{ url: formValues.image_url, primary: true, type: 'image' }] : []),
                    ...extra.map((u) => ({ url: u, primary: false, type: 'image' })),
                    ...(formValues.face_thumbnail ? [{ url: formValues.face_thumbnail, type: 'character' }] : []),
                  ];
                  if (!all.length) return null;
                  const removeAt = (item) => {
                    setFormValues(cfv => {
                      const updated = { ...cfv };
                      if (item.type === 'character') {
                        updated.face_thumbnail = null;
                        updated.face_asset = null;
                        // Optional: also remove @token from prompt if we want to be thorough,
                        // but usually the user handles prompt text manually in TextNode.
                      } else if (item.primary) {
                        const rest = Array.isArray(updated.images_list) ? updated.images_list.filter(Boolean) : [];
                        updated.image_url = rest.length ? rest[0] : null;
                        updated.images_list = rest.slice(1);
                      } else {
                        updated.images_list = (Array.isArray(updated.images_list) ? updated.images_list.filter(Boolean) : []).filter((u) => u !== item.url);
                      }
                      return updated;
                    });
                  };
                  return (
                    <div className="w-full px-3 pb-2">
                      <p className="text-[10px] font-semibold text-emerald-300 uppercase tracking-wider mb-1.5">
                        Подключенные объекты ({all.length})
                      </p>
                      <div className="grid grid-cols-4 gap-1.5">
                        {all.map((item, i) => (
                          <div key={`${item.url}-${i}`} className={`relative group/refimg rounded-lg overflow-hidden border bg-black aspect-square ${item.type === 'character' ? 'border-purple-500/50 ring-1 ring-purple-500/20' : 'border-emerald-500/30'}`}>
                            <img src={item.url} alt="ref" className="w-full h-full object-cover" />
                            {item.type === 'character' && (
                              <div className="absolute inset-0 bg-purple-600/10 pointer-events-none" />
                            )}
                            <button
                              type="button"
                              onClick={() => removeAt(item)}
                              className="absolute top-0.5 right-0.5 bg-black hover:bg-black text-white rounded px-1 text-[10px] opacity-0 group-hover/refimg:opacity-100 transition-opacity z-10"
                            >
                              ×
                            </button>
                            {item.type === 'character' && (
                              <div className="absolute bottom-0 left-0 right-0 bg-purple-600/80 text-[7px] text-white font-bold py-0.5 text-center uppercase tracking-tighter">
                                Лицо
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                <div className="flex flex-col items-center justify-center text-zinc-400 gap-2">
                  <TfiText size={32} />
                  <span className="text-[10px] italic">Результат появится здесь...</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      <Handle  
        type="target" 
        position={Position.Left} 
        id="textInput" 
        style={{ 
          top: 100,
          width: 14,
          height: 14,
          opacity: hasPrompt ? 1 : 0,
          pointerEvents: hasPrompt ? 'auto' : 'none',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}  
        className={`
          !rounded-full !border-[3px] !left-[-8px] transition-all
          ${connectedInputs.textInput 
            ? '!bg-blue-500 !border-zinc-900 shadow-[0_0_15px_rgba(59,130,246,0.8)]' 
            : '!bg-zinc-900 !border-blue-500/50 hover:!border-blue-500 shadow-sm'
          }
        `}
        data-type="blue"
      />
      {hasPrompt && (
        <p 
          className={`absolute text-[10px] font-bold tracking-tight text-blue-500 transition-all duration-300 pointer-events-none whitespace-nowrap ${
            data.activeHandleColor === "blue" 
              ? "opacity-100 translate-x-0" 
              : "opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0"
          }`}
          style={{ top: 100, left: -40 }}
        > 
          ТЕКСТ 
        </p>
      )}
      
      <Handle  
        type="target" 
        position={Position.Left} 
        id="textInput2" 
        style={{ 
          top: 150,
          width: 14,
          height: 14,
          opacity: hasImageUrl ? 1 : 0,
          pointerEvents: hasImageUrl ? 'auto' : 'none',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }} 
        className={`
          !rounded-full !border-[3px] !left-[-8px] transition-all
          ${connectedInputs.textInput2 
            ? '!bg-emerald-500 !border-zinc-900 shadow-[0_0_15px_rgba(16,185,129,0.8)]' 
            : '!bg-zinc-900 !border-emerald-500/50 hover:!border-emerald-500 shadow-sm'
          }
        `}
        data-type="green"
      />
      {hasImageUrl && (
        <p 
          className={`absolute text-[10px] font-bold tracking-tight text-emerald-500 transition-all duration-300 pointer-events-none whitespace-nowrap ${
            data.activeHandleColor === "green" 
              ? "opacity-100 translate-x-0" 
              : "opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0"
          }`}
          style={{ top: 150, left: -45 }}
        > 
          ИЗОБРАЖЕНИЕ 
        </p>
      )}

      <Handle  
        type="target" 
        position={Position.Left} 
        id="textInput3" 
        style={{ 
          top: 200,
          width: 14,
          height: 14,
          opacity: hasImagesList ? 1 : 0,
          pointerEvents: hasImagesList ? 'auto' : 'none',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }} 
        className={`
          !rounded-full !border-[3px] !left-[-8px] transition-all
          ${connectedInputs.textInput3 
            ? '!bg-emerald-500 !border-zinc-900 shadow-[0_0_15px_rgba(16,185,129,0.8)]' 
            : '!bg-zinc-900 !border-emerald-500/50 hover:!border-emerald-500 shadow-sm'
          }
        `}
        data-type="green"
      />
      {hasImagesList && (
        <p 
          className={`absolute text-[10px] font-bold tracking-tight text-emerald-500 transition-all duration-300 pointer-events-none whitespace-nowrap ${
            data.activeHandleColor === "green" 
              ? "opacity-100 translate-x-0" 
              : "opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0"
          }`}
          style={{ top: 200, left: -45 }}
        > 
          ИЗОБРАЖЕНИЕ 
        </p>
      )}

      <Handle  
        type="target" 
        position={Position.Left} 
        id="textInput4" 
        style={{ 
          top: 250,
          width: 14,
          height: 14,
          opacity: hasSystemPrompt ? 1 : 0,
          pointerEvents: hasSystemPrompt ? 'auto' : 'none',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }} 
        className={`
          !rounded-full !border-[3px] !left-[-8px] transition-all
          ${connectedInputs.textInput4 
            ? '!bg-blue-600 !border-zinc-900 shadow-[0_0_15px_rgba(37,99,235,0.8)]' 
            : '!bg-zinc-900 !border-blue-600/50 hover:!border-blue-600 shadow-sm'
          }
        `}
        data-type="blue"
      />
      {hasSystemPrompt && (
        <p 
          className={`absolute text-[10px] font-bold tracking-tight text-blue-600 transition-all duration-300 pointer-events-none whitespace-nowrap ${
            data.activeHandleColor === "blue" 
              ? "opacity-100 translate-x-0" 
              : "opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0"
          }`}
          style={{ top: 250, left: -50 }}
        > 
          СИСТЕМНЫЙ 
        </p>
      )}

      <Handle 
        type="source" 
        position={Position.Right} 
        id="textOutput" 
        style={{ 
          top: 100,
          width: 14,
          height: 14,
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }} 
        className={`
          !rounded-full !border-[3px] !right-[-8px] transition-all
          ${connectedOutputs.textOutput 
            ? '!bg-blue-500 !border-zinc-900 shadow-[0_0_15px_rgba(59,130,246,0.8)]' 
            : '!bg-zinc-900 !border-blue-500/50 hover:!border-blue-500 shadow-sm'
          }
        `}
        data-type="blue"
      />
      <p 
        className={`absolute text-[10px] font-bold tracking-tight text-blue-500 transition-all duration-300 pointer-events-none whitespace-nowrap ${
          data.activeHandleColor === "blue" 
            ? "opacity-100 translate-x-0" 
            : "opacity-0 translate-x-1 group-hover:opacity-100 group-hover:translate-x-0"
        }`}
        style={{ top: 100, right: -40 }}
      > 
        ТЕКСТ 
      </p>
    </div>
  );
};

export default TextGeneration;
