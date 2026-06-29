import { NextResponse } from 'next/server';
import { createHmac, createHash } from 'crypto';
import { getUserForGallery } from '../_lib/balance';
import { buildUserMediaKey, buildUserTosRoot } from '../_lib/tosPaths';
import { listPendingTasks } from '../_lib/tosPending';
import { paginateGalleryEntries } from './pagination.js';
import { saveGalleryEntry } from '../_lib/tosGallery';
import {
    buildGalleryEntriesFromCompletedTasks,
    buildGalleryEntriesFromTosMediaUrls,
    mergeGalleryEntriesWithFallback,
} from './sourceMerge.js';

// Allow time to download the generated video from the CDN and re-upload to TOS.
// Videos cross two regions (ARK CDN in China → Vercel → TOS in China), so 60s was
// too tight and the save 504'd; match the workflow route's 5-minute ceiling.
export const maxDuration = 300;

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

function normalizeTosMediaUrl(url, tosHost = `${TOS_BUCKET}.${TOS_ENDPOINT}`) {
    if (!url || !tosHost) return url;
    try {
        const parsed = new URL(url);
        if (parsed.protocol !== 'https:' || parsed.host !== tosHost) return url;
        return `https://${parsed.host}${parsed.pathname}`;
    } catch {
        return url;
    }
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
async function maybeUploadMediaToTOS(srcUrl, kind, userId = null) {
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
        const tosKey = buildUserMediaKey(userId, folder, ext);
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

// Append an entry to the per-user index file gallery/{uid}/entries.json.
// The gallery read lists per-file entries with tosList (ListObjectsV2), but some
// TOS access keys lack the ListObjects permission — then writes succeed yet the
// listing returns nothing and nothing shows. A single index file is read with a
// direct (signed) GetObject, which does work, so maintaining it makes the gallery
// independent of ListObjects. Read-modify-write; dedupes by id and url.
async function appendToIndex(host, userId, entry) {
    if (!TOS_ENABLED || !userId || !entry) return;
    const key = `gallery/${userId}/entries.json`;
    const readList = async () => {
        try {
            const r = await fetch(`https://${host}/${key}`);
            if (r.ok) return await r.json().catch(() => null);
            return await tosGetSignedJson(host, key);
        } catch { return null; }
    };
    // Read-modify-write with verify+retry. The index is a single shared file, so
    // two generations finishing close together would otherwise overwrite each
    // other (the "saved then vanished" bug). TOS is read-after-write consistent,
    // so re-reading after the write reliably tells us whether our entry stuck;
    // if a concurrent writer clobbered it we retry (with jitter) until it does.
    for (let attempt = 0; attempt < 6; attempt++) {
        let list = await readList();
        if (!Array.isArray(list)) list = [];
        if (list.some((e) => e && (e.id === entry.id || e.url === entry.url))) return; // already saved
        let next = [entry, ...list];
        if (next.length > 1000) next = next.slice(0, 1000);
        const ok = await tosUpload(key, Buffer.from(JSON.stringify(next)), 'application/json');
        if (ok) {
            const check = await readList();
            if (Array.isArray(check) && check.some((e) => e && e.id === entry.id)) return; // survived
        }
        await new Promise((r) => setTimeout(r, 70 + Math.floor(Math.random() * 130)));
    }
    logStep('appendToIndex gave up (contention)', { userId });
}

export async function GET(request) {
    try {
        const user = await getUserForGallery(request);
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

        const completedTasks = await listPendingTasks(user.id, { statuses: ['completed'] }).catch(() => []);
        const fallbackEntries = buildGalleryEntriesFromCompletedTasks(
            completedTasks,
            (value) => normalizeTosMediaUrl(value),
        );
        const fallbackTosVideoEntries = buildGalleryEntriesFromTosMediaUrls(
            await tosList(`${buildUserTosRoot(user.id)}/videos/`),
            (value) => normalizeTosMediaUrl(value),
        );

        let entries = mergeGalleryEntriesWithFallback(
            mergeGalleryEntriesWithFallback([...byId.values()], fallbackEntries),
            fallbackTosVideoEntries,
        ).sort(
            (a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0),
        );
        entries = entries.map((e) => ({ ...e, url: normalizeTosMediaUrl(e?.url) }));
        // Collapse entries that point at the same media url (the client POST and
        // the server-side save can each persist the same image under different
        // ids) — keep the newest, which is already first after the sort above.
        const seenUrl = new Set();
        const seenDedupeKey = new Set();
        entries = entries.filter((e) => {
            if (!e?.url) return true;
            if (e.dedupe_key) {
                if (seenDedupeKey.has(e.dedupe_key)) return false;
                seenDedupeKey.add(e.dedupe_key);
            }
            if (seenUrl.has(e.url)) return false;
            seenUrl.add(e.url);
            return true;
        });
        const page = paginateGalleryEntries(entries, new URL(request.url).searchParams);

        logStep('GET ok', { user: user.id, perFile: keys.length, total: page.total, cursor: page.cursor, limit: page.limit, returned: page.entries.length });
        return NextResponse.json(
            { entries: page.entries, nextCursor: page.nextCursor, total: page.total, limit: page.limit },
            {
                headers: {
                    'Cache-Control': 'private, max-age=30, stale-while-revalidate=120',
                    'CDN-Cache-Control': 'private, max-age=30',
                },
            },
        );
    } catch (error) {
        logStep('GET error', { message: error.message });
        return NextResponse.json({ entries: [] });
    }
}

export async function POST(request) {
    try {
        const user = await getUserForGallery(request);
        logStep('POST start', { user: user?.id || null, tosEnabled: TOS_ENABLED });
        if (!user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        if (!TOS_ENABLED) { logStep('POST aborted: TOS not enabled'); return NextResponse.json({ error: 'TOS not enabled' }, { status: 503 }); }

        const body = await request.json();
        const { url, type = 'video', model = '', prompt = '', ...extra } = body;
        logStep('POST body', { type, model, hasUrl: !!url, promptLen: (prompt || '').length });
        if (!url) return NextResponse.json({ error: 'url required' }, { status: 400 });
        const entry = await saveGalleryEntry({ userId: user.id, url, type, model, prompt, extra });
        if (!entry) {
            logStep('POST entry write failed', { type, model });
            return NextResponse.json({ error: 'TOS upload failed' }, { status: 500 });
        }

        logStep('POST ok', { id: entry.id, type });
        return NextResponse.json({ success: true, entry });
    } catch (error) {
        logStep('POST error', { message: error.message });
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
