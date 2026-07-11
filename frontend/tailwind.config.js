/**
 * Reference token map (Section 3). Tailwind v4 is CSS-first — the live tokens live
 * in src/index.css under @theme. This file documents the design intent and can be
 * consumed by Lovable-generated components that expect a classic config.
 */
export default {
  theme: {
    extend: {
      colors: {
        os: {
          bg: '#050507',
          panel: 'rgba(255, 255, 255, 0.02)',
          border: 'rgba(255, 255, 255, 0.08)',
          accent: '#8b5cf6',
          success: '#10b981',
          muted: '#87878a',
        },
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', 'monospace'],
        sans: ['"Inter"', 'sans-serif'],
      },
      boxShadow: {
        'glow-accent': '0 0 20px rgba(139, 92, 246, 0.15)',
        'glow-success': '0 0 15px rgba(16, 185, 129, 0.2)',
      },
    },
  },
};
