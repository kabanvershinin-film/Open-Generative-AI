export function buildContent({ prompt, first_frame_image, image_url, image_urls, video_url, video_urls, audio_url, audio_urls, face_asset, last_image_url }) {
    const content = [];
    
    // First, process explicit first frame image (if present)
    if (first_frame_image || image_url) { // keep backward compatibility with image_url
        const u = first_frame_image || image_url;
        const url = typeof u === 'string' ? u : (u.url || u.image_url);
        const face = typeof u === 'object' ? u.face_asset : null;
        const effectiveFace = face || (typeof face_asset === 'string' ? face_asset : null);
        const isAsset = effectiveFace && effectiveFace.startsWith('asset://');
        const finalUrl = isAsset ? effectiveFace : url;
        const item = { 
            type: 'image_url', 
            image_url: { 
                url: finalUrl,
                ...(effectiveFace ? { face_asset: effectiveFace } : {})
            }
        };
        if (effectiveFace) {
            item.face_asset = effectiveFace;
        }
        content.push(item);
    }

    // Process reference images
    const refImages = [];
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
        const effectiveFace = face;

        const isAsset = effectiveFace && effectiveFace.startsWith('asset://');
        const finalUrl = isAsset ? effectiveFace : url;

        const item = { 
            type: 'image_url', 
            image_url: { 
                url: finalUrl,
                ...(effectiveFace ? { face_asset: effectiveFace } : {})
            }
        };
        if (effectiveFace) {
            item.face_asset = effectiveFace;
        }
        content.push(item);
    });

    // Optional last frame control
    if (last_image_url) {
        content.push({
            type: 'image_url', 
            image_url: { url: last_image_url }
        });
    }
    
    videos.forEach((u) => content.push({ type: 'video_url', video_url: { url: u } }));
    audios.forEach((u) => content.push({ type: 'audio_url', audio_url: { url: u } }));
    
    // Text prompt at the end
    if (prompt) content.push({ type: 'text', text: prompt });
    
    return content;
}
