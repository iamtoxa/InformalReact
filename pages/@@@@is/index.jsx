import { useState, useRef } from 'react';
import Head from 'next/head'

import { Container, Row, Col, Form, Button } from 'react-bootstrap';


function Page() {
  return (
    <>
      <Head>
        <title>Informal Place</title>
        <link rel="icon" href="/favicon.ico" />
        <meta name="Description" content="Informal Place - education service" />
      </Head>

      <Container fluid style={{background: "#000000"}}>
          <Row style={{minHeight:"100vh", display: 'flex', alignItems: 'center'}}>
              <Col className="mx-n3" style={{background: "#000000", display: 'flex', alignItems: 'center', justifyContent:'center', minHeight:"100vh", maxWidth: "100vw"}}>
                <img style={{maxHeight:"800px"}} src="/images/NotEvenClose.png" alt=""/>
              </Col>
          </Row>
      </Container>
    </>
  )
}


export default Page