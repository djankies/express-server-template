export default {
  '*.{js,mjs,cjs}': ['npm run lint:fix'],
  '*.md': ['npm run lint:fix'],
  '*': ['prettier --write --ignore-unknown'],
};
