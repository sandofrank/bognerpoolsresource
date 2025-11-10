/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    tailwindcss: {},
    // Autoprefixer will use .browserslistrc to add vendor prefixes for Safari 14.1.2
    autoprefixer: {},
  },
};

export default config;
