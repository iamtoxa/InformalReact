import Head from 'next/head'
import { motion } from "framer-motion"
import { Container, Button, Row, Col, Card, ListGroup } from 'react-bootstrap'

import React, { useState, useEffect } from 'react';
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useQuery, useMutation } from '@apollo/react-hooks';
import { gql } from 'apollo-boost';
import { useSelector, useDispatch } from "react-redux";

import { RiStarLine } from 'react-icons/ri';
import { MdAccountBalanceWallet, MdClose } from 'react-icons/md';


import { MdMoneyOff } from 'react-icons/md';
import { BsEyeSlash, BsArchive } from 'react-icons/bs';
import { AiOutlineFileSearch } from 'react-icons/ai';

import { CREATE_TOAST, CREATE_MODAL } from "~/redux/actions";
import { withApollo } from '@apollo/react-hoc';

const COURSE_FAVORITE = gql`
    mutation courseFavorite($id: ID!, $value: Boolean!){
      courseFavorite(id: $id, value: $value)
    }
`;

const COURSE_BUY = gql`
    mutation courseInfo($id: ID!) {
      courseBuy(id:$id)
    }
`;

const COURSE_INFO = gql`
query courseInfo($id: ID!) {
  courseInfo(id: $id) {
    ID
    name
    price
    description
    image
    favorite
    status
    owned
    category {
      ID
      name
    }
    owner {
      ID
      firstName
      lastName
    }
    purchases {
      ID
      user{
        ID
        firstName
        lastName
      }
    }
    
    lessons{
      _lessonID
      title
      description
      order
    }
  }
}

`;



const Page = ({ client: apolloClient, course, userID, balance }) => {
  const dispatch = useDispatch();

  // const router = useRouter()
  // var id = props.pageId


  // var { loading, error, data, refetch } = useQuery(COURSE_INFO, { variables: { id: id } });
  // if (!loading && data && course == null) {
  //   router.push('/404')
  // }


  const [couseInfo, setСourse] = useState(course);


  const favoriteToggle = () => {
    apolloClient.mutate({
      mutation: COURSE_FAVORITE,
      variables: {
        id: couseInfo.ID,
        value: !couseInfo.favorite
      }
    })
      .then(({ data }) => {
        setСourse({...couseInfo, favorite: !couseInfo.favorite});
        
        if(!couseInfo.favorite){
          dispatch({
            type: CREATE_TOAST, props: {
              type: "success",
              title: "Избранное",
              body: "Курс добавлен в список избранных"
            }
          });
        } else {
          dispatch({
            type: CREATE_TOAST, props: {
              type: "success",
              title: "Избранное",
              body: "Курс убран из списка избранных"
            }
          });
        }

        return true
      })
      .catch(() => {
        dispatch({
          type: CREATE_TOAST, props: {
            type: "danger",
            title: "Избранное",
            body: <span>Что-то пошло не так. Проверьте корректность данных. или обратитесь в <a href='mailto:iamtoxa00@gmail.com'>службу поддержки</a></span>
          }
        });

        return { data: {} }
      })
  }

  const handleBuy = () => {
    apolloClient.mutate({
      errorPolicy: "all",
      mutation: COURSE_BUY,
      variables: {
        id: couseInfo.ID
      }
    })
      .then(({ data, errors }) => {
        if (errors) {
          const err = errors[0].message;

          if(err === "already purchased"){
            dispatch({ type: CREATE_TOAST, props: {
              type: "danger",
              title:"Покупка курса",
              body:"Вы уже приобрели этот курс"
            }});
            setСourse({...couseInfo, owned: true});
          }
          if(err === "not enough money"){
            dispatch({ type: CREATE_TOAST, props: {
              type: "danger",
              title:"Покупка курса",
              body:"На вашем балансе недостаточно средств"
            }});
          }

          return false;
        }

        setСourse({...couseInfo, owned: true});

        dispatch({
          type: CREATE_TOAST, props: {
            type: "success",
            title: "Покупка курса",
            body: "Вы успешно приобрели курс"
          }
        });

        return true
      })
      .catch(() => {
        dispatch({
          type: CREATE_TOAST, props: {
            type: "danger",
            title: "Избранное",
            body: <span>Что-то пошло не так. Проверьте корректность данных. или обратитесь в <a href='mailto:iamtoxa00@gmail.com'>службу поддержки</a></span>
          }
        });

        return { data: {} }
      })
  }

  return (<>
    <Head>
      {course ? <title>{couseInfo.name}</title> : <title>Страница курса</title>}
      {course && <meta name="description" content={`Страница курса "${couseInfo.name}" на ресурсе InformalPlace. Описание курса: ${couseInfo.description}`} />}
    </Head>

    <Container className='py-3' fluid>
      <div className='balance'>
        <MdAccountBalanceWallet className='icon' size={32}/> {balance} ₽
      </div>

      {course && (<div className='CoursePage'>
        <div className="header">
          <div className="imageWrapper">
            <div className="image">
              <img alt='' src={couseInfo.image ? couseInfo.image : "https://user-images.githubusercontent.com/194400/49531010-48dad180-f8b1-11e8-8d89-1e61320e1d82.png"} />
              <div className="badges">
                {couseInfo.favorite && <div className='badge'><RiStarLine size={20} /></div>}
                {couseInfo.price == 0 && <div className='badge'><MdMoneyOff size={20} /></div>}

                {(couseInfo.status != "showed") && <div title='Скрытый курс' className='badge'><BsEyeSlash size={20} /></div>}
                {(couseInfo.status == "moderate") && <div title='На модерации' className='badge'><AiOutlineFileSearch size={20} /></div>}
                {(couseInfo.status == "rejected") && <div title='Отклонён от размещения' className='badge'><MdClose size={20} /></div>}
                {(couseInfo.status == "archive") && <div title='В архиве' className='badge'><BsArchive size={20} /></div>}
              </div>
              {couseInfo.price != 0 && (
                <div className='price'>
                  {couseInfo.price} ₽
                </div>
              )}
            </div>

            <div className="actions">
              {userID && (<>
                <Button onClick={favoriteToggle}><RiStarLine size={18} /></Button>
                {couseInfo.owner.ID != userID && couseInfo.price == 0 && !couseInfo.owned && <Button onClick={handleBuy}>Начать изучение</Button>}
                {couseInfo.owner.ID != userID && couseInfo.price != 0 && !couseInfo.owned && <Button onClick={handleBuy}>Приобрести курс</Button>}
                {couseInfo.owned && couseInfo.owner.ID != userID && <Button disabled variant='outline-primary'>Уже приобретен</Button>}
                {userID && couseInfo.owner.ID == userID && <Button disabled variant='outline-primary'>Вы владелец курса</Button>}
              </>)}
              {!userID && (<>
                <Link href='/login'>
                  <Button>Авторизуйтесь для начала обучения</Button>
                </Link>
              </>)}
            </div>
          </div>
          <div className="info">
            <h1 className="title">{couseInfo.name}</h1>
            <div className="topGroup">
              <div className="author">
                <Link href='/user/[id]' as={`/user/${couseInfo.owner.ID}`}>
                  {
                    (!couseInfo.owner.firstName && !couseInfo.owner.lastName) ?
                      <a>Анонимный пользователь</a> :
                      <a>{couseInfo.owner.firstName.trim()+" "+couseInfo.owner.lastName.trim()}</a>
                  }
                </Link>
              </div>
              <span>•</span>
              <div className="category">
                {couseInfo.category.name}
              </div>
            </div>
            <div className="description">{couseInfo.description}</div>
          </div>
        </div>
        <Row>
          <Col md={12} lg={8} className='mb-3'>
            <div className="lessons">
              {couseInfo.lessons.map((lesson, index) => (
                <Card key={lesson._lessonID} className='lesson shadow-custom'>
                  <Card.Header>
                    <div className="num">{("0" + (index + 1)).slice(-2)}</div>
                    <h2 className="title">{lesson.title}</h2>
                  </Card.Header>
                  <Card.Body>
                    {lesson.description}
                  </Card.Body>
                  {(couseInfo.owned || couseInfo.owner.ID == userID) && (
                    <Card.Footer align='right'>
                      <Link href='/lesson/[id]' as={`/lesson/${lesson._lessonID}`}>
                        <Button>Открыть урок</Button>
                      </Link>
                    </Card.Footer>
                  )}
                </Card>
              ))}
            </div>
          </Col>
          <Col md={12} lg={4}>
            <Card className='students shadow-custom round-custom'>
              <Card.Header>
                Последние ученики
                </Card.Header>
              <ListGroup variant="flush">
                {couseInfo.purchases.length > 0 ? couseInfo.purchases.map((purchase, index) => {
                  if (!purchase.user.firstName && !purchase.user.lastName) {
                    purchase.user.firstName = "Анонимный"
                    purchase.user.lastName = "пользователь"
                  }
                  if (index < 10) {
                    return (
                      <Link key={purchase.user.ID} href='/user/[id]' as={`/user/${purchase.user.ID}`}>
                        <ListGroup.Item action>
                          {purchase.user.firstName.trim()+" "+purchase.user.lastName.trim()}
                        </ListGroup.Item>
                      </Link>
                    )
                  }
                }) : <Card.Body>Вы можете стать первым учеником</Card.Body>}
              </ListGroup>
            </Card>
          </Col>
        </Row>
      </div>)}
    </Container>
  </>)

}


Page.getInitialProps = async (ctx) => {
  var atob = require('atob');

  const { id } = ctx.query;

  const checkLoggedIn = require('~/lib/checkLoggedIn').default;
  const AccessToken = checkLoggedIn(ctx);


  const userInfo = require('~/lib/getUser').default;

  const b64DecodeUnicode = (str) => {
    return decodeURIComponent(atob(str).split('').map(function (c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
  }

  const userID = AccessToken ? JSON.parse(b64DecodeUnicode(AccessToken.split('.')[1])).userId : false;

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

  const balance = await userInfo(ctx.apolloClient).then(res=>res.balance)

  return {
    pageId: id, userID, course: courseInfo, balance
  }
};

export default withApollo(Page)