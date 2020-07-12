const https = require('https');
const fs = require('fs');
const express = require('express')
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

  expressApp.all('*', (req, res) => {
    res.header('X-Content-Type-Options', 'nosniff');
    return handle(req, res)
  })

  https.createServer(httpsOptions, expressApp).listen(port, (err) => {
    if (err) throw err
    console.log(`> Ready on http://localhost:${port}`)
  });
})
