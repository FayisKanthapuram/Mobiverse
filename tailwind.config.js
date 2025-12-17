/** @type {import('tailwindcss').Config} */
export const content = [
  "./src/**/*.{html,js,jsx,ts,tsx}",
  "./public/**/*.{html,js}",
  "./views/**/*.{ejs,html}",
];
export const theme = {
  extend: {
    colors: {
      primary: "#0d6efd",
      danger: "#dc3545",
      success: "#198754",
    },
  },
};
export const plugins = [];
