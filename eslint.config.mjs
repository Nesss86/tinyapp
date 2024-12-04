import babelParser from "@babel/eslint-parser";

export default [
  {
    files: ["**/*.js"], // Specify files ESLint should process
    languageOptions: {
      parser: babelParser, // Use the parser directly
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        requireConfigFile: false, // Prevents it from looking for a Babel config file
      },
      globals: {
        structuredClone: "readonly", // Define `structuredClone` as a global
      },
    },
    rules: {
      
    },
  },
];





