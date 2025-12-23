import { defineConfig } from 'windicss/helpers';

export default defineConfig({
  preflight: false,
  theme: {
    colors: {
      primary: 'var(--color-primary)',
    },
  },
  extract: {
    include: ['**/*.{html,jsx,tsx}'],
    exclude: ['.git', '.ice', 'node_modules', 'build', '.history', '.husky'],
  },
  attributify: true,
  shortcuts: {
    btn: 'rounded-lg border border-gray-300 text-gray-100 bg-primary px-4 py-2 m-2 inline-block hover:shadow cursor-pointer',
  },
});
