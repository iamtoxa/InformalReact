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
import { BsEyeSlash, BsCheckCircle, BsTrashFill } from 'react-icons/bs';

import { CREATE_TOAST } from "~/redux/actions";
import { CREATE_MODAL } from "~/redux/actions";

import { Player } from 'video-react';

import { Formik } from 'formik';
import { object as yupObject, string as yupString, number as yupNumber, setLocale } from 'yup';

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
      name
      lessons{
        _lessonID
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

const Page = ({ userID, lesson, client: apolloClient }) => {
  const dispatch = useDispatch();
  const [lessonInfo, setLesson] = useState(lesson);

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
        setLesson({ ...lessonInfo, comments: lessonInfo.comments.filter(el=>el.ID != id) })
        return true;
      })
      .catch(() => {
        return false;
      })
  }


  return (<>
    <Head>
      {lessonInfo ? <title>{lessonInfo.title}</title> : <title>Страница урока</title>}
    </Head>

    <motion.div transition={{ duration: 0.2, delay: 0 }} initial={{ opacity: 0, translateX: -50 }} animate={{ opacity: 1, translateX: 0 }} exit={{ opacity: 0 }} >
      <Container className='lessonPage' fluid>
        {lessonInfo && (
          <>

            <Row className='header'>

              <Col xl={9} className='naming'>
                <div className="title">Урок {lessonInfo.course.lessons.findIndex(el => el._lessonID == lessonInfo._lessonID) + 1}. {lessonInfo.title}</div>
                <div className="course">Курс: {lessonInfo.course.name}</div>
              </Col>

              <Col xl={3} className="stat d-none d-xl-flex">
                <div className="stat-badge">
                  {lessonInfo.__typename == "Lection" && duration && (
                    <div className="timing">{Math.floor(duration / 3600)}:{Math.floor(duration / 60) - Math.floor(duration / 3600) * 60}:{Math.floor(duration - Math.floor(duration / 60) * 60)}</div>
                  )}

                  {lessonInfo.__typename == "Lection" && (
                    <div className="lessonType">Лекция</div>
                  )}
                  {lessonInfo.__typename == "Test" && (
                    <div className="lessonType">Тестирование</div>
                  )}
                </div>
              </Col>

            </Row>

            {lessonInfo.__typename == "Test" && lessonInfo.correctAnswers != -1 && (
              <>
                <Row>
                  <Col xs={{ span: 12, order: 1 }} xl={{ span: 9, order: 0 }} className='p-3'>


                    <Card className='mb-3'>
                      <Card.Header>Результаты тестирования</Card.Header>
                      <Card.Body>
                        <p>Вы уже прошли это тестирование, ваш итоговый результат: {lessonInfo.correctAnswers}</p>
                      </Card.Body>
                      <Card.Footer as={Row}>
                        <Col md={3}>
                          <Link href='/course/[id]' as={`/course/${lessonInfo.course.ID}`}>
                            <Button block>Перейти к курсу</Button>
                          </Link>
                        </Col>
                      </Card.Footer>
                    </Card>

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
                        <Card.Footer>
                          <Button disabled={(!tasksAnswers[selectedTask]) || tasksAnswers[selectedTask] == selectedOption} onClick={() => { saveAnswer() }} disabled={tasksResults[selectedTask] != undefined}>Сохранить ответ</Button>
                        </Card.Footer>
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
                              variant={(task.ID == selectedTask ? "" : "outline-") + (tasksResults[task.ID] != undefined ? (tasksResults[task.ID] == true ? "success" : "danger") : "primary")}
                              onClick={() => { setSelectedTask(task.ID) }}
                            >
                              {index + 1}
                            </Button>
                          ))}
                        </Masonry>
                      </Card.Body>
                      <Card.Footer>
                        <Button onClick={() => { handleCheckTest() }} disabled>Вы уже прошли этот тест</Button>
                      </Card.Footer>
                    </Card>
                  </Col>
                </Row>
              </>
            )}

            {lessonInfo.__typename == "Test" && lessonInfo.correctAnswers == -1 && (
              <>
                <Row>
                  <Col xs={{ span: 12, order: 1 }} xl={{ span: 9, order: 0 }} className='p-3'>

                    {Object.entries(tasksResults).length == lessonInfo.tasks.length && (
                      <Card className='mb-3'>
                        <Card.Header>Результаты тестирования</Card.Header>
                        <Card.Body>
                          {Object.entries(tasksResults).filter(([key, val]) => !!val).length / Object.entries(tasksResults).length > 0.5 ? (
                            <p>Вы успешно прошли тестирование. Поздравляем!</p>
                          ) : (
                              <p>Вы дали слишком мало правильных ответов.. Рекомендуем повторить пройденный материал ещё раз.</p>
                            )}
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
                        <Card.Footer>
                          <Button disabled={(!tasksAnswers[selectedTask]) || tasksAnswers[selectedTask] == selectedOption} onClick={() => { saveAnswer() }} disabled={tasksResults[selectedTask] != undefined || lessonInfo.tasks.find(el => el.ID == selectedTask).options.findIndex(el => el.ID == selectedOption) == -1 || tasksAnswers[selectedTask] == selectedOption}>Сохранить ответ</Button>
                        </Card.Footer>
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
                        <Button onClick={() => { handleCheckTest() }} disabled={Object.entries(tasksAnswers).length != lessonInfo.tasks.length}>Отправить ответы</Button>
                      </Card.Footer>
                    </Card>
                  </Col>
                </Row>
              </>
            )}

            {lessonInfo.__typename == "Lection" && (
              <>
                <Row>
                  <Col xl={9} className='px-0'>
                    <div className='videoPlayer'>
                      <Player className="video" ref={(video1) => { videoPlayer.current = video1; }}>
                        <source src={lessonInfo.video} />
                      </Player>
                    </div>

                  </Col>
                  <Col xl={3} className='px-0'>
                    <Card className='materials'>
                      <Card.Header className='bg-primary text-white'>Материалы урока</Card.Header>
                      <Card.Body>
                        {lessonInfo.text ? (
                          <ReactMarkdown source={lessonInfo.text} />
                        ) : (<span>Материалов урока нет</span>)}
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>

                <Row>
                  <Col xl={9} className='px-0'>
                    <Card className='homework'>
                      <Card.Header className='bg-primary text-white'>Домашняя работа</Card.Header>
                      <Card.Body>
                        {lessonInfo.homework ? (
                          <ReactMarkdown source={lessonInfo.homework} />
                        ) : (<span>Домашней работы нет</span>)}
                      </Card.Body>
                    </Card>

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
                                <Button onClick={(e) => { e.stopPropagation(); handleCommentRemove(comment.ID) }} className='btn-icon'><BsTrashFill className='text-danger' /></Button>
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

          </>
        )}
      </Container>
    </motion.div>
  </>)

}


Page.getInitialProps = async (ctx) => {
  var atob = require('atob');
  var redirect = require('~/lib/redirect').default;

  const { id } = ctx.query;

  const checkLoggedIn = require('~/lib/checkLoggedIn').default;
  const AccessToken = checkLoggedIn(ctx);

  const b64DecodeUnicode = (str) => {
    return decodeURIComponent(atob(str).split('').map(function (c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
  }

  const userID = AccessToken ? JSON.parse(b64DecodeUnicode(AccessToken.split('.')[1])).userId : false;

  if(!userID){
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

  return {
    pageId: id, userID, lesson: lessonInfo
  }
};

export default withApollo(Page)
