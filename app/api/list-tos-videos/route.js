import { NextResponse } from 'next/server';
import { createHmac, createHash } from 'crypto';

const TOS_ENDPOINT = process.env.TOS_ENDPOINT || '';
const TOS_BUCKET   = process.env.TOS_BUCKET   || '';
const TOS_REGION   = process.env.TOS_REGION   || 'cn-beijing';
const TOS_AK       = process.env.TOS_ACCESS_KEY || '';
const TOS_SK       = process.env.TOS_SECRET_KEY || '';
const TOS_READ_ENABLED = !!(TOS_ENDPOINT && TOS_BUCKET);

function sha256hex(data) { return createHash('sha256').update(data).digest('hex'); }
function hmac(key, data) { return createHmac('sha256', key).update(data).digest(); }

function tosDateParts() {
    const iso = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
    return { date: iso.slice(0, 8), datetime: iso };
}

function tosSigningKey(date) {
    return hmac(hmac(hmac(hmac(TOS_SK, date), TOS_REGION), 'tos'), 'request');
}

const EMPTY_SHA256 = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';

async function tosList(prefix) {
    if (!TOS_READ_ENABLED) return [];
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
        if (!res.ok) return [];
        const xml = await res.text();
        const keys = [...xml.matchAll(/<Key>([^<]+)<\/Key>/g)].map((m) => m[1]);
        return keys.map((k) => `https://${host}/${k}`);
    } catch {
        return [];
    }
}

export async function GET() {
    const videos = await tosList('users/anonymous/videos/');
    const all = await tosList('');
    return NextResponse.json({ videos, all });
}
