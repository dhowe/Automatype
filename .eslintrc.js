module.exports = {
  extends: 'node-style-guide',
  rules: {
    'space-after-keywords': 'off',
    'keyword-spacing': ["error", {before: true, after: true}],
    'max-statements': ['warn', 25],
    'curly': ["error", "multi-line"]
  }
};
