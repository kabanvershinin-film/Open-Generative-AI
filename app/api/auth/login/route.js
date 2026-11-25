import { prisma } from '@/lib/db';
import { signToken } from '@/lib/jwt';
import bcrypt from 'bcryptjs';

export async function POST(request) {
    const { email, password } = await request.json().catch(() => ({}));
    if (!email || !password) return Response.json({ error: 'email и password обязательны' }, { status: 400 });

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
    if (!user || !user.passwordHash) return Response.json({ error: 'Неверный email или пароль' }, { status: 401 });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return Response.json({ error: 'Неверный email или пароль' }, { status: 401 });

    const token = await signToken({ sub: user.id, email: user.email });
    return Response.json({
        token,
        user: { id: user.id, email: user.email, full_name: user.fullName },
    });
}
