// Dynamic sitemap.xml generation
import { prisma } from '~~/server/utils/db'

const SITE_URL = 'https://v-more.store'

export default defineEventHandler(async (event) => {
  // Static pages
  const staticPages = [
    { url: '/', priority: 1.0, changefreq: 'daily' },
    { url: '/boats', priority: 0.9, changefreq: 'daily' },
    { url: '/group-trips', priority: 0.9, changefreq: 'daily' },
    { url: '/about', priority: 0.7, changefreq: 'monthly' },
    { url: '/contacts', priority: 0.7, changefreq: 'monthly' }
  ]

  // Get dynamic boat pages from database
  let boatPages: { url: string; priority: number; changefreq: string; lastmod?: string }[] = []
  try {
    const boats = await prisma.boat.findMany({
      where: { isActive: true },
      select: { id: true, updatedAt: true }
    })

    boatPages = boats.map(boat => ({
      url: `/boats/${boat.id}`,
      priority: 0.8,
      changefreq: 'weekly',
      lastmod: boat.updatedAt.toISOString().split('T')[0]
    }))
  } catch (error) {
    console.error('Sitemap: Error fetching boats:', error)
  }

  // Get group trip service pages
  const servicePages = [
    { url: '/group-trips/services/SHORT', priority: 0.8, changefreq: 'weekly' },
    { url: '/group-trips/services/MEDIUM', priority: 0.8, changefreq: 'weekly' },
    { url: '/group-trips/services/FISHING', priority: 0.8, changefreq: 'weekly' }
  ]

  // Combine all pages
  const allPages = [...staticPages, ...boatPages, ...servicePages]

  // Generate XML
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allPages.map(page => `  <url>
    <loc>${SITE_URL}${page.url}</loc>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>${page.lastmod ? `
    <lastmod>${page.lastmod}</lastmod>` : ''}
  </url>`).join('\n')}
</urlset>`

  // Set headers
  setHeader(event, 'Content-Type', 'application/xml')
  setHeader(event, 'Cache-Control', 'public, max-age=3600') // Cache for 1 hour

  return xml
})
