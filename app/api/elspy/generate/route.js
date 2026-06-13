import { NextResponse } from 'next/server';
import { BILLING_ENABLED, getBalance, signBill, verifyBillData, chargeForTask, refundBalanceRpc } from '../../_lib/balance';
import { priceRub, ensureCnyRate } from '../../_lib/pricing';

const ELSPI_BASE_URL = 'https://api.lk888.ai';
const ELSPI_API_KEY = process.env.ELSPY_API_KEY;

export async function POST(request) {
  if (!ELSPI_API_KEY) {
    return NextResponse.json({ error: 'ELSPY_API_KEY not configured' }, { status: 503 });
  }
  try {
    const body = await request.json();
    const { model, prompt, params } = body;

    // Сначала рассчитаем примерную стоимость для проверки баланса
    await ensureCnyRate();
    const cost = await priceRub('video', 'omni-flash', { duration: params?.duration });
    let bill = '';
    if (BILLING_ENABLED && cost > 0) {
      const balance = await getBalance(request);
      if (balance === null) {
        return NextResponse.json({ error: 'Войдите в аккаунт, чтобы генерировать.' }, { status: 401 });
      }
      if (balance < cost) {
        return NextResponse.json({ error: 'insufficient_funds', required: cost, balance }, { status: 402 });
      }
      // Подпишем примерную стоимость как fallback, потом при успехе спишем реальную
      bill = signBill(cost, { m: 'omni-flash', d: params?.duration });
    }

    // Отправляем запрос к ElSpy
    const payload = {
      model: model || 'omni-flash',
      prompt,
      params
    };

    const response = await fetch(`${ELSPI_BASE_URL}/v1/media/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ELSPI_API_KEY}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ElSpy generate error:', response.status, errorText);
      return NextResponse.json({ error: `ElSpy API error: ${response.status}` }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json({ ...data, bill });
  } catch (e) {
    console.error('ElSpy generate route error:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
