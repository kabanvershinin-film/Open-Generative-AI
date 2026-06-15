import { NextResponse } from 'next/server';
import { createHmac, createHash } from 'crypto';
import { getUser, isAdminUser } from '../../_lib/balance';

const TOS_ENDPOINT = process.env.TOS_ENDPOINT || '';
const TOS_BUCKET   = process.env.TOS_BUCKET   || '';
const TOS_REGION   = process.env.TOS_REGION   || 'cn-beijing';
const TOS_AK       = process.env.TOS_ACCESS_KEY || '';
const TOS_SK       = process.env.TOS_SECRET_KEY || '';
const TOS_ENABLED  = !!(TOS_ENDPOINT && TOS_BUCKET && TOS_AK && TOS_SK);

const EMPTY_SHA256 = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';

function sha256hex(data) { return createHash('sha256').update(data).digest('hex'); }
function hmac(key, data)  { return createHmac('sha256', key).update(data).digest(); }

async function tosUpload(key, buffer, contentType) {
    if (!TOS_ENABLED) return null;
    try {
        const now = new Date();
        const iso = now.toISOString().replace(/[-:]/g, '').replace(/\.\d+/g, '');
        const date = iso.slice(0, 8);
        const datetime = iso;
        const host = `${TOS_BUCKET}.${TOS_ENDPOINT}`;
        const path = `/${key}`;
        const payloadHash = sha256hex(buffer);

        const canonHeaders = `content-length:${buffer.length}\ncontent-type:${contentType}\nhost:${host}\nx-tos-content-sha256:${payloadHash}\nx-tos-date:${datetime}\n`;
        const signedHeaders = 'content-length;content-type;host;x-tos-content-sha256;x-tos-date';
        const canonical = `PUT\n${path}\n\n${canonHeaders}\n${signedHeaders}\n${payloadHash}`;

        const scope = `${date}/${TOS_REGION}/tos/request`;
        const strToSign = `TOS4-HMAC-SHA256\n${datetime}\n${scope}\n${sha256hex(canonical)}`;
        const sigKey = hmac(hmac(hmac(hmac(TOS_SK, date), TOS_REGION), 'tos'), 'request');
        const sig = createHmac('sha256', sigKey).update(strToSign).digest('hex');
        const auth = `TOS4-HMAC-SHA256 Credential=${TOS_AK}/${scope}, SignedHeaders=${signedHeaders}, Signature=${sig}`;

        const res = await fetch(`https://${host}${path}`, {
            method: 'PUT',
            headers: {
                'Authorization': auth,
                'Content-Type': contentType,
                'Content-Length': String(buffer.length),
                'X-Tos-Content-Sha256': payloadHash,
                'X-Tos-Date': datetime,
            },
            body: buffer,
        });
        
        const resText = await res.text().catch(() => '');
        if (!res.ok) {
            console.error('[tosUpload] PUT failed:', res.status, resText);
            return null;
        }
        
        console.log('[tosUpload] PUT success, verifying...');
        // Verify by trying to head the object
        return `https://${host}${path}`;
    } catch (e) { 
        return null; 
    }
}

async function tosGetSignedJson(host, key) {
    const now = new Date();
    const iso = now.toISOString().replace(/[-:]/g, '').replace(/\.\d+/g, '');
    const date = iso.slice(0, 8);
    const datetime = iso;
    const path = '/' + key.split('/').map(encodeURIComponent).join('/');
    const canonHeaders = `host:${host}\nx-tos-content-sha256:${EMPTY_SHA256}\nx-tos-date:${datetime}\n`;
    const signedHeaders = 'host;x-tos-content-sha256;x-tos-date';
    const canonical = `GET\n${path}\n\n${canonHeaders}\n${signedHeaders}\n${EMPTY_SHA256}`;
    const scope = `${date}/${TOS_REGION}/tos/request`;
    const strToSign = `TOS4-HMAC-SHA256\n${datetime}\n${scope}\n${sha256hex(canonical)}`;
    const sigKey = hmac(hmac(hmac(hmac(TOS_SK, date), TOS_REGION), 'tos'), 'request');
    const sig = createHmac('sha256', sigKey).update(strToSign).digest('hex');
    const auth = `TOS4-HMAC-SHA256 Credential=${TOS_AK}/${scope}, SignedHeaders=${signedHeaders}, Signature=${sig}`;
    
    console.log('[tosGetSignedJson] Fetching:', `https://${host}${path}`);
    const r = await fetch(`https://${host}${path}`, {
        headers: { 'Authorization': auth, 'X-Tos-Content-Sha256': EMPTY_SHA256, 'X-Tos-Date': datetime },
    });
    if (!r.ok) {
        console.error('[tosGetSignedJson] Failed:', r.status, await r.text().catch(() => ''));
        return null;
    }
    return r.json();
}

async function tosList(prefix) {
    const now = new Date();
    const iso = now.toISOString().replace(/[-:]/g, '').replace(/\.\d+/g, '');
    const date = iso.slice(0, 8);
    const datetime = iso;
    const host = `${TOS_BUCKET}.${TOS_ENDPOINT}`;
    const params = { 'list-type': '2', 'max-keys': '1000', 'prefix': prefix };
    const query = Object.keys(params).sort()
        .map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(params[k])}`).join('&');
    const canonHeaders = `host:${host}\nx-tos-content-sha256:${EMPTY_SHA256}\nx-tos-date:${datetime}\n`;
    const signedHeaders = 'host;x-tos-content-sha256;x-tos-date';
    const canonical = `GET\n/\n${query}\n${canonHeaders}\n${signedHeaders}\n${EMPTY_SHA256}`;
    const scope = `${date}/${TOS_REGION}/tos/request`;
    const strToSign = `TOS4-HMAC-SHA256\n${datetime}\n${scope}\n${sha256hex(canonical)}`;
    const sigKey = hmac(hmac(hmac(hmac(TOS_SK, date), TOS_REGION), 'tos'), 'request');
    const sig = createHmac('sha256', sigKey).update(strToSign).digest('hex');
    const auth = `TOS4-HMAC-SHA256 Credential=${TOS_AK}/${scope}, SignedHeaders=${signedHeaders}, Signature=${sig}`;
    const res = await fetch(`https://${host}/?${query}`, {
        headers: { 'Authorization': auth, 'X-Tos-Content-Sha256': EMPTY_SHA256, 'X-Tos-Date': datetime },
    });
    if (!res.ok) return [];
    const xml = await res.text();
        console.log('[tosList] XML Response:', xml.slice(0, 500));
        const keys = [...xml.matchAll(/<Key>([^<]+)<\/Key>/g)].map((m) => m[1]);
        console.log('[tosList] Extracted keys:', keys);
        return keys;
}

const INDEX_KEY = 'admin_prompts/index.json';

async function readIndex() {
    if (!TOS_ENABLED) return [];
    try {
        const host = `${TOS_BUCKET}.${TOS_ENDPOINT}`;
        const data = await tosGetSignedJson(host, INDEX_KEY);
        return Array.isArray(data) ? data : [];
    } catch (e) {
        console.error('[prompts/admin] Failed to read index:', e.message);
        return [];
    }
}

async function writeIndex(data) {
    if (!TOS_ENABLED) return false;
    const buffer = Buffer.from(JSON.stringify(data));
    return !!(await tosUpload(INDEX_KEY, buffer, 'application/json'));
}

export async function GET(request) {
    try {
        if (!TOS_ENABLED) {
            return NextResponse.json({ prompts: [], error: 'Storage not configured' });
        }
        
        const prompts = await readIndex();
        console.log('[prompts/admin] Loaded from index:', prompts.length);

        return NextResponse.json({ 
            prompts: prompts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)),
            debug: {
                tos_enabled: TOS_ENABLED,
                source: 'index_file',
                count: prompts.length
            }
        });
    } catch (e) {
        console.error('[prompts/admin] GET error:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const user = await getUser(request);
        if (!isAdminUser(user)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        if (!TOS_ENABLED) return NextResponse.json({ error: 'Storage not configured' }, { status: 503 });

        const body = await request.json();
        const { videoUrl, model, prompt } = body;

        if (!videoUrl || !model || !prompt) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const id = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
        const entry = {
            id,
            url: videoUrl,
            model,
            prompt,
            created_at: new Date().toISOString()
        };

        // 1. Save individual file (optional, for backup)
        const key = `admin_prompts/entries/${id}.json`;
        await tosUpload(key, Buffer.from(JSON.stringify(entry)), 'application/json');

        // 2. Update index file (main source of truth)
        let index = await readIndex();
        index.unshift(entry);
        if (index.length > 2000) index = index.slice(0, 2000); // Limit size

        const ok = await writeIndex(index);
        if (!ok) {
            return NextResponse.json({ error: 'Failed to update index' }, { status: 500 });
        }

        return NextResponse.json({ success: true, prompt: entry });
    } catch (e) {
        console.error('[prompts/admin] POST error:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
