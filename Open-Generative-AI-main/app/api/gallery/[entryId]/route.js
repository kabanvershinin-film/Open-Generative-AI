import { NextResponse } from 'next/server';
import { createHmac, createHash } from 'crypto';
import { resolveGalleryUser } from '../../_lib/gallery-user';

const TOS_ENDPOINT = process.env.TOS_ENDPOINT || '';
const TOS_BUCKET   = process.env.TOS_BUCKET   || '';
const TOS_REGION   = process.env.TOS_REGION   || 'cn-beijing';
const TOS_AK       = process.env.TOS_ACCESS_KEY || '';
const TOS_SK       = process.env.TOS_SECRET_KEY || '';
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
        if (!res.ok) { logStep('tosUpload failed', { key, status: res.status }); return null; }
        return `https://${host}${path}`;
    } catch (e) {
        logStep('tosUpload error', { key, message: e.message });
        return null;
    }
}

async function tosDeleteObj(key) {
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

export async function DELETE(request, { params }) {
    let userId = null;
    let source = 'unknown';
    try {
        const resolved = await resolveGalleryUser(request);
        userId = resolved.id;
        source = resolved.source;
        logStep('DELETE start', { userId, source });
        if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        if (!TOS_ENABLED) { logStep('DELETE aborted: TOS not enabled'); return NextResponse.json({ error: 'TOS not enabled' }, { status: 503 }); }

        const { entryId } = await params;
        const host = `${TOS_BUCKET}.${TOS_ENDPOINT}`;

        // NEW per-file format: delete the single object.
        const ok = await tosDeleteObj(`gallery/${userId}/entries/${entryId}.json`);
        logStep('DELETE per-file', { userId, source, entryId, ok });

        // MIGRATION fallback (remove after ~1 week): drop id from old entries.json too.
        try {
            const r = await fetch(`https://${host}/gallery/${userId}/entries.json`);
            if (r.ok) {
                let entries = await r.json();
                if (Array.isArray(entries) && entries.some((e) => e.id === entryId)) {
                    entries = entries.filter((e) => e.id !== entryId);
                    await tosUpload(`gallery/${userId}/entries.json`, Buffer.from(JSON.stringify(entries)), 'application/json');
                    logStep('DELETE legacy updated', { userId, entryId });
                }
            }
        } catch { /* no legacy file */ }

        return NextResponse.json({ success: true });
    } catch (error) {
        logStep('DELETE error', { userId, source, message: error.message });
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
