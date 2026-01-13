'use client';

import { useEffect, useRef } from 'react';

export function LiquidBlobs() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* Base dark background */}
      <div className="absolute inset-0 bg-walnut" />

      {/* Animated gradient blobs */}
      <div
        className="absolute w-[800px] h-[800px] rounded-full opacity-30"
        style={{
          background: 'radial-gradient(circle, rgba(255,195,0,0.4) 0%, transparent 70%)',
          top: '-20%',
          right: '-10%',
          animation: 'blob-move-1 25s ease-in-out infinite',
          filter: 'blur(80px)',
        }}
      />

      <div
        className="absolute w-[600px] h-[600px] rounded-full opacity-25"
        style={{
          background: 'radial-gradient(circle, rgba(190,50,90,0.5) 0%, transparent 70%)',
          bottom: '-15%',
          left: '-5%',
          animation: 'blob-move-2 30s ease-in-out infinite',
          filter: 'blur(100px)',
        }}
      />

      <div
        className="absolute w-[500px] h-[500px] rounded-full opacity-20"
        style={{
          background: 'radial-gradient(circle, rgba(16,185,129,0.4) 0%, transparent 70%)',
          top: '40%',
          left: '30%',
          animation: 'blob-move-3 20s ease-in-out infinite',
          filter: 'blur(90px)',
        }}
      />

      <div
        className="absolute w-[400px] h-[400px] rounded-full opacity-15"
        style={{
          background: 'radial-gradient(circle, rgba(99,102,241,0.4) 0%, transparent 70%)',
          top: '20%',
          right: '20%',
          animation: 'blob-move-4 35s ease-in-out infinite',
          filter: 'blur(70px)',
        }}
      />

      {/* Subtle noise texture overlay */}
      <div
        className="absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      <style jsx>{`
        @keyframes blob-move-1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(-50px, 30px) scale(1.1); }
          50% { transform: translate(30px, -40px) scale(0.95); }
          75% { transform: translate(-20px, 20px) scale(1.05); }
        }
        @keyframes blob-move-2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(60px, -20px) scale(1.15); }
          66% { transform: translate(-30px, 40px) scale(0.9); }
        }
        @keyframes blob-move-3 {
          0%, 100% { transform: translate(0, 0) rotate(0deg) scale(1); }
          50% { transform: translate(40px, -30px) rotate(180deg) scale(1.2); }
        }
        @keyframes blob-move-4 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(30px, 40px) scale(0.9); }
          50% { transform: translate(-40px, 20px) scale(1.1); }
          75% { transform: translate(20px, -30px) scale(1.05); }
        }
      `}</style>
    </div>
  );
}

// Alternative: More subtle mesh gradient
export function GradientMesh() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none bg-walnut">
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 80% 50% at 20% 40%, rgba(255,195,0,0.12) 0%, transparent 50%),
            radial-gradient(ellipse 60% 40% at 80% 20%, rgba(99,102,241,0.08) 0%, transparent 50%),
            radial-gradient(ellipse 70% 60% at 70% 80%, rgba(190,50,90,0.1) 0%, transparent 50%),
            radial-gradient(ellipse 50% 50% at 10% 80%, rgba(16,185,129,0.08) 0%, transparent 50%)
          `,
        }}
      />
    </div>
  );
}
