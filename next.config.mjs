import nextMDX from '@next/mdx';

const withMDX = nextMDX({
  extension: /\.mdx?$/,
});

export default withMDX({
  experimental: {
    appDir: true,
  },
  pageExtensions: ['ts', 'tsx', 'mdx', 'md'],
});
