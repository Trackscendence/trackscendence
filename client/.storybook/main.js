import path from 'node:path'
import { mergeConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import svgr from 'vite-plugin-svgr'

const config = {
  stories: ['../src/**/*.stories.@(js|jsx)'],
  addons: [],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  viteFinal: (viteConfig) =>
    mergeConfig(viteConfig, {
      plugins: [tailwindcss(), svgr()],
      resolve: {
        alias: {
          '@': path.resolve(import.meta.dirname, '../src'),
        },
      },
    }),
}

export default config
