import { buildArkSubmitPayload, normalizeArkResolution } from './route.helpers.js';

function jsonResult(body, status = 200) {
  return { status, body };
}

function pickSeedanceModelId(requestedModel, fast, stdModelId, fastModelId) {
  const model = String(requestedModel || "");
  if (/doubao-seedance-2-0-mini/.test(model)) return model;
  if (/doubao-seedance-2-0-fast/.test(model)) return fastModelId;
  if (/doubao-seedance-2-0/.test(model)) return stdModelId;
  return fast ? fastModelId : stdModelId;
}

function extractArkError(data, status) {
  return data?.error?.message || data?.message || `Ark error ${status}`;
}

async function resolveReferenceValue(value, resolvePublic, userId) {
  if (!value) return undefined;
  if (typeof value === 'object') {
    return { ...value, url: await resolvePublic(value.url, userId) };
  }
  return resolvePublic(value, userId);
}

async function resolveReferenceList(values, resolvePublic, userId) {
  if (!Array.isArray(values)) return undefined;
  return Promise.all(values.map((value) => resolveReferenceValue(value, resolvePublic, userId)));
}

export async function submitSeedanceTask(deps, requestBody, requestMeta = {}) {
  const {
    arkApiKey,
    arkBase,
    getUser,
    resolvePublic,
    buildContent,
    ensureCnyRate,
    priceRub,
    seedance2RateCny,
    signBill,
    pickEndpoint,
    fetchImpl,
    fastModelId,
    stdModelId,
  } = deps;

  if (!arkApiKey) {
    return jsonResult({ error: 'ARK_API_KEY not configured' }, 503);
  }

  const user = await getUser(requestMeta.request);
  const userId = user?.id || null;
  const {
    model,
    fast = false,
    prompt = '',
    first_frame_image,
    image_url,
    image_urls,
    video_url,
    video_urls,
    audio_url,
    audio_urls,
    resolution,
    ratio,
    duration,
    generate_audio = true,
    face_asset,
    face_thumbnail,
    last_image_url,
    seed,
    return_last_frame,
  } = requestBody;

  const resolvedFirstFrameImage = await resolveReferenceValue(first_frame_image, resolvePublic, userId);
  const resolvedImageUrl = await resolveReferenceValue(image_url, resolvePublic, userId);
  const resolvedImageUrls = await resolveReferenceList(image_urls, resolvePublic, userId);

  const content = buildContent({
    prompt,
    first_frame_image: resolvedFirstFrameImage,
    image_url: resolvedImageUrl,
    image_urls: resolvedImageUrls,
    video_url,
    video_urls,
    audio_url,
    audio_urls,
    face_asset,
    face_thumbnail: face_asset ? await resolvePublic(face_thumbnail, userId) : undefined,
    last_image_url: await resolvePublic(last_image_url, userId),
  });

  if (content.length === 0) {
    return jsonResult({ error: 'Empty content' }, 400);
  }

  const modelId = pickSeedanceModelId(model, fast, stdModelId, fastModelId);
  const isFastModel = modelId === fastModelId;
  const usesDedicatedEndpoint = modelId === stdModelId || modelId === fastModelId;
  const endpoint = usesDedicatedEndpoint ? (pickEndpoint(isFastModel) || modelId) : modelId;

  await ensureCnyRate();
  const estimatedCost = await priceRub('video', modelId, { resolution, video_url, duration, generate_audio });
  const hasVideoInput = !!video_url;
  const finalRes = normalizeArkResolution(resolution || '720p', isFastModel) || '720p';
  const rateCny = seedance2RateCny(modelId, finalRes, hasVideoInput);
  const bill = signBill(estimatedCost, {
    model: modelId,
    resolution: finalRes,
    hasVideoInput,
    userId,
  });

  const payload = buildArkSubmitPayload({
    model: endpoint,
    content,
    generateAudio: generate_audio,
    faceAsset: face_asset,
    resolution,
    ratio,
    duration,
    seed,
    returnLastFrame: return_last_frame,
    fast: isFastModel,
  });

  const response = await fetchImpl(`${arkBase}/contents/generations/tasks`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${arkApiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    return jsonResult({ error: extractArkError(data, response.status) }, response.status);
  }

  return jsonResult({
    taskId: data.id,
    endpoint,
    bill,
    estimatedCost,
    rateCny,
  });
}

export async function pollSeedanceTask(deps, requestMeta = {}) {
  const {
    arkApiKey,
    arkBase,
    verifyBillData,
    seedance2RateCny,
    rubFromTokens,
    chargeForTask,
    fetchImpl,
  } = deps;

  if (!arkApiKey) {
    return jsonResult({ error: 'ARK_API_KEY not configured' }, 503);
  }

  const taskId = requestMeta.taskId;
  const bill = requestMeta.bill;
  if (!taskId) {
    return jsonResult({ error: 'Missing taskId' }, 400);
  }

  const response = await fetchImpl(`${arkBase}/contents/generations/tasks/${taskId}`, {
    headers: { Authorization: `Bearer ${arkApiKey}` },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    return jsonResult({ error: extractArkError(data, response.status) }, response.status);
  }

  const status = (data.status || 'running').toLowerCase();
  const url = data.content?.video_url || data.video_url || null;
  const error = data.error?.message || data.message || null;
  const totalTokens = data.usage?.total_tokens || 0;

  if ((status === 'succeeded' || status === 'success') && bill) {
    const billData = verifyBillData(bill);
    if (billData) {
      const { model, resolution, hasVideoInput, userId } = billData;
      const rateCny = seedance2RateCny(model, resolution, hasVideoInput);
      const finalCost = await rubFromTokens(totalTokens, rateCny, userId);
      if (finalCost > 0) {
        await chargeForTask(requestMeta.request, taskId, finalCost, `ark_seedance_${model}`, {
          model,
          taskId,
          tokens: totalTokens,
        });
      }
    }
  }

  return jsonResult({
    status,
    url,
    error,
    tokens: totalTokens,
    last_frame_url: data.content?.last_frame_url || data.last_frame_url || null,
  });
}
