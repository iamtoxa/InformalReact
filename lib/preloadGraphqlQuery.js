const preloadGraphqlQuery = async (apolloClient, options) => {

    return apolloClient
      .query({
        ...options
      })
      .then(({ data }) => {
        return { data: data }
      })
      .catch((e) => {
        return { data: {} }
      })
  
  };

export default preloadGraphqlQuery