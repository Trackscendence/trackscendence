const quoteFiles = (files) =>
  files.map((file) => JSON.stringify(file)).join(' ')

export default {
  '*.{css,html,js,jsx,json,md,yaml,yml}': (files) => [
    `prettier --write ${quoteFiles(files)}`,
    `cspell --no-progress --no-summary ${quoteFiles(files)}`,
  ],
  'client/**/*.{js,jsx}': () => 'npm run lint:client -- --fix',
}
