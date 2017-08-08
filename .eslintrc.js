module.exports = {
  "extends": "airbnb",
  "env": {
    "browser": true,
    "mocha": true,
  },
  "plugins": ["react"],
  "rules" : {
    "import/no-extraneous-dependencies": ["error", { devDependencies: true }],
  }
};
