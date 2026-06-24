import { NextResponse } from 'next/server';
import { getUserForGallery } from '../_lib/balance';
import { isTosPendingEnabled, listPendingTasks, removePendingTask, upsertPendingTask } from '../_lib/tosPending';
import { saveGalleryEntry } from '../_lib/tosGallery';

function unauthorized() {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

export async function GET(request) {
    try {
        const user = await getUserForGallery(request);
        if (!user?.id) return unauthorized();
        if (!isTosPendingEnabled()) return NextResponse.json({ tasks: [] });
        const { searchParams } = new URL(request.url);
        const studio = searchParams.get('studio') || undefined;
        const statuses = (searchParams.get('statuses') || '')
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean);
        const tasks = await listPendingTasks(user.id, { studio, statuses });
        return NextResponse.json({ tasks });
    } catch (error) {
        return NextResponse.json({ error: error.message || 'Не удалось получить задачи' }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const user = await getUserForGallery(request);
        if (!user?.id) return unauthorized();
        if (!isTosPendingEnabled()) return NextResponse.json({ error: 'TOS not enabled' }, { status: 503 });
        const body = await request.json().catch(() => ({}));
        const task = await upsertPendingTask(user.id, body || {});
        if (!task) return NextResponse.json({ error: 'Не удалось сохранить задачу' }, { status: 500 });
        return NextResponse.json({ task });
    } catch (error) {
        return NextResponse.json({ error: error.message || 'Не удалось создать задачу' }, { status: 500 });
    }
}

export async function PATCH(request) {
    try {
        const user = await getUserForGallery(request);
        if (!user?.id) return unauthorized();
        if (!isTosPendingEnabled()) return NextResponse.json({ error: 'TOS not enabled' }, { status: 503 });
        const body = await request.json().catch(() => ({}));
        const nextBody = { ...(body || {}) };
        let savedEntry = null;
        if (nextBody.status === 'completed' && nextBody.entry?.url) {
            const galleryEntry = await saveGalleryEntry({
                userId: user.id,
                url: nextBody.entry.url,
                type: nextBody.entry.type || nextBody.type || 'video',
                model: nextBody.entry.model || nextBody.model || '',
                prompt: nextBody.entry.prompt || nextBody.prompt || '',
            });
            if (galleryEntry) {
                savedEntry = galleryEntry;
                nextBody.entry = {
                    ...nextBody.entry,
                    id: nextBody.entry.id || galleryEntry.id,
                    url: galleryEntry.url,
                    created_at: galleryEntry.created_at,
                };
            }
        }
        const task = await upsertPendingTask(user.id, nextBody);
        if (!task) return NextResponse.json({ error: 'Не удалось обновить задачу' }, { status: 500 });
        return NextResponse.json({ task, entry: savedEntry });
    } catch (error) {
        return NextResponse.json({ error: error.message || 'Не удалось обновить задачу' }, { status: 500 });
    }
}

export async function DELETE(request) {
    try {
        const user = await getUserForGallery(request);
        if (!user?.id) return unauthorized();
        if (!isTosPendingEnabled()) return NextResponse.json({ error: 'TOS not enabled' }, { status: 503 });
        const { searchParams } = new URL(request.url);
        const taskId = searchParams.get('id');
        if (!taskId) return NextResponse.json({ error: 'id required' }, { status: 400 });
        const removed = await removePendingTask(user.id, taskId);
        return NextResponse.json({ success: removed });
    } catch (error) {
        return NextResponse.json({ error: error.message || 'Не удалось удалить задачу' }, { status: 500 });
    }
}
