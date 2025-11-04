/**
 * Explicit sidebar for the towns docs plugin instance.
 *
 * The structure below places the `Towns` index at the top and lists each
 * town as a child in the requested south-to-north order so the sidebar is
 * predictable and stable.
 */
module.exports = {
  townsSidebar: [
    // Top-level doc: the Towns index page
    {
      type: 'doc',
      id: 'index',
    },
    // State categories (each collapsible) so the top-level 'Towns' doc
    // remains as the main link and the states can be expanded/collapsed.
    {
      type: 'category',
      label: 'Connecticut',
      collapsed: true,
      items: [
        'new-haven',
        'hamden',
        'cheshire',
        'southington',
        'plainville',
        'farmington',
        'avon',
        'simsbury',
        'east-granby',
        'granby',
        'suffield',
      ],
    },
    {
      type: 'category',
      label: 'Massachusetts',
      collapsed: true,
      items: [
        'southwick',
        'westfield',
        'russell',
        'southampton',
        'easthampton',
        'northampton',
      ],
    },
  ],
};
