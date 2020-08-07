import Head from 'next/head'
import { motion } from "framer-motion"
import { Container, Button, Row, Col, Card, ListGroup, Form } from 'react-bootstrap'
import Masonry from '~/components/Masonry';

import { withApollo } from '@apollo/react-hoc';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useQuery, useMutation } from '@apollo/react-hooks';
import { gql } from 'apollo-boost';
import { useSelector, useDispatch } from "react-redux";
const ReactMarkdown = require('react-markdown')

import { RiStarLine } from 'react-icons/ri';
import { MdMoneyOff } from 'react-icons/md';
import { BsEyeSlash, BsCheckCircle, BsTrashFill, BsCollectionPlay } from 'react-icons/bs';

import { CREATE_TOAST } from "~/redux/actions";
import { CREATE_MODAL } from "~/redux/actions";

import ReactPlayer from 'react-player'

import { Formik } from 'formik';
import { object as yupObject, string as yupString, number as yupNumber, setLocale } from 'yup';
import { FaTasks } from 'react-icons/fa';

setLocale({
  mixed: {
    required: 'Обязательное поле',
  },
  string: {
    min: 'Не менее ${min} символов',
    max: 'Не более ${max} символов'
  }
});


let CommentSchema = yupObject({
  text: yupString().required().min(5).max(100),
}).defined();


function b64DecodeUnicode(str) {
  return decodeURIComponent(atob(str).split('').map(function (c) {
    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
  }).join(''));
}

const LESSON_INFO = gql`
query lessonInfo($lessonID:ID!){
  lessonInfo(id: $lessonID){
    _lessonID
    __typename
    comments{
      ID
      text
      user{
				ID
        image
        firstName
        lastName
      }
    }
    course{
      ID
      image
      name
      lessons{
        __typename
        _lessonID
        title
        access

        ... on Test{
          correctAnswers
          tasks{
            ID
          }
        }
      }
			owner{
        ID
      }
    }

    ... on Test{
      ID
      title
      description
      timer
      correctAnswers

      tasks{
        ID
        text

        options{
          text
          value
          ID
        }
      }
    }

    ... on Lection{
      ID
      title
      description
      video
      homework
      text
    }
  }
}
`;

const COMMENT_CREATE = gql`
mutation commentCreate($ID: ID!, $msg: String!){
  commentCreate(lessonID:$ID, msg: $msg){
    ID
      text
      user{
				ID
        image
        firstName
        lastName
      }
  }
}
`;

const COMMENT_DELETE = gql`
mutation commentDelete($ID: ID!){
  commentDelete(id: $ID)
}
`;

const TEST_CHECK_RESULTS = gql`
  mutation testCheckResults($id: ID!, $answers: [testAnswer!]!){
    testCheckResults(id:$id, answers: $answers){
      _taskID
      _answerID
    }
  }
`;

const Page = ({ userID, lesson, client: apolloClient, videoCode }) => {
  const dispatch = useDispatch();
  const [lessonInfo, setLesson] = useState(lesson);

  const [codeVideo, setCodeVideo] = useState(videoCode);




  const router = useRouter()
  const videoPlayer = useRef();

  const [duration, setDuration] = useState();
  const [selectedTask, setSelectedTask] = useState(0);
  const [selectedOption, setSelectedOption] = useState(0);

  const [tasksResults, setTasksResults] = useState({});
  const [tasksAnswers, setTasksAnswers] = useState({});
  const [correctAnswers, setCorrectAnswers] = useState({});

  const saveAnswer = () => {
    tasksAnswers[selectedTask] = selectedOption;
    setTasksAnswers({ ...tasksAnswers })
  }

  const handleCheckTest = () => {
    apolloClient.mutate({
      mutation: TEST_CHECK_RESULTS,
      variables: {
        id: lessonInfo.ID,
        answers: Object.entries(tasksAnswers).map(([taskID, answerID]) => { return { _answerID: answerID, _taskID: taskID } })
      }
    })
      .then(({ data }) => {
        apolloClient.resetStore();
        setCorrectAnswers(data.testCheckResults)
        Object.entries(tasksAnswers).forEach(([taskID, answerID]) => {
          if (data.testCheckResults.find(el => el._taskID == taskID)._answerID == answerID) {
            tasksResults[taskID] = true;
            setTasksResults({ ...tasksResults })
          } else {
            tasksResults[taskID] = false;
            setTasksResults({ ...tasksResults })
          }
        })
      })
      .catch(() => {
        return false;
      })
  }


  if (lessonInfo && lessonInfo.__typename == "Test" && selectedTask == 0) {
    setSelectedTask(lessonInfo.tasks[0].ID)
  }


  const handleCommentPublish = (values) => {
    apolloClient.mutate({
      mutation: COMMENT_CREATE,
      variables: {
        ID: lessonInfo._lessonID,
        msg: values.text
      }
    })
      .then(({ data }) => {
        apolloClient.resetStore();
        setLesson({ ...lessonInfo, comments: [data.commentCreate, ...lessonInfo.comments] })
        return true;
      })
      .catch(() => {
        return false;
      })
  }

  const handleCommentRemove = (id) => {
    apolloClient.mutate({
      mutation: COMMENT_DELETE,
      variables: {
        ID: id
      }
    })
      .then(({ data }) => {
        apolloClient.resetStore();
        setLesson({ ...lessonInfo, comments: lessonInfo.comments.filter(el => el.ID != id) })
        return true;
      })
      .catch(() => {
        return false;
      })
  }

  const playerError = (...args) => {
    console.log(args)
  }


  return (<>
    <Head>
      {<title>{lessonInfo.title}</title>}
    </Head>


    {/* <div className="course">Курс: {lessonInfo.course.name}</div> */}

    <Container className='lessonPage' fluid>
      {lessonInfo.__typename == "Test" && (
        <Row className="Test">
          <Col xs={{ span: 12, order: 1 }} xl={{ span: 9, order: 0 }} className='p-3'>

            {Object.entries(tasksResults).length == lessonInfo.tasks.length && (
              <Card className='mb-3'>
                <Card.Header>Результаты тестирования</Card.Header>
                <Card.Body>
                  <Card.Text>Вы завершили это тестирование, ваш итоговый результат: {Object.entries(tasksResults).filter(([key, val]) => !!val).length}</Card.Text>
                </Card.Body>
                <Card.Footer as={Row}>
                  <Col md={3}>
                    <Link href='/course/[id]' as={`/course/${lessonInfo.course.ID}`}>
                      <Button block>Перейти к курсу</Button>
                    </Link>
                  </Col>
                </Card.Footer>
              </Card>
            )}

            {lessonInfo.correctAnswers != -1 &&
              <Card className='mb-3'>
                <Card.Header>Результаты тестирования</Card.Header>
                <Card.Body>
                  <Card.Text>Вы прошли это тестирование, ваш итоговый результат: {lessonInfo.correctAnswers}</Card.Text>
                </Card.Body>
              </Card>}

            {selectedTask != 0 && (
              <Card>
                <Card.Header>{lessonInfo.tasks.find(el => el.ID == selectedTask).text}</Card.Header>
                <ListGroup>
                  {lessonInfo.tasks.find(el => el.ID == selectedTask).options.map((option) => (
                    <ListGroup.Item
                      action={tasksResults[selectedTask] == undefined}
                      key={option.ID}
                      className={tasksResults[selectedTask] != undefined ? (option.ID == tasksAnswers[selectedTask] ? (tasksResults[selectedTask] ? 'bg-success' : 'bg-danger') : (correctAnswers.find(ca => ca._taskID == selectedTask)._answerID == option.ID ? 'bg-success' : '')) : option.ID == tasksAnswers[selectedTask] ? 'bg-primary' : (option.ID == selectedOption ? 'bg-info' : '')}
                      onClick={() => { if (tasksResults[selectedTask] == undefined) setSelectedOption(option.ID) }}
                    >{option.text}</ListGroup.Item>
                  ))}
                </ListGroup>
                {lessonInfo.correctAnswers == -1 &&
                  <Card.Footer>
                    <Button disabled={tasksResults[selectedTask] != undefined || lessonInfo.tasks.find(el => el.ID == selectedTask).options.findIndex(el => el.ID == selectedOption) == -1 || tasksAnswers[selectedTask] == selectedOption} onClick={() => { saveAnswer() }}>Сохранить ответ</Button>
                  </Card.Footer>}
              </Card>
            )}
          </Col>
          <Col xs={{ span: 12, order: 0 }} xl={{ span: 3, order: 1 }} className='p-3'>
            <Card className='mb-3'>
              <Card.Header className='bg-primary text-white'>Задания</Card.Header>
              <Card.Body>
                <Masonry>
                  {lessonInfo.tasks.map((task, index) => (
                    <Button
                      key={task.ID}
                      className='item mb-2'
                      variant={(task.ID == selectedTask ? "" : "outline-") + (tasksResults[task.ID] != undefined ? (tasksResults[task.ID] == true ? "success" : "danger") : tasksAnswers[task.ID] != undefined ? "primary" : "gray-3")}
                      onClick={() => { setSelectedTask(task.ID) }}
                    >
                      {index + 1}
                    </Button>
                  ))}
                </Masonry>
              </Card.Body>
              <Card.Footer>
                {lessonInfo.correctAnswers != -1 ?
                  <Button disabled>Вы уже прошли этот тест</Button> :
                  <Button disabled={Object.entries(tasksAnswers).length != lessonInfo.tasks.length} onClick={() => { handleCheckTest() }}>Отправить ответы</Button>}
              </Card.Footer>
            </Card>

            <Card className='lessonsListCard card--custom'>
              <Card.Header className='bg-primary text-white'>
                <h1 className='title'>Курс: {lessonInfo.course.name}</h1>
                {lessonInfo.course.owner.ID == userID &&
                  <Link href='/controlPanel/course/[id]/lesson/[lessonId]' as={`/controlPanel/course/${lessonInfo.course.ID}/lesson/${lessonInfo._lessonID}`}>
                    <Button size="sm" variant='outline-white' className='edit'>Редактировать</Button>
                  </Link>}
              </Card.Header>
              <ListGroup className='lessonsList'>
                {lessonInfo.course.lessons.map(lesson => {
                  if (lesson.__typename == "Test") {
                    return lesson.access ?
                      <Link key={lesson._lessonID} href='/lesson/[id]' as={`/lesson/${lesson._lessonID}`}>
                        <ListGroup.Item className={`item ${lesson._lessonID == lessonInfo._lessonID ? "current" : ""}`} action>
                          <div className='icon'><FaTasks size={20} /></div>
                          <div className="title">{lesson.title}</div>
                          {lesson.correctAnswers != -1 ?
                            <div className="score">{lesson.correctAnswers}/{lesson.tasks.length}</div> :
                            <div className="required"></div>
                          }
                        </ListGroup.Item>
                      </Link> :
                      <ListGroup.Item key={lesson._lessonID} className="item noAccess">
                        <div className='icon'><FaTasks size={20} /></div>
                        <div className="title">{lesson.title}</div>
                        {lesson.correctAnswers != -1 ?
                          <div className="score">{lesson.correctAnswers}/{lesson.tasks.length}</div> :
                          <div className="required"></div>
                        }
                      </ListGroup.Item>
                  }


                  if (lesson.__typename == "Lection") {
                    return lesson.access ?
                      <Link key={lesson._lessonID} href={'/lesson/[id]'} as={`/lesson/${lesson._lessonID}`}>
                        <ListGroup.Item className={`item ${lesson._lessonID == lessonInfo._lessonID ? "current" : ""}`} action>
                          <div className='icon'><BsCollectionPlay size={20} /></div>
                          <div className="title">{lesson.title}</div>
                        </ListGroup.Item>
                      </Link> :
                      <ListGroup.Item key={lesson._lessonID} className="item noAccess">
                        <div className='icon'><BsCollectionPlay size={20} /></div>
                        <div className="title">{lesson.title}</div>
                      </ListGroup.Item>
                  }

                })}
              </ListGroup>
            </Card>
          </Col>
        </Row>
      )}

      {lessonInfo.__typename == "Lection" && (
        <>
          <Row className="Lection">
            <Col xl={9} className='px-0'>
              <div className='videoPlayer'>
                {codeVideo == 416 && <ReactPlayer onError={playerError} url={lessonInfo.video} className='react-player' width='100%' height='100%' controls />}
                {codeVideo == 418 && <div className='videoPlayer-error'>
                  <span className='main'>Возможно видео ещё обрабатывается.</span>
                  <span className='small'>В случае явной неисправности обратитесь в <Link href='/contacts'><a>службу поддержки</a></Link></span>
                </div>}
                {codeVideo == 403 && <div className='videoPlayer-error'>
                  <span className='main'>Доступ к видео ограничен.</span>
                  <span className='small'>Обратитесь в <Link href='/contacts'><a>службу поддержки</a></Link></span>
                </div>}
                {codeVideo == 400 && <div className='videoPlayer-error'>
                  <span className='main'>Ошибка запроса.</span>
                  <span className='small'>Обратитесь в <Link href='/contacts'><a>службу поддержки</a></Link></span>
                </div>}

              </div>

            </Col>
            <Col xl={3} className='px-xl-0 py-lg-3 py-xl-0'>
              <Card className='lessonsListCard card--custom'>
                <Card.Header className='bg-primary text-white'>
                  <h1 className='title'>Курс: {lessonInfo.course.name}</h1>
                  {lessonInfo.course.owner.ID == userID &&
                    <Link href='/controlPanel/course/[id]/lesson/[lessonId]' as={`/controlPanel/course/${lessonInfo.course.ID}/lesson/${lessonInfo._lessonID}`}>
                      <Button size="sm" variant='outline-white' className='edit'>Редактировать</Button>
                    </Link>}
                </Card.Header>
                <ListGroup className='lessonsList'>
                  {lessonInfo.course.lessons.map(lesson => {
                    if (lesson.__typename == "Test") {
                      return lesson.access ?
                        <Link key={lesson._lessonID} href='/lesson/[id]' as={`/lesson/${lesson._lessonID}`}>
                          <ListGroup.Item className={`item ${lesson._lessonID == lessonInfo._lessonID ? "current" : ""}`} action>
                            <div className='icon'><FaTasks size={20} /></div>
                            <div className="title">{lesson.title}</div>
                            {lesson.correctAnswers != -1 ?
                              <div className="score">{lesson.correctAnswers}/{lesson.tasks.length}</div> :
                              <div className="required"></div>
                            }
                          </ListGroup.Item>
                        </Link> :
                        <ListGroup.Item key={lesson._lessonID} className="item noAccess">
                          <div className='icon'><FaTasks size={20} /></div>
                          <div className="title">{lesson.title}</div>
                          {lesson.correctAnswers != -1 ?
                            <div className="score">{lesson.correctAnswers}/{lesson.tasks.length}</div> :
                            <div className="required"></div>
                          }
                        </ListGroup.Item>
                    }


                    if (lesson.__typename == "Lection") {
                      return lesson.access ?
                        <Link key={lesson._lessonID} href={'/lesson/[id]'} as={`/lesson/${lesson._lessonID}`}>
                          <ListGroup.Item className={`item ${lesson._lessonID == lessonInfo._lessonID ? "current" : ""}`} action>
                            <div className='icon'><BsCollectionPlay size={20} /></div>
                            <div className="title">{lesson.title}</div>
                          </ListGroup.Item>
                        </Link> :
                        <ListGroup.Item key={lesson._lessonID} className="item noAccess">
                          <div className='icon'><BsCollectionPlay size={20} /></div>
                          <div className="title">{lesson.title}</div>
                        </ListGroup.Item>
                    }

                  })}
                </ListGroup>
              </Card>
            </Col>

            <Col xl={9} className='py-3'>
              <div className="additionalInfo">
                <Card className='card--custom'>
                  <Card.Header>Материалы урока</Card.Header>
                  {lessonInfo.text && lessonInfo.text.length>0 ?
                    <Card.Body>
                      <ReactMarkdown source={lessonInfo.text} />
                    </Card.Body> :
                    <Card.Body>

                    </Card.Body>}
                </Card>
                
                <Card className='card--custom'>
                  <Card.Header>Домашняя работа</Card.Header>
                  {lessonInfo.homework && lessonInfo.homework.length>0 ?
                    <Card.Body>
                      <ReactMarkdown source={lessonInfo.homework} />
                    </Card.Body> :
                    <Card.Body>

                    </Card.Body>
                  }
                </Card>
              </div>
            </Col>
            <Col xl={3} className='comments mt-3 px-3'>
              <div className='title mb-3'>Комментарии ({lessonInfo.comments.length})</div>

              {lessonInfo.comments.map((comment) => {
                if (!comment.user.firstName && !comment.user.lastName) {
                  comment.user.firstName = "Анонимный"
                  comment.user.lastName = "пользователь"
                }
                return (
                  <Card className='comment mb-2' key={comment.ID}>
                    <Link href='/user/[id]' as={`/user/${comment.user.ID}`}>
                      <Card.Header className='bg-primary text-white'>
                        {comment.user.image && <img alt='' src={comment.user.image} alt="" />}
                        <span>{comment.user.firstName}&nbsp;{comment.user.lastName}</span>
                        {comment.user.ID == userID && <div style={{ width: "100%", display: "flex", justifyContent: "flex-end" }}>
                          <Button onClick={(e) => { e.stopPropagation(); handleCommentRemove(comment.ID) }} className='btn-icon'><BsTrashFill className='delete' /></Button>
                        </div>}
                      </Card.Header>
                    </Link>
                    <Card.Body>{comment.text}</Card.Body>
                  </Card>
                )
              })}

              <Card className='mb-2'>
                <Card.Header className='bg-primary text-white'>
                  <span>Оставить комментарий</span>
                </Card.Header>
                <Card.Body>
                  <Formik enableReinitialize onSubmit={handleCommentPublish} validationSchema={CommentSchema} initialValues={{ text: "" }}>
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
                          <Form noValidate>
                            <Form.Row>
                              <Form.Group as={Col} md="12" controlId="control_text">
                                <Form.Control
                                  as='textarea'
                                  type="text"
                                  name="text"
                                  value={values.text}
                                  onChange={handleChange}
                                  isInvalid={!touched.text && errors.text}
                                  className="slim"
                                />
                                <Form.Control.Feedback type='invalid'>
                                  {errors.text}
                                </Form.Control.Feedback>
                              </Form.Group>
                            </Form.Row>

                            <Form.Row align='right'>
                              <Button block disabled={!isValid} onClick={handleSubmit}>Отправить</Button>
                            </Form.Row>
                          </Form>
                        </>
                      )}

                  </Formik>
                </Card.Body>
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
  var redirect = require('~/lib/redirect').default;
  const axios = require('axios').default;

  const { id } = ctx.query;

  console.log(ctx.query)

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

  const lessonInfo = await ctx.apolloClient.query({
    query: LESSON_INFO,
    variables: {
      lessonID: id
    }
  })
    .then(({ data }) => {
      return data.lessonInfo
    })
    .catch(() => {
      return false;
    })

    

  if (lessonInfo.video) {
    var videoCode;
    await axios.get(`${lessonInfo.video}`)
      .then(function (response) {
        console.log(response);
        videoCode = response.status;
      })
      .catch(function (error) {
        console.log(error.response.status);
        videoCode = error.response.status;
      })
  }

  return {
    pageId: id, userID, lesson: lessonInfo, videoCode
  }
};

export default withApollo(Page)
