import axios from 'axios';

export const generateSiteMap = async () => {
  const lastmod = new Date().toISOString();
  const slugsUrl = 'https://cosourcery.firebaseio.com/articleData/slugs.json';
  const usersUrl = 'https://cosourcery.firebaseio.com/userInfo/open.json';

  const responses = await axios.all([axios.get(slugsUrl), axios.get(usersUrl)]);
  const articleSlugs = Object.keys(responses[0].data);
  const userIds = Object.keys(responses[1].data);

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
      <urlset
        xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
            http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">`;

  const homeBlock = generateUrlBlock(
    'https://cosourcery.com/',
    lastmod,
    0.75,
    'daily',
  );
  xml += homeBlock;

  for (let slug of articleSlugs) {
    const block = generateUrlBlock(
      `https://cosourcery.com/article/${slug}`,
      lastmod,
      1.0,
      'monthly',
    );

    xml += block;
  }

  for (let id of userIds) {
    const block = generateUrlBlock(
      `https://cosourcery.com/profile/${id}`,
      lastmod,
      0.5,
      'monthly',
    );

    xml += block;
  }

  xml += '</urlset>';
  return xml;
};

const generateUrlBlock = (
  loc: string,
  lastmod: string,
  priority: number,
  changefreq:
    | 'always'
    | 'hourly'
    | 'daily'
    | 'weekly'
    | 'monthly'
    | 'yearly'
    | 'never',
) => {
  let xml = '<url>';
  xml += `<loc>${loc}</loc>`;
  xml += `<lastmod>${lastmod}</lastmod>`;
  xml += `<priority>${priority}</priority>`;
  xml += `<changefreq>${changefreq}</changefreq>`;
  xml += '</url>';

  return xml;
};

// app.get('/sitemap.xml', async (req, res) => {
//   const sitemap = await generateSiteMap();
//   res.header('Content-Type', 'text/xml');
//   res.send(sitemap);
// });
