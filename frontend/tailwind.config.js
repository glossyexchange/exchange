/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],

  theme: {
    extend: {
      colors: {
        primary: "#003462",
        lightPrimary:"#00427c",
        secondary: "#b2ebf2",
        border: "#FEEAF1",
        tinyGrey: "#FDFDFD",
        backGroundGrey: "#F5F6F7",
        tertiary: "#6C4DDA",
        success: "#0ABE75",
        darkBlue: "#2A629A",
        lightGreen:"#E1E8EB",
        lightBlue:"#CAE1EB",
darkGreen:"#4b6043",
semiLightGreen:"#b3cf99",
        Chocolate: "#D2691E",
        DarkGray: "#FF7F50",
        Crimson: "#DC143C",
        LightSalmon: "#FFA07A",
        SteelBlue: "#4682B4",
        DarkOrchid: "#9932CC",
        MintCream: "#6A5ACD",
      },
    },
  },
  plugins: [require("tailwind-scrollbar")],
};
