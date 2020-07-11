import Head from 'next/head'
import { motion } from "framer-motion"
import { Container, Button, Row, Col, Card, ListGroup, Form, Tabs, Tab, Nav, FormControl } from 'react-bootstrap'
import React, { useState } from 'react';
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useQuery, useMutation } from '@apollo/react-hooks';
import { gql } from 'apollo-boost';
import { useSelector, useDispatch } from "react-redux";
import ImageLoader from '../../../../../components/ImageLoader'
import { CREATE_TOAST } from "../../../../../redux/actions";
import { CREATE_MODAL } from "../../../../../redux/actions";

import { withApollo } from '@apollo/react-hoc';

const ReactMarkdown = require('react-markdown')

import { Formik } from 'formik';
import { object as yupObject, string as yupString, number as yupNumber, setLocale } from 'yup';
import { AiOutlinePlus } from 'react-icons/ai';
import { BsPlus, BsTrash, BsCheck } from 'react-icons/bs';

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

let taskSchema = yupObject({
  text: yupString().required().min(5).max(200)
}).defined();


function b64DecodeUnicode(str) {
  return decodeURIComponent(atob(str).split('').map(function (c) {
    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
  }).join(''));
}

const USER_INFO = gql`
  query{
    me{
      moderator
    }
  }
`;

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
      }
    }
    course{
      ID
			owner{
        ID
      }
    }

    ... on Test{
      ID
      title
      description
      # timer

      tasks{
        ID
        text
        CorrectOption{
          ID
        }
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
      text
      homework
    }
  }
}
`;


const LECTION_UPDATE = gql`
mutation lectionUpdate($ID: ID!, $title: String!, $description: String!){
  lectionUpdate(id: $ID, info:{
    title: $title
    description: $description
  }){
    _lessonID
  }
}
`;

const TEST_UPDATE = gql`
mutation testUpdate($ID: ID!, $title: String!, $description: String!, $timer: Int){
  testUpdate(id: $ID, info:{
    title: $title
    description: $description
    timer: $timer
  }){
    _lessonID
  }
}
`;


const LECTION_UPDATE__TEXT = gql`
mutation textUpdate($ID: ID!, $text: String!){
  lectionUpdate(id: $ID, info:{
    text: $text
  }){
    _lessonID
  }
}
`;

const LECTION_UPDATE__HOMEWORK = gql`
mutation homeworkUpdate($ID: ID!, $homework: String!){
  lectionUpdate(id: $ID, info:{
    homework: $homework
  }){
    _lessonID
  }
}
`;

const LESSON_DELETE = gql`
mutation lessonDelete($ID: ID!){
  lessonDelete(id:$ID)
}
`;

const TEST_ADD_TASK = gql`
mutation taskCreate($ID: ID!, $text: String!){
  taskCreate(testID:$ID, info:{
    text: $text
  }){
    ID
    text
    CorrectOption{
      ID
    }
    options{
      text
      value
      ID
    }
  }
}
`;

const TEST_UPDATE_TASK = gql`
mutation taskUpdate($ID: ID!, $text: String!){
  taskUpdate(id: $ID, info:{text: $text}){
		ID
  }
}
`;

const TEST_REMOVE_TASK = gql`
mutation taskDelete($ID: ID!){
  taskDelete(id:$ID)
}
`;

const TEST_UPDATE_TASK_CORRECT = gql`
mutation taskSetCorrect($ID: ID!, $value:ID!){
  taskSetCorrect(id: $ID, value: $value)
}
`;


const TEST_REMOVE_TASK_OPTION = gql`
mutation optionDelete($ID: ID!){
  optionDelete(id: $ID)
}
`;

const TEST_CREATE_TASK_OPTION = gql`
mutation optionCreate($taskID: ID!, $text: String!){
  optionCreate(taskID: $taskID, info: {text: $text, value: $text}){
    text
    value
    ID
  }
}
`;

const Page = ({ userID, lesson, client: apolloClient }) => {
  const router = useRouter()
  const dispatch = useDispatch();

  const [lessonInfo, setLesson] = useState(lesson);

  const [video, setVideo] = useState();
  const [textView, setTextView] = useState('render');
  const [homeworkView, setHomeworkView] = useState('render');

  const [markdownText, setMarkdownText] = useState();
  const [markdownHomework, setMarkdownHomework] = useState();

  const [selectedTask, setSelectedTask] = useState();
  const [newOption, setNewOption] = useState();



  if (lessonInfo.video && lessonInfo.video != video) {
    setVideo(lessonInfo.video);
  }

  if (lessonInfo.homework && lessonInfo.homework != homeworkView && homeworkView === undefined) {
    setMarkdownHomework(lessonInfo.homework);
  }

  if (lessonInfo.text && lessonInfo.text != markdownText && markdownText === undefined) {
    setMarkdownText(lessonInfo.text);
  }

  const handleSaveLectionInfo = (values) => {
    apolloClient.mutate({
      mutation: LECTION_UPDATE,
      variables: {
        ID: lessonInfo.ID,
        title: values.title,
        description: values.description
      }
    })
      .then(({ data }) => {
        dispatch({
          type: CREATE_TOAST, props: {
            type: "success",
            title: "Информация обновлена",
            body: "Основная информация об этой лекции успешно обновлена"
          }
        });

        return true;
      })
      .catch(() => {
        return false;
      })
  }

  const handleSaveLectionHomework = () => {
    apolloClient.mutate({
      mutation: LECTION_UPDATE__HOMEWORK,
      variables: {
        ID: lessonInfo.ID,
        homework: markdownHomework
      }
    })
      .then(({ data }) => {
        dispatch({
          type: CREATE_TOAST, props: {
            type: "success",
            title: "Информация обновлена",
            body: "Домашняя работа к уроку обновлена"
          }
        });

        return true;
      })
      .catch(() => {
        return false;
      })
  }


  const handleSaveLectionText = () => {
    apolloClient.mutate({
      mutation: LECTION_UPDATE__TEXT,
      variables: {
        ID: lessonInfo.ID,
        text: markdownText
      }
    })
      .then(({ data }) => {
        dispatch({
          type: CREATE_TOAST, props: {
            type: "success",
            title: "Информация обновлена",
            body: "Материалы урока обновлены"
          }
        });

        return true;
      })
      .catch(() => {
        return false;
      })
  }


  const handleSaveTestInfo = (values) => {
    apolloClient.mutate({
      mutation: TEST_UPDATE,
      variables: {
        ID: lessonInfo.ID,
        title: values.title,
        description: values.description,
        // timer: Number(values.timer)
      }
    })
      .then(({ data }) => {
        dispatch({
          type: CREATE_TOAST, props: {
            type: "success",
            title: "Информация обновлена",
            body: "Основная информация об этом тестировании успешно обновлена"
          }
        });

        return true;
      })
      .catch(() => {
        return false;
      })
  }

  const handleLessonDelete = () => {
    apolloClient.mutate({
      mutation: LESSON_DELETE,
      variables: {
        ID: lessonInfo._lessonID
      }
    })
      .then(({ data }) => {
        dispatch({
          type: CREATE_TOAST, props: {
            type: "success",
            title: "Удаление урока",
            body: "Урок успешно удалён"
          }
        });

        router.push(`/controlPanel/course/${lessonInfo.course.ID}`)

        return true;
      })
      .catch(() => {
        return false;
      })
  }


  const handleCreateTask = () => {
    apolloClient.mutate({
      mutation: TEST_ADD_TASK,
      variables: {
        ID: lessonInfo.ID,
        text: ""
      }
    })
      .then(({ data }) => {
        setLesson({...lessonInfo, tasks:[...lessonInfo.tasks, data.taskCreate]})

        dispatch({
          type: CREATE_TOAST, props: {
            type: "success",
            title: "Новое задание",
            body: "Создано новое задание"
          }
        });

        return true;
      })
      .catch(() => {
        return false;
      })
  }

  const handleUpdateTask = (values) => {
    apolloClient.mutate({
      mutation: TEST_UPDATE_TASK,
      variables: {
        ID: selectedTask,
        text: values.text
      }
    })
      .then(({ data }) => {
        dispatch({
          type: CREATE_TOAST, props: {
            type: "success",
            title: "Задание обновлено",
            body: "Задание успешно обновлено"
          }
        });

        return true;
      })
      .catch(() => {
        return false;
      })
  }


  const handleRemoveTask = () => {
    var deleted = selectedTask;
    apolloClient.mutate({
      mutation: TEST_REMOVE_TASK,
      variables: {
        ID: deleted
      }
    })
      .then(({ data }) => {
      
        setSelectedTask(null);
        setLesson({...lessonInfo, tasks:[...lessonInfo.tasks.filter(el=>el.ID != deleted)]})
        
        dispatch({
          type: CREATE_TOAST, props: {
            type: "success",
            title: "Задание обновлено",
            body: "Задание успешно удалено"
          }
        });

        return true;
      })
      .catch(() => {
        return false;
      })
  }

  const handleUpdateTaskCorrect = (correctID) => {
    apolloClient.mutate({
      mutation: TEST_UPDATE_TASK_CORRECT,
      variables: {
        ID: selectedTask,
        value: correctID
      }
    })
      .then(({ data }) => {
        var newTasks = lessonInfo.tasks;
        newTasks[newTasks.findIndex(el=>el.ID == selectedTask)].CorrectOption = {ID: correctID};
        
        setLesson({...lessonInfo, tasks: newTasks})

        dispatch({
          type: CREATE_TOAST, props: {
            type: "success",
            title: "Задание обновлено",
            body: "Верный вариант ответа установлен"
          }
        });
        return true;
      })
      .catch(() => {
        return false;
      })
  }

  const handleRemoveOption = (optionID) => {
    apolloClient.mutate({
      mutation: TEST_REMOVE_TASK_OPTION,
      variables: {
        ID: optionID
      }
    })
      .then(({ data }) => {
        var newTasks = lessonInfo.tasks;
        var taskIndex = newTasks.findIndex(el=>el.ID == selectedTask);
        // var optionIndex = newTasks[taskIndex].options.findIndex(el=>el.ID == optionID);

        newTasks[taskIndex].options = newTasks[taskIndex].options.filter(el=>el.ID != optionID);
        
        setLesson({...lessonInfo, tasks: newTasks})

        dispatch({
          type: CREATE_TOAST, props: {
            type: "success",
            title: "Задание обновлено",
            body: "Вариант ответа удалён"
          }
        });
        return true;
      })
      .catch(() => {
        return false;
      })
  }

  const handleCreateOption = () => {
    apolloClient.mutate({
      mutation: TEST_CREATE_TASK_OPTION,
      variables: {
        taskID: selectedTask,
        text: newOption
      }
    })
      .then(({ data }) => {
        var newTasks = lessonInfo.tasks;
        var taskIndex = newTasks.findIndex(el=>el.ID == selectedTask);

        newTasks[taskIndex].options = [...newTasks[taskIndex].options, data.optionCreate];
        
        setLesson({...lessonInfo, tasks: newTasks})

        dispatch({
          type: CREATE_TOAST, props: {
            type: "success",
            title: "Задание обновлено",
            body: "Вариант ответа добавлен"
          }
        });
        return true;
      })
      .catch(() => {
        return false;
      })
  }

  return (<>
    <Head>
      <title>Редактирование урока</title>
    </Head>

    <motion.div transition={{ duration: 0.2, delay: 0 }} initial={{ opacity: 0, translateX: -50 }} animate={{ opacity: 1, translateX: 0 }} exit={{ opacity: 0 }} >
      <Container className='py-3 controlPanelPage' fluid>
        {lessonInfo && (
          <Row>
            <Col md={{ span: 12, order: 1 }} lg={{ span: 6, order: 1 }} xl={{ span: 3, order: 1 }}>
              <Row>
                <Col md={12} className='mb-3'>
                  {lessonInfo.video && (
                    <Card className='mb-3'>
                      <Card.Header>Видео</Card.Header>
                      <div className="videoPlayer">
                        <video src={lessonInfo.video} controls />
                      </div>
                    </Card>
                  )}


                  {lessonInfo.__typename == 'Lection' && (
                    <Card className="shadow-custom">
                      <Card.Header> Основная информация</Card.Header>
                      <Formik enableReinitialize onSubmit={handleSaveLectionInfo} validationSchema={schema} initialValues={{ ...lessonInfo }}>
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
                              </Card.Body>
                              <Card.Footer>
                                <Button block disabled={!isValid} variant='primary' type="button" onClick={handleSubmit}>Сохранить</Button>
                                <Button block variant='outline-primary' type="button" onClick={resetForm}>Вернуть к инзачальным</Button>
                              </Card.Footer>
                            </>
                          )}

                      </Formik>
                    </Card>
                  )}

                  {lessonInfo.__typename == 'Test' && (
                    <Card className="shadow-custom">
                      <Card.Header> Основная информация</Card.Header>
                      <Formik enableReinitialize onSubmit={handleSaveTestInfo} validationSchema={schema} initialValues={{ ...lessonInfo }}>
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

                                  {/* <Form.Row>
                                    <Form.Group as={Col} md="12" controlId="control_timer">
                                      <Form.Label>Таймер тестирования</Form.Label>
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
                              </Card.Body>
                              <Card.Footer>
                                <Button block disabled={!isValid} variant='primary' type="button" onClick={handleSubmit}>Сохранить</Button>
                                <Button block variant='outline-primary' type="button" onClick={resetForm}>Вернуть к инзачальным</Button>
                              </Card.Footer>
                            </>
                          )}

                      </Formik>
                    </Card>
                  )}

                </Col>
              </Row>
            </Col>


            <Col md={{ span: 12, order: 3 }} lg={{ span: 12, order: 3 }} xl={{ span: 6, order: 2 }}>
              <Row>
                {lessonInfo.__typename == "Lection" && (
                  <Col md={12} className='mb-3'>
                    <Card className="lessons shadow-custom">
                      <Card.Header>Материалы урока</Card.Header>

                      <Card.Header>
                        <Nav variant="tabs" defaultActiveKey="#first">
                          <Nav.Item>
                            <Nav.Link onClick={() => { setTextView('edit') }}>Редактирование</Nav.Link>
                          </Nav.Item>
                          <Nav.Item>
                            <Nav.Link onClick={() => { setTextView('render') }}>Предосмотр</Nav.Link>
                          </Nav.Item>
                        </Nav>
                      </Card.Header>

                      {textView == 'edit' && (
                        <Card.Body>
                          <Row>
                            <Col xs={12}>
                              <FormControl maxLength='5000' as="textarea" placeholder="Markdown разметка" value={markdownText} onChange={(e) => { setMarkdownText(e.currentTarget.value) }} />
                            </Col>
                          </Row>
                        </Card.Body>
                      )}

                      {textView == 'render' && (
                        <Card.Body>

                          {markdownText ? (
                            <ReactMarkdown source={markdownText} />
                          ) : (
                              <span>Материалов урока нет</span>
                            )}


                        </Card.Body>
                      )}

                      <Card.Footer align='right'>
                        <Button onClick={handleSaveLectionText}>Сохранить</Button>
                      </Card.Footer>
                    </Card>
                  </Col>
                )}

                {lessonInfo.__typename == "Lection" && (
                  <Col md={12} className='mb-3'>
                    <Card className="lessons shadow-custom">
                      <Card.Header>Домашняя работа</Card.Header>
                      <Card.Header>
                        <Nav variant="tabs" defaultActiveKey="#first">
                          <Nav.Item>
                            <Nav.Link onClick={() => { setHomeworkView('edit') }}>Редактирование</Nav.Link>
                          </Nav.Item>
                          <Nav.Item>
                            <Nav.Link onClick={() => { setHomeworkView('render') }}>Предосмотр</Nav.Link>
                          </Nav.Item>
                        </Nav>
                      </Card.Header>

                      {homeworkView == 'edit' && (
                        <Card.Body>
                          <Row>
                            <Col xs={12}>
                              <FormControl maxLength='500' as="textarea" placeholder="Markdown разметка" value={markdownHomework} onChange={(e) => { setMarkdownHomework(e.currentTarget.value) }} />
                            </Col>
                          </Row>
                        </Card.Body>
                      )}

                      {homeworkView == 'render' && (
                        <Card.Body>

                          {markdownHomework ? (
                            <ReactMarkdown source={markdownHomework} />
                          ) : (<span>Домашней работы нет</span>)}


                        </Card.Body>
                      )}

                      <Card.Footer align='right'>
                        <Button onClick={handleSaveLectionHomework}>Сохранить</Button>
                      </Card.Footer>
                    </Card>
                  </Col>
                )}

                {lessonInfo.__typename == "Test" && (
                  <Col md={12} className='mb-3'>
                    <Card className="lessons shadow-custom">
                      <Card.Header>Задания теста</Card.Header>
                      <Card.Header>
                        <Nav variant="tabs">
                          {lessonInfo.tasks && lessonInfo.tasks.map((task, index) => {
                            return <Nav.Item key={task.ID} className="task-tab">
                              <Nav.Link onClick={() => { setSelectedTask(task.ID) }}>{index + 1}</Nav.Link>
                            </Nav.Item>
                          })}

                          <Nav.Item className="task-tab" onClick={handleCreateTask}>
                            <Nav.Link><BsPlus /></Nav.Link>
                          </Nav.Item>
                        </Nav>
                      </Card.Header>


                      {selectedTask && (
                        <>
                          <Formik enableReinitialize onSubmit={handleUpdateTask} validationSchema={taskSchema} initialValues={{ ...lessonInfo.tasks.find(el => el.ID == selectedTask) }}>
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
                                        <Form.Group as={Col} md="12" controlId="control_text">
                                          <Form.Label>Текст задания</Form.Label>
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
                                    </Form>

                                    <Row>
                                      <Col xs={12} align='right'>
                                        <Button disabled={!isValid} variant='outline-primary' type="button" onClick={handleSubmit}>Сохранить</Button>
                                      </Col>
                                    </Row>

                                    <div className='mb-2'>Варианты ответов</div>
                                    <ListGroup >
                                      {lessonInfo.tasks.find(el => el.ID == selectedTask).options.map((option, index) => (
                                        <ListGroup.Item key={option.ID} className='optionsList' active={lessonInfo.tasks.find(el => el.ID == selectedTask).CorrectOption && option.ID == lessonInfo.tasks.find(el => el.ID == selectedTask).CorrectOption.ID}>
                                          <Row>
                                            <Col sm={10} lg={9}>
                                              {option.text}
                                            </Col>
                                            <Col sm={2} lg={3} style={{display:'flex', alignItems:"center", justifyContent: "flex-end"}}>
                                              {lessonInfo.tasks.find(el => el.ID == selectedTask).CorrectOption && option.ID != lessonInfo.tasks.find(el => el.ID == selectedTask).CorrectOption.ID && (
                                                <>
                                                  <Button className='btn-icon mr-2' variant='outline-success' onClick={() => { handleUpdateTaskCorrect(option.ID) }}>
                                                    <BsCheck />
                                                  </Button>
                                                  <Button className='btn-icon' variant='outline-danger' onClick={(e) => { handleRemoveOption(option.ID) }}>
                                                    <BsTrash />
                                                  </Button>
                                                </>
                                              )}

                                              {!lessonInfo.tasks.find(el => el.ID == selectedTask).CorrectOption && (
                                                <>
                                                  <Button className='btn-icon mr-2' variant='outline-success' onClick={() => { handleUpdateTaskCorrect(option.ID) }}>
                                                    <BsCheck />
                                                  </Button>
                                                  <Button className='btn-icon' variant='outline-danger' onClick={(e) => { handleRemoveOption(option.ID) }}>
                                                    <BsTrash />
                                                  </Button>
                                                </>
                                              )}
                                            </Col>
                                          </Row>
                                        </ListGroup.Item>
                                      ))}

                                      <ListGroup.Item>
                                        <Row>
                                          <Col sm={10} style={{ display: "flex", alignItems: "center" }}>
                                            <FormControl
                                              placeholder='Добавить вариант ответа'
                                              value={newOption}
                                              onChange={(e) => { setNewOption(e.currentTarget.value) }}
                                            />
                                          </Col>
                                          <Col sm={2} align='right' style={{ display: "flex", alignItems: "center", justifyContent: "flex-end" }}>
                                            <Button className='btn-icon' variant='outline-primary' onClick={handleCreateOption}>
                                              <BsPlus />
                                            </Button>
                                          </Col>
                                        </Row>
                                      </ListGroup.Item>

                                    </ListGroup>

                                  </Card.Body>
                                  <Card.Footer>
                                    <Button block variant='outline-danger' onClick={handleRemoveTask}>Удалить задание</Button>
                                  </Card.Footer>
                                </>
                              )}

                          </Formik>

                        </>
                      )}
                    </Card>
                  </Col>
                )}

                {lessonInfo.course.owner.ID == userID && (
                  <>
                    <Col md={12} className='mb-3'>
                      <Card className="shadow-custom">
                        <Card.Header>Действия с уроком</Card.Header>
                        <Card.Body>
                          <Button block variant='outline-danger' onClick={handleLessonDelete}>Удалить урок</Button>
                          <Link href='/controlPanel/course/[id]' as={`/controlPanel/course/${lessonInfo.course.ID}`}>
                            <Button block variant='outline-primary'>Панель управления курса</Button>
                          </Link>
                          <Link href='/lesson/[id]' as={`/lesson/${lessonInfo.ID}`}>
                            <Button block variant='outline-primary'>Страница урока</Button>
                          </Link>
                        </Card.Body>
                      </Card>
                    </Col>
                  </>
                )}
              </Row>
            </Col>


            {lessonInfo.__typename == "Lection" && (
              <Col md={{ span: 12, order: 2 }} lg={{ span: 6, order: 2 }} xl={{ span: 3, order: 3 }}>
                <Row>
                  <Col md={12} className='mb-3'>
                    <Card className='students shadow-custom'>
                      <Card.Header>Комментарии</Card.Header>
                      <ListGroup variant="flush">
                        {lessonInfo.comments.length > 0 ? lessonInfo.comments.map((comment, index) => {
                          return (
                            <Link key={comment.ID} href='/user/[id]' as={`/user/${comment.user.ID}`}>
                              <ListGroup.Item key={comment.ID} action>
                                {comment.text}
                              </ListGroup.Item>
                            </Link>
                          )
                        }) : <ListGroup.Item>Ещё никто не комментировал этот урок</ListGroup.Item>}
                      </ListGroup>
                    </Card>
                  </Col>
                </Row>
              </Col>
            )}

            {lessonInfo.__typename == "Test" && (
              <Col md={{ span: 12, order: 2 }} lg={{ span: 6, order: 2 }} xl={{ span: 3, order: 3 }}>
                <Row>
                  <Col md={12} className='mb-3'>
                    <Card className='students shadow-custom'>
                      <Card.Header>Результаты (В разработке)</Card.Header>
                      <ListGroup variant="flush">
                        {false ? lessonInfo.comments.map((comment, index) => {
                          return (
                            <>
                            </>
                          )
                        }) : <ListGroup.Item>Ещё никто не проходил этот тест</ListGroup.Item>}
                      </ListGroup>
                    </Card>
                  </Col>
                </Row>
              </Col>
            )}
          </Row>
        )}
      </Container>
    </motion.div>
  </>)

}

Page.getInitialProps = async (ctx) => {
  const { id, lessonId } = ctx.query;

  var atob = require('atob');
  var redirect = require('../../../../../lib/redirect').default;

  const checkLoggedIn = require('../../../../../lib/checkLoggedIn').default;
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
      lessonID: lessonId
    }
  })
    .then(({ data }) => {
      return data.lessonInfo
    })
    .catch(() => {
      return false;
    })

  return { lessonId, userID, lesson: lessonInfo };
};

export default withApollo(Page)
