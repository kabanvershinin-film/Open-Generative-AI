    const body = await req.json();
    const { 
      fast, 
      prompt, 
      image_url, 
      image_urls, 
      video_url, 
      video_urls, 
      audio_url, 
      audio_urls, 
      resolution, 
      ratio, 
      duration, 
      face_asset,
      is_i2v,
      model: requestedModel
    } = body;

    const model = requestedModel || pickEndpoint(fast) || (fast ? FAST_MODEL_ID : STD_MODEL_ID);
    console.log('[ARK Seedance] Using model/endpoint:', model);