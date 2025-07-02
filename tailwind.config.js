/** @type {import('tailwindcss').Config} */
import forms from "@tailwindcss/forms";

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {},
  },
  plugins: [
    forms,
    function ({ addUtilities }) {
      const scrollbarUtilities = {
        ".scrollbar-default": {
          "scrollbar-width": "thin",
          "scrollbar-color": "var(--scrollbar-thumb) var(--scrollbar-track)",
          "&::-webkit-scrollbar": {
            width: "12px",
            height: "12px",
          },
          "&::-webkit-scrollbar-track": {
            background: "var(--scrollbar-track)",
            borderRadius: "6px",
            border: "1px solid var(--scrollbar-border)",
          },
          "&::-webkit-scrollbar-thumb": {
            background: "var(--scrollbar-thumb)",
            borderRadius: "6px",
            border: "2px solid var(--scrollbar-track)",
            transition: "all 0.2s ease",
          },
          "&::-webkit-scrollbar-thumb:hover": {
            background: "var(--scrollbar-thumb-hover)",
            borderColor: "var(--scrollbar-border)",
          },
          "&::-webkit-scrollbar-thumb:active": {
            background: "var(--scrollbar-thumb-active)",
          },
          "&::-webkit-scrollbar-corner": {
            background: "var(--scrollbar-track)",
          },
        },
        ".scrollbar-thin": {
          "scrollbar-width": "thin",
          "scrollbar-color": "var(--scrollbar-thumb) transparent",
          "&::-webkit-scrollbar": {
            width: "6px",
            height: "6px",
          },
          "&::-webkit-scrollbar-track": {
            background: "transparent",
          },
          "&::-webkit-scrollbar-thumb": {
            background: "var(--scrollbar-thumb)",
            borderRadius: "3px",
            border: "none",
          },
          "&::-webkit-scrollbar-thumb:hover": {
            background: "var(--scrollbar-thumb-hover)",
          },
        },
        ".scrollbar-hide": {
          "scrollbar-width": "none",
          "-ms-overflow-style": "none",
          "&::-webkit-scrollbar": {
            display: "none",
          },
        },
        ".scrollbar-custom": {
          "scrollbar-width": "thin",
          "scrollbar-color": "var(--scrollbar-thumb) var(--scrollbar-track)",
          "&::-webkit-scrollbar": {
            width: "8px",
            height: "8px",
          },
          "&::-webkit-scrollbar-track": {
            background: "var(--scrollbar-track)",
            borderRadius: "4px",
          },
          "&::-webkit-scrollbar-thumb": {
            background: "var(--scrollbar-thumb)",
            borderRadius: "4px",
            border: "1px solid var(--scrollbar-track)",
          },
          "&::-webkit-scrollbar-thumb:hover": {
            background: "var(--scrollbar-thumb-hover)",
          },
        },
      };
      addUtilities(scrollbarUtilities);
    },
  ],
};
