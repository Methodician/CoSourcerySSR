import 'zone.js/dist/zone-node';
import { enableProdMode } from '@angular/core';
// Express Engine
import { ngExpressEngine } from '@nguniversal/express-engine';
// Import module map for lazy loading
import { provideModuleMap } from '@nguniversal/module-map-ngfactory-loader';

import * as express from 'express';
import { join } from 'path';

// Polyfills required for Firebase
(global as any).XMLHttpRequest = require('xhr2');
// may also come in handy
// (global as any).WebSocket = require('ws');

// Import gCloud debug-agent for Stackdriver debugging
import * as debugAgent from '@google-cloud/debug-agent';
// Enable gCould debug-agent
debugAgent.start();

// Faster server renders w/ Prod mode (dev mode never needed)
enableProdMode();

// Express server
const app = express();

const PORT = process.env.PORT || 4000;
const DIST_FOLDER = join(process.cwd(), 'dist/browser');

// * NOTE :: leave this as require() since this file is built Dynamically from webpack
const { AppServerModuleNgFactory, LAZY_MODULE_MAP } = require('./server/main');

// Our Universal express-engine (found @ https://github.com/angular/universal/tree/master/modules/express-engine)
app.engine(
  'html',
  ngExpressEngine({
    bootstrap: AppServerModuleNgFactory,
    providers: [provideModuleMap(LAZY_MODULE_MAP)],
  }),
);

app.set('view engine', 'html');
app.set('views', DIST_FOLDER);

// Example Express Rest API endpoints
// app.get('/api/**', (req, res) => { });

const generateSiteMap = () => {
  const lastmod = new Date().toISOString();
  const articleSlugs = [
    'get-large-fenestrated-leaves-on-your-monstera-deliciosa',
    'grow-aroids-in-glass',
    'how-to-re-pot-a-house-plant',
    'hydroponics-the-kratky-jar',
    'hydroponics-deep-water-culture',
    'save-time-and-money-with-your-instant-pot',
    'how-to-use-google-calendar-as-a-super-charged-to-do-list',
    'zucchini-bread-vegan',
    'github-pages-for-the-budding-technical-writer',
    'grow-some-food-in-kratky-jars',
    'contributing-to-cosourcery',
    'how-to-grow-store-bought-celery-at-home-using-hydroponics',
    'a-quick-list-of-the-pros-and-cons-of-using-hydroponics-kratky-method',
  ];

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
      `https://cosourcery.com/${slug}`,
      lastmod,
      1.0,
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

app.get('/sitemap.xml', (req, res) => {
  const sitemap = generateSiteMap();
  res.header('Content-Type', 'text/xml');
  res.send(sitemap);
});

// Serve static files from /browser
app.get(
  '*.*',
  express.static(DIST_FOLDER, {
    maxAge: '1y',
  }),
);

// All regular routes use the Universal engine
app.get('*', (req, res) => {
  res.render('index', { req });
});

// Start up the Node server
app.listen(PORT, () => {
  console.log(`Node Express server listening on http://localhost:${PORT}`);
});
