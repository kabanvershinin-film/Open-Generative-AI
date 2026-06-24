import { createHmac, createHash } from 'crypto';

const TOS_ENDPOINT = process.env.TOS_ENDPOINT || '';
const TOS_BUCKET = process.env.TOS_BUCKET || '';
const TOS_REGION = process.env.TOS_REGION || 'cn-beijing';
const TOS_AK = process.env.TOS_ACCESS_KEY || '';
const TOS_SK = process.env.TOS_SECRET_KEY || '';
const TOS_ENABLED = !!(TOS_ENDPOINT && TOS_BUCKET && TOS_AK && TOS_SK);
const EMPTY_SHA256 = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';

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
    const canonHeaders = `host:${host}\nx-tos-content-sha256:${EMPTY_SHA256}\nx-tos-date:${datetime}\n`;
    const signedHeaders = 'host;x-tos-content-sha256;x-tos-date';
    const canonical = `GET\n${path}\n\n${canonHeaders}\n${signedHeaders}\n${EMPTY_SHA256}`;
    const scope = `${date}/${TOS_REGION}/tos/request`;
    const strToSign = `TOS4-HMAC-SHA256\n${datetime}\n${scope}\n${sha256hex(canonical)}`;
    const sig = createHmac('sha256', tosSigningKey(date)).update(strToSign).digest('hex');
    const auth = `TOS4-HMAC-SHA256 Credential=${TOS_AK}/${scope}, SignedHeaders=${signedHeaders}, Signature=${sig}`;
    const r = await fetch(`https://${host}${path}`, {
        headers: {
            Authorization: auth,
            'X-Tos-Content-Sha256': EMPTY_SHA256,
            'X-Tos-Date': datetime,
        },
    });
    if (!r.ok) return null;
    return r.json();
}

function buildTasksKey(userId) {
    return `pending/${userId}/tasks.json`;
}

function nowIso() {
    return new Date().toISOString();
}

export function normalizePendingTask(input = {}) {
    const status = input.status || 'running';
    const meta = input.meta && typeof input.meta === 'object' ? input.meta : {};
    return {
        id: String(input.id || input.task_id || input.request_id || `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`),
        studio: input.studio || 'video',
        type: input.type || 'video',
        provider: input.provider || 'unknown',
        model: input.model || '',
        prompt: input.prompt || '',
        status,
        request_id: input.request_id || null,
        task_id: input.task_id || null,
        bill: input.bill || null,
        entry: input.entry && typeof input.entry === 'object' ? input.entry : null,
        error: input.error || null,
        meta,
        created_at: input.created_at || nowIso(),
        updated_at: nowIso(),
    };
}

export function mergePendingTasks(tasks, nextTask) {
    const normalized = normalizePendingTask(nextTask);
    const list = Array.isArray(tasks) ? [...tasks] : [];
    const index = list.findIndex((item) => item?.id === normalized.id);
    if (index === -1) list.unshift(normalized);
    else list[index] = { ...list[index], ...normalized, meta: { ...(list[index]?.meta || {}), ...(normalized.meta || {}) } };
    return list
        .filter(Boolean)
        .sort((a, b) => new Date(b.updated_at || 0) - new Date(a.updated_at || 0))
        .slice(0, 500);
}

async function readTasks(userId) {
    if (!TOS_ENABLED || !userId) return [];
    const host = `${TOS_BUCKET}.${TOS_ENDPOINT}`;
    const key = buildTasksKey(userId);
    try {
        const direct = await fetch(`https://${host}/${key}`);
        if (direct.ok) {
            const data = await direct.json().catch(() => []);
            return Array.isArray(data) ? data : [];
        }
        const signed = await tosGetSignedJson(host, key);
        return Array.isArray(signed) ? signed : [];
    } catch {
        return [];
    }
}

async function writeTasks(userId, tasks) {
    const key = buildTasksKey(userId);
    return tosUpload(key, Buffer.from(JSON.stringify(tasks)), 'application/json');
}

export async function listPendingTasks(userId, { studio, statuses } = {}) {
    const tasks = await readTasks(userId);
    const statusSet = Array.isArray(statuses) && statuses.length > 0 ? new Set(statuses) : null;
    return tasks.filter((task) => {
        if (!task) return false;
        if (studio && task.studio !== studio) return false;
        if (statusSet && !statusSet.has(task.status)) return false;
        return true;
    });
}

export async function upsertPendingTask(userId, taskInput) {
    if (!TOS_ENABLED || !userId) return null;
    const task = normalizePendingTask(taskInput);
    for (let attempt = 0; attempt < 6; attempt += 1) {
        const current = await readTasks(userId);
        const next = mergePendingTasks(current, task);
        const ok = await writeTasks(userId, next);
        if (!ok) continue;
        const verify = await readTasks(userId);
        const saved = verify.find((item) => item?.id === task.id);
        if (saved && saved.updated_at === next.find((item) => item.id === task.id)?.updated_at) {
            return saved;
        }
        await new Promise((resolve) => setTimeout(resolve, 60 + Math.floor(Math.random() * 120)));
    }
    return null;
}

export async function removePendingTask(userId, taskId) {
    if (!TOS_ENABLED || !userId || !taskId) return false;
    for (let attempt = 0; attempt < 6; attempt += 1) {
        const current = await readTasks(userId);
        const next = current.filter((task) => task?.id !== taskId);
        const ok = await writeTasks(userId, next);
        if (!ok) continue;
        const verify = await readTasks(userId);
        if (!verify.some((task) => task?.id === taskId)) return true;
        await new Promise((resolve) => setTimeout(resolve, 60 + Math.floor(Math.random() * 120)));
    }
    return false;
}

export function isTosPendingEnabled() {
    return TOS_ENABLED;
}
