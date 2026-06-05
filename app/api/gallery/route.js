import { NextResponse } from 'next/server';
import { createHmac, createHash } from 'crypto';
import { getUser } from '../_lib/balance';

// Allow time to download the generated video from the CDN and re-upload to TOS.
export const maxDuration = 60;

const TOS_ENDPOINT = process.env.TOS_ENDPOINT || '';
const TOS_BUCKET   = process.env.TOS_BUCKET   || '';
const TOS_REGION   = process.env.TOS_REGION   || 'cn-beijing';
const TOS_AK       = process.env.TOS_ACCESS_KEY || '';
const TOS_SK       = process.env.TOS_SECRET_KEY || '';
const TOS_READ_ENABLED = !!(TOS_ENDPOINT && TOS_BUCKET);
const TOS_ENABLED  = !!(TOS_ENDPOINT && TOS_BUCKET && TOS_AK && TOS_SK);

const EMPTY_SHA256 = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';

function logStep(step, data) {
    try {
        console.log(`[gallery ${new Date().toISOString()}] ${step}`,
            data !== undefined ? JSON.stringify(data) : '');
    } catch {
        console.log(`[gallery ${new Date().toISOString()}] ${step}`);
    }
}

function sha256hex(data) { return createHash('sha256').update(data).digest('hex'); }
function hmac(key, data) { return createHmac('sha256', key).update(data).digest(); }

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
                'Authorization': auth, 'Content-Type': contentType,
                'Content-Length': String(buffer.length),
                'X-Tos-Content-Sha256': payloadHash, 'X-Tos-Date': datetime,
            },
            body: buffer,
        });
        if (!res.ok) {
            logStep('tosUpload failed', { key, status: res.status, body: (await res.text().catch(() => '')).slice(0, 200) });
            return null;
        }
        return `https://${host}${path}`;
    } catch (e) {
        logStep('tosUpload error', { key, message: e.message });
        return null;
    }
}

async function tosDelete(key) {
    if (!TOS_ENABLED) return false;
    try {
        const { date, datetime } = tosDateParts();
        const host = `${TOS_BUCKET}.${TOS_ENDPOINT}`;
        const path = `/${key}`;
        const canonHeaders = `host:${host}\nx-tos-content-sha256:${EMPTY_SHA256}\nx-tos-date:${datetime}\n`;
        const signedHeaders = 'host;x-tos-content-sha256;x-tos-date';
        const canonical = `DELETE\n${path}\n\n${canonHeaders}\n${signedHeaders}\n${EMPTY_SHA256}`;
        const scope = `${date}/${TOS_REGION}/tos/request`;
        const strToSign = `TOS4-HMAC-SHA256\n${datetime}\n${scope}\n${sha256hex(canonical)}`;
        const sig = createHmac('sha256', tosSigningKey(date)).update(strToSign).digest('hex');
        const auth = `TOS4-HMAC-SHA256 Credential=${TOS_AK}/${scope}, SignedHeaders=${signedHeaders}, Signature=${sig}`;
        const res = await fetch(`https://${host}${path}`, {
            method: 'DELETE',
            headers: { 'Authorization': auth, 'X-Tos-Content-Sha256': EMPTY_SHA256, 'X-Tos-Date': datetime },
        });
        return res.ok || res.status === 404;
    } catch (e) {
        logStep('tosDelete error', { key, message: e.message });
        return false;
    }
}

// Signed ListObjectsV2 by prefix. Returns matching object keys (max 1000).
async function tosList(prefix) {
    if (!TOS_ENABLED) return [];
    try {
        const { date, datetime } = tosDateParts();
        const host = `${TOS_BUCKET}.${TOS_ENDPOINT}`;
        const params = { 'list-type': '2', 'max-keys': '1000', 'prefix': prefix };
        const query = Object.keys(params).sort()
            .map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(params[k])}`).join('&');
        const canonHeaders = `host:${host}\nx-tos-content-sha256:${EMPTY_SHA256}\nx-tos-date:${datetime}\n`;
        const signedHeaders = 'host;x-tos-content-sha256;x-tos-date';
        const canonical = `GET\n/\n${query}\n${canonHeaders}\n${signedHeaders}\n${EMPTY_SHA256}`;
        const scope = `${date}/${TOS_REGION}/tos/request`;
        const strToSign = `TOS4-HMAC-SHA256\n${datetime}\n${scope}\n${sha256hex(canonical)}`;
        const sig = createHmac('sha256', tosSigningKey(date)).update(strToSign).digest('hex');
        const auth = `TOS4-HMAC-SHA256 Credential=${TOS_AK}/${scope}, SignedHeaders=${signedHeaders}, Signature=${sig}`;
        const res = await fetch(`https://${host}/?${query}`, {
            headers: { 'Authorization': auth, 'X-Tos-Content-Sha256': EMPTY_SHA256, 'X-Tos-Date': datetime },
        });
        if (!res.ok) {
            logStep('tosList failed', { prefix, status: res.status, body: (await res.text().catch(() => '')).slice(0, 200) });
            return [];
        }
        const xml = await res.text();
        return [...xml.matchAll(/<Key>([^<]+)<\/Key>/g)].map((m) => m[1]);
    } catch (e) {
        logStep('tosList error', { prefix, message: e.message });
        return [];
    }
}

// Mirror media to TOS. Returns permanent URL on success, null on failure.
async function maybeUploadMediaToTOS(srcUrl, kind) {
    if (!srcUrl) return null;
    const tosHost = `${TOS_BUCKET}.${TOS_ENDPOINT}`;
    if (srcUrl.startsWith(`https://${tosHost}`)) return srcUrl;
    try {
        const r = await fetch(srcUrl);
        if (!r.ok) { logStep('mirror source fetch failed', { kind, status: r.status }); return null; }
        const buf = Buffer.from(await r.arrayBuffer());
        const ct = r.headers.get('content-type') || (kind === 'video' ? 'video/mp4' : kind === 'audio' ? 'audio/mpeg' : 'image/png');
        let folder = 'images', ext = 'png';
        if (kind === 'video') { folder = 'videos'; ext = ct.includes('webm') ? 'webm' : ct.includes('mov') ? 'mov' : 'mp4'; }
        else if (kind === 'audio') { folder = 'audio'; ext = ct.includes('wav') ? 'wav' : ct.includes('ogg') ? 'ogg' : 'mp3'; }
        else { ext = (ct.split('/')[1] || 'png').split('+')[0]; }
        const tosKey = `${folder}/${Date.now()}_${Math.random().toString(36).slice(2, 7)}.${ext}`;
        const uploaded = await tosUpload(tosKey, buf, ct);
        if (!uploaded) logStep('mirror upload failed', { kind, tosKey });
        return uploaded;
    } catch (e) {
        logStep('mirror error', { kind, message: e.message });
        return null;
    }
}

// Signed GET of a single object. Needed because gallery entry JSONs are stored
// with private ACL (only images/ & videos/ are covered by the bucket's public
// read policy), so an unsigned fetch returns 403 and the entry would silently
// vanish from the gallery. Signing mirrors tosList's TOS4 GET signature.
async function tosGetSignedJson(host, key) {
    if (!TOS_ENABLED) return null;
    const { date, datetime } = tosDateParts();
    const path = '/' + key.split('/').map(encodeURIComponent).join('/');
    const canonHeaders = `host:${host}\nx-tos-content-sha256:${EMPTY_SHA256}\nx-tos-date:${datetime}\n`;
    const signedHeaders = 'host;x-tos-content-sha256;x-tos-date';
    const canonical = `GET\n${path}\n\n${canonHeaders}\n${signedHeaders}\n${EMPTY_SHA256}`;
    const scope = `${date}/${TOS_REGION}/tos/request`;
    const strToSign = `TOS4-HMAC-SHA256\n${datetime}\n${scope}\n${sha256hex(canonical)}`;
    const sig = createHmac('sha256', tosSigningKey(date)).update(strToSign).digest('hex');
    const auth = `TOS4-HMAC-SHA256 Credential=${TOS_AK}/${scope}, SignedHeaders=${signedHeaders}, Signature=${sig}`;
    const r = await fetch(`https://${host}${path}`, {
        headers: { 'Authorization': auth, 'X-Tos-Content-Sha256': EMPTY_SHA256, 'X-Tos-Date': datetime },
    });
    if (!r.ok) return null;
    return r.json();
}

async function fetchEntry(host, key) {
    try {
        // Try an unsigned read first (cheap when the object is public); fall back
        // to a signed read so private gallery entries still load.
        let data = null;
        const r = await fetch(`https://${host}/${key}`);
        if (r.ok) data = await r.json();
        else data = await tosGetSignedJson(host, key);
        return data && data.id ? data : null;
    } catch {
        try { const d = await tosGetSignedJson(host, key); return d && d.id ? d : null; } catch { return null; }
    }
}

export async function GET(request) {
    try {
        const user = await getUser(request);
        if (!user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        if (!TOS_READ_ENABLED) return NextResponse.json({ entries: [] });

        const host = `${TOS_BUCKET}.${TOS_ENDPOINT}`;
        const byId = new Map();

        // NEW per-file format: list gallery/{uid}/entries/ and fetch each.
        const prefix = `gallery/${user.id}/entries/`;
        const keys = (await tosList(prefix)).filter((k) => k.endsWith('.json'));
        const fetched = await Promise.all(keys.map((k) => fetchEntry(host, k)));
        fetched.forEach((e) => { if (e) byId.set(e.id, e); });

        // MIGRATION (remove after ~1 week): merge old single entries.json.
        try {
            const legacyKey = `gallery/${user.id}/entries.json`;
            let legacy = null;
            const r = await fetch(`https://${host}/${legacyKey}`);
            if (r.ok) legacy = await r.json();
            else legacy = await tosGetSignedJson(host, legacyKey);
            if (Array.isArray(legacy)) {
                legacy.forEach((e) => { if (e?.id && !byId.has(e.id)) byId.set(e.id, e); });
            }
        } catch { /* no legacy file */ }

        let entries = [...byId.values()].sort(
            (a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0),
        );
        const type = new URL(request.url).searchParams.get('type');
        if (type) entries = entries.filter((e) => e.type === type);

        logStep('GET ok', { user: user.id, perFile: keys.length, total: entries.length });
        return NextResponse.json({ entries });
    } catch (error) {
        logStep('GET error', { message: error.message });
        return NextResponse.json({ entries: [] });
    }
}

export async function POST(request) {
    try {
        const user = await getUser(request);
        logStep('POST start', { user: user?.id || null, tosEnabled: TOS_ENABLED });
        if (!user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        if (!TOS_ENABLED) { logStep('POST aborted: TOS not enabled'); return NextResponse.json({ error: 'TOS not enabled' }, { status: 503 }); }

        const body = await request.json();
        const { url, type = 'video', model = '', prompt = '' } = body;
        logStep('POST body', { type, model, hasUrl: !!url, promptLen: (prompt || '').length });
        if (!url) return NextResponse.json({ error: 'url required' }, { status: 400 });

        const permanentUrl = await maybeUploadMediaToTOS(url, type);
        logStep('POST mirror result', { mirrored: !!permanentUrl });
        if (!permanentUrl) {
            return NextResponse.json(
                { error: 'Не удалось сохранить медиа в хранилище (зеркалирование не удалось)' },
                { status: 502 },
            );
        }

        const entry = {
            id: `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
            type, url: permanentUrl, model, prompt,
            created_at: new Date().toISOString(),
        };

        const key = `gallery/${user.id}/entries/${entry.id}.json`;
        const result = await tosUpload(key, Buffer.from(JSON.stringify(entry)), 'application/json');
        if (!result) { logStep('POST entry write failed', { key }); return NextResponse.json({ error: 'TOS upload failed' }, { status: 500 }); }

        logStep('POST ok', { id: entry.id, type });
        return NextResponse.json({ success: true, entry });
    } catch (error) {
        logStep('POST error', { message: error.message });
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
