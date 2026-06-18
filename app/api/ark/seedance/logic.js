export function buildContent({ prompt, image_url, image_urls, video_url, video_urls, audio_url, audio_urls, face_asset, last_image_url }) {
  const content = [];
  
  const images = [];
  if (image_url) images.push(image_url);
  if (Array.isArray(image_urls)) images.push(...image_urls.filter(Boolean));

  const videos = [];
  if (video_url) videos.push(video_url);
  if (Array.isArray(video_urls)) videos.push(...video_urls.filter(Boolean));

  const audios = [];
  if (audio_url) audios.push(audio_url);
  if (Array.isArray(audio_urls)) audios.push(...audio_urls.filter(Boolean));

  // Multiple images or image + video/audio → multimodal reference.
  const hasRefMedia = videos.length > 0 || audios.length > 0 || !!last_image_url;
  const multiImage  = images.length > 1;
  const hasFaceAsset = !!face_asset;

  images.forEach((u, idx) => {
    const url = typeof u === 'string' ? u : (u.url || u.image_url);
    const face = typeof u === 'object' ? u.face_asset : null;
    
    const isFirstImage = idx === 0;
    const effectiveFace = face || (isFirstImage && typeof face_asset === 'string' ? face_asset : null);

    // If we have a face_asset (asset://), we MUST use it as the URL to avoid sending the real photo.
    // If we send a photo of a real person as the URL, Ark's safety filters will block it.
    const isAsset = effectiveFace && effectiveFace.startsWith('asset://');
    const finalUrl = isAsset ? effectiveFace : url;

    const item = { 
      type: 'image_url', 
      image_url: { 
        url: finalUrl,
        // For Trusted Assets, do not include face_asset inside image_url if we already use it as the url,
        // as some versions of the API might get confused.
        ...(!isAsset && effectiveFace ? { face_asset: effectiveFace } : {})
      }
    };
    
    if (effectiveFace) {
      // For Trusted Assets in Seedance 2.0, face_asset MUST be at the item level.
      item.face_asset = effectiveFace;
      item.role = 'reference_image';
    } else if (isFirstImage && !hasRefMedia && !multiImage && !hasFaceAsset) {
      // Pure I2V: the single image is the first frame.
      item.role = 'first_frame';
    } else {
      // Multimodal reference mode.
      item.role = 'reference_image';
    }
    
    content.push(item);
  });

  // Optional last frame control
  if (last_image_url) {
    content.push({
      type: 'image_url', 
      image_url: { url: last_image_url },
      role: 'last_frame'
    });
  }
  
  videos.forEach((u) => content.push({ type: 'video_url', video_url: { url: u }, role: 'reference_video' }));
  audios.forEach((u) => content.push({ type: 'audio_url', audio_url: { url: u }, role: 'reference_audio' }));
  
  // Text prompt at the end - Seedance 2.0 uses this to bind to preceding media roles/indices (图片1 refers to the first media item)
  if (prompt) content.push({ type: 'text', text: prompt });
  
  return content;
}
