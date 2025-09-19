import type { Block } from 'payload'

export const ContentBlock: Block = {
  slug: 'content',
  labels: {
    singular: 'Content Block',
    plural: 'Content Blocks',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'content',
      type: 'richText',
      label: 'Content',
      required: false,
    },
    {
      name: 'cta',
      type: 'group',
      label: 'Call to Action',
      fields: [
        { name: 'label', type: 'text', required: false },
        { name: 'url', type: 'text', required: false },
      ],
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      required: false,
    },
  ],
}

export default ContentBlock
