/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#080808',
        paper: '#f8f4ee',
        electric: '#265DFF',
        crimson: '#E74646'
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        body: ['"Manrope"', 'sans-serif']
      },
      boxShadow: {
        glow: '0 20px 80px rgba(38, 93, 255, 0.18)'
      },
      backgroundImage: {
        mesh:
          'radial-gradient(circle at top left, rgba(38,93,255,0.18), transparent 35%), radial-gradient(circle at bottom right, rgba(231,70,70,0.14), transparent 35%)'
      }
    }
  },
  plugins: []
};
