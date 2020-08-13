const https = require('https');
const fs = require('fs');
const express = require('express')
var path = require('path');
const next = require('next')

const port = parseInt(process.env.PORT, 10) || 3000
const dev = process.env.NODE_ENV !== 'production'
const app = next({ dev })
const handle = app.getRequestHandler()

const httpsOptions = {
  key: fs.readFileSync('./https/key.pem'),
  cert: fs.readFileSync('./https/cert.pem')
};

app.prepare().then(() => {
  const expressApp = express()

  expressApp.get('/sitemap.xml', async (req, res) => {
    const sitemapOptions = {
      headers: {
        'Content-Type': 'text/xml;charset=UTF-8'
      }
    };
    
    const { ApolloClient } = require('apollo-client');
    const { gql } = require('apollo-boost');
    const { createHttpLink } = require('apollo-link-http');
    const { IntrospectionFragmentMatcher, InMemoryCache } = require('apollo-cache-inmemory');
    const introspectionQueryResultData = require('./fragmentTypes.json');
    const fragmentMatcher = new IntrospectionFragmentMatcher({
      introspectionQueryResultData
    });

    
    const client = new ApolloClient({
      link: createHttpLink({ uri: 'https://api.informalplace.ru' }),
      credentials: 'same-origin',
      cache: new InMemoryCache({fragmentMatcher}).restore({})
    });

    var coursesList = await client.query({
      query: gql`
        query coursesList {
          coursesList(limit: 500, sortBy:newest){
            ID
            name
            short
            pubdate
          }
        }
      `
    })
    .then(({data}) => {
      return data.coursesList;
    });

    var usersList = await client.query({
      query: gql`
        query coursesList {
          usersList{
            ID
          }
        }
      `
    })
    .then(({data}) => {
      return data.usersList;
    });



    res.writeHead(200, {
      'Content-Type': 'text/xml;charset=UTF-8'
    })
    res.write(`<?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      <url>
          <loc>https://informalplace.ru/</loc>
          <changefreq>always</changefreq>
          <priority>1.0</priority>
      </url>
      ${coursesList.map(course=>{
        return `<url>
          <loc>https://informalplace.ru/course/${course.ID}</loc>
          <changefreq>weekly</changefreq>
          <priority>0.9</priority>
        </url>`
      }).join('')}
      ${usersList.map(user=>{
        return `<url>
          <loc>https://informalplace.ru/user/${user.ID}</loc>
          <changefreq>weekly</changefreq>
          <priority>0.8</priority>
        </url>`
      }).join('')}
    </urlset>
    `)
  });

  expressApp.all('*', (req, res) => {
    return handle(req, res)
  })

  https.createServer(httpsOptions, expressApp).listen(port, (err) => {
    if (err) throw err
    console.log(`> Ready on http://localhost:${port}`)
  });
})