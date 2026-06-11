import { NextResponse } from 'next/server';
import { priceRub, ensureCnyRate } from '../_lib/pricing';

export async function POST(request) {
    try {
        const body = await request.json();
        const { category, model, params = {} } = body;
        
        await ensureCnyRate();
        const cost = priceRub(category, model, params);
        
        return NextResponse.json({ cost });
    } catch (e) {
        console.error('Error calculating price:', e);
        return NextResponse.json({ error: 'Failed to calculate price' }, { status: 500 });
    }
}
