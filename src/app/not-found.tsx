import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center">
      {/* Lost book illustration */}
      <div className="mb-8">
        <svg viewBox="0 0 120 100" className="w-32 h-28 mx-auto opacity-60">
          {/* Fallen book */}
          <rect x="20" y="60" width="80" height="12" rx="2" fill="#8B4513" transform="rotate(-8 60 66)" />
          <rect x="22" y="62" width="76" height="8" rx="1" fill="#F5E6D3" transform="rotate(-8 60 66)" />
          {/* Pages flying */}
          <rect x="70" y="30" width="20" height="28" rx="1" fill="#FFF8E7" transform="rotate(15 80 44)" opacity="0.7" />
          <rect x="50" y="20" width="18" height="24" rx="1" fill="#FFF8E7" transform="rotate(-10 59 32)" opacity="0.5" />
          <rect x="30" y="35" width="16" height="20" rx="1" fill="#FFF8E7" transform="rotate(25 38 45)" opacity="0.4" />
          {/* Question mark */}
          <text x="60" y="55" fontSize="24" fill="#FFC300" textAnchor="middle" fontFamily="Georgia, serif">?</text>
        </svg>
      </div>

      <h1 className="text-6xl font-bold text-brass mb-4">404</h1>
      <h2 className="text-2xl text-cream mb-3">Page Not Found</h2>
      <p className="text-cream/50 mb-8 max-w-md">
        Looks like this page wandered off the shelf. Let&apos;s get you back to the reading room.
      </p>

      <Link
        href="/"
        className="inline-flex items-center gap-2 px-6 py-3 bg-brass text-walnut font-semibold rounded-xl hover:bg-brass-light transition-colors"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
        Back to Home
      </Link>
    </div>
  );
}
