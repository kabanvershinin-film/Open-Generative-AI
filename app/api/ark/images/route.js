import { NextResponse } from 'next/server';

import { BILLING_ENABLED, refundBalanceRpc, spendBalance } from '../../_lib/balance';
import { priceRub } from '../../_lib/pricing';
import { buildImageChargeMeta } from '../../mf/helpers.js';
import { buildArkImagePayload, extractArkImageError } from './route.helpers.js';

const ARK_BASE = 'https://ark.cn-beijing.volces.com/api/v3';
const ARK_API_KEY = process.env.ARK_API_KEY || '';

export async function POST(request) {
  if (!ARK_API_KEY) {
    return NextResponse.json({ error: 'ARK_API_KEY not configured' }, { status: 503 });
  }

  const body = await request.json().catch(() => null);
  const payload = buildArkImagePayload(body || {});
  if (!payload.model) {
    return NextResponse.json({ error: 'Missing model' }, { status: 400 });
  }

  let charged = { ok: true, free: !BILLING_ENABLED };
  const imagePriceRub = await priceRub('image', payload.model, {});
  if (BILLING_ENABLED) {
    charged = await spendBalance(
      request,
      imagePriceRub,
      payload.model,
      buildImageChargeMeta(['v3', 'images', 'generations'], payload.model, null),
    );

    if (!charged?.ok) {
      if (charged.error === 'unauthorized') {
        return NextResponse.json(
          { error: 'Войдите в аккаунт, чтобы генерировать.' },
          { status: 401 },
        );
      }
      if (charged.error === 'insufficient') {
        return NextResponse.json(
          {
            error: 'Недостаточно средств.',
            required: charged.required ?? imagePriceRub,
            balance: charged.balance ?? 0,
          },
          { status: 402 },
        );
      }
      return NextResponse.json(
        { error: charged.error || 'Не удалось списать средства.' },
        { status: 500 },
      );
    }
  }

  try {
    const upstream = await fetch(`${ARK_BASE}/images/generations`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${ARK_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    const data = await upstream.json().catch(() => ({}));

    if (!upstream.ok) {
      if (charged?.ok && !charged?.free) {
        await refundBalanceRpc(request, imagePriceRub, payload.model);
      }
      return NextResponse.json(
        { error: extractArkImageError(data, upstream.status) },
        { status: upstream.status },
      );
    }

    return NextResponse.json(data, { status: upstream.status });
  } catch (error) {
    if (charged?.ok && !charged?.free) {
      await refundBalanceRpc(request, imagePriceRub, payload.model);
    }
    return NextResponse.json(
      { error: error?.message || 'Ark image proxy failed' },
      { status: 502 },
    );
  }
}
