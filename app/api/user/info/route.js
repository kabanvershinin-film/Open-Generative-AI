import { NextResponse } from 'next/server';
import { getUser, isAdminUser } from '../../_lib/balance';

export async function GET(request) {
    try {
        const user = await getUser(request);
        if (!user) {
            return NextResponse.json({ authenticated: false });
        }
        return NextResponse.json({
            authenticated: true,
            email: user.email,
            isAdmin: isAdminUser(user),
            id: user.id
        });
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
