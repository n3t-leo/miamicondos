import type { CollectionConfig } from 'payload'

export const Media: CollectionConfig = {
  slug: 'media',
  access: {
    read: () => true,
  },
  // Enable folders for this collection (beta feature)
  folders: true,
  admin: {
    useAsTitle: 'alt',
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
    },
  ],
  upload: {
    mimeTypes: ['image/*'],
    displayPreview: true,
    adminThumbnail: 'thumbnail',
    imageSizes: [{ name: 'thumbnail', width: 400, height: 300, position: 'centre' }],
  },
}
