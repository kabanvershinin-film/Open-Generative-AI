import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { uploadUrl, partData, partNumber } = await request.json();
    if (!uploadUrl || !partData) {
      return NextResponse.json({ error: 'uploadUrl и partData обязательны' }, { status: 400 });
    }

    // Decode base64 partData
    const binaryString = atob(partData);
    const uint8Array = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      uint8Array[i] = binaryString.charCodeAt(i);
    }
    const blob = new Blob([uint8Array]);

    // Upload to Volc upload URL
    const resp = await fetch(uploadUrl, {
      method: 'PUT',
      body: blob,
      headers: { 'Content-Type': 'application/octet-stream' },
    });

    if (!resp.ok) {
      throw new Error('Failed to upload part');
    }

    return NextResponse.json({ success: true, partNumber });
  } catch (err) {
    console.error('[video-part-upload] error:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
