import { NextResponse } from 'next/server';

// This would typically fetch from your database
const getRestaurants = async () => {
  // Mock data - replace with actual API call
  return [
    { id: '1', name: 'One Aldwych', updatedAt: '2024-01-15' },
    { id: '2', name: 'The Clermont London', updatedAt: '2024-01-14' },
    { id: '3', name: 'Dishoom', updatedAt: '2024-01-13' },
    { id: '4', name: 'The Wolseley', updatedAt: '2024-01-12' },
    { id: '5', name: 'Sketch', updatedAt: '2024-01-11' },
  ];
};

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://bookmytable.com';
  const restaurants = await getRestaurants();
  
  const staticPages = [
    {
      url: '',
      lastModified: new Date().toISOString().split('T')[0],
      changeFrequency: 'daily',
      priority: '1.0',
    },
    {
      url: '/explore',
      lastModified: new Date().toISOString().split('T')[0],
      changeFrequency: 'daily',
      priority: '0.9',
    },
    {
      url: '/booking',
      lastModified: new Date().toISOString().split('T')[0],
      changeFrequency: 'weekly',
      priority: '0.8',
    },
    {
      url: '/about',
      lastModified: new Date().toISOString().split('T')[0],
      changeFrequency: 'monthly',
      priority: '0.6',
    },
    {
      url: '/contact',
      lastModified: new Date().toISOString().split('T')[0],
      changeFrequency: 'monthly',
      priority: '0.6',
    },
    {
      url: '/privacy',
      lastModified: new Date().toISOString().split('T')[0],
      changeFrequency: 'yearly',
      priority: '0.4',
    },
    {
      url: '/terms',
      lastModified: new Date().toISOString().split('T')[0],
      changeFrequency: 'yearly',
      priority: '0.4',
    },
  ];

  const restaurantPages = restaurants.map(restaurant => ({
    url: `/restaurants/${restaurant.id}`,
    lastModified: restaurant.updatedAt,
    changeFrequency: 'weekly',
    priority: '0.7',
  }));

  const allPages = [...staticPages, ...restaurantPages];

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allPages
  .map(
    page => `  <url>
    <loc>${baseUrl}${page.url}</loc>
    <lastmod>${page.lastModified}</lastmod>
    <changefreq>${page.changeFrequency}</changefreq>
    <priority>${page.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>`;

  return new NextResponse(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
