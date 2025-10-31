
module.exports = {
  title: 'New Haven and Northampton Canal',
  tagline: "New England's longest canal",
  url: 'https://nhncanal.org',
  baseUrl: '/',
  onBrokenLinks: 'throw',
  favicon: 'img/favicon.ico',

  organizationName: 'nhncanal',
  projectName: 'website',

  stylesheets: [
    {
      href: 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css',
      crossorigin: 'anonymous',
    },
  ],

  markdown: {
    hooks: {
      onBrokenMarkdownLinks: 'warn',
    },
  },

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */ (
        {
          docs: false,
          blog: false,
          theme: {
            customCss: require.resolve('./src/css/custom.css'),
          },
        }
      ),
    ],
  ],

  themeConfig: /** @type {import('@docusaurus/preset-classic').ThemeConfig} */ ({
    colorMode: {
      defaultMode: 'dark',
      disableSwitch: false,
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: 'Map of the New Haven and Northampton Canal',
      logo: {
        alt: 'Canal company seal',
        src: 'img/logo.png',
      },
      items: [
        { to: '/sources', label: 'Sources', position: 'left' },
        { to: '/towns', label: 'Towns', position: 'left' },
      ],
    },
    footer: {
      style: 'dark',
      copyright: `
        <div style="display: flex; gap: 1.5rem; justify-content: center; align-items: center; font-size: 1.5rem;">
          <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer" aria-label="Creative Commons BY 4.0" title="CC BY 4.0">
            <i class="fab fa-creative-commons"></i>
          </a>
          <a href="mailto:mail@nhncanal.org" aria-label="Email" title="mail@nhncanal.org">
            <i class="fas fa-envelope"></i>
          </a>
          <a href="https://github.com/ianml" target="_blank" rel="noopener noreferrer" aria-label="GitHub" title="GitHub">
            <i class="fab fa-github"></i>
          </a>
        </div>
      `,
    },
  }),
};
