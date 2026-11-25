import { prisma } from '@/lib/db';
import { signToken } from '@/lib/jwt';
import bcrypt from 'bcryptjs';

export async function POST(request) {
    const { email, password, full_name } = await request.json().catch(() => ({}));
    if (!email || !password) return Response.json({ error: 'email и password обязательны' }, { status: 400 });
    if (password.length < 6) return Response.json({ error: 'Пароль минимум 6 символов' }, { status: 400 });

    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
    if (existing) return Response.json({ error: 'Пользователь с таким email уже существует' }, { status: 409 });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
        data: { email: email.toLowerCase().trim(), passwordHash, fullName: full_name || null },
    });

    // Starter credits
    await prisma.creditLedger.create({
        data: { userId: user.id, type: 'credit', amount: 50, description: 'Стартовые кредиты' },
    });

    const token = await signToken({ sub: user.id, email: user.email });
    return Response.json({
        token,
        user: { id: user.id, email: user.email, full_name: user.fullName },
    }, { status: 201 });
}
