import { createHmac, createHash } from 'crypto';
import { buildUserMediaKey } from './tosPaths';

const TOS_ENDPOINT = process.env.TOS_ENDPOINT || '';
const TOS_BUCKET = process.env.TOS_BUCKET || '';
const TOS_REGION = process.env.TOS_REGION || 'cn-beijing';
const TOS_AK = process.env.TOS_ACCESS_KEY || '';
const TOS_SK = process.env.TOS_SECRET_KEY || '';
const TOS_ENABLED = !!(TOS_ENDPOINT && TOS_BUCKET && TOS_AK && TOS_SK);

function sha256hex(data) {
    return createHash('sha256').update(data).digest('hex');
}

function hmac(key, data) {
    return createHmac('sha256', key).update(data).digest();
}

function tosDateParts() {
    const iso = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
    return { date: iso.slice(0, 8), datetime: iso };
}

function tosSigningKey(date) {
    return hmac(hmac(hmac(hmac(TOS_SK, date), TOS_REGION), 'tos'), 'request');
}

async function tosUpload(key, buffer, contentType) {
    if (!TOS_ENABLED) return null;
    try {
        const { date, datetime } = tosDateParts();
        const host = `${TOS_BUCKET}.${TOS_ENDPOINT}`;
        const path = `/${key}`;
        const payloadHash = sha256hex(buffer);
        const canonHeaders = `content-length:${buffer.length}\ncontent-type:${contentType}\nhost:${host}\nx-tos-content-sha256:${payloadHash}\nx-tos-date:${datetime}\n`;
        const signedHeaders = 'content-length;content-type;host;x-tos-content-sha256;x-tos-date';
        const canonical = `PUT\n${path}\n\n${canonHeaders}\n${signedHeaders}\n${payloadHash}`;
        const scope = `${date}/${TOS_REGION}/tos/request`;
        const strToSign = `TOS4-HMAC-SHA256\n${datetime}\n${scope}\n${sha256hex(canonical)}`;
        const sig = createHmac('sha256', tosSigningKey(date)).update(strToSign).digest('hex');
        const auth = `TOS4-HMAC-SHA256 Credential=${TOS_AK}/${scope}, SignedHeaders=${signedHeaders}, Signature=${sig}`;
        const res = await fetch(`https://${host}${path}`, {
            method: 'PUT',
            headers: {
                Authorization: auth,
                'Content-Type': contentType,
                'Content-Length': String(buffer.length),
                'X-Tos-Content-Sha256': payloadHash,
                'X-Tos-Date': datetime,
            },
            body: buffer,
        });
        if (!res.ok) return null;
        return `https://${host}${path}`;
    } catch {
        return null;
    }
}

async function tosGetSignedJson(host, key) {
    if (!TOS_ENABLED) return null;
    const { date, datetime } = tosDateParts();
    const path = '/' + key.split('/').map(encodeURIComponent).join('/');
    const emptyHash = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
    const canonHeaders = `host:${host}\nx-tos-content-sha256:${emptyHash}\nx-tos-date:${datetime}\n`;
    const signedHeaders = 'host;x-tos-content-sha256;x-tos-date';
    const canonical = `GET\n${path}\n\n${canonHeaders}\n${signedHeaders}\n${emptyHash}`;
    const scope = `${date}/${TOS_REGION}/tos/request`;
    const strToSign = `TOS4-HMAC-SHA256\n${datetime}\n${scope}\n${sha256hex(canonical)}`;
    const sig = createHmac('sha256', tosSigningKey(date)).update(strToSign).digest('hex');
    const auth = `TOS4-HMAC-SHA256 Credential=${TOS_AK}/${scope}, SignedHeaders=${signedHeaders}, Signature=${sig}`;
    const r = await fetch(`https://${host}${path}`, {
        headers: {
            Authorization: auth,
            'X-Tos-Content-Sha256': emptyHash,
            'X-Tos-Date': datetime,
        },
    });
    if (!r.ok) return null;
    return r.json();
}

async function maybeUploadMediaToTOS(srcUrl, kind, userId = null) {
    if (!srcUrl) return null;
    const tosHost = `${TOS_BUCKET}.${TOS_ENDPOINT}`;
    if (srcUrl.startsWith(`https://${tosHost}`)) return srcUrl;
    try {
        const r = await fetch(srcUrl);
        if (!r.ok) return null;
        const buf = Buffer.from(await r.arrayBuffer());
        const ct = r.headers.get('content-type') || (kind === 'video' ? 'video/mp4' : kind === 'audio' ? 'audio/mpeg' : 'image/png');
        let folder = 'images';
        let ext = 'png';
        if (kind === 'video') {
            folder = 'videos';
            ext = ct.includes('webm') ? 'webm' : ct.includes('mov') ? 'mov' : 'mp4';
        } else if (kind === 'audio') {
            folder = 'audio';
            ext = ct.includes('wav') ? 'wav' : ct.includes('ogg') ? 'ogg' : 'mp3';
        } else {
            ext = (ct.split('/')[1] || 'png').split('+')[0];
        }
        const tosKey = buildUserMediaKey(userId, folder, ext);
        return tosUpload(tosKey, buf, ct);
    } catch {
        return null;
    }
}

async function appendToIndex(host, userId, entry) {
    if (!TOS_ENABLED || !userId || !entry) return;
    const key = `gallery/${userId}/entries.json`;
    const readList = async () => {
        try {
            const r = await fetch(`https://${host}/${key}`);
            if (r.ok) return await r.json().catch(() => null);
            return await tosGetSignedJson(host, key);
        } catch {
            return null;
        }
    };

    for (let attempt = 0; attempt < 6; attempt += 1) {
        let list = await readList();
        if (!Array.isArray(list)) list = [];
        if (list.some((item) => item && (item.id === entry.id || item.url === entry.url))) return;
        let next = [entry, ...list];
        if (next.length > 1000) next = next.slice(0, 1000);
        const ok = await tosUpload(key, Buffer.from(JSON.stringify(next)), 'application/json');
        if (ok) {
            const check = await readList();
            if (Array.isArray(check) && check.some((item) => item && item.id === entry.id)) return;
        }
        await new Promise((resolve) => setTimeout(resolve, 70 + Math.floor(Math.random() * 130)));
    }
}

export async function saveGalleryEntry({ userId, url, type = 'video', model = '', prompt = '', extra = {} }) {
    if (!TOS_ENABLED || !userId || !url) return null;
    const permanentUrl = await maybeUploadMediaToTOS(url, type, userId);
    if (type === 'video' && !permanentUrl) return null;
    const finalUrl = permanentUrl || url;
    const safeExtra = extra && typeof extra === 'object' ? { ...extra } : {};
    delete safeExtra.id;
    delete safeExtra.url;
    delete safeExtra.type;
    delete safeExtra.model;
    delete safeExtra.prompt;
    const entry = {
        id: `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        type,
        url: finalUrl,
        model,
        prompt,
        ...safeExtra,
        mirrored_to_tos: !!permanentUrl,
        created_at: new Date().toISOString(),
    };
    const key = `gallery/${userId}/entries/${entry.id}.json`;
    const result = await tosUpload(key, Buffer.from(JSON.stringify(entry)), 'application/json');
    if (!result) return null;
    const host = `${TOS_BUCKET}.${TOS_ENDPOINT}`;
    await appendToIndex(host, userId, entry);
    return entry;
}

export function isTosGalleryEnabled() {
    return TOS_ENABLED;
}
