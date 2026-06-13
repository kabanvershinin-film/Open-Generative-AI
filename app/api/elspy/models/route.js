import { NextResponse } from 'next/server';

const ELSPI_BASE_URL = 'https://api.lk888.ai';
const ELSPI_API_KEY = process.env.ELSPY_API_KEY;

export async function GET(request) {
  try {
    // Use the user-provided API key if available, otherwise fall back to env
    const authHeader = request.headers.get('Authorization');
    const apiKey = authHeader ? authHeader.replace('Bearer ', '') : ELSPI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: 'ELSPY_API_KEY not configured' }, { status: 503 });
    }

    const response