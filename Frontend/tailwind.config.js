/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx}'
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Clash Display"', '"Space Grotesk"', 'system-ui', 'sans-serif'],
        body: ['"Space Grotesk"', 'system-ui', 'sans-serif']
      },
      colors: {
        ink: '#1f2933',
        inkLight: '#667085',
        primary: '#b45309',
        primarySoft: '#fff7ed',
        surface: '#fffdfa',
        mist: '#f6f1e8'
      }
    }
  },
  plugins: []
};
