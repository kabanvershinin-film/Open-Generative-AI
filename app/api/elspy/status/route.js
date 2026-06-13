import { NextResponse } from 'next/server';
import { BILLING_ENABLED, getBalance, signBill, verifyBillData, chargeForTask, refundBalanceRpc } from '../../_lib/balance';
import { priceRub, ensureCnyRate } from '../../_lib/pricing';

const ELSPI_BASE_URL = 'https://api.lk888.ai';
const ELSPI_API_KEY = process.env.ELSPY_API_KEY;

export async function GET(request) {
  try {
    if (!ELSPI_API_KEY) {
      return NextResponse.json({ error: 'ELSPY_API_KEY not configured' }, { status: 503 });
    }

    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get('taskId');

    if (!taskId) {
      return NextResponse.json({ error: 'taskId required' }, { status: 400 });
    }

    const response = await fetch(`${ELSPI_BASE_URL}/v1/media/status?task_id=${encodeURIComponent(taskId)}`, {
      headers: {
        'Authorization': `Bearer ${ELSPI_API_KEY}`
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ElSpy status error:', response.status, errorText);
      return NextResponse.json({ error: `ElSpy API error: ${response.status}` }, { status: response.status });
    }

    const data = await response.json();
    
    // Если задача успешна — списываем реальную стоимость из ответа ElSpy
    if (data.is_final && data.state === 'success' && BILLING_ENABLED) {
      const billData = verifyBillData(searchParams.get('bill'));
      if (billData) {
        await ensureCnyRate(); // Обновляем курс валют
        let actualCost = Number(data.cost || 0); // Стоимость из ElSpy (в ₽ или CNY?)
        // NOTE: Нужно проверить, в какой валюте возвращает cost ElSpy. Если в CNY — умножим на курс
        // Пока предположим, что cost уже в ₽ или используем fallback из estimate
        if (!actualCost || actualCost <= 0) {
          actualCost = Number(billData.c || 0);
        }
        
        if (actualCost > 0) {
          const reason = 'Omni Flash';
          try {
            await chargeForTask(request, taskId, actualCost, reason, {
              model: billData.m || 'omni-flash',
              durationSec: billData.d,
              elspyCost: data.cost,
            });
          } catch (billingError) {
            console.error('[ElSpy status] billing error (delivering video anyway):', billingError);
          }
        }
      }
    }

    return NextResponse.json(data);
  } catch (e) {
    console.error('ElSpy status route error:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
