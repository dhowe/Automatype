module.exports = {
  extends: 'node-style-guide',
  rules: {
    'space-after-keywords': 'off',
    'keyword-spacing': [2, {before: true, after: true}],
    'max-statements': ['error', 25],
    'curly': ["error", "multi-line"]
  }
};
