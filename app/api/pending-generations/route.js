import { NextResponse } from 'next/server';
import { getUserForGallery } from '../_lib/balance';
import { isTosPendingEnabled, listPendingTasks, removePendingTask, upsertPendingTask } from '../_lib/tosPending';
import { saveGalleryEntry } from '../_lib/tosGallery';
import {
    applySavedPendingGalleryEntry,
    buildPendingGallerySaveInput,
    parsePendingGenerationFilters,
} from './logic';

function unauthorized() {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

export async function GET(request) {
    try {
        const user = await getUserForGallery(request);
        if (!user?.id) return unauthorized();
        if (!isTosPendingEnabled()) return NextResponse.json({ tasks: [] });
        const { studio, statuses } = parsePendingGenerationFilters(request.url);
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
        const gallerySaveInput = buildPendingGallerySaveInput(user.id, nextBody);
        if (gallerySaveInput) {
            const galleryEntry = await saveGalleryEntry(gallerySaveInput);
            const result = applySavedPendingGalleryEntry(nextBody, galleryEntry);
            savedEntry = result.savedEntry;
            Object.assign(nextBody, result.nextBody);
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
