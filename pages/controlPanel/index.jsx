import Head from 'next/head'
import { motion } from "framer-motion"
import { Container, Button, Row, Col, Card, ListGroup, Form, Modal, Toast } from 'react-bootstrap'
import React, { useState, useEffect } from 'react';
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useQuery, useMutation } from '@apollo/react-hooks';
import { gql } from 'apollo-boost';
import { useSelector, useDispatch } from "react-redux";
import ImageLoader from '../../components/ImageLoader'
import { CREATE_TOAST } from "../../redux/actions";
import { CREATE_MODAL } from "../../redux/actions";

import redirect from '../../lib/redirect'

import { withApollo } from '@apollo/react-hoc';

import { Formik } from 'formik';
import { object as yupObject, string as yupString, number as yupNumber, setLocale } from 'yup';

setLocale({
  mixed: {
    required: 'Обязательное поле',
  },
  string: {
    min: 'Не менее ${min} символов',
    max: 'Не более ${max} символов'
  },
});


let schema = yupObject({
  firstName: yupString().required().min(2).max(20).trim(),
  lastName: yupString().required().min(2).max(20).trim()
}).defined();

const USER_INFO = gql`
  query {
    me{
      ID
      firstName
      lastName
      image
      username
      vkID
      email
      balance
      courses{
        ID
        name
      }
    }
  }
`;


const AVATAR_UPDATE = gql`
  mutation avatarUpdate($id: ID!, $avatar: String!) {
    userUpdate(id: $id, info:{image: $avatar}) {
      ID
    }
  }
`;

const USER_UPDATE = gql`
  mutation userUpdate($ID: ID!, $firstName: String!, $lastName: String!) {
    userUpdate(id: $ID, info: { firstName: $firstName, lastName: $lastName }) {
      ID
    }
  }
`;


const Page = ({ client: apolloClient, userID, user }) => {
  const dispatch = useDispatch();

  const [userInfo, setUser] = useState(user);

  const handleSaveMain = (values) => {
    apolloClient.mutate({
      mutation: USER_UPDATE,
      variables: {
        ID: userInfo.ID,
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim()
      }
    })
      .then(({ data }) => {
        setUser({ ...userInfo, firstName: values.firstName.trim(), lastName: values.lastName.trim() });

        dispatch({
          type: CREATE_TOAST, props: {
            type: "success",
            title: "Обновление профиля",
            body: "Информация о профиле успешно обновлена"
          }
        })

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

  const isDef = () => {
    // if (data.me) {
    //   if (data.me && firstName != userInfo.firstName) return false
    //   if (lastName != userInfo.lastName) return false
    //   return true;
    // } else {
    //   return false
    // }
  }

  const avatarChanged = (info) => {

    apolloClient.mutate({
      mutation: AVATAR_UPDATE,
      variables: {
        id: userInfo.ID,
        avatar: `https://storage.informalplace.ru/${info.Key}`
      }
    })
      .then(({ data }) => {
        setUser({ ...userInfo, image: `https://storage.informalplace.ru/${info.Key}` });

        dispatch({
          type: CREATE_TOAST, props: {
            type: "success",
            title: "Загрузка завершена",
            body: "Новое фото профиля успешно установлено"
          }
        });

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

  const VKModalCall = () => {
    dispatch({
      type: CREATE_MODAL, props: {
        title: "Привязка аккаунта",
        body: `Для привязки аккаунта ВК вам понадобится написать в наше сообщество Вконтакте. Начните общение с ботом с фразы "Начать".`,
        cancel: true,
        action: () => { window.open('https://vk.com/informalplace', "_blank") },
        actionLabel: "Перейти в Вконтакте"
      }
    })
  }

  return (<>
    <Head>
      <title>Панель управления</title>
    </Head>

    <Container className='py-3 controlPanelPage' fluid>
      {userInfo && (
        <>
          <Row>
            <Col md={12} lg={6}>
              <Card className='accountSettings mb-3'>
                <Formik enableReinitialize onSubmit={handleSaveMain} validationSchema={schema} initialValues={{ ...userInfo }}>
                  {({
                    handleSubmit,
                    handleChange,
                    values,
                    touched,
                    isValid,
                    errors,
                    resetForm
                  }) => (
                      <Form noValidate>
                        <Card.Header>Основная информация</Card.Header>
                        <Card.Body>
                          <Row>
                            <Col sm={12} md={6} lg={6} xl={5}>
                              <ImageLoader ratio={1 / 1} uploadType='avatar' onUpload={avatarChanged} initValue={userInfo.image} label="Фото профиля" />
                            </Col>
                            <Col sm={12} md={6} lg={6} xl={7}>
                              <Form.Row>
                                <Form.Group as={Col} md="12" controlId="control_firstName">
                                  <Form.Label>Имя</Form.Label>
                                  <Form.Control
                                    name="firstName"
                                    value={values.firstName}
                                    onChange={handleChange}
                                    isInvalid={!touched.firstName && errors.firstName}
                                  />
                                  <Form.Control.Feedback type='invalid'>
                                    {errors.firstName}
                                  </Form.Control.Feedback>
                                </Form.Group>
                              </Form.Row>

                              <Form.Row>
                                <Form.Group as={Col} md="12" controlId="control_lastName">
                                  <Form.Label>Фамилия</Form.Label>
                                  <Form.Control
                                    name="lastName"
                                    value={values.lastName}
                                    onChange={handleChange}
                                    isInvalid={!touched.lastName && errors.lastName}
                                  />
                                  <Form.Control.Feedback type='invalid'>
                                    {errors.lastName}
                                  </Form.Control.Feedback>
                                </Form.Group>
                              </Form.Row>


                              <Row>
                                <Col lg={12} xl={6}>
                                  <Form.Group controlId="FormMainInfo.ControlEmail">
                                    <Form.Label>Почта</Form.Label>
                                    <Form.Control readOnly disabled as="input" placeholder="..." value={userInfo.email} />
                                  </Form.Group>
                                </Col>
                                <Col lg={12} xl={6}>
                                  <Form.Group controlId="FormMainInfo.ControlVkID">
                                    <Form.Label>Вконтакте</Form.Label>
                                    {userInfo.vkID && <Form.Control readOnly disabled as="input" placeholder="..." value={"ID: " + userInfo.vkID} />}
                                    {!userInfo.vkID && <Form.Control as={Button} type="button" onClick={VKModalCall}>Привязать</Form.Control>}
                                  </Form.Group>
                                </Col>
                              </Row>
                            </Col>
                          </Row>
                        </Card.Body>
                        <Card.Footer>
                          {isDef() ? (
                            <Button block disabled>Начните изменение данных</Button>
                          ) : (
                              <Button block onClick={handleSubmit}>Сохранить</Button>
                            )}
                          <Button block disabled={isDef()} onClick={resetForm} variant='outline-primary' >Вернуть к изначальным</Button>
                        </Card.Footer>
                      </Form>
                    )}

                </Formik>
              </Card>


              <Card className="accountSettings">
                <Card.Header>Оповещения (Раздел в разработке)</Card.Header>
                <Card.Body>
                  <Row>
                    <Col sm={12} md={6}>
                      <span>Вконтакте</span>

                    </Col>
                    <Col sm={12} md={6}>
                      <span>Электронная почта</span>

                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            </Col>
            <Col md={12} lg={6}>
              <Card className="accountSettings mb-3">
                <Card.Header>Платёжная информация</Card.Header>
                <ListGroup>
                  <ListGroup.Item>
                    Баланс: {userInfo.balance} руб.
                    </ListGroup.Item>

                  <ListGroup.Item>
                    <Link href="/payments">
                      <Button>Управление балансом</Button>
                    </Link>
                  </ListGroup.Item>
                </ListGroup>
              </Card>

              <Card className="accountSettings">
                <Card.Header>Созданные курсы</Card.Header>
                <ListGroup>
                  {userInfo.courses.map(course => {
                    return (
                      <Link key={course.ID.toString()} href='/controlPanel/course/[id]' as={`/controlPanel/course/${course.ID}`}>
                        <ListGroup.Item action>
                          {course.name}
                        </ListGroup.Item>
                      </Link>
                    )
                  })}
                  <ListGroup.Item>
                    <Link href='/create/course'>
                      <Button>Создать курс</Button>
                    </Link>
                  </ListGroup.Item>
                </ListGroup>
              </Card>
            </Col>
          </Row>
        </>
      )}
    </Container>
  </>)

}

Page.getInitialProps = async (ctx) => {
  var atob = require('atob');
  var redirect = require('../../lib/redirect').default;

  const checkLoggedIn = require('../../lib/checkLoggedIn').default;
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

  const userInfo = await ctx.apolloClient.query({
    query: USER_INFO
  })
    .then(({ data }) => {
      return data.me
    })
    .catch(() => {
      return false;
    })


  return {
    userID, user: userInfo
  }
};

export default withApollo(Page)