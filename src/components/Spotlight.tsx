'use client';

import { useState, useRef } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';

interface SpotlightItem {
  type: 'movie' | 'podcast';
  title: string;
  subtitle?: string;
  description?: string;
  youtubeId?: string;
  author?: string;
  year?: string;
  discussionQuestions?: string[];
}

const spotlightItems: SpotlightItem[] = [
  {
    type: 'movie',
    title: 'The Spook Who Sat by the Door',
    subtitle: 'Movie of the Week',
    description: `Based on Sam Greenlee's 1969 novel, this 1973 film tells the story of Dan Freeman—the first Black CIA officer—who endures tokenism and racism to master the agency's tactics, then returns to Chicago to train gang members into a revolutionary army.

The film was so threatening to the establishment that it was allegedly suppressed by the FBI and pulled from theaters within weeks. For decades, it existed only in bootleg copies passed hand-to-hand in Black communities.`,
    youtubeId: '9JIfUsOYRuo',
    author: 'Sam Greenlee',
    year: '1973',
    discussionQuestions: [
      'What does it mean to use the "master\'s tools" against the system?',
      'How does Dan Freeman\'s journey mirror or diverge from real civil rights strategies?',
      'Why might this film have been suppressed—what made it so dangerous?',
      'Is revolutionary fiction still possible today, or has everything been commodified?',
    ],
  },
  {
    type: 'podcast',
    title: 'Why building things in America has become so hard',
    subtitle: 'Podcast of the Week',
    description: `The Gray Area digs into one of America's most frustrating paradoxes: Why does it take decades and billions of dollars to build things that other countries complete in a fraction of the time?

The episode explores how environmental review processes meant to protect communities have been weaponized to block housing and transit, how labor costs and regulations have spiraled, and why even progressive cities can't build their way out of a housing crisis.`,
    youtubeId: 'l5-8l9FejSI',
    author: 'The Gray Area (Vox)',
    year: '2024',
    discussionQuestions: [
      'What\'s the difference between regulation that protects and regulation that paralyzes?',
      'How do we build political will for construction when NIMBYism is so locally powerful?',
      'Is the American Dream of homeownership still possible—or desirable?',
      'What would it take to build a subway line in your city in under 5 years?',
    ],
  },
];

// Stage lamp SVG component with glow
function StageLamp({ className }: { className?: string }) {
  return (
    <div className={`relative ${className}`}>
      {/* Glow effect behind the lamp */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/4 w-24 h-24 sm:w-40 sm:h-40 rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(255,195,0,0.6) 0%, rgba(255,195,0,0.2) 40%, transparent 70%)',
          filter: 'blur(20px)',
        }}
      />
      <svg
        viewBox="0 0 140 100"
        className="relative w-full h-full"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Glow filter */}
          <filter id="lampGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          {/* Radial gradient for bulb */}
          <radialGradient id="bulbGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fffef0" />
            <stop offset="30%" stopColor="#ffd54f" />
            <stop offset="70%" stopColor="#ffb300" />
            <stop offset="100%" stopColor="#ff8f00" />
          </radialGradient>
        </defs>

        {/* Mount/ceiling bar */}
        <rect x="55" y="0" width="30" height="10" rx="3" fill="#5d4e42" />
        <rect x="58" y="2" width="24" height="6" rx="2" fill="#4a3f35" />

        {/* Arm/neck */}
        <rect x="65" y="10" width="10" height="25" rx="2" fill="#4a3f35" />
        <rect x="67" y="12" width="6" height="21" rx="1" fill="#3d3429" />

        {/* Main housing - fresnel style */}
        <ellipse cx="70" cy="55" rx="45" ry="32" fill="#3d3429" />
        <ellipse cx="70" cy="55" rx="40" ry="28" fill="#2a2420" />
        <ellipse cx="70" cy="55" rx="35" ry="24" fill="#1a1612" />

        {/* Inner reflector rings */}
        <ellipse cx="70" cy="58" rx="28" ry="18" fill="none" stroke="#3d3429" strokeWidth="1" />
        <ellipse cx="70" cy="60" rx="22" ry="14" fill="#0d0b09" />

        {/* THE BULB - glowing! */}
        <ellipse cx="70" cy="62" rx="16" ry="10" fill="url(#bulbGradient)" filter="url(#lampGlow)" />
        <ellipse cx="70" cy="62" rx="10" ry="6" fill="#fff9e6" />
        <ellipse cx="70" cy="61" rx="5" ry="3" fill="#ffffff" />

        {/* Barn doors */}
        <path d="M25 42 L32 78 L25 80 Z" fill="#3d3429" />
        <path d="M115 42 L108 78 L115 80 Z" fill="#3d3429" />

        {/* Housing rim highlight */}
        <ellipse cx="70" cy="55" rx="45" ry="32" stroke="#5d4e42" strokeWidth="3" fill="none" />

        {/* Lens rings for realism */}
        <circle cx="70" cy="60" r="18" stroke="#4a3f35" strokeWidth="1" fill="none" opacity="0.5" />
        <circle cx="70" cy="60" r="14" stroke="#4a3f35" strokeWidth="0.5" fill="none" opacity="0.3" />
      </svg>
    </div>
  );
}

export function Spotlight() {
  const [activeType, setActiveType] = useState<'movie' | 'podcast'>('movie');
  const [showQuestions, setShowQuestions] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start'],
  });

  // Lamp swing animation - swings into position
  const lampRotate = useTransform(scrollYProgress, [0, 0.15, 0.3], [-30, 0, 5]);
  const lampOpacity = useTransform(scrollYProgress, [0, 0.1], [0, 1]);

  // Hard-edge spotlight circle - slides down to illuminate content
  const spotlightY = useTransform(scrollYProgress, [0.1, 0.25, 0.5, 0.7], ['-50%', '10%', '40%', '70%']);
  const spotlightOpacity = useTransform(scrollYProgress, [0.1, 0.2, 0.75, 0.9], [0, 1, 1, 0]);
  const spotlightScale = useTransform(scrollYProgress, [0.1, 0.3, 0.6], [0.6, 1, 1.3]);

  // Content illumination - things light up as spotlight passes over them
  const videoIllumination = useTransform(scrollYProgress, [0.15, 0.3], [0.2, 1]);
  const titleIllumination = useTransform(scrollYProgress, [0.25, 0.4], [0, 1]);
  const descIllumination = useTransform(scrollYProgress, [0.35, 0.5], [0, 1]);
  const extrasIllumination = useTransform(scrollYProgress, [0.45, 0.6], [0, 1]);

  const movie = spotlightItems.find((item) => item.type === 'movie');
  const podcast = spotlightItems.find((item) => item.type === 'podcast');
  const activeItem = activeType === 'movie' ? movie : podcast;

  if (!activeItem) return null;

  return (
    <div ref={containerRef} className="relative min-h-[140vh]">

      {/* THE LAMP FIXTURE - swings into position */}
      <div className="sticky top-0 h-screen overflow-hidden pointer-events-none">
        {/* Lamp */}
        <motion.div
          style={{
            rotate: lampRotate,
            opacity: lampOpacity,
          }}
          className="absolute top-0 left-1/2 -translate-x-1/2 origin-top"
        >
          <StageLamp className="w-32 h-24 sm:w-40 sm:h-28 md:w-48 md:h-36" />
        </motion.div>

        {/* HARD-EDGE SPOTLIGHT CIRCLE */}
        <motion.div
          style={{
            y: spotlightY,
            opacity: spotlightOpacity,
            scale: spotlightScale,
          }}
          className="absolute left-1/2 -translate-x-1/2 w-[280px] h-[280px] sm:w-[380px] sm:h-[380px] md:w-[500px] md:h-[500px] pointer-events-none"
        >
          {/* Hard edge circle with soft interior */}
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background: `
                radial-gradient(circle at center,
                  rgba(255,220,150,0.25) 0%,
                  rgba(255,195,0,0.15) 40%,
                  rgba(255,195,0,0.08) 60%,
                  rgba(255,195,0,0.03) 75%,
                  transparent 85%
                )
              `,
              boxShadow: 'inset 0 0 60px rgba(255,195,0,0.1)',
            }}
          />
          {/* Crisp outer ring */}
          <div
            className="absolute inset-4 rounded-full"
            style={{
              border: '2px solid rgba(255,195,0,0.15)',
              boxShadow: '0 0 40px rgba(255,195,0,0.1)',
            }}
          />
        </motion.div>

        {/* Light beam cone from lamp to spotlight */}
        <motion.div
          style={{ opacity: spotlightOpacity }}
          className="absolute top-20 left-1/2 -translate-x-1/2 w-4 pointer-events-none"
        >
          <div
            className="w-full h-[60vh]"
            style={{
              background: 'linear-gradient(to bottom, rgba(255,220,150,0.3) 0%, rgba(255,195,0,0.05) 50%, transparent 100%)',
              clipPath: 'polygon(30% 0%, 70% 0%, 100% 100%, 0% 100%)',
              filter: 'blur(8px)',
            }}
          />
        </motion.div>
      </div>

      {/* CONTENT - illuminated by the spotlight */}
      <div className="relative z-10 -mt-[100vh] pt-[12vh]">
        <div className="max-w-4xl mx-auto px-4">

          {/* Toggle - no emoji */}
          <motion.div
            style={{ opacity: videoIllumination }}
            className="flex justify-center mb-10 pointer-events-auto"
          >
            <div className="inline-flex bg-walnut/90 backdrop-blur-xl rounded-full p-1.5 border border-brass/30 shadow-xl">
              <button
                onClick={() => { setActiveType('movie'); setShowQuestions(false); }}
                className={`px-8 py-3 rounded-full text-sm font-semibold transition-all duration-300 ${
                  activeType === 'movie'
                    ? 'bg-brass text-walnut shadow-lg'
                    : 'text-cream/50 hover:text-cream'
                }`}
              >
                Movie
              </button>
              <button
                onClick={() => { setActiveType('podcast'); setShowQuestions(false); }}
                className={`px-8 py-3 rounded-full text-sm font-semibold transition-all duration-300 ${
                  activeType === 'podcast'
                    ? 'bg-brass text-walnut shadow-lg'
                    : 'text-cream/50 hover:text-cream'
                }`}
              >
                Podcast
              </button>
            </div>
          </motion.div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeType}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {/* Video - illuminated first */}
              <motion.div
                style={{ opacity: videoIllumination }}
                className="relative mb-10"
              >
                <div className="relative aspect-video rounded-2xl overflow-hidden bg-black border-2 border-brass/20 shadow-2xl shadow-black/50">
                  {activeItem.youtubeId && (
                    <iframe
                      src={`https://www.youtube.com/embed/${activeItem.youtubeId}`}
                      title={activeItem.title}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="absolute inset-0 w-full h-full"
                    />
                  )}
                </div>
              </motion.div>

              {/* Title - illuminated second */}
              <motion.div
                style={{ opacity: titleIllumination }}
                className="text-center mb-8"
              >
                <p className="text-brass/80 text-sm font-medium tracking-widest uppercase mb-3">
                  {activeItem.subtitle}
                </p>
                <h3 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-cream mb-3">
                  {activeItem.title}
                </h3>
                <p className="text-cream/55">
                  {activeItem.author} · {activeItem.year}
                </p>
              </motion.div>

              {/* Description - illuminated third */}
              <motion.div
                style={{ opacity: descIllumination }}
                className="space-y-4 mb-12 max-w-2xl mx-auto"
              >
                {activeItem.description?.split('\n\n').map((paragraph, i) => (
                  <p key={i} className="text-cream/60 text-center leading-relaxed">
                    {paragraph}
                  </p>
                ))}
              </motion.div>

              {/* Extras - illuminated last */}
              <motion.div style={{ opacity: extrasIllumination }} className="space-y-8">
                {/* Discussion questions */}
                <div className="text-center">
                  <button
                    onClick={() => setShowQuestions(!showQuestions)}
                    className="inline-flex items-center gap-3 px-8 py-4 bg-burgundy/20 hover:bg-burgundy/30 text-cream rounded-xl font-medium transition-all border border-burgundy/30 hover:border-burgundy/50"
                  >
                    <span>{showQuestions ? 'Hide Questions' : 'Discussion Questions'}</span>
                    <motion.span
                      animate={{ rotate: showQuestions ? 180 : 0 }}
                      className="text-cream/55 text-sm"
                    >
                      ▼
                    </motion.span>
                  </button>

                  <AnimatePresence>
                    {showQuestions && activeItem.discussionQuestions && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.4 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-8 max-w-2xl mx-auto text-left">
                          <div className="bg-walnut-50/50 backdrop-blur rounded-xl p-8 border border-bronze/20">
                            <p className="text-brass/70 text-xs uppercase tracking-widest mb-6 font-medium">
                              Questions to consider
                            </p>
                            <div className="space-y-5">
                              {activeItem.discussionQuestions.map((question, i) => (
                                <motion.div
                                  key={i}
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: i * 0.08 }}
                                  className="flex gap-4"
                                >
                                  <span className="text-brass/50 font-mono text-sm">{i + 1}.</span>
                                  <p className="text-cream/70 leading-relaxed">{question}</p>
                                </motion.div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Book note for movie */}
                {activeType === 'movie' && (
                  <div className="max-w-2xl mx-auto">
                    <div className="flex items-start gap-5 p-6 bg-lamp/5 rounded-xl border border-lamp/10">
                      <div className="w-8 h-10 bg-gradient-to-b from-lamp to-brass rounded-sm flex-shrink-0" />
                      <div>
                        <p className="text-lamp font-semibold mb-2">The Book Goes Deeper</p>
                        <p className="text-cream/50 text-sm leading-relaxed">
                          Sam Greenlee's 1969 novel was written in exile—no American publisher would touch
                          it. Part spy thriller, part revolutionary manual, part sharp critique of race
                          in America.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
