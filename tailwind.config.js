/** @type {import('tailwindcss').Config} */
export const content = [
  './views/**/*.ejs' // This tells Tailwind to scan all .ejs files in your 'views' folder
];
export const theme = {
  extend: {
    // You can add your custom fonts here
    fontFamily: {
      inter: ['Inter', 'sans-serif']
    }
  },
};
export const plugins = [];