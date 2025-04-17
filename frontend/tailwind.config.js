/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#F5A281',    // primary
          dark: '#F37C4C',       // primary-dark
          bg: '#FCE3D9',         // primary-bg
          10: '#FEF6F2',         // primary-10 (rgb(254, 246, 242))
          20: '#FFE6DC',         // primary-20 (rgb(255, 230, 220))
          30: '#FACDB8',         // primary-30 (rgb(250, 205, 187))
          40: '#F8BEA7',         // primary-40 (rgb(248, 190, 167))
        },
        duty: {
          day: {
            DEFAULT: '#61A86A',   // duty-day (rgb(97, 168, 106))
            dark: '#318F3D',      // duty-day-dark (rgb(49, 143, 61))
            bg: '#D0E5D2',        // duty-day-bg (rgb(208, 229, 210))
          },
          evening: {
            DEFAULT: '#F68585',   // duty-evening (rgb(246, 133, 133))
            dark: '#E55656',      // duty-evening-dark (rgb(229, 86, 86))
            bg: '#FCDADA',        // duty-evening-bg (rgb(252, 218, 218))
          },
          night: {
            DEFAULT: '#7454DF',   // duty-night (rgb(116, 84, 223))
            dark: '#532FC8',      // duty-night-dark (rgb(83, 47, 200))
            bg: '#D5CCF5',        // duty-night-bg (rgb(213, 204, 245))
          },
          off: {
            DEFAULT: '#999786',   // duty-off (rgb(153, 151, 134))
            dark: '#726F5A',      // duty-off-dark (rgb(114, 111, 90))
            bg: '#E5E5E1',        // duty-off-bg (rgb(229, 229, 225))
          }
        },
        base: {
          background: '#F9F9F9',      // background (rgb(249, 249, 249))
          foreground: '#4D4D4D',      // foreground(text) (rgb(77, 77, 77))
          muted: '#D9D9D9',           // muted (rgb(217, 217, 217))
          'muted-30': '#F4F4F4',      // muted-30 (rgb(244, 244, 244))
          transparent: '#D9D9D900',    // transparent (rgba(217, 217, 217, 0))
          white: '#FFFFFF',            // white (rgb(255, 255, 255))
          black: '#000000',            // black (rgb(0, 0, 0))
        }
      },
      fontFamily: {
        pretendard: ['Pretendard', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

