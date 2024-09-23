module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme:   {
    extend: {
      colors: {
        'primary-blue': {
          50:  '#ebf5ff',
          100: '#dbebff',
          200: '#bedbff',
          300: '#97c1ff',
          400: '#6e9aff',
          500: '#4c75ff',
          600: '#2c4cff', // Primary blue
          700: '#2039e2',
          800: '#1d34b6',
          900: '#20338f',
          950: '#131c53',
        },
        'primary-gray': {
          50:  '#f7f7f7',
          100: '#ededed',
          200: '#dfdfdf',
          300: '#cccccc',
          400: '#adadad',
          500: '#999999',
          600: '#888888',
          700: '#7b7b7b',
          800: '#676767',
          900: '#545454',
          950: '#363636',
        },
      },
    },
  },
  plugins: [],
};
