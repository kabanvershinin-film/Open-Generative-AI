import { verifyToken } from '@/lib/jwt';
import { prisma } from '@/lib/db';
import { isAdminEmail } from '@/lib/admin';

// Prisma is the new "admin client" — kept for backward compat with API routes
export function getAdminClient() { return prisma; }
export function getAnonClient() { return prisma; }

export async function requireAuth(request) {
    const auth = request.headers.get('authorization') || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
    if (!token) return { user: null, error: 'Unauthorized' };
    const payload = await verifyToken(token);
    if (!payload?.sub) return { user: null, error: 'Invalid session' };
    const user = await prisma.user.findUnique({ where: { id: String(payload.sub) } });
    if (!user) return { user: null, error: 'User not found' };
    return { user: { id: user.id, email: user.email }, error: null };
}

export async function requireAdmin(request) {
    const { user, error } = await requireAuth(request);
    if (error || !user) return { user: null, error: error || 'Unauthorized' };
    if (!isAdminEmail(user.email)) return { user: null, error: 'Forbidden' };
    return { user, error: null };
}

export async function getUserCredits(_, userId) {
    const rows = await prisma.creditLedger.findMany({ where: { userId } });
    return rows.reduce((sum, row) => {
        if (['credit', 'refund'].includes(row.type)) return sum + row.amount;
        if (['charge', 'capture'].includes(row.type)) return sum - row.amount;
        return sum;
    }, 0);
}
