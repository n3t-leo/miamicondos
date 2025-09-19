import type { GlobalConfig } from 'payload'

export const Settings: GlobalConfig = {
  slug: 'settings',
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'homePage',
      label: 'Homepage',
      type: 'relationship',
      relationTo: 'pages',
      required: false,
      admin: {
        description: 'Select a Page to use as the site homepage.',
      },
    },
  ],
}

export default Settings
