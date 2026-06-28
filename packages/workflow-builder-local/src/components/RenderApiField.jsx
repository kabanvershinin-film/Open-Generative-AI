import axios from "axios";
import Image from "next/image";
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { FaAngleDown } from "react-icons/fa6";
import { FiUpload } from "react-icons/fi";
import { toast } from "react-hot-toast";
import AudioPlayer from "./AudioPlayer";
import { IoCloudUploadOutline } from "react-icons/io5";
import { Handle, Position } from "reactflow";
import { TbBoxModel2, TbExternalLink } from "react-icons/tb";
import {
  appendUploadUrls,
  getDisplayUploadUrls,
  normalizeUploadUrls,
  removeUploadUrl,
  replaceUploadUrl,
} from "./uploadPreviewState.js";
import {
  optimizeWorkflowImageUploadFile,
  validateWorkflowImageUploadFile,
} from "./imageUploadOptimization.js";

const UI_TRANSLATIONS = {
  "Prompt": "Промпт",
  "Reference Images": "Референсные изображения",
  "Aspect Ratio": "Соотношение сторон",
  "Resolution": "Разрешение",
  "Routing": "Маршрутизация",
  "Size": "Размер",
  "Quality": "Качество",
  "Format": "Формат",
  "Background": "Фон",
  "Moderation": "Модерация",
  "default": "По умолчанию",
  "nitro": "Нитро",
  "floor": "Флор",
  "stable": "Стабильный",
  "auto": "Авто",
  "high": "Высокое",
  "medium": "Среднее",
  "low": "Низкое",
  "transparent": "Прозрачный",
  "opaque": "Непрозрачный",
  "Add a file or provide an URL": "Добавьте файл или укажите URL",
  "Unsupported file type": "Неподдерживаемый тип файла",
  "Upload failed": "Не удалось загрузить файл",
  "Upload failed.": "Не удалось загрузить файл",
  "Preview": "Предпросмотр",
  "* required": "* обязательно",
  "Remove input": "Удалить вход",
  "Set as input": "Сделать входом",
  "Select or type...": "Выберите или введите...",
  "No options found": "Ничего не найдено",
};

const translateUi = (value) => {
  if (typeof value !== "string") return value;
  return UI_TRANSLATIONS[value] || value;
};

const RenderApiField = ({ fieldName, meta, idx, formValues, setFormValues, handleChange, hasHandle = false, exposedHandles = [], onToggleHandle }) => {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dropDown, setDropDown] = useState(-1);
  const [uploading, setUploading] = useState(false);
  const [isOpeningUp, setIsOpeningUp] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState({});
  const [isMobileUploadUi, setIsMobileUploadUi] = useState(false);
  const [previewUrls, setPreviewUrls] = useState([]);
  const containerRef = useRef(null);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const ownedObjectUrlsRef = useRef(new Set());

  const isImageUrl = (url) => {
    if (typeof url !== 'string') return false;
    return url.match(/\.(jpeg|jpg|gif|png|webp|avif|HEIC)(\?.*)?$/i) !== null || url.startsWith('https://cdn.muapi.ai/');
  };

  const isImageField = ['image', 'last_image', 'image_url'].includes(meta.field) || 
                       ['image', 'last_image', 'image_url'].includes(fieldName);
  const isImagesListField = ['images', 'image_urls', 'images_list'].includes(fieldName) || meta.field === 'images_list';
  const isVideoField = ['video', 'video_url'].includes(meta.field) || ['video', 'video_url'].includes(fieldName);
  const isAudioField = ['audio', 'audio_url'].includes(meta.field) || ['audio', 'audio_url'].includes(fieldName);
  const value = formValues[fieldName] ?? meta.default ?? "";
  const isRequired = meta.required || false;
  const isUploadArrayField = meta.type === "array" || isImagesListField;
  const actualUploadUrls = isUploadArrayField
    ? normalizeUploadUrls(formValues[fieldName])
    : normalizeUploadUrls(formValues[fieldName] ?? "");
  const displayUploadUrls = getDisplayUploadUrls(uploading ? previewUrls : [], actualUploadUrls);
  const displayUploadUrl = displayUploadUrls[0] || "";
  const label = (
    <div className="flex items-center justify-between w-full group/label">
      <label htmlFor={fieldName} className="text-xs font-bold text-zinc-500 text-start flex-grow cursor-pointer">
        {translateUi(fieldName)}
        {isRequired && <span className="text-blue-500 text-[9px] ml-1">{translateUi("* required")}</span>}
      </label>
      {onToggleHandle && (
        <button
          type="button"
          suppressHydrationWarning={true}
          onClick={(e) => { e.stopPropagation(); onToggleHandle(fieldName); }}
          className={`p-1 rounded-lg transition-all group-hover/label:opacity-100 h-6 w-6 flex items-center justify-center ${exposedHandles.includes(fieldName) ? "text-blue-500 bg-blue-500/10 opacity-100" : "text-zinc-500 hover:text-white hover:bg-white/5 opacity-0"}`}
          title={translateUi(exposedHandles.includes(fieldName) ? "Remove input" : "Set as input")}
        >
          <TbExternalLink size={14} />
        </button>
      )}
    </div>
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mediaQuery = window.matchMedia("(max-width: 767px), (pointer: coarse)");
    const applyMatch = () => setIsMobileUploadUi(mediaQuery.matches);
    applyMatch();
    mediaQuery.addEventListener?.("change", applyMatch);
    return () => mediaQuery.removeEventListener?.("change", applyMatch);
  }, []);

  useEffect(() => () => {
    ownedObjectUrlsRef.current.forEach((url) => {
      try {
        URL.revokeObjectURL(url);
      } catch {}
    });
    ownedObjectUrlsRef.current.clear();
  }, []);

  useLayoutEffect(() => {
    if (dropDown === idx + 1 && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const spaceBelow = windowHeight - rect.bottom;
      setIsOpeningUp(spaceBelow < 200);
    }
  }, [dropDown, idx]);

  const handleFileUpload = async (field, fieldSchema, e) => {
    let file = null;

    if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
      file = e.dataTransfer.files[0];
    } else if (e.target.files && e.target.files.length > 0) {
      file = e.target.files[0];
    } else {
      return;
    }
    const fileName = (file.name || "").toLowerCase();
    const isAcceptedType =
      isImageField
        ? file.type.startsWith("image/") || /\.(png|jpe?g|webp|gif|avif|heic|heif)$/i.test(fileName)
        : isVideoField
          ? file.type.startsWith("video/") || /\.(mp4|webm|mov|m4v)$/i.test(fileName)
          : isAudioField
            ? file.type.startsWith("audio/") || /\.(mp3|wav|webm|m4a|ogg)$/i.test(fileName)
            : file.type.startsWith("image/") || file.type.startsWith("video/");

    if (!isAcceptedType) {
      toast.error(translateUi("Unsupported file type"));
      return;
    }

    const previewUrl = typeof URL !== "undefined" ? URL.createObjectURL(file) : "";
    if (previewUrl) {
      ownedObjectUrlsRef.current.add(previewUrl);
      setPreviewUrls((prev) => appendUploadUrls(
        prev.length > 0 ? prev : actualUploadUrls,
        [previewUrl],
        fieldSchema.type === "array" ? (fieldSchema.maxItems || Number.POSITIVE_INFINITY) : 1,
      ));
    }
    setUploading(true);
    setUploadProgress(0);
    try {
      let uploadFile = file;
      if (isImageField) {
        validateWorkflowImageUploadFile(file);
        uploadFile = await optimizeWorkflowImageUploadFile(file);
      }

      const response = await axios.get("/api/upload-file", {
        params: { filename: uploadFile.name || file.name, type: uploadFile.type || file.type }
      });
      const { putUrl, publicUrl } = response.data;

      await axios.put(putUrl, uploadFile, {
        headers: { "Content-Type": uploadFile.type || file.type },
        onUploadProgress: (progressEvent) => {
          const total = progressEvent.total || uploadFile.size || file.size || 1;
          const percentCompleted = Math.round((progressEvent.loaded * 100) / total);
          setUploadProgress(percentCompleted);
        }
      });

        setFormValues((prev) => {
          const current = prev[field];
          const updatedValue = fieldSchema.type === 'array'
            ? [...(current || []), publicUrl]
            : publicUrl

            return { ...prev, [field]: updatedValue };
        });
        setPreviewUrls((prev) => replaceUploadUrl(prev, previewUrl, publicUrl));
        if (previewUrl && ownedObjectUrlsRef.current.has(previewUrl)) {
          try {
            URL.revokeObjectURL(previewUrl);
          } catch {}
          ownedObjectUrlsRef.current.delete(previewUrl);
        }
        setTimeout(() => {
          setUploading(false);
          setUploadProgress(0);
          setPreviewUrls([]);
        }, 500);
    } catch (error) {
      console.error("Upload failed", error);
      toast.error(error?.message || translateUi("Upload failed."), error?.response?.data);
      setPreviewUrls((prev) => removeUploadUrl(prev, previewUrl));
      if (previewUrl && ownedObjectUrlsRef.current.has(previewUrl)) {
        try {
          URL.revokeObjectURL(previewUrl);
        } catch {}
        ownedObjectUrlsRef.current.delete(previewUrl);
      }
      setUploading(false);
      setUploadProgress(0);
      setPreviewUrls([]);
    } finally {
      if (e?.target && "value" in e.target) {
        e.target.value = "";
      }
    }
  };

  const handleStyle = {
    width: 10,
    height: 10,
    transition: 'all 0.2s ease-in-out',
    background: '#3b82f6',
    border: '2px solid #fff',
    zIndex: 10,
    boxShadow: '0 0 10px rgba(59, 130, 246, 0.5)'
  };

  const fileAcceptAttr =
    isImageField
      ? "image/*,.heic,.heif"
      : isVideoField
        ? "video/*,.mov,.m4v"
        : isAudioField
          ? "audio/*,.m4a,.ogg"
          : "image/*,video/*,.heic,.heif,.mov,.m4v";

  if (meta.enum) {
    const isManual = meta.allowManual || false;
    const filteredOptions = isManual && value 
      ? meta.enum.filter(opt => (opt || "").toString().toLowerCase().includes((value || "").toString().toLowerCase()))
      : meta.enum;

    return (
      <div key={fieldName} className="flex flex-col gap-1 w-full relative">
        {hasHandle && (
          <Handle 
            type="target" 
            position={Position.Left} 
            id={fieldName} 
            style={{ ...handleStyle, top: '50%', transform: 'translateY(-50%)' }} 
            className="!rounded-full input-handle !left-[-17px]" 
          />
        )}
        {label}
        <div
          tabIndex={0}
          onBlur={(e) => {
            const currentTarget = e.currentTarget;
            setTimeout(() => {
              if (
                currentTarget &&
                !currentTarget.contains(document.activeElement)
              ) {
                setDropDown(-1);
              }
            }, 100);
          }}
          className="flex flex-col gap-1 relative w-full"
        >
          <div 
            ref={containerRef}
            className="flex items-center gap-1 border border-white/10 rounded-lg bg-zinc-900 hover:border-white/20 transition-all relative overflow-hidden"
          >
            {isManual ? (
              <input
                type="text"
                value={value}
                onChange={(e) => handleChange(fieldName, e.target.value)}
                onFocus={() => setDropDown(idx + 1)}
                placeholder={translateUi("Select or type...")}
                className="flex-grow text-xs text-white bg-transparent outline-none px-2 py-[5px] w-full"
              />
            ) : (
              <button
                type="button"
                suppressHydrationWarning={true}
                onClick={() => setDropDown((prev) => (prev === idx + 1 ? -1 : idx + 1))}
                className="flex items-center justify-between gap-1 text-xs text-center text-white w-full h-full cursor-pointer whitespace-nowrap px-3 py-1.5 focus:outline-none"
              >
                <div className="flex items-center gap-2 truncate">
                  <span className="truncate">
                    {(() => {
                      if (typeof value === 'object') return translateUi(value.label || value.value);
                      const option = meta.enum?.find(opt => (typeof opt === 'object' ? opt.value : opt) === value);
                      return typeof option === 'object' ? translateUi(option.label) : translateUi(value);
                    })()}
                  </span>
                </div>
              </button>
            )}
            
            <button
              type="button"
              suppressHydrationWarning={true}
              onClick={() => setDropDown((prev) => (prev === idx + 1 ? -1 : idx + 1))}
              className="px-2 text-gray-400 hover:text-white cursor-pointer border-l border-gray-700 h-full flex items-center justify-center"
            >
              <FaAngleDown
                size={14}
                className={`transition-all duration-300 ease-in-out ${
                  dropDown === idx + 1 ? "rotate-180" : ""
                }`}
              />
            </button>
          </div>
          <div
            tabIndex={-1}
            style={dropdownStyle}
            className={`absolute left-0 ${isOpeningUp ? "bottom-full mb-2" : "top-full mt-2"} border border-white/10 p-2 rounded-lg flex flex-col overflow-y-auto bg-zinc-900 shadow-2xl z-50 transition-all duration-200 w-full max-h-60 custom-scrollbar-thin ${
              dropDown === idx + 1
                ? "opacity-100 scale-100 visible translate-y-0"
                : `opacity-0 scale-95 invisible ${isOpeningUp ? "translate-y-2" : "-translate-y-2"}`
            }`}
          >
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option, i) => (
                <button
                  type="button"
                  suppressHydrationWarning={true}
                  key={i}
                  className={`flex items-center gap-2 px-3 py-2 text-xs cursor-pointer rounded-lg transition-all ${
                    (typeof option === "object" ? formValues[fieldName] === option.value : formValues[fieldName] === option)
                      ? "bg-blue-500/10 text-blue-400"
                      : "text-zinc-400 hover:bg-white/5 hover:text-white"
                  }`}
                  onClick={() => {handleChange(fieldName, typeof option === "object" ? option.value : option); setDropDown(-1)}}
                >
                  <span className="truncate">{typeof option === "object" ? translateUi(option.label || option.value) : translateUi(option)}</span>
                  {(typeof option === "object" ? formValues[fieldName] === option.value : formValues[fieldName] === option) && (
                    <span className="ml-auto text-blue-400 font-bold">✓</span>
                  )}
                </button>
              ))
            ) : (
              <div className="text-gray-500 text-xs p-2 text-center">{translateUi("No options found")}</div>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (isImageField || isVideoField || isAudioField) {
    return (
      <div key={fieldName} className="flex flex-col gap-2 relative">
        {hasHandle && (
          <Handle 
            type="target" 
            position={Position.Left} 
            id={fieldName} 
            style={{ ...handleStyle, top: '25px' }} 
            className="!rounded-full input-handle !left-[-17px]" 
          />
        )}
        {label}
        <div className="flex items-center gap-1">
          <input 
            type="text" 
            value={formValues[fieldName] || ''} 
            readOnly
            // onChange={(e) => handleChange(fieldName, e.target.value)} 
            className="bg-zinc-900 text-white text-xs py-2 px-3 rounded-lg border border-white/10 hover:border-white/20 transition-all w-full outline-none focus:border-blue-500/50" 
            placeholder={translateUi("Add a file or provide an URL")} 
          />
          {/* <input 
            type="file" 
            accept={
              isImageField ? "image/*" : 
              isVideoField ? "video/*" : 
              isAudioField ? "audio/*": 
              "image/*,video/*,audio/*"
            }
            id={`file-upload-${fieldName}`} 
            className="hidden" 
            disabled={uploading}
            onChange={(e) => handleFileUpload(fieldName, meta, e)} 
          />
          <label 
            htmlFor={`file-upload-${fieldName}`} 
            className={`flex items-center justify-center gap-1 bg-blue-500 text-white hover:bg-blue-600 text-xs font-medium cursor-pointer flex-shrink-0 ${
              uploading ? 'rounded-full h-6 w-6': 'rounded py-1 px-3'}
            `}
          >
            {uploading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <IoCloudUploadOutline size={16} />
            )}
          </label> */}
        </div>
        {uploading && (
          <div className="w-full bg-gray-700 rounded h-1 overflow-hidden">
            <div className="bg-blue-500 h-full" style={{ width: `${uploadProgress}%` }}></div>
          </div>
        )}
        {isMobileUploadUi && (
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="min-h-11 px-4 rounded-lg bg-cyan-500/50 border border-cyan-400/30 text-cyan-300 text-xs font-semibold hover:bg-cyan-500/60 transition-colors">
              Выбрать файл
            </button>
            {isImageField && (
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="min-h-11 px-4 rounded-lg bg-purple-500/50 border border-purple-400/30 text-purple-300 text-xs font-semibold hover:bg-purple-500/60 transition-colors">
                Камера
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept={fileAcceptAttr}
              className="hidden"
              disabled={uploading}
              onChange={(e) => handleFileUpload(fieldName, meta, e)}
            />
            {isImageField && (
              <input
                ref={cameraInputRef}
                type="file"
                accept={fileAcceptAttr}
                capture="environment"
                className="hidden"
                disabled={uploading}
                onChange={(e) => handleFileUpload(fieldName, meta, e)}
              />
            )}
          </div>
        )}
        {displayUploadUrl && (
          <div className="flex items-center gap-2 relative group overflow-hidden self-start w-full">
            {isImageField || isImageUrl(displayUploadUrl) ? (
              <img src={displayUploadUrl} alt="Preview" className="w-24 h-24 object-cover border border-white/10 rounded-xl shadow-lg" width={0} height={0} />
            ) : isVideoField ? (
              <video src={displayUploadUrl} className="w-24 h-24 object-cover border border-white/10 rounded-xl shadow-lg" />
            ) : isAudioField && (
              <div className="flex flex-col w-full h-16 border border-white/10 rounded-xl overflow-hidden shadow-lg">
                <AudioPlayer src={displayUploadUrl} />
              </div>
            )}
            {uploading && (
              <div className="absolute inset-x-2 bottom-2 rounded-lg bg-black/70 px-2 py-1 text-[10px] text-cyan-200">
                Загрузка... {uploadProgress}%
              </div>
            )}
            <button 
              type="button" 
              suppressHydrationWarning={true}
              onClick={() => handleChange(fieldName, '')} 
              className="text-gray-500 group-hover:text-red-600 group-hover:font-black cursor-pointer absolute top-2 left-2"
            >
              &#10005;
            </button>
          </div>
        )}
      </div>
    );
  };

  if (isImagesListField) {
    const imageList = displayUploadUrls;
    return (
      <div key={fieldName} className="flex flex-col gap-1 relative">
        {hasHandle && (
          <Handle 
            type="target" 
            position={Position.Left} 
            id={fieldName} 
            style={{ ...handleStyle, top: '25px' }} 
            className="!rounded-full input-handle !left-[-17px]" 
          />
        )}
        <div className="flex items-center justify-between">
          {label}
          {meta.maxItems && <span className="text-xs text-gray-400">{translateUi("max items:")} {meta.maxItems}</span>}
        </div>
        <div className="grid grid-cols-3 gap-2">
          {imageList.map((url, idx) => (
            <div key={idx} className="flex items-center gap-2 relative group overflow-hidden">
              {isImageUrl(url) ? (
                <img 
                  src={url} 
                  alt="Preview" 
                  className="w-full h-full aspect-[1/1] object-cover border border-gray-500 rounded" 
                />
              ) : (url.includes('.mp4') || url.includes('.webm')) && (
                <video 
                  src={url} 
                  className="w-full h-full aspect-[1/1] object-cover border border-gray-500 rounded" 
                />
              )}
              <div className="inset-0 group-hover:bg-gray-600 absolute rounded">
                <button 
                  type="button" 
                  suppressHydrationWarning={true}
                  onClick={() => {
                    const updated = [...imageList];
                    updated.splice(idx, 1);
                    handleChange(fieldName, updated);
                  }} 
                  className="text-gray-500 group-hover:text-red-600 hover:font-bold cursor-pointer absolute top-2 left-2"
                >
                  &#10005;
                </button>
              </div>
            </div>
          ))}
          {/* {imageList.length < (meta.maxItems) && (
            <div>
              <input
                type="file"
                id={`file-upload-${fieldName}`} 
                accept={isImageField ? "image/*" : isVideoField ? "video/*" : "image/*,video/*"}
                multiple
                onChange={(e) => handleFileUpload(fieldName, meta, e)}
                className="hidden"
              />
              <label
                htmlFor={`file-upload-${fieldName}`} 
                className="w-full h-full aspect-[1/1] flex items-center justify-center border border-dashed border-gray-400 text-gray-500 hover:text-white text-xl rounded cursor-pointer hover:bg-gray-800">
                {uploading ? (
                  <div className="animate-spin w-6 h-6 border-2 border-white border-t-transparent rounded-full" />
                ) : (
                  <FiUpload size={25} />
                )}
              </label>
            </div>
          )} */}
        </div>
      </div>
    );
  };

  // if (meta.minValue !== undefined && meta.maxValue !== undefined) {
  //   return (
  //     <div key={fieldName} className="flex flex-col w-full">
  //       {label}
  //       <div className="flex items-center gap-2 w-full">
  //         <input
  //           type="range"
  //           id={fieldName}
  //           min={meta.minValue}
  //           max={meta.maxValue}
  //           step={meta.step}
  //           value={formValues[fieldName] ?? meta.default}
  //           onChange={(e) => handleChange(fieldName, parseFloat(e.target.value))}
  //           className="h-1 rounded-full cursor-pointer accent-blue-600 active:accent-blue-600 outline-none w-full"
  //         />
  //         <input 
  //           type="number" 
  //           id={fieldName} 
  //           min={meta.minValue} 
  //           max={meta.maxValue} 
  //           step={meta.step}
  //           value={formValues[fieldName] ?? meta.default} 
  //           readOnly
  //           // onChange={(e) => {
  //           //   const val = parseFloat(e.target.value) || meta.minValue;
  //           //   const clamped = Math.max(meta.minValue, Math.min(val, meta.maxValue));
  //           //   handleChange(fieldName, clamped);
  //           // }} 
  //           className="w-12 h-7 text-center text-white rounded border border-gray-300 text-xs" 
  //         />
  //       </div>
  //     </div>
  //   );
  // };

  if (meta.type === "int" || meta.type === "number") {
    return (
      <div key={fieldName} className="flex flex-col gap-1 relative">
        {hasHandle && (
          <Handle 
            type="target" 
            position={Position.Left} 
            id={fieldName} 
            style={{ ...handleStyle, top: '50%', transform: 'translateY(-50%)' }} 
            className="!rounded-full input-handle !left-[-17px]" 
          />
        )}
        {label}
        <input
          type="number"
          value={value}
          onChange={(e) => handleChange(fieldName, parseFloat(e.target.value || 0))}
          placeholder={meta.description || ""}
          className="bg-zinc-900 text-white text-xs p-2 rounded-lg border border-white/10 hover:border-white/20 transition-all outline-none focus:border-blue-500/50"
        />
      </div>
    );
  };

  if (meta.format === 'text') {
    return (
      <div key={fieldName} className="flex flex-col gap-2 w-full relative">
        {hasHandle && (
          <Handle 
            type="target" 
            position={Position.Left} 
            id={fieldName} 
            style={{ ...handleStyle, top: '25px' }} 
            className="!rounded-full input-handle !left-[-17px]" 
          />
        )}
        <div className="flex items-center gap-2 text-sm font-medium relative">
          {label}
        </div>
        <input
          type="text"
          id={fieldName}
          value={value}
          placeholder={translateUi(meta.placeholder || meta.description || fieldName)}
          onChange={(e) => handleChange(fieldName, e.target.value)}
          className="bg-zinc-900 text-white text-xs py-2 px-3 rounded-lg border border-white/10 hover:border-white/20 transition-all w-full outline-none focus:border-blue-500/50"
        />
      </div>
    );
  };

  if (meta.type === "bool") {
    return (
      <div key={fieldName} className="flex flex-col gap-1 relative">
        {hasHandle && (
          <Handle 
            type="target" 
            position={Position.Left} 
            id={fieldName} 
            style={{ ...handleStyle, top: '50%', transform: 'translateY(-50%)' }} 
            className="!rounded-full input-handle !left-[-17px]" 
          />
        )}
        {label}
        <div className="flex items-center gap-2">
          <label htmlFor={`instrumental-${fieldName}`} className="flex items-center justify-between cursor-pointer select-none relative">
            <input
              type="checkbox"
              id={`instrumental-${fieldName}`}
              className="sr-only peer"
              checked={!!formValues[fieldName]}
              onChange={(e) => handleChange(fieldName, e.target.checked)}
            />
            <span className={`flex items-center h-[20px] w-[36px] rounded-full p-1 duration-200 transition-all ${!!formValues[fieldName] ? "bg-blue-600 shadow-lg shadow-blue-900/40" : "bg-zinc-800 border border-white/10"}`}>
              <span className={`h-[12px] w-[12px] rounded-full bg-white duration-200 shadow-sm ${!!formValues[fieldName] && "translate-x-4"}`}></span>
            </span>
          </label>
          <p className="text-xs">{meta.description}</p>
        </div>
      </div>
    )
  };

  // if (meta.type === "string") {
  return (
    <div key={fieldName} className="flex flex-col items-start gap-1 relative">
      {hasHandle && (
        <Handle 
          type="target" 
          position={Position.Left} 
          id={fieldName} 
          style={{ ...handleStyle, top: '25px' }} 
          className="!rounded-full input-handle !left-[-17px]" 
        />
      )}
      {label}
      <textarea
        value={value}
        readOnly
        // onChange={(e) => handleChange(fieldName, e.target.value)}
        placeholder={meta.description || ""}
        className="bg-zinc-900 text-white text-xs py-2 px-3 rounded-lg border border-white/10 hover:border-white/20 transition-all w-full outline-none focus:border-blue-500/50"
        rows={6}
      />
    </div>
  );
  // }
};

export default RenderApiField;
