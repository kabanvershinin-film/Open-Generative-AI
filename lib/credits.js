// Credits ledger helpers — all mutations go through here.
// Never update or delete ledger rows; only insert.
import { prisma } from '@/lib/db';

export async function getBalance(_, userId) {
    const rows = await prisma.creditLedger.findMany({ where: { userId } });
    return rows.reduce((sum, row) => {
        if (['credit', 'refund'].includes(row.type)) return sum + row.amount;
        if (['charge', 'capture'].includes(row.type)) return sum - row.amount;
        return sum;
    }, 0);
}

export async function addCredits(_, userId, amount, description = '') {
    await prisma.creditLedger.create({ data: { userId, type: 'credit', amount, description } });
}

export async function chargeCredits(_, userId, amount, description = '', generationId = null) {
    const balance = await getBalance(null, userId);
    if (balance < amount) throw new Error('Недостаточно кредитов');
    await prisma.creditLedger.create({ data: { userId, type: 'charge', amount, description, generationId } });
}

export async function reserveCredits(_, userId, amount, description = '') {
    const balance = await getBalance(null, userId);
    if (balance < amount) throw new Error('Недостаточно кредитов для резервирования');
    const row = await prisma.creditLedger.create({ data: { userId, type: 'reserve', amount, description } });
    return row.id;
}

export async function captureReserve(_, userId, reserveId, actualAmount, description = '') {
    const reserve = await prisma.creditLedger.findUnique({ where: { id: reserveId } });
    if (!reserve) throw new Error('Reserve not found');
    await prisma.creditLedger.createMany({ data: [
        { userId, type: 'refund', amount: reserve.amount, description: 'Снятие резерва' },
        { userId, type: 'capture', amount: actualAmount, description, generationId: reserveId },
    ]});
}

export async function refundCredits(_, userId, reserveId, description = 'Возврат') {
    const reserve = await prisma.creditLedger.findUnique({ where: { id: reserveId } });
    if (!reserve || reserve.type !== 'reserve') throw new Error('Reserve not found');
    await prisma.creditLedger.create({ data: { userId, type: 'refund', amount: reserve.amount, description } });
}
