export function buildContent({ prompt, first_frame_image, image_url, image_urls, video_url, video_urls, audio_url, audio_urls, face_asset, face_thumbnail, last_image_url }) {
    const content = [];

    const seenAssetRefs = new Set();
    
    // Process all reference images (no explicit first frame)
    const refImages = [];
    if (first_frame_image) refImages.push(first_frame_image);
    if (image_url) refImages.push(image_url);
    if (Array.isArray(image_urls)) refImages.push(...image_urls.filter(Boolean));

    const videos = [];
    if (video_url) videos.push(video_url);
    if (Array.isArray(video_urls)) videos.push(...video_urls.filter(Boolean));

    const audios = [];
    if (audio_url) audios.push(audio_url);
    if (Array.isArray(audio_urls)) audios.push(...audio_urls.filter(Boolean));

    refImages.forEach((u) => {
        const url = typeof u === 'string' ? u : (u.url || u.image_url);
        const face = typeof u === 'object' ? u.face_asset : null;
        const directAssetUrl = typeof url === 'string' && url.startsWith('asset://') ? url : null;
        const fallbackAssetUrl = typeof face === 'string' && face.startsWith('asset://') ? face : null;
        const finalUrl = directAssetUrl || fallbackAssetUrl || url;
        if (!finalUrl) return;
        if (finalUrl.startsWith('asset://')) seenAssetRefs.add(finalUrl);

        const item = { 
            type: 'image_url',
            role: 'reference_image',
            image_url: { 
                url: finalUrl,
            }
        };
        content.push(item);
    });

    // Backward compatibility: if callers still pass a top-level face_asset, map it
    // to an Ark asset URI reference image instead of duplicating thumbnail + asset fields.
    if (face_asset && !seenAssetRefs.has(face_asset)) {
        const item = { 
            type: 'image_url',
            role: 'reference_image',
            image_url: { 
                url: face_asset
            }
        };
        content.push(item);
    }

    // Optional last frame control
    if (last_image_url) {
        content.push({
            type: 'image_url', 
            image_url: { url: last_image_url }
        });
    }
    
    videos.forEach((u) => content.push({ type: 'video_url', role: 'reference_video', video_url: { url: u } }));
    audios.forEach((u) => content.push({ type: 'audio_url', role: 'reference_audio', audio_url: { url: u } }));
    
    // Text prompt at the end
    if (prompt) content.push({ type: 'text', text: prompt });
    
    return content;
}
