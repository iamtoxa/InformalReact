import '~/styles/main.scss'

import App from 'next/app';
import React, { useState, useEffect } from 'react';
import { CookiesProvider, Cookies, withCookies, useCookies } from 'react-cookie';
import { Provider as ReduxProvider, useSelector } from "react-redux";

import dynamic from 'next/dynamic'
import cookie from 'cookie';

import { TOGGLE_DARKTHEME, UPDATE_ACCESS } from "~/redux/actions";

import withApollo from '../lib/withApollo'
import { ApolloProvider } from '@apollo/react-hooks';

import Navbar from "~/components/Navbar/Navbar";
const ToastsPanel = dynamic(() => import('~/components/ToastsPanel/Panel'))
const LoadIndicator = dynamic(() => import('~/components/LoadIndicator'))
const ModalLayer = dynamic(() => import('~/components/ModalLayer'))


import Router from 'next/router'

import { createStore } from "redux";
import rootReducer from "~/redux/reducers";

function MyApp({ Component, pageProps, router, cookies, initialCookies, apolloClient }) {
  const [init, setInit] = useState(true);
  const [loading, setLoading] = useState(false);

  if (typeof window === 'undefined') {
    cookies.get = (name) => {
      return initialCookies[name];
    }
  }

  let initialState = {
    modals: { appendToast: null, appendModal: null },
    theme: { darkThemeEnabled: cookies.get('darkThemeEnabled') == 'true' },
    auch: { access: cookies.get('accessToken') || undefined, refresh: cookies.get('refreshToken') || undefined }
  };
  const store = createStore(rootReducer, initialState);

  Router.events.on('routeChangeStart', (url) => {
    setLoading(true);
  })
  Router.events.on('routeChangeComplete', () => { setLoading(false); })
  Router.events.on('routeChangeError', () => { setLoading(false); })


  useEffect(() => {
    try {
      document.getElementById('main').scroll({
        top: 0,
        left: 0,
        behavior: 'smooth'
      });
    } catch (error) {
      document.getElementById('main').scrollTo(0, 0);
    }
  });

  return (
    <ApolloProvider client={apolloClient}>
      <CookiesProvider cookies={cookies}>
        <ReduxProvider store={store}>
          <main id='main' className={(cookies.get('darkThemeEnabled') == 'true' ? router.route != '/landing' ? 'theme-dark' : 'theme-light' : 'theme-light') + (router.route == '/landing' ? " no_menu" : "")}>
            {router.route != '/landing' && <Navbar />}
            <Component {...pageProps} key={router.asPath} />
            <LoadIndicator active={loading} />
            <ToastsPanel />
            <ModalLayer />
          </main>
        </ReduxProvider>
      </CookiesProvider>
    </ApolloProvider>
  )
}

MyApp.getInitialProps = async (appContext) => {
  const request = appContext.ctx.req;
  const cookies = request && request.headers.cookie ? Object.fromEntries(request.headers.cookie.split('; ').map(el => { return el.split('=') })) : {};

  // Call the page's `getInitialProps` and fill `appProps.pageProps`
  const appProps = await App.getInitialProps(appContext);
  return { ...appProps, initialCookies: cookies };
};

export default withCookies(withApollo(MyApp))