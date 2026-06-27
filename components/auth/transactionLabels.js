export function txnLabel(t) {
    const r = t?.reason || '';

    if (r === 'admin_topup') return 'Пополнение (админ)';
    if (r === 'topup' || r === 'payment') return 'Пополнение';
    if (/^refund_seedance_prompt_/i.test(r)) return 'Возврат · Создание промта';
    if (/^seedance_prompt_/i.test(r)) return 'Списание · Создание промта';
    if (/^Возврат/i.test(r)) return r;

    const model = t?.meta?.model || r;
    return model ? `Генерация · ${model}` : 'Операция';
}
