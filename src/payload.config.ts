// storage-adapter-import-placeholder
import { s3Storage } from '@payloadcms/storage-s3'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { payloadCloudPlugin } from '@payloadcms/payload-cloud'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { formBuilderPlugin } from '@payloadcms/plugin-form-builder'
import { nestedDocsPlugin } from '@payloadcms/plugin-nested-docs'
import { searchPlugin } from '@payloadcms/plugin-search'
import { seoPlugin } from '@payloadcms/plugin-seo'
import { importExportPlugin } from '@payloadcms/plugin-import-export'

import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { ContentBlock } from './blocks/Content'
import { Settings } from './globals/Settings'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

// Read S3/Supabase Storage env vars with fallbacks
const S3_BUCKET = process.env.SUPABASE_S3_BUCKET || process.env.S3_BUCKET
const S3_ENDPOINT = process.env.SUPABASE_S3_ENDPOINT || process.env.S3_ENDPOINT
const S3_REGION = process.env.SUPABASE_S3_REGION || process.env.S3_REGION || 'us-east-1'
const S3_ACCESS_KEY_ID = process.env.SUPABASE_S3_ACCESS_KEY_ID || process.env.S3_ACCESS_KEY_ID
const S3_SECRET_ACCESS_KEY =
  process.env.SUPABASE_S3_SECRET_ACCESS_KEY || process.env.S3_SECRET_ACCESS_KEY
const S3_PREFIX = process.env.SUPABASE_S3_PREFIX || process.env.S3_PREFIX || undefined

export default buildConfig({
  admin: {
    user: Users.slug,
    autoRefresh: true,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [
    Users,
    Media,
    {
      slug: 'pages',
      fields: [
        {
          name: 'title',
          type: 'text',
        },
        {
          name: 'slug',
          type: 'text',
          admin: {
            description: 'URL path for this page (e.g. about, contact). Leave blank for home.',
          },
        },
        {
          name: 'layout',
          type: 'blocks',
          blocks: [ContentBlock],
          admin: {
            description: 'Add content blocks that will render on the frontend.',
          },
        },
        // Admin-only UI field to show a "View" button linking to the frontend URL
        {
          name: 'viewButton',
          type: 'ui',
          admin: {
            components: {
              Field: '/components/admin/ViewButton',
            },
            position: 'sidebar',
          },
        },
      ],
    },
  ],
  globals: [Settings],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URI || '',
    },
  }),
  sharp,
  folders: {
    // Enable browse-by-folder view and use default field/collection names
    browseByFolder: true,
    // fieldName: 'folder',
    // slug: 'payload-folders',
    // debug: false,
  },
  plugins: [
    formBuilderPlugin({}),
    importExportPlugin({
      collections: ['users', 'pages'],
    }),
    nestedDocsPlugin({
      collections: ['pages'],
      generateLabel: (_docs: Record<string, unknown>[], doc: Record<string, unknown>) => {
        const title = doc['title']
        return typeof title === 'string' ? title : 'Untitled'
      },
      generateURL: (docs: Record<string, unknown>[]) =>
        docs.reduce((url, doc) => {
          const slug = doc['slug']
          return `${url}/${typeof slug === 'string' ? slug : ''}`
        }, ''),
    }),
    payloadCloudPlugin(),
    s3Storage({
      collections: {
        media: {
          prefix: S3_PREFIX,
        },
      },
      bucket: S3_BUCKET!,
      config: {
        endpoint: S3_ENDPOINT!,
        region: S3_REGION,
        forcePathStyle: true,
        credentials: {
          accessKeyId: S3_ACCESS_KEY_ID!,
          secretAccessKey: S3_SECRET_ACCESS_KEY!,
        },
      },
    }),
    searchPlugin({
      collections: ['pages'],
      defaultPriorities: {
        pages: 10,
      },
    }),
    seoPlugin({
      collections: ['pages'],
      globals: ['settings'],
      uploadsCollection: 'media',
      generateTitle: ({ doc }) => `${doc.title} | Condohub`,
      generateDescription: ({ doc }) => doc.excerpt,
    }),
  ],
})
