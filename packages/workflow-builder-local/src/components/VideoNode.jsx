    // Gather all character nodes and images connected to this node
    // MUST match the order logic in SeedancePromptNode.jsx so 图片1, 图片2, etc. refer to the right things.
    const findConnectedAssets = () => {
      const incoming = edges.filter(e => e.target === id);
      const assets = { images: [], videos: [], audios: [] };
      const seen = new Set();
      
      const processSource = (sourceId) => {
        if (seen.has(sourceId)) return;
        seen.add(sourceId);
        const sourceNode = nodes.find(n => n.id === sourceId);
        if (!sourceNode) return;
        
        if (sourceNode.type === "characterNode") {
          const fv = sourceNode.data?.formValues || {};
          const rawAsset = fv.face_asset || sourceNode.data?.resultUrl || sourceNode.data?.outputs?.[0]?.value;
          const asset = toAssetUri(rawAsset);
          
          // Always use the character_photo (HTTP URL) as the reference image.
          // Using asset:// in image_url causes "invalid_image_url" validation error in Ark.
          if (fv.character_photo) {
            assets.images.push({
              url: fv.character_photo,
              face_asset: asset || undefined
            });
          } else if (asset) {
            // If no photo, but we have an asset, we still need to pass it.
            // But Seedance 2.0 requires a visual image for the face_asset to work.
            assets.images.push({
              url: "", // This might be an issue, but we don't have a photo
              face_asset: asset
            });
          }
        } else if (sourceNode.type === "imageNode" || sourceNode.type === "uploadNode") {
          const url = sourceNode.data?.resultUrl || sourceNode.data?.outputs?.[0]?.value;
          if (url) assets.images.push({ url });
        } else if (sourceNode.type === "videoNode") {
          const url = sourceNode.data?.resultUrl || sourceNode.data?.outputs?.[0]?.value;
          if (url) assets.videos.push(url);
        } else if (sourceNode.type === "audioNode") {
          const url = sourceNode.data?.resultUrl || sourceNode.data?.outputs?.[0]?.value;
          if (url) assets.audios.push(url);
        } else if (["concatNode", "seedancePromptNode"].includes(sourceNode.type)) {
          // For utility nodes, we look at THEIR incoming edges
          const subEdges = edges.filter(e => e.target === sourceId);
          subEdges.forEach(se => processSource(se.source));
        }
      };

      incoming.forEach(edge => processSource(edge.source));
      return assets;
    };

    const allAssets = findConnectedAssets();
    const uniqueImages = allAssets.images;
    const uniqueVideos = Array.from(new Set(allAssets.videos));
    const uniqueAudios = Array.from(new Set(allAssets.audios));
    const facesFound = uniqueImages.filter(img => img.face_asset).length;

    console.log('[VideoNode] Connected assets found:', { facesFound, imageCount: uniqueImages.length, uniqueVideos, uniqueAudios });

    if (facesFound > 0 || uniqueImages.length > 0) {
      toast(`Использую: ${facesFound} лиц, ${uniqueImages.length} фото`, { icon: "🎨" });
    }

    const fast = /fast/.test(`${selectedModel?.id || ""} ${selectedModel?.name || ""}`.toLowerCase());
    const src = formValues || {};
    
    const body = {
      fast,
      prompt: src.prompt || "",
      image_url: uniqueImages[0] || src.image_url || undefined,
      image_urls: uniqueImages.length > 1 ? uniqueImages.slice(1) : undefined,
      video_url: uniqueVideos[0] || src.video_url || undefined,
      video_urls: uniqueVideos.length > 1 ? uniqueVideos.slice(1) : undefined,
      audio_url: uniqueAudios[0] || src.audio_url || undefined,
      audio_urls: uniqueAudios.length > 1 ? uniqueAudios.slice(1) : undefined,
      resolution: src.resolution || undefined,
      ratio: src.aspect_ratio || src.ratio || undefined,
      duration: src.duration || undefined,
    };
