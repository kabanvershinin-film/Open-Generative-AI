import { NextResponse } from 'next/server';

const ELSPI_BASE_URL = 'https://api.lk888.ai';

export async function GET(request) {
  try {
    const apiKey = process.env.ELSPY_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'ELSPY_API_KEY not configured' }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get('taskId');

    if (!taskId) {
      return NextResponse.json({ error: 'taskId required' }, { status: 400 });
    }

    const response = await fetch(`${ELSPI_BASE_URL}/v1/media/status?task_id=${encodeURIComponent(taskId)}`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ElSpy status error:', response.status, errorText);
      return NextResponse.json({ error: `ElSpy API error: ${response.status}` }, { status: response.status });
    }

    const result = await response.json();
    return NextResponse.json(result);
  } catch (error) {
    console.error('ElSpy status route error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
