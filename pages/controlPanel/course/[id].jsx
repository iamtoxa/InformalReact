import Head from 'next/head'
import { motion } from "framer-motion"
import { Container, Button, Row, Col, Card, ListGroup, Form } from 'react-bootstrap'
import React, { useState } from 'react';
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useQuery, useMutation } from '@apollo/react-hooks';
import { gql } from 'apollo-boost';
import { useSelector, useDispatch } from "react-redux";
import ImageLoader from '../../../components/imageLoader'
import { CREATE_TOAST } from "../../../redux/actions";
import { CREATE_MODAL } from "../../../redux/actions";

import DraggbleList from '../../../components/draggbleList';

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
});


let schema = yupObject({
  name: yupString().required().min(5).max(50),
  short: yupString().required().min(10).max(250),
  description: yupString().required().min(10).max(500),
  price: yupNumber()
}).defined();


function b64DecodeUnicode(str) {
  return decodeURIComponent(atob(str).split('').map(function (c) {
    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
  }).join(''));
}

const CATEGORIES_LIST = gql`
query{
  categoriesList{
    ID
    name
  }
}
`;

const USER_INFO = gql`
query{
  me{
    ID
    moderator
  }
}
`;

const COURSE_UPDATE = gql`
    mutation courseUpdate($id: ID!, $name: String!, $short: String!, $description: String!, $categoryID: ID!, $image: String!, $price: Int!){
      courseUpdate(id: $id, info:{name: $name, short: $short, description: $description, _categoryID: $categoryID, image: $image, price: $price}){
        ID
      }
    }
`;

const LESSON_SET_ORDER = gql`
    mutation lessonSetOrder($id: ID!, $value: Int!){
      lessonSetOrder(id: $id, value: $value)
    }
`;

const COURSE_SET_MODERATE = gql`
    mutation courseSetStatus($id: ID!, $value: courseStatus!){
      courseSetStatus(id: $id, value: $value)
    }
`;

const COURSE_INFO = gql`
query courseInfo($id: ID!) {
  courseInfo(id: $id) {
    ID
    name
    price
    short
    description
    image
    status
    category {
      ID
    }
    purchases {
      ID
      user{
        ID
        firstName
        lastName
      }
    }
    
    owner{
      ID
    }

    lessons{
      _lessonID
      title
      order

      comments{
        ID
        text
      }
    }
  }
}

`;

const Page = ({ client: apolloClient, user, course, categories }) => {
  const router = useRouter()
  const dispatch = useDispatch();

  const [image, setImage] = useState("https://user-images.githubusercontent.com/194400/49531010-48dad180-f8b1-11e8-8d89-1e61320e1d82.png");


  const [userInfo, setUser] = useState(user);
  const [courseInfo, setCourse] = useState(course);
  const [categoriesList, setCategories] = useState(categories);


  if (courseInfo) {
    if (courseInfo.image && courseInfo.image != image) {
      setImage(courseInfo.image);
    }
  }

  if (userInfo && courseInfo && courseInfo.owner.ID != userInfo.ID && !userInfo.moderator) {
    dispatch({
      type: CREATE_TOAST, props: {
        type: "danger",
        title: "Нет доступа",
        body: "У вас нет доступа к редактированию этого курса"
      }
    });
    router.push('/')
  }


  const handleSaveCourseInfo = (values) => {
    apolloClient.mutate({
      mutation: COURSE_UPDATE,
      variables: {
        id: course.ID,
        name: values.name,
        short: values.short,
        description: values.description,
        categoryID: values.category.ID || values.category,
        image: image,
        price: Number(values.price)
      }
    })
      .then(({ data }) => {
        dispatch({
          type: CREATE_TOAST, props: {
            type: "success",
            title: "Информация обновлена",
            body: "Основная информация об этом курсе успешно обновлена"
          }
        });
      })
      .catch(() => {
        return false;
      })
  }

  const imagePreview = (info) => {
    const imgSrc = `https://storage.informalplace.ru/${info.Key}`;
    courseInfo.image = imgSrc
    setImage(imgSrc)
  }

  const handleSendToModerate = () => {
    apolloClient.mutate({
      mutation: COURSE_SET_MODERATE,
      variables: {
        id: course.ID,
        value: "moderate"
      }
    })
      .then(({ data }) => {
        setCourse({...course, status: "moderate"})
        dispatch({
          type: CREATE_TOAST, props: {
            type: "success",
            title: "Модерация",
            body: "Курс успешно отправлен на модерацию"
          }
        });
      })
      .catch(() => {
        return false;
      })
  }

  const handleAcceptCourse = () => {
    apolloClient.mutate({
      mutation: COURSE_SET_MODERATE,
      variables: {
        id: course.ID,
        value: "showed"
      }
    })
      .then(({ data }) => {
        setCourse({...course, status: "showed"})
        dispatch({
          type: CREATE_TOAST, props: {
            type: "success",
            title: "Модерация",
            body: "Вы допустили этот курс к размещению на платформе"
          }
        });
      })
      .catch(() => {
        return false;
      })
  }

  const handleRejectCourse = () => {
     apolloClient.mutate({
      mutation: COURSE_SET_MODERATE,
      variables: {
        id: course.ID,
        value: "rejected"
      }
    })
      .then(({ data }) => {
        setCourse({...course, status: "rejected"})
        dispatch({
          type: CREATE_TOAST, props: {
            type: "info",
            title: "Модерация",
            body: "Вы отклонили курс от размещения на платформе"
          }
        });
      })
      .catch(() => {
        return false;
      })
  }

  const onChangeOrder = (newOrder) => {
    if (courseInfo.owner.ID == userInfo.ID) {
      var changes = newOrder.filter((el, index) => courseInfo.lessons[index]._lessonID != el._lessonID)
      changes.map((change, index) => {
        apolloClient.mutate({
          mutation: LESSON_SET_ORDER,
          variables: {
            id: change._lessonID,
            value: newOrder.findIndex(element => element._lessonID === change._lessonID)
          }
        })
          .then(({ data }) => {
            if (index == changes.length - 1) {
              dispatch({
                type: CREATE_TOAST, props: {
                  type: "success",
                  title: "Изменение очерёдности",
                  body: "Очерёдность уроков в этом курсе сохранена."
                }
              });
            }

            return true;
          })
          .catch(() => {

            dispatch({
              type: CREATE_TOAST, props: {
                type: "danger",
                title: "зменение очерёдности",
                body: <span>Что-то пошло не так обратитесь в <a href='mailto:iamtoxa00@gmail.com'>службу поддержки</a></span>
              }
            });

            return false;
          })
      })
    } else {
      dispatch({
        type: CREATE_TOAST, props: {
          type: "danger",
          title: "Ошибка",
          body: "Вы не можете менять очерёдность уроков в этом курсе. Ваши изменения не будут сохранены."
        }
      });
    }
  }



  return (<>
    <Head>
      <title>Редактирование курса</title>
    </Head>

    <motion.div transition={{ duration: 0.2, delay: 0 }} initial={{ opacity: 0, translateX: -50 }} animate={{ opacity: 1, translateX: 0 }} exit={{ opacity: 0 }} >
      <Container className='py-3 controlPanelPage' fluid>
        {courseInfo && userInfo && (
          <Row>
            <Col md={{ span: 12, order: 1 }} lg={{ span: 6, order: 1 }} xl={{ span: 3, order: 1 }}>
              <Row>
                <Col md={12} className='mb-3'>
                  <Card className="shadow-custom">
                    <Card.Header> Основная информация</Card.Header>
                    <Formik enableReinitialize onSubmit={handleSaveCourseInfo} validationSchema={schema} initialValues={{ ...courseInfo, image: image }}>
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
                            <Card.Body>
                              <Form noValidate>

                                <Form.Row>
                                  <Form.Group as={Col} md="12" controlId="control_name">
                                    <ImageLoader ratio={3 / 2} uploadType='course' label='Иллюстрация' onUpload={imagePreview} value={values.image} />
                                  </Form.Group>
                                </Form.Row>

                                <Form.Row>
                                  <Form.Group as={Col} md="12" controlId="control_name">
                                    <Form.Label>Название курса</Form.Label>
                                    <Form.Control
                                      type="text"
                                      name="name"
                                      value={values.name}
                                      onChange={handleChange}
                                      isInvalid={!touched.name && errors.name}
                                    />
                                    <Form.Control.Feedback type='invalid'>
                                      {errors.name}
                                    </Form.Control.Feedback>
                                  </Form.Group>
                                </Form.Row>

                                <Form.Row>
                                  <Form.Group as={Col} md="12" controlId="control_price">
                                    <Form.Label>Стоимость курса</Form.Label>
                                    <Form.Control
                                      type="text"
                                      name="price"
                                      value={values.price}
                                      onChange={handleChange}
                                      isInvalid={!touched.price && errors.price}
                                    />
                                    <Form.Control.Feedback type='invalid'>
                                      {errors.price}
                                    </Form.Control.Feedback>
                                  </Form.Group>
                                </Form.Row>

                                <Form.Row>
                                  <Form.Group as={Col} md="12" controlId="control_short">
                                    <Form.Label>Краткое описание</Form.Label>
                                    <Form.Control
                                      as='textarea'
                                      name="short"
                                      value={values.short}
                                      onChange={handleChange}
                                      isInvalid={!touched.short && errors.short}
                                    />
                                    <Form.Control.Feedback type='invalid'>
                                      {errors.short}
                                    </Form.Control.Feedback>
                                  </Form.Group>
                                </Form.Row>

                                <Form.Row>
                                  <Form.Group as={Col} md="12" controlId="control_full">
                                    <Form.Label>Полное описание</Form.Label>
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

                                <Form.Row>
                                  <Form.Group as={Col} md="12" controlId="control_category">
                                    <Form.Label>Категория</Form.Label>
                                    <Form.Control
                                      as='select'
                                      name="category"
                                      value={values.category.ID}
                                      onChange={handleChange}
                                      isInvalid={!touched.category && errors.category}
                                    >
                                      {categoriesList && categoriesList.map(el => { return (<option value={el.ID} key={el.ID}>{el.name}</option>) })}
                                    </Form.Control>
                                    <Form.Control.Feedback type='invalid'>
                                      {errors.category}
                                    </Form.Control.Feedback>
                                  </Form.Group>
                                </Form.Row>

                              </Form>
                            </Card.Body>
                            <Card.Footer>
                              <Button block disabled={!isValid} variant='primary' type="button" onClick={handleSubmit}>Сохранить</Button>
                              <Button block variant='outline-primary' type="button" onClick={resetForm}>Вернуть к инзачальным</Button>
                            </Card.Footer>
                          </>
                        )}

                    </Formik>
                  </Card>
                </Col>
              </Row>
            </Col>


            <Col md={{ span: 12, order: 3 }} lg={{ span: 12, order: 3 }} xl={{ span: 6, order: 2 }}>
              <Row>
                <Col md={12} className='mb-3'>
                  <Card className="lessons shadow-custom">
                    <Card.Header>
                      Уроки курса
                  </Card.Header>
                    <ListGroup variant="flush">
                      <DraggbleList initData={courseInfo.lessons} indexField="_lessonID" onChangeOrder={onChangeOrder} href={`/controlPanel/course/[id]/lesson/[lessonId]`} asBase={`/controlPanel/course/${courseInfo.ID}/lesson/`} />
                    </ListGroup>
                    <Card.Footer align='right'>
                      <Link href='/controlPanel/course/[id]/lesson/new' as={`/controlPanel/course/${courseInfo.ID}/lesson/new`}>
                        <Button>Создать урок</Button>
                      </Link>
                    </Card.Footer>
                  </Card>
                </Col>

                <Col md={12} className='mb-3'>
                  <Card className="shadow-custom">
                    <Card.Header>
                      Возможности курса
                  </Card.Header>
                    <Card.Body>
                      Продажа, реклама, установка собственного url, комментирование
                  </Card.Body>
                  </Card>
                </Col>

                <Col md={12} className='mb-3'>
                  <Card className="shadow-custom">
                    <Card.Header>Действия с курсом</Card.Header>
                    <Card.Body>
                      {courseInfo.status == 'hidden' && courseInfo.owner.ID == userInfo.ID && (
                        <>
                          <Button block variant='primary' onClick={handleSendToModerate}>Отправить на модерацию</Button>
                        </>
                      )}

                      {courseInfo.status == 'moderate' && courseInfo.owner.ID == userInfo.ID && (
                        <>
                          <Button block disabled variant='primary'>Курс на модерации</Button>
                        </>
                      )}


                      {userInfo.moderator && courseInfo.status != "moderate" && courseInfo.owner.ID != userInfo.ID && (
                        <>
                          Курс не на модерации
                        </>
                      )}

                      {userInfo.moderator && courseInfo.status != "hidden" && (
                        <>
                          {courseInfo.status != "showed" && <Button block variant='outline-primary' onClick={handleAcceptCourse}>Разрешить курс</Button>}
                          {courseInfo.status != "rejected" && <Button block variant='outline-danger' onClick={handleRejectCourse}>Запретить курс</Button>}
                        </>
                      )}

                      <Link href='/course/[id]' as={`/course/${courseInfo.ID}`}>
                        <Button block variant='outline-primary'>Страница курса</Button>
                      </Link>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </Col>

            <Col md={{ span: 12, order: 2 }} lg={{ span: 6, order: 2 }} xl={{ span: 3, order: 3 }}>
              <Row>
                <Col md={12} className='mb-3'>
                  <Card className='shadow-custom'>
                    <Card.Header>
                      Статистика
                  </Card.Header>
                    <Card.Body>
                      Количество учеников,
                      прибыль по курсу
                      и прочая полезная информация
                  </Card.Body>
                  </Card>
                </Col>
                <Col md={12} className='mb-3'>
                  <Card className='students shadow-custom'>
                    <Card.Header>Ученики курса</Card.Header>
                    <ListGroup variant="flush">
                      {courseInfo.purchases.length > 0 ? courseInfo.purchases.map((purchase, index) => {
                        if (!purchase.user.firstName && !purchase.user.lastName) {
                          purchase.user.firstName = "Анонимный"
                          purchase.user.lastName = `пользователь (ID: ${purchase.user.ID})`
                        }

                        return (
                          <Link key={purchase.user.ID} href='/user/[id]' as={`/user/${purchase.user.ID}`}>
                            <ListGroup.Item action>
                              {purchase.user.firstName}&nbsp;{purchase.user.lastName}
                            </ListGroup.Item>
                          </Link>
                        )
                      }) : <ListGroup.Item>Ещё никто не начал изучение этого курса</ListGroup.Item>}
                    </ListGroup>
                  </Card>
                </Col>
                {/* <Col md={12} className='mb-3'>
                  <Card className="comments shadow-custom">
                    <Card.Header>Комментарии</Card.Header>
                    <ListGroup variant="flush">
                      {courseInfo.lessons.comments.length > 0 ? courseInfo.comments.map((purchase, index) => {
                        return (
                          <Link href='/user/[id]' as={`/user/${purchase.user.ID}`}>
                            <ListGroup.Item key={purchase.user.ID} action>
                              {purchase.user.firstName}&nbsp;{purchase.user.lastName}
                            </ListGroup.Item>
                          </Link>
                        )
                      }) : <Card.Body>В уроках этого курса ещё нет комментариев</Card.Body>}
                    </ListGroup>
                  </Card>
                </Col> */}
              </Row>
            </Col>
          </Row>
        )}
      </Container>
    </motion.div>
  </>)

}

Page.getInitialProps = async (ctx) => {
  var atob = require('atob');
  var redirect = require('../../../lib/redirect').default;

  const { id } = ctx.query;

  const checkLoggedIn = require('../../../lib/checkLoggedIn').default;
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

  const categoriesList = await ctx.apolloClient.query({
    query: CATEGORIES_LIST,
  })
    .then(({ data }) => {
      return data.categoriesList
    })
    .catch(() => {
      return false;
    })

  const userInfo = await ctx.apolloClient.query({
    query: USER_INFO,
  })
    .then(({ data }) => {
      return data.me
    })
    .catch(() => {
      return false;
    })

  const courseInfo = await ctx.apolloClient.query({
    query: COURSE_INFO,
    variables: {
      id: id
    }
  })
    .then(({ data }) => {
      return data.courseInfo
    })
    .catch(() => {
      return false;
    })

  return { pageId: id, categories: categoriesList, course: courseInfo, user: userInfo };
};

export default withApollo(Page)
