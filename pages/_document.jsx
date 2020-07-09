import Document, { Html, Head, Main, NextScript } from 'next/document'

class MyDocument extends Document {
  static async getInitialProps(ctx) {
    const initialProps = await Document.getInitialProps(ctx)
    return { ...initialProps }
  }

  render() {
    return (
      <Html lang="ru">
        <Head>
          <link rel="icon" href="/favicon.ico" />
          <script data-ad-client="ca-pub-5077557270258535" async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js" />
          <base href="/"/>

          <link rel='manifest' href='/manifest.json'/>
          <meta charSet="utf-8" />
          <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
          <meta name="viewport" content="width=device-width,initial-scale=1,minimum-scale=1,maximum-scale=5" />

          <meta name="theme-color" content="#2d9cdb" />
          <meta name="mobile-web-app-capable" content="yes" />

          <link rel="apple-touch-icon" href="/favicons/apple-touch-icon.png"/>
          <meta name="apple-mobile-web-app-title" content="Informal Place" />
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-status-bar-style" content="default" />

          <meta name="application-name" content="Informal Place" />
          <meta name="msapplication-tooltip" content="Образовательная платформа" />
          <meta name="msapplication-starturl" content="/" />


          <meta name="full-screen" content="yes" />
          <meta name="browsermode" content="application" />
          <meta name="nightmode" content="enable/disable" />
          <meta name="layoutmode" content="fitscreen/standard" />
          <meta name="imagemode" content="focrce" />
          <meta name="screen-orientation" content="portrait" />

          <script type="module" dangerouslySetInnerHTML={{__html:`
            import 'https://cdn.jsdelivr.net/npm/@pwabuilder/pwaupdate';

            const el = document.createElement('pwa-update');
            document.body.appendChild(el);
          `}}/>
           
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    )
  }
}

export default MyDocument