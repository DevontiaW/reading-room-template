import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const ROOM_PASSCODE = process.env.ROOM_PASSCODE;

function supabaseServer() {
  return createClient(url, anon);
}

export async function GET() {
  if (!url || !anon) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  }

  const sb = supabaseServer();
  const { data, error } = await sb
    .from('app_state')
    .select('*')
    .eq('id', 'global')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

export async function POST(req: Request) {
  if (!url || !anon) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  }

  // Passcode check disabled - using Discord auth instead for access control
  // If you want to re-enable, uncomment below:
  // if (ROOM_PASSCODE) {
  //   const passcode = req.headers.get('x-room-passcode');
  //   if (passcode !== ROOM_PASSCODE) {
  //     return NextResponse.json({ error: 'Invalid passcode' }, { status: 401 });
  //   }
  // }

  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { completed_book_ids, series_state, current_pick_id, pending_decision } = body;

  const sb = supabaseServer();
  const { data, error } = await sb
    .from('app_state')
    .update({
      completed_book_ids,
      series_state,
      current_pick_id,
      pending_decision,
      updated_at: new Date().toISOString(),
    })
    .eq('id', 'global')
    .select('*')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}
