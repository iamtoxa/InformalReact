import Head from 'next/head'
import { motion } from "framer-motion"
import { Container, Button, Row, Col, Card, ListGroup, Form } from 'react-bootstrap'
import React, { useState } from 'react';
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useQuery, useMutation } from '@apollo/react-hooks';
import { gql } from 'apollo-boost';
import { useSelector, useDispatch } from "react-redux";
import VideoLoader from '~/components/VideoUploader/index'
import { CREATE_TOAST } from "~/redux/actions";
import { CREATE_MODAL } from "~/redux/actions";
import { BsCollectionPlay } from 'react-icons/bs';
import { FaTasks } from 'react-icons/fa';

import { Formik } from 'formik';
import { object as yupObject, string as yupString, number as yupNumber, setLocale } from 'yup';
import { withApollo } from '@apollo/react-hoc';

setLocale({
  mixed: {
    required: 'Обязательное поле',
  },
  string: {
    min: 'Не менее ${min} символов',
    max: 'Не более ${max} символов'
  },
  number: {
    min: 'Не менее ${min} секунд',
    max: 'Не более ${max} секунд',
    integer: 'Чисто не может быть дробным'
  }
});


let schema = yupObject({
  title: yupString().required().min(5).max(50),
  description: yupString().required().min(10).max(500),
  timer: yupNumber('число').min(30).max(3600).integer().typeError('Необходимо указать целое число'),
}).defined();


function b64DecodeUnicode(str) {
  return decodeURIComponent(atob(str).split('').map(function (c) {
    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
  }).join(''));
}

const CREATE_TEST = gql`
    mutation testCreate($courseID:ID!, $title: String!, $timer: Int, $description: String!){
      testCreate(courseID: $courseID, info:{
        title: $title
        timer: $timer
        description: $description
      }){
        _lessonID
        course{
          ID
        }
      }
    }
`;

const CREATE_LECTION = gql`
    mutation lectionCreate($courseID:ID!, $title: String!, $video: String!, $description: String!){
      lectionCreate(courseID: $courseID, info:{
        title: $title
        description: $description
        video: $video
      }){
        _lessonID
        course{
          ID
        }
      }
    }
`;


const Page = ({ courseId, userID, client: apolloClient }) => {
  const router = useRouter()
  const dispatch = useDispatch();

  const [video, setVideo] = useState();
  const [type, setType] = useState();
  
  const handlePublishLection = (values) => {
    if(video){
      apolloClient.mutate({
        mutation: CREATE_LECTION,
        variables: {
          courseID: courseId,
          title: values.title,
          video: video,
          description: values.description
        }
      })
        .then(({ data }) => {
          router.push(`/controlPanel/course/${courseId}`)
          return true;
        })
        .catch(() => {
          return false;
        })
    } else {
      dispatch({
        type: CREATE_TOAST, props: {
          type: "success",
          title: "Создание урока",
          body: "Для начала загрузите видео"
        }
      });
    }
  }

  const handlePublishTest = (values) => {

    apolloClient.mutate({
      mutation: CREATE_TEST,
      variables: {
        courseID: courseId,
        title: values.title,
        timer: 0,
        description: values.description
      }
    })
      .then(({ data }) => {
        router.push(`/controlPanel/course/${courseId}`)
        return true;
      })
      .catch(() => {
        return false;
      })

  }

  const onUploaded = (src) => {
    setVideo(src)
    dispatch({
      type: CREATE_TOAST, props: {
        type: "success",
        title: "Загрузка видео",
        body: "Видео успешно загружено"
      }
    });
  }

  return (<>
    <Head>
      <title>Создание курса</title>
    </Head>

    <motion.div transition={{ duration: 0.2, delay: 0 }} initial={{ opacity: 0, translateX: -50 }} animate={{ opacity: 1, translateX: 0 }} exit={{ opacity: 0 }} >
      <Container className='py-3 lessonCreatePage'>

        <Row className='mb-3'>
          <Col xs={12}>
            <Card>
              <Card.Header>
                Выберите тип урока
            </Card.Header>
              <Card.Body>
                <Row>
                  <Col sm={6} align='center'>
                    <Button block className='lessonType' onClick={() => { setType('lection') }}>
                      <BsCollectionPlay className='icon' />
                      <span>Лекция</span>
                    </Button>
                  </Col>
                  <Col sm={6} align='center'>
                    <Button block className='lessonType' onClick={() => { setType('test') }}>
                      <FaTasks className='icon' />
                      <span>Тестирование</span>
                    </Button>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {type == 'lection' && (
          <motion.div transition={{ duration: 0.2, delay: 0 }} initial={{ opacity: 0, translateY: -50 }} animate={{ opacity: 1, translateY: 0 }} exit={{ opacity: 0 }} >
            <Row>
              <Col md={12}>
                <Card className='accountSettings'>
                  <Formik enableReinitialize onSubmit={handlePublishLection} validationSchema={schema} initialValues={{ title: "", description: "" }}>
                    {({
                      handleSubmit,
                      handleChange,
                      values,
                      touched,
                      isValid,
                      errors,
                      resetForm
                    }) => (
                        <>
                          <Card.Header>Информация о лекции</Card.Header>
                          <Card.Body>
                            <Row>
                              <Col sm={12} md={6} lg={6} xl={5}>
                                <Row>
                                  <Col sm={12}>
                                    <VideoLoader ratio={16 / 9} uploadType='video' label='Видео' onUpload={onUploaded} />
                                  </Col>
                                </Row>
                              </Col>
                              <Col sm={12} md={6} lg={6} xl={7}>

                                <Form noValidate>
                                  <Form.Row>
                                    <Form.Group as={Col} md="12" controlId="control_title">
                                      <Form.Label>Название урока</Form.Label>
                                      <Form.Control
                                        type="text"
                                        name="title"
                                        value={values.title}
                                        onChange={handleChange}
                                        isInvalid={!touched.title && errors.title}
                                      />
                                      <Form.Control.Feedback type='invalid'>
                                        {errors.title}
                                      </Form.Control.Feedback>
                                    </Form.Group>
                                  </Form.Row>

                                  <Form.Row>
                                    <Form.Group as={Col} md="12" controlId="control_description">
                                      <Form.Label>Описание урока</Form.Label>
                                      <Form.Control
                                        as='textarea'
                                        name="description"
                                        value={values.description}
                                        onChange={handleChange}
                                        isInvalid={!touched.description && errors.description}
                                      />
                                      <Form.Control.Feedback type='invalid'>
                                        {errors.description}
                                      </Form.Control.Feedback>
                                    </Form.Group>
                                  </Form.Row>

                                </Form>
                              </Col>
                            </Row>
                          </Card.Body>
                          <Card.Footer align='right'>
                            <Row>
                              <Col xs={12} align='right'>
                                <Button variant='outline-primary' type="button" onClick={resetForm} className='mr-3'>Вернуть к инзачальным</Button>
                                <Button type="button" onClick={handleSubmit}>Создать урок</Button>
                              </Col>
                            </Row>
                          </Card.Footer>
                        </>)}
                  </Formik>
                </Card>
              </Col>
            </Row>
          </motion.div>
        )}

        {type == 'test' && (
          <motion.div transition={{ duration: 0.2, delay: 0 }} initial={{ opacity: 0, translateY: -50 }} animate={{ opacity: 1, translateY: 0 }} exit={{ opacity: 0 }} >
            <Row>
              <Col md={12}>
                <Card className='accountSettings'>
                  <Formik enableReinitialize onSubmit={handlePublishTest} validationSchema={schema} initialValues={{ title: "", description: "" }}>
                    {({
                      handleSubmit,
                      handleChange,
                      values,
                      touched,
                      isValid,
                      errors,
                      resetForm
                    }) => (
                        <>
                          <Card.Header>Информация о тестировании</Card.Header>
                          <Card.Body>
                            <Row>
                              <Col sm={12}>
                                <Form noValidate>
                                  <Form.Row>
                                    <Form.Group as={Col} md="12" controlId="control_title">
                                      <Form.Label>Название теста</Form.Label>
                                      <Form.Control
                                        type="text"
                                        name="title"
                                        value={values.title}
                                        onChange={handleChange}
                                        isInvalid={!touched.title && errors.title}
                                      />
                                      <Form.Control.Feedback type='invalid'>
                                        {errors.title}
                                      </Form.Control.Feedback>
                                    </Form.Group>
                                  </Form.Row>

                                  <Form.Row>
                                    <Form.Group as={Col} md="12" controlId="control_description">
                                      <Form.Label>Описание теста</Form.Label>
                                      <Form.Control
                                        as='textarea'
                                        name="description"
                                        value={values.description}
                                        onChange={handleChange}
                                        isInvalid={!touched.description && errors.description}
                                      />
                                      <Form.Control.Feedback type='invalid'>
                                        {errors.description}
                                      </Form.Control.Feedback>
                                    </Form.Group>
                                  </Form.Row>

                                  {/* <Form.Row>
                                    <Form.Group as={Col} md="12" controlId="control_timer">
                                      <Form.Label>Таймер теста в секундах</Form.Label>
                                      <Form.Control
                                        name="timer"
                                        value={values.timer}
                                        onChange={handleChange}
                                        isInvalid={!touched.timer && errors.timer}
                                        placeholder="Если тест без таймера, оставьте пустым."
                                        title="Например для 15 минут введите: 900."
                                      />
                                      <Form.Control.Feedback type='invalid'>
                                        {errors.timer}
                                      </Form.Control.Feedback>
                                    </Form.Group>
                                  </Form.Row> */}

                                </Form>
                              </Col>
                            </Row>
                          </Card.Body>
                          <Card.Footer align='right'>
                            <Row>
                              <Col xs={12} align='right'>
                                <Button variant='outline-primary' type="button" onClick={resetForm} className='mr-3'>Вернуть к инзачальным</Button>
                                <Button type="button" onClick={handleSubmit}>Создать тест</Button>
                              </Col>
                            </Row>
                          </Card.Footer>
                        </>)}
                  </Formik>
                </Card>
              </Col>
            </Row>
          </motion.div>
        )}
      </Container>
    </motion.div>
  </>)

}

Page.getInitialProps = async (ctx) => {
  const { id } = ctx.query;

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

  return { courseId: id, userID };
};

export default withApollo(Page)
