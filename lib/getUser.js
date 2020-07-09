import gql from 'graphql-tag'




export default apolloClient =>
  apolloClient
    .query({
      query: gql`
        query getUser {
          me {
            ID
            firstName
            lastName
            email
            image
            balance
          }
        }
      `
    })
    .then(({ data }) => {
      return { ...data.me }
    })
    .catch(() => {
      // Fail gracefully
      return false
    })