import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { AppState, Remark, SeriesState } from './types';

let supabaseClient: SupabaseClient | null = null;

// Get or create supabase client (works in browser and server)
export function getSupabaseClient(): SupabaseClient | null {
  if (!supabaseClient) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !key) {
      console.warn('Supabase not configured - using localStorage fallback');
      return null;
    }

    supabaseClient = createClient(url, key);
  }

  return supabaseClient;
}

// Named export for convenience
export const supabase = {
  from: (table: string) => {
    const client = getSupabaseClient();
    if (!client) throw new Error('Supabase not configured');
    return client.from(table);
  },
  channel: (name: string) => {
    const client = getSupabaseClient();
    if (!client) throw new Error('Supabase not configured');
    return client.channel(name);
  },
  removeChannel: (channel: any) => {
    const client = getSupabaseClient();
    if (!client) throw new Error('Supabase not configured');
    return client.removeChannel(channel);
  },
};

// Database row types (snake_case from Postgres)
interface DbAppState {
  id: string;
  completed_book_ids: string[];
  series_state: Record<string, SeriesState>;
  current_pick_id: string | null;
  pending_decision: string | null;
  updated_at: string;
}

interface DbRemark {
  id: string;
  book_id: string;
  user_name: string;
  rating: number | null;
  note: string;
  created_at: string;
}

// Convert DB row to app type
function dbToAppState(row: DbAppState): AppState {
  return {
    id: row.id,
    completedBookIds: row.completed_book_ids,
    seriesState: row.series_state,
    currentPickId: row.current_pick_id,
    pendingDecision: row.pending_decision,
    updatedAt: row.updated_at,
  };
}

function appStateToDb(state: AppState): DbAppState {
  return {
    id: state.id,
    completed_book_ids: state.completedBookIds,
    series_state: state.seriesState,
    current_pick_id: state.currentPickId,
    pending_decision: state.pendingDecision,
    updated_at: state.updatedAt,
  };
}

function dbToRemark(row: DbRemark): Remark {
  return {
    id: row.id,
    bookId: row.book_id,
    userName: row.user_name,
    rating: row.rating,
    note: row.note,
    createdAt: row.created_at,
  };
}

// App State Operations
export async function fetchAppState(): Promise<AppState | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  const { data, error } = await client
    .from('app_state')
    .select('*')
    .eq('id', 'global')
    .single();

  if (error) {
    console.error('Error fetching app state:', error);
    return null;
  }

  return data ? dbToAppState(data as DbAppState) : null;
}

export async function saveAppState(state: AppState): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  const dbState = appStateToDb(state);

  const { error } = await client
    .from('app_state')
    .upsert(dbState, { onConflict: 'id' });

  if (error) {
    console.error('Error saving app state:', error);
    return false;
  }

  return true;
}

// Remarks Operations
export async function fetchRemarks(bookId?: string): Promise<Remark[]> {
  const client = getSupabaseClient();
  if (!client) return [];

  let query = client
    .from('remarks')
    .select('*')
    .order('created_at', { ascending: false });

  if (bookId) {
    query = query.eq('book_id', bookId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching remarks:', error);
    return [];
  }

  return (data || []).map((row) => dbToRemark(row as DbRemark));
}

export async function createRemark(
  bookId: string,
  userName: string,
  note: string,
  rating?: number
): Promise<Remark | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  const { data, error } = await client
    .from('remarks')
    .insert({
      book_id: bookId,
      user_name: userName,
      note,
      rating: rating || null,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating remark:', error);
    return null;
  }

  return data ? dbToRemark(data as DbRemark) : null;
}

// Realtime subscriptions
export function subscribeToAppState(
  callback: (state: AppState) => void
): (() => void) | null {
  const client = getSupabaseClient();
  if (!client) return null;

  const channel = client
    .channel('app_state_changes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'app_state' },
      (payload) => {
        if (payload.new) {
          callback(dbToAppState(payload.new as DbAppState));
        }
      }
    )
    .subscribe();

  return () => {
    client.removeChannel(channel);
  };
}

export function subscribeToRemarks(
  bookId: string,
  callback: (remarks: Remark[]) => void
): (() => void) | null {
  const client = getSupabaseClient();
  if (!client) return null;

  const channel = client
    .channel(`remarks_${bookId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'remarks',
        filter: `book_id=eq.${bookId}`,
      },
      async () => {
        // Refetch all remarks for this book
        const remarks = await fetchRemarks(bookId);
        callback(remarks);
      }
    )
    .subscribe();

  return () => {
    client.removeChannel(channel);
  };
}
