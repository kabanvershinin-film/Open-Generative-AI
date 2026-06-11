import { NextResponse } from 'next/server';
import { priceRub, ensureCnyRate, CNY_TO_RUB, PLATFORM_MARKUP } from '../_lib/pricing';

export async function POST(request) {
    try {
        const body = await request.json();
        const { category, model, params = {} } = body;

        await ensureCnyRate();
        // Don't multiply by 2 for generate_audio in the estimate, since real usage is usually lower
        const cost = priceRub(category, model, { ...params, generate_audio: false });

        console.log('[calculate-price]', { category, model, params, cost, CNY_TO_RUB, PLATFORM_MARKUP });

        return NextResponse.json({ cost, debug: { category, model, params, CNY_TO_RUB, PLATFORM_MARKUP } });
    } catch (e) {
        console.error('Error calculating price:', e);
        return NextResponse.json({ error: 'Failed to calculate price' }, { status: 500 });
    }
}
