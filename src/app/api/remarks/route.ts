import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const ROOM_PASSCODE = process.env.ROOM_PASSCODE;

function supabaseServer() {
  return createClient(url, anon);
}

export async function GET(req: Request) {
  if (!url || !anon) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  }

  const { searchParams } = new URL(req.url);
  const bookId = searchParams.get('book_id');

  const sb = supabaseServer();

  let query = sb
    .from('remarks')
    .select('*')
    .order('created_at', { ascending: false });

  if (bookId) {
    query = query.eq('book_id', bookId);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

export async function POST(req: Request) {
  if (!url || !anon) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  }

  // Passcode check (only if ROOM_PASSCODE is set)
  if (ROOM_PASSCODE) {
    const passcode = req.headers.get('x-room-passcode');
    if (passcode !== ROOM_PASSCODE) {
      return NextResponse.json({ error: 'Invalid passcode' }, { status: 401 });
    }
  }

  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { book_id, user_name, rating, note } = body;

  if (!book_id || !user_name) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const sb = supabaseServer();
  const { data, error } = await sb
    .from('remarks')
    .insert({
      book_id,
      user_name,
      rating: rating ?? null,
      note: note || '',
    })
    .select('*')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}
