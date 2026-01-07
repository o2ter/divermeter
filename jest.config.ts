export default {
  setupFiles: [
    "<rootDir>/node_modules/core-js",
  ],
  moduleNameMapper: {
    "~/(.*)": "<rootDir>/src/$1",
  },
  transform: {
    "^.+\\.tsx?$": "ts-jest",
  }, 
};