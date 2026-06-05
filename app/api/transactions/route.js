// List the authenticated user's balance transactions (spending history).
// Used by the cabinet modal to show "your expenses" when the balance is clicked.
import { NextResponse } from 'next/server';
import { getUserForGallery, listTransactions } from '../_lib/balance';

export async function GET(request) {
    try {
        const user = await getUserForGallery(request);
        if (!user?.id) return NextResponse.json({ transactions: [] }, { status: 401 });
        const transactions = await listTransactions(user.id, 50);
        return NextResponse.json({ transactions });
    } catch {
        return NextResponse.json({ transactions: [] });
    }
}
