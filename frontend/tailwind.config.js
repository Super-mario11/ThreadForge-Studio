/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0B1020',
        paper: '#F7F8FF',
        electric: '#7C3AED',
        crimson: '#EC4899'
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        body: ['"Manrope"', 'sans-serif']
      },
      boxShadow: {
        glow: '0 22px 90px rgba(124, 58, 237, 0.20)'
      },
      backgroundImage: {
        mesh:
          'radial-gradient(circle at 12% 12%, rgba(124,58,237,0.26), transparent 42%), radial-gradient(circle at 88% 24%, rgba(236,72,153,0.20), transparent 42%), radial-gradient(circle at 30% 85%, rgba(99,102,241,0.14), transparent 40%)',
        'accent-gradient':
          'linear-gradient(135deg, rgba(124,58,237,0.95), rgba(236,72,153,0.92))'
      }
    }
  },
  plugins: []
};
