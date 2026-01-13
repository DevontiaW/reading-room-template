'use client';

import { useState } from 'react';

interface RemarkFormProps {
  userName: string | null;
  onSetUserName: (name: string) => void;
  onSubmit: (note: string, rating?: number) => void;
}

export function RemarkForm({ userName, onSetUserName, onSubmit }: RemarkFormProps) {
  const [localName, setLocalName] = useState('');
  const [note, setNote] = useState('');
  const [rating, setRating] = useState<number | null>(null);
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  if (!userName) {
    return (
      <div className="bg-white/5 rounded-xl p-6">
        <h4 className="font-medium text-white mb-3">Enter your name to leave remarks</h4>
        <div className="flex gap-2">
          <input
            type="text"
            value={localName}
            onChange={(e) => setLocalName(e.target.value)}
            placeholder="Your display name"
            className="flex-1 bg-white/10 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-primary"
          />
          <button
            onClick={() => localName.trim() && onSetUserName(localName.trim())}
            disabled={!localName.trim()}
            className="px-6 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg font-medium disabled:opacity-50 transition-colors"
          >
            Save
          </button>
        </div>
      </div>
    );
  }

  const handleSubmit = () => {
    if (note.trim() || rating) {
      onSubmit(note.trim(), rating || undefined);
      setNote('');
      setRating(null);
    }
  };

  return (
    <div className="bg-white/5 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <span className="text-gray-400">
          Posting as <span className="text-primary font-medium">{userName}</span>
        </span>
        <button
          onClick={() => onSetUserName('')}
          className="text-xs text-gray-500 hover:text-gray-400"
        >
          Change
        </button>
      </div>

      {/* Star rating */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-sm text-gray-400">Rating:</span>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(null)}
              onClick={() => setRating(star === rating ? null : star)}
              className="p-1 transition-transform hover:scale-110"
            >
              <svg
                className={`w-6 h-6 ${
                  star <= (hoverRating || rating || 0)
                    ? 'text-amber-400'
                    : 'text-gray-600'
                } transition-colors`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </button>
          ))}
        </div>
        {rating && (
          <span className="text-sm text-gray-400">({rating}/5)</span>
        )}
      </div>

      {/* Note input */}
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Share your thoughts on this book..."
        rows={3}
        className="w-full bg-white/10 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-primary resize-none mb-4"
      />

      <button
        onClick={handleSubmit}
        disabled={!note.trim() && !rating}
        className="w-full py-3 bg-primary hover:bg-primary-dark text-white rounded-lg font-medium disabled:opacity-50 transition-colors"
      >
        Post Remark
      </button>
    </div>
  );
}
