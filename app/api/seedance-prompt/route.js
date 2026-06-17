import { NextResponse } from 'next/server';
import { BILLING_ENABLED, getUserForGallery, deduct, refund } from '../_lib/balance';
import { priceRub, ensureCnyRate } from '../_lib/pricing';

export const maxDuration = 60;

const MEMEFAST = 'https://memefast.top';

// Built-in "Seedance director" — turns a plain idea into a detailed cinematic
// Seedance 2.0 prompt. Ported verbatim from creator-club's SeedancePromptNode.
const SYSTEM_PROMPT = `Ты — профессиональный режиссёр и сценарист для нейросети Seedance 2.0.
Твоя задача — создавать детальные, кинематографические промпты для генерации видео.

Правила:
- Используй временны́е метки [0:00-0:05] для каждого действия
- Для видео >15 секунд разбивай на сегменты: === Сегмент N (x:xx-y:yy) ===
- Включай технические детали: фокусное расстояние, цветовая температура, тип освещения
- Упоминай движение камеры (панорама, наезд, облёт)
- Если есть референсы @Изображение1 и т.д. — включай их в текст промпта
- Отвечай ТОЛЬКО готовым промптом без лишних пояснений
- Отвечай на русском языке`;

// Default LLM (same as creator-club). Overridable via body.model.
const DEFAULT_MODEL = process.env.SEEDANCE_PROMPT_MODEL || 'claude-sonnet-4-6';

export async function POST(request) {
    try {
        const cookieKey = request.headers.get('cookie')?.match(/muapi_key=([^;]+)/)?.[1] || '';
        const apiKey = request.headers.get('authorization')?.replace('Bearer ', '') || cookieKey || '';
        if (!apiKey) return NextResponse.json({ error: 'Нет API-ключа' }, { status: 401 });

        const body = await request.json();
        const {
            idea = '', style = '', duration = '15 секунд',
            photoRefs = 0, videoRefs = 0, audioRefs = 0, cameraPrompt = '',
            model = DEFAULT_MODEL,
        } = body;
        if (!idea.trim()) return NextResponse.json({ error: 'Пустая идея' }, { status: 400 });

        // Billing: flat chat cost (text category). Charge before, refund on failure.
        await ensureCnyRate();
        const cost = priceRub('text', model, {});
        const user = await getUserForGallery(request);
        let billed = false;
        if (BILLING_ENABLED && user && cost > 0) {
            const charged = await deduct(user.id, cost, `seedance_prompt_${model}`, { model });
            if (!charged.ok && charged.reason === 'insufficient') {
                return NextResponse.json({ error: 'insufficient_funds', required: cost, balance: charged.balance }, { status: 402 });
            }
            billed = charged.ok;
        }

        // Build the user message (mirrors creator-club).
        const durationSec = parseInt(duration, 10) || 15;
        let userMsg = `Идея: ${idea}\nДлительность: ${durationSec} секунд`;
        if (style) userMsg += `\nСтиль: ${style}`;
        if (cameraPrompt) userMsg += `\nНастройки камеры: ${cameraPrompt}`;
        if (photoRefs > 0) userMsg += `\nИзображения: ${Array.from({ length: photoRefs }, (_, i) => `@Изображение${i + 1}`).join(', ')}`;
        if (videoRefs > 0) userMsg += `\nВидео: ${Array.from({ length: videoRefs }, (_, i) => `@Видео${i + 1}`).join(', ')}`;
        if (audioRefs > 0) userMsg += `\nАудио: ${Array.from({ length: audioRefs }, (_, i) => `@Аудио${i + 1}`).join(', ')}`;

        try {
            // Проверим, доступен ли MEMEFAST
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 секунд таймаут
            const res = await fetch(`${MEMEFAST}/v1/chat/completions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
                body: JSON.stringify({
                    model,
                    messages: [
                        { role: 'system', content: SYSTEM_PROMPT },
                        { role: 'user', content: userMsg },
                    ],
                    temperature: 0.8,
                    max_tokens: 2000,
                }),
                signal: controller.signal,
            });
            clearTimeout(timeoutId);
            
            if (!res.ok) {
                const txt = await res.text().catch(() => res.statusText);
                throw new Error(`API ${res.status}: ${txt.slice(0, 200)}`);
            }
            const json = await res.json();
            if (json?.error) throw new Error(json.error.message || 'LLM error');
            const prompt = json?.choices?.[0]?.message?.content || '';
            if (!prompt.trim()) throw new Error('Пустой ответ модели');
            return NextResponse.json({ prompt });
        } catch (e) {
            console.error('Seedance prompt error:', e);
            if (billed) await refund(user.id, cost, `refund_seedance_prompt_${model}`, { model }).catch(() => {});
            
            // Если ошибка в API (например, баланс или таймаут) — выбрасываем её, чтобы пользователь видел проблему,
            // а не получал просто повторение своего текста.
            return NextResponse.json({ error: `Ошибка LLM: ${e.message}. Попробуйте сменить модель в настройках.` }, { status: 500 });
        }
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
