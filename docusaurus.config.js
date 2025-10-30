
module.exports = {
  title: 'New Haven and Northampton Canal',
  tagline: "New England's longest canal",
  url: 'https://nhncanal.org',
  baseUrl: '/',
  onBrokenLinks: 'throw',
  favicon: 'img/favicon.ico',

  organizationName: 'nhncanal',
  projectName: 'website',

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
        alt: 'Canal company logo',
        src: 'img/logo.png',
      },
      items: [
        { to: '/sources', label: 'Sources', position: 'left' },
        { to: '/towns', label: 'Towns', position: 'left' },
      ],
    },
    footer: {
      style: 'dark',
      copyright: `Copyright © ${new Date().getFullYear()} New Haven and Northampton Canal Project`,
    },
  }),
};
