import Head from 'next/head'
import { motion } from "framer-motion"
import { Container, Button, Row, Col, Card, ListGroup, Form } from 'react-bootstrap'
import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useQuery, useMutation } from '@apollo/react-hooks';
import { gql } from 'apollo-boost';
import { useSelector, useDispatch } from "react-redux";
import ImageLoader from '~/components/imageLoader'
import { CREATE_TOAST } from "~/redux/actions";
import { CREATE_MODAL } from "~/redux/actions";
import { withApollo } from '@apollo/react-hoc';

import CourseCard from '~/components/CourseCard'

const CATEGORIES_LIST = gql`
query{
  categoriesList{
    ID
    name
  }
}
`;

const COURSE_PUBLISH = gql`
    mutation courseCreate($name: String!, $short: String!, $description: String!, $categoryID: ID!, $image: String!){
      courseCreate(info:{name: $name, short: $short, description: $description, _categoryID: $categoryID, image: $image}){
        ID
      }
    }
`;


const Page = ({ client: apolloClient, userID, categories }) => {
  const router = useRouter()
  const dispatch = useDispatch();

  const [image, setImage] = useState("https://user-images.githubusercontent.com/194400/49531010-48dad180-f8b1-11e8-8d89-1e61320e1d82.png");

  const name = useRef();
  const short = useRef();
  const category = useRef();
  const description = useRef();

  const handlePublish = (event) => {
    event.preventDefault()

    apolloClient.mutate({
      mutation: COURSE_PUBLISH,
      variables: {
        name: name.current.value,
        short: short.current.value,
        description: description.current.value,
        categoryID: category.current.value,
        image: image
      }
    })
      .then(({ data }) => {
        apolloClient.resetStore();
        router.push(`/course/${data.courseCreate.ID}`)
        return true;
      })
      .catch(() => {
        dispatch({
          type: CREATE_TOAST, props: {
            type: "danger",
            title: "Избранное",
            body: <span>Что-то пошло не так. Проверьте корректность данных. или обратитесь в <a href='mailto:iamtoxa00@gmail.com'>службу поддержки</a></span>
          }
        });

        return false;
      })
  }

  const imagePreview = (info) => {
    setImage(`https://storage.informalplace.ru/${info.Key}`)
  }

  return (<>
    <Head>
      <title>Создание курса</title>
    </Head>

    <motion.div transition={{ duration: 0.2, delay: 0 }} initial={{ opacity: 0, translateX: -50 }} animate={{ opacity: 1, translateX: 0 }} exit={{ opacity: 0 }} >
      <Container className='py-3 controlPanelPage'>
        <Row>
          <Col md={12}>
            <Card className='accountSettings'>
              <Form onSubmit={handlePublish}>
                <Card.Header>Основная информация</Card.Header>
                <Card.Body>
                  <Row>
                    <Col sm={12} md={6} lg={6} xl={5}>
                      <Row>
                        <Col sm={12}>
                          <ImageLoader ratio={3 / 2} uploadType='course' label='Иллюстрация' onUpload={imagePreview} />
                        </Col>
                        {/* {name.current && name.current.value && (
                          <Col sm={12} className='mt-3'>
                          <p className='pb-2 m-0'>Предпросмотр</p>
                          <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
                            <CourseCard template data={{
                              name: name.current.value,
                              short: short.current.value,
                              image: image,
                              hidden: true
                            }} />
                          </div>
                        </Col>
                        )} */}
                      </Row>
                    </Col>
                    <Col sm={12} md={6} lg={6} xl={7}>
                      <Row>
                        <Col md={12}>
                          <Form.Group controlId="FormMainInfo.ControlName">
                            <Form.Label>Название курса</Form.Label>
                            <Form.Control name='name' as="input" maxlength="30" ref={name} required />
                          </Form.Group>
                        </Col>
                        <Col md={12}>
                          <Form.Group controlId="FormMainInfo.ControlShort">
                            <Form.Label>Короткое описание</Form.Label>
                            <Form.Control name='short' as="textarea" maxlength="250" ref={short} required />
                          </Form.Group>
                        </Col>
                        <Col md={12}>
                          <Form.Group controlId="FormMainInfo.ControlShort">
                            <Form.Label>Полное описание</Form.Label>
                            <Form.Control name='description' as="textarea" maxlength="500" ref={description} required />
                          </Form.Group>
                        </Col>
                        <Col md={12}>
                          <Form.Group controlId="FormMainInfo.ControlCategory">
                            <Form.Label>Категория</Form.Label>
                            <Form.Control name='category' as="select" ref={category} required>
                              {categories && categories.map(el => { return (<option value={el.ID} key={el.ID}>{el.name}</option>) })}
                            </Form.Control>
                          </Form.Group>
                        </Col>
                      </Row>
                    </Col>
                  </Row>
                </Card.Body>
                <Card.Footer align='right'>
                  <Button className="btn-icon" type='submit'>Создать курс</Button>
                </Card.Footer>
              </Form>
            </Card>
          </Col>
        </Row>
      </Container>
    </motion.div>
  </>)

}

Page.getInitialProps = async (ctx) => {
  var atob = require('atob');
  var redirect = require('~/lib/redirect').default;

  const checkLoggedIn = require('~/lib/checkLoggedIn').default;
  const AccessToken = checkLoggedIn(ctx);

  const b64DecodeUnicode = (str) => {
    return decodeURIComponent(atob(str).split('').map(function (c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
  }

  const userID = AccessToken ? JSON.parse(b64DecodeUnicode(AccessToken.split('.')[1])).userId : false;

  if (!userID) {
    redirect(ctx, '/login')
    return {};
  }


  const { categories } = await ctx.apolloClient
    .query({ query: CATEGORIES_LIST })
    .then(({ data }) => {
      return { categories: data.categoriesList }
    })
    .catch(() => {
      return { categories: [] }
    })

  return { userID, categories }
}

export default withApollo(Page)