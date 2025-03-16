/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      scale: {
        '102': '1.02',
      },
      animation: {
        'fadeIn': 'fadeIn 0.3s ease-out',
        'pulse': 'pulse 2s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { 
            opacity: '0',
            transform: 'scale(0.8)',
          },
          '100%': { 
            opacity: '1',
            transform: 'scale(1)',
          },
        },
        pulse: {
          '0%': { 
            transform: 'scale(1)',
            boxShadow: '0 0 0 0 rgba(74, 222, 128, 0.4)',
          },
          '70%': { 
            transform: 'scale(1.02)',
            boxShadow: '0 0 0 10px rgba(74, 222, 128, 0)',
          },
          '100%': { 
            transform: 'scale(1)',
            boxShadow: '0 0 0 0 rgba(74, 222, 128, 0)',
          },
        },
      },
    },
  },
  plugins: [],
} 