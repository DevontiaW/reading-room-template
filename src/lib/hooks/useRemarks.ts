'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Remark } from '../types';
import { getRoomPasscode } from '../room';

const LOCAL_REMARKS_KEY = 'bookclub_remarks';

function loadLocalRemarks(): Remark[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(LOCAL_REMARKS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveLocalRemarks(remarks: Remark[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LOCAL_REMARKS_KEY, JSON.stringify(remarks));
}

// Convert DB row to app type
function dbToRemark(row: {
  id: string;
  book_id: string;
  user_name: string;
  rating: number | null;
  note: string;
  created_at: string;
}): Remark {
  return {
    id: row.id,
    bookId: row.book_id,
    userName: row.user_name,
    rating: row.rating,
    note: row.note,
    createdAt: row.created_at,
  };
}

export function useRemarks(bookId?: string) {
  const [remarks, setRemarks] = useState<Remark[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch remarks from API
  const fetchRemarks = useCallback(async (): Promise<Remark[]> => {
    try {
      const url = bookId ? `/api/remarks?book_id=${bookId}` : '/api/remarks';
      const res = await fetch(url);
      const json = await res.json();

      if (json.error) {
        console.warn('Remarks API error:', json.error);
        return [];
      }

      if (json.data) {
        return json.data.map(dbToRemark);
      }
    } catch (err) {
      console.warn('Remarks fetch error:', err);
    }
    return [];
  }, [bookId]);

  useEffect(() => {
    async function init() {
      setIsLoading(true);

      // Try to fetch from API
      const remoteRemarks = await fetchRemarks();

      if (remoteRemarks.length > 0 || (await fetch('/api/remarks').then(r => r.ok))) {
        setIsOnline(true);
        setRemarks(remoteRemarks);

        // Poll for updates every 15 seconds
        pollRef.current = setInterval(async () => {
          const updated = await fetchRemarks();
          setRemarks(updated);
        }, 15000);
      } else {
        setIsOnline(false);
        const localRemarks = loadLocalRemarks();
        const filtered = bookId
          ? localRemarks.filter((r) => r.bookId === bookId)
          : localRemarks;
        setRemarks(filtered);
      }

      setIsLoading(false);
    }

    init();

    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
      }
    };
  }, [bookId, fetchRemarks]);

  const addRemark = useCallback(
    async (userName: string, note: string, rating?: number) => {
      if (!bookId) return null;

      const passcode = getRoomPasscode();

      if (isOnline) {
        try {
          const res = await fetch('/api/remarks', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(passcode ? { 'x-room-passcode': passcode } : {}),
            },
            body: JSON.stringify({
              book_id: bookId,
              user_name: userName,
              note,
              rating: rating || null,
            }),
          });

          const json = await res.json();

          if (json.error) {
            setError(json.error);
            return null;
          }

          if (json.data) {
            const newRemark = dbToRemark(json.data);
            setRemarks((prev) => [newRemark, ...prev]);
            return newRemark;
          }
        } catch (err) {
          console.warn('Add remark error:', err);
        }
        return null;
      } else {
        // Local-only mode
        const newRemark: Remark = {
          id: `local_${Date.now()}`,
          bookId,
          userName,
          note,
          rating: rating || null,
          createdAt: new Date().toISOString(),
        };

        const allRemarks = loadLocalRemarks();
        allRemarks.unshift(newRemark);
        saveLocalRemarks(allRemarks);
        setRemarks((prev) => [newRemark, ...prev]);
        return newRemark;
      }
    },
    [bookId, isOnline]
  );

  const refreshRemarks = useCallback(async () => {
    const updated = await fetchRemarks();
    setRemarks(updated);
  }, [fetchRemarks]);

  return {
    remarks,
    isLoading,
    isOnline,
    error,
    addRemark,
    refreshRemarks,
  };
}
