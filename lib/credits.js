// Credits ledger helpers — all mutations go through here.
// Never update or delete ledger rows; only insert.

export async function getBalance(adminClient, userId) {
    const { data } = await adminClient
        .from('credit_ledger')
        .select('amount, type')
        .eq('user_id', userId);
    if (!data) return 0;
    return data.reduce((sum, row) => {
        if (['credit', 'refund'].includes(row.type)) return sum + Number(row.amount);
        if (['charge', 'capture'].includes(row.type)) return sum - Number(row.amount);
        return sum;
    }, 0);
}

export async function addCredits(adminClient, userId, amount, description = '') {
    const { error } = await adminClient.from('credit_ledger').insert({
        user_id: userId, type: 'credit', amount, description,
    });
    if (error) throw new Error(error.message);
}

export async function chargeCredits(adminClient, userId, amount, description = '', generationId = null) {
    const balance = await getBalance(adminClient, userId);
    if (balance < amount) throw new Error('Недостаточно кредитов');
    const { error } = await adminClient.from('credit_ledger').insert({
        user_id: userId, type: 'charge', amount, description, generation_id: generationId,
    });
    if (error) throw new Error(error.message);
}

export async function reserveCredits(adminClient, userId, amount, description = '') {
    const balance = await getBalance(adminClient, userId);
    if (balance < amount) throw new Error('Недостаточно кредитов для резервирования');
    const { data, error } = await adminClient.from('credit_ledger').insert({
        user_id: userId, type: 'reserve', amount, description,
    }).select().single();
    if (error) throw new Error(error.message);
    return data.id;
}

export async function captureReserve(adminClient, userId, reserveId, actualAmount, description = '') {
    // Refund the reserve, then charge the actual amount
    const { data: reserve } = await adminClient
        .from('credit_ledger').select('amount').eq('id', reserveId).single();
    if (!reserve) throw new Error('Reserve not found');
    await adminClient.from('credit_ledger').insert([
        { user_id: userId, type: 'refund', amount: reserve.amount, description: 'Снятие резерва' },
        { user_id: userId, type: 'capture', amount: actualAmount, description, generation_id: reserveId },
    ]);
}

export async function refundCredits(adminClient, userId, reserveId, description = 'Возврат') {
    const { data: reserve } = await adminClient
        .from('credit_ledger').select('amount, type').eq('id', reserveId).single();
    if (!reserve || reserve.type !== 'reserve') throw new Error('Reserve not found');
    await adminClient.from('credit_ledger').insert({
        user_id: userId, type: 'refund', amount: reserve.amount, description,
    });
}
