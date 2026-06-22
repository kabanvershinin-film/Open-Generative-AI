export async function getUserBalance(apiKey) {
    const response = await fetch('/api/user/balance', {
        headers: { 'Authorization': `Bearer ${apiKey}` },
    });
    const data = await response.json().catch(() => ({ balance: 0 }));
    return data.balance ?? 0;
}
