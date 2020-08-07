import '~/styles/main.scss'

import App from 'next/app';
import React, { useState, useEffect } from 'react';
import { CookiesProvider, Cookies, withCookies, useCookies } from 'react-cookie';
import { Provider as ReduxProvider, useSelector } from "react-redux";

import dynamic from 'next/dynamic'
import store from "~/redux/store";
import cookie from 'cookie';

import { TOGGLE_DARKTHEME, UPDATE_ACCESS } from "~/redux/actions";

import withApollo from '../lib/withApollo'
import { ApolloProvider } from '@apollo/react-hooks';

import Navbar from "~/components/Navbar/Navbar";
const ToastsPanel = dynamic(() => import('~/components/ToastsPanel/Panel'))
const LoadIndicator = dynamic(() => import('~/components/LoadIndicator'))
const ModalLayer = dynamic(() => import('~/components/ModalLayer'))

function MyApp({ Component, pageProps, router, cookies, initialCookies, reduxStore, apolloClient }) {
  const [init, setInit] = useState(true);
  const [loading, setLoading] = useState(true);

  if(typeof window === 'undefined'){
    cookies.get = (name)=>{
      return initialCookies[name];
    }
  }

  if(init){
    setInit(false);
    if(cookies.get('accessToken')) store.dispatch({ type: UPDATE_ACCESS, value: cookies.get('accessToken') })
    setLoading(false);
  }

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
            {router.route != '/landing' && <Navbar darkThemeEnabled={cookies.get('darkThemeEnabled') == 'true'}/>}
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
  const cookies = request && request.headers.cookie ? Object.fromEntries(request.headers.cookie.split('; ').map(el=>{return el.split('=')})) : {};

  // Call the page's `getInitialProps` and fill `appProps.pageProps`
  const appProps = await App.getInitialProps(appContext);
  return { ...appProps, initialCookies: cookies };
};

export default withCookies(withApollo(MyApp))




function deepEqual(object1, object2) {
  const keys1 = Object.keys(object1);
  const keys2 = Object.keys(object2);

  if (keys1.length !== keys2.length) {
    return false;
  }

  for (const key of keys1) {
    const val1 = object1[key];
    const val2 = object2[key];
    const areObjects = isObject(val1) && isObject(val2);
    if (
      areObjects && !deepEqual(val1, val2) ||
      !areObjects && val1 !== val2
    ) {
      return false;
    }
  }

  return true;
}

function isObject(object) {
  return object != null && typeof object === 'object';
}