import { NextResponse } from 'next/server';

const ELSPI_BASE_URL = 'https://api.lk888.ai';

export async function POST(request) {
  try {
    const apiKey = process.env.ELSPY_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'ELSPY_API_KEY not configured' }, { status: 500 });
    }

    const body = await request.json();
    const { model, prompt, params } = body;

    const payload = {
      model: model || 'omni-flash',
      prompt,
      params
    };

    const response = await fetch(`${ELSPI_BASE_URL}/v1/media/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ElSpy generate error:', response.status, errorText);
      return NextResponse.json({ error: `ElSpy API error: ${response.status}` }, { status: response.status });
    }

    const result = await response.json();
    return NextResponse.json(result);
  } catch (error) {
    console.error('ElSpy generate route error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
