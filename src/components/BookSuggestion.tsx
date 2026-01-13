'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';

interface OpenLibraryBook {
  key: string;
  title: string;
  author_name?: string[];
  first_publish_year?: number;
  cover_i?: number;
  subject?: string[];
}

interface BookSuggestion {
  id: string;
  title: string;
  author: string;
  coverUrl?: string;
  suggestedBy: string;
  suggestedById: string;
  suggestedAt: string;
  votes: string[];
  genres?: string[];
}

export function BookSuggestion() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<OpenLibraryBook[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [suggestions, setSuggestions] = useState<BookSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showSearch, setShowSearch] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Load suggestions from Supabase
  const loadSuggestions = async () => {
    try {
      const res = await fetch('/api/suggestions', {
        credentials: 'same-origin', // Ensure cookies are sent
      });
      const json = await res.json();
      if (json.data) {
        setSuggestions(json.data);
      }
    } catch (err) {
      console.error('Failed to load suggestions:', err);
    }
    setIsLoading(false);
  };

  // Load on mount
  useEffect(() => {
    loadSuggestions();
  }, []);

  // Search Open Library
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const response = await fetch(
        `https://openlibrary.org/search.json?q=${encodeURIComponent(searchQuery)}&limit=10`
      );
      const data = await response.json();
      setSearchResults(data.docs || []);
    } catch (error) {
      console.error('Search failed:', error);
      setSearchResults([]);
    }
    setIsSearching(false);
  };

  // Add book to suggestions
  // NOTE: Server gets userId from session, not request body (security fix)
  const handleSuggest = async (book: OpenLibraryBook) => {
    if (!user) return;

    try {
      const res = await fetch('/api/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin', // Ensure cookies are sent for auth
        body: JSON.stringify({
          title: book.title,
          author: book.author_name?.[0] || 'Unknown Author',
          coverUrl: book.cover_i
            ? `https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg`
            : null,
          genres: book.subject?.slice(0, 3),
          // userId removed - server gets it from session
        }),
      });

      const json = await res.json();

      if (res.status === 401) {
        setMessage({ type: 'error', text: 'Please sign in to suggest books' });
      } else if (res.status === 409) {
        setMessage({ type: 'error', text: 'This book has already been suggested!' });
      } else if (res.status === 429) {
        setMessage({ type: 'error', text: 'Too many requests. Please wait a moment.' });
      } else if (json.error) {
        setMessage({ type: 'error', text: json.error });
      } else {
        setMessage({ type: 'success', text: `"${book.title}" added to suggestions!` });
        loadSuggestions(); // Refresh list
        setShowSearch(false);
        setSearchQuery('');
        setSearchResults([]);
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to add suggestion' });
    }

    setTimeout(() => setMessage(null), 3000);
  };

  // Vote for a suggestion
  // NOTE: Server gets userId from session, not request body (security fix)
  const handleVote = async (suggestionId: string) => {
    if (!user) return;

    try {
      const res = await fetch('/api/suggestions/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin', // Ensure cookies are sent for auth
        body: JSON.stringify({
          suggestionId,
          // userId removed - server gets it from session
        }),
      });

      if (res.status === 401) {
        setMessage({ type: 'error', text: 'Please sign in to vote' });
        setTimeout(() => setMessage(null), 3000);
        return;
      }

      loadSuggestions(); // Refresh to show updated votes
    } catch (err) {
      console.error('Vote failed:', err);
    }
  };

  // Remove suggestion
  // NOTE: Server verifies ownership from session, not URL param (security fix)
  const handleRemove = async (suggestionId: string) => {
    if (!user) return;

    try {
      const res = await fetch(`/api/suggestions?id=${suggestionId}`, {
        method: 'DELETE',
        credentials: 'same-origin', // Ensure cookies are sent for auth
      });

      if (res.status === 401) {
        setMessage({ type: 'error', text: 'Please sign in to remove suggestions' });
        setTimeout(() => setMessage(null), 3000);
        return;
      }

      if (res.status === 403) {
        setMessage({ type: 'error', text: 'You can only remove your own suggestions' });
        setTimeout(() => setMessage(null), 3000);
        return;
      }

      loadSuggestions(); // Refresh list
    } catch (err) {
      console.error('Remove failed:', err);
    }
  };

  // Sort by votes (most votes first)
  const sortedSuggestions = [...suggestions].sort((a, b) => b.votes.length - a.votes.length);

  return (
    <div className="bg-white/5 backdrop-blur rounded-2xl sm:rounded-3xl p-5 sm:p-8 border border-white/10">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
          <span>📚</span> Book Suggestions
        </h2>
        {user && (
          <button
            onClick={() => {
              setShowSearch(!showSearch);
            }}
            className="px-4 py-2 bg-primary hover:bg-primary/80 text-white rounded-xl font-medium text-sm transition-colors min-h-[44px]"
          >
            {showSearch ? 'Cancel' : '+ Suggest a Book'}
          </button>
        )}
      </div>

      {/* Message */}
      {message && (
        <div className={`mb-4 p-3 rounded-xl text-sm ${
          message.type === 'success'
            ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-400'
            : 'bg-red-500/20 border border-red-500/30 text-red-400'
        }`}>
          {message.text}
        </div>
      )}

      {/* Search Section */}
      {showSearch && (
        <div className="mb-6 p-4 bg-white/5 rounded-xl border border-white/10">
          <p className="text-gray-400 text-sm mb-3">
            Search for a book to suggest to the club
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Search by title or author..."
              className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-primary min-h-[48px]"
            />
            <button
              onClick={handleSearch}
              disabled={isSearching || !searchQuery.trim()}
              className="px-5 py-3 bg-primary hover:bg-primary/80 disabled:opacity-50 text-white rounded-xl font-medium transition-colors min-h-[48px]"
            >
              {isSearching ? '...' : 'Search'}
            </button>
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="mt-4 space-y-2 max-h-80 overflow-y-auto">
              {searchResults.map((book) => (
                <div
                  key={book.key}
                  className="flex items-center gap-3 p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors"
                >
                  {book.cover_i ? (
                    <img
                      src={`https://covers.openlibrary.org/b/id/${book.cover_i}-S.jpg`}
                      alt={book.title}
                      className="w-12 h-16 object-cover rounded"
                    />
                  ) : (
                    <div className="w-12 h-16 bg-white/10 rounded flex items-center justify-center text-gray-500 text-xs">
                      No Cover
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium truncate">{book.title}</p>
                    <p className="text-gray-400 text-sm truncate">
                      {book.author_name?.[0] || 'Unknown Author'}
                      {book.first_publish_year && ` · ${book.first_publish_year}`}
                    </p>
                  </div>
                  <button
                    onClick={() => handleSuggest(book)}
                    className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
                  >
                    + Add
                  </button>
                </div>
              ))}
            </div>
          )}

          {searchResults.length === 0 && searchQuery && !isSearching && (
            <p className="mt-4 text-gray-500 text-sm text-center">
              No results found. Try a different search term.
            </p>
          )}
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="text-center py-8">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto" />
        </div>
      )}

      {/* Suggestions List */}
      {!isLoading && sortedSuggestions.length > 0 ? (
        <div className="space-y-3">
          <p className="text-gray-400 text-sm">
            Vote for books you'd like the club to read next!
          </p>
          {sortedSuggestions.map((suggestion) => {
            const hasVoted = user && suggestion.votes.includes(user.id);
            const isOwner = user && suggestion.suggestedById === user.id;

            return (
              <div
                key={suggestion.id}
                className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/10"
              >
                {suggestion.coverUrl ? (
                  <img
                    src={suggestion.coverUrl}
                    alt={suggestion.title}
                    className="w-12 h-16 object-cover rounded"
                  />
                ) : (
                  <div className="w-12 h-16 bg-white/10 rounded flex items-center justify-center text-gray-500 text-xl">
                    📖
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium truncate">{suggestion.title}</p>
                  <p className="text-gray-400 text-sm truncate">
                    {suggestion.author}
                  </p>
                  <p className="text-gray-500 text-xs">
                    Suggested by {suggestion.suggestedBy}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleVote(suggestion.id)}
                    disabled={!user}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 min-h-[40px] ${
                      hasVoted
                        ? 'bg-primary text-white'
                        : 'bg-white/10 text-gray-300 hover:bg-white/20'
                    } ${!user ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <span>👍</span>
                    <span>{suggestion.votes.length}</span>
                  </button>
                  {isOwner && (
                    <button
                      onClick={() => handleRemove(suggestion.id)}
                      className="p-2 text-gray-500 hover:text-red-400 transition-colors"
                      title="Remove suggestion"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : !isLoading ? (
        <div className="text-center py-8">
          <span className="text-4xl mb-3 block">📚</span>
          <p className="text-gray-400">No suggestions yet</p>
          <p className="text-gray-500 text-sm">Be the first to suggest a book!</p>
        </div>
      ) : null}
    </div>
  );
}
