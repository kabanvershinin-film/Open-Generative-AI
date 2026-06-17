    // Ark handles face_asset for trusted assets.
    // We pass the face asset URI in face_asset field of each image, 
    // but for image_urls we must use a real HTTP URL (thumbnail) to avoid validation errors.
    const faceAsset = params.face_asset;
    const initialImages = Array.isArray(params.image_urls) ? [...params.image_urls] : [];
    
    // Convert images to objects with face_asset if needed
    let images = initialImages.map(u => (typeof u === 'string' ? { url: u } : u));
    
    if (params.face_thumbnail) {
        const thumb = params.face_thumbnail;
        const exists = images.some(img => img.url === thumb);
        if (!exists) {
            images.unshift({ url: thumb, face_asset: faceAsset || undefined });
        } else {
            // Update existing image with face_asset
            images = images.map(img => img.url === thumb ? { ...img, face_asset: faceAsset || undefined } : img);
        }
    }

    const body = {
        fast,
        model: modelInfo?.apiId || modelInfo?.id || undefined,
        is_i2v: params.is_i2v ?? false,
        prompt: params.prompt || '',
        image_url: params.image_url || images[0] || undefined,
        image_urls: images.length > 1 ? images.slice(1) : undefined,
        video_url: params.video_url || undefined,
        video_urls: Array.isArray(params.video_urls) ? params.video_urls : undefined,
        audio_url: params.audio_url || undefined,
        audio_urls: Array.isArray(params.audio_urls) ? params.audio_urls : undefined,
        resolution: params.resolution || undefined,
        ratio: params.aspect_ratio || undefined,
        duration: params.duration || undefined,
    };
