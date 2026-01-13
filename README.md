# The Reading Room

> What started as a simple hobby between friends turned into an ecosystem for literacy within our circle.

A beautiful, open-source book club platform designed to bring people together through reading. Track your journey, share thoughts, and discover your next adventure together.

![The Reading Room](https://img.shields.io/badge/Built%20with-Next.js%2016-black?style=flat-square) ![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)

## The Story

We wanted a way to pick books fairly, track what we'd read together, and have meaningful discussions. Every book club app we found was either too complex or too bare-bones. So we built The Reading Room—a warm, inviting space that treats reading as the communal experience it should be.

**Design Philosophy:**
- **Tufte-inspired data visualization** - The data IS the graphic. Our bookshelf shows progress as actual book spines.
- **Warm library aesthetic** - Brass, walnut, and cream tones that feel like a cozy reading nook.
- **Fair randomization** - Series order is sacred. No spoilers, no confusion.

## Features

- **Smart Book Picking** - Random draws for standalones, enforced order for series
- **Visual Progress Tracking** - A bookshelf that fills as you read
- **Series Intelligence** - Pilot book decisions, pause/resume, never spoil order
- **Shared Remarks** - Leave notes and ratings on books you've finished
- **Spotlight Section** - Feature movies, podcasts, and discussion questions
- **Discord Integration** - Announce picks to your server
- **Real-time Sync** - Powered by Supabase, works across all devices

## Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/YOUR_USERNAME/reading-room.git
cd reading-room
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env.local
```

Edit `.env.local` with your credentials (see [Environment Setup](#environment-setup)).

### 3. Add Your Books

Edit `data/books.json`:

```json
[
  {
    "id": "unique-slug",
    "title": "Your Book Title",
    "author": "Author Name",
    "genres": ["Fiction", "Mystery"],
    "series": null,
    "description": "A brief description."
  }
]
```

For series books, add the series object:

```json
{
  "series": {
    "name": "Series Name",
    "order": 1,
    "total": 3
  }
}
```

### 4. Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Environment Setup

### Supabase (Required for sync)

1. Create a free project at [supabase.com](https://supabase.com)
2. Run the SQL in `supabase-migrations.sql` in the SQL Editor
3. Copy your project URL and anon key from Settings > API

### Discord Webhook (Optional)

1. In your Discord server, go to Server Settings > Integrations > Webhooks
2. Create a webhook and copy the URL

## Deploy to Vercel

The easiest way to deploy:

1. Push to GitHub
2. Import at [vercel.com/new](https://vercel.com/new)
3. Add environment variables
4. Deploy

Or via CLI:

```bash
npx vercel --prod
```

## The Rules (Non-negotiable)

### Series Order is Sacred
- Book 2+ of any series is NEVER eligible unless that series is ACTIVE
- When a series is ACTIVE, the next pick is ALWAYS the next book in order

### Pilot Book Caveat
After completing Book 1 of any series, the group decides:
- **Continue** - Series becomes active, Book 2 is next
- **Pause** - Series goes dormant, can resume later
- **Drop** - Series is permanently out of the pool

### Fair Randomization
When no series is active, the pool includes:
- All unread standalones
- Book 1 of any unstarted series

## Tech Stack

- **Next.js 16** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **Framer Motion** for animations
- **Supabase** for database and real-time sync
- **Open Library API** for book covers

## Project Structure

```
├── data/
│   └── books.json           # Your book list
├── src/
│   ├── app/                  # Next.js pages
│   ├── components/           # React components
│   └── lib/                  # Core logic and hooks
├── public/                   # Static assets
└── supabase-migrations.sql   # Database schema
```

## Contributing

We welcome contributions! Whether it's:
- Bug fixes
- New features
- Design improvements
- Documentation

Open an issue or submit a PR.

## License

MIT - Use it, modify it, share it. Build your own reading community.

---

**Built with love for readers, by readers.**
