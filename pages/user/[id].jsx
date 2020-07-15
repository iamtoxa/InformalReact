import Head from 'next/head'
import { motion } from "framer-motion"

import { Container, Button, Row, Col, Card, ListGroup } from 'react-bootstrap'

import React, { useState, useEffect } from 'react';
import Link from 'next/link'
import { useRouter, Router } from 'next/router'
import { useQuery, useMutation } from '@apollo/react-hooks';
import { gql } from 'apollo-boost';
import { useDispatch } from "react-redux";

import { GiFountainPen, GiOpenBook } from 'react-icons/gi';
import { MdMoneyOff } from 'react-icons/md';

import CourseCard from '~/components/CourseCard'
import Masonry from '~/components/Masonry';
import { truncate } from 'lodash';

import { withApollo } from '@apollo/react-hoc';


const USER_INFO = gql`
  query userInfo($id: ID!) {
    userInfo(id: $id) {
      ID
      firstName
      lastName
      image
      courses{
        ID
        name
        short
        price
        image
        favorite
        status
      }
      purchases{
        ID
        course{
          ID
          name
          short
          price
          image
          favorite
          status
        }
      }
    }
  }
`;

const Page = ({ selfPage, user }) => {
  const dispatch = useDispatch();
  const [userInfo, setUser] = useState(user);

  const [list, setList] = useState('');

  return (<>
    <Head>
      {userInfo && (userInfo.firstName || userInfo.lastName) ? <title>{userInfo.firstName} {userInfo.lastName}</title> : <title>Страница пользователя</title>}
    </Head>

    <Container className='py-3' fluid>
      {userInfo && (<div className='UserPage'>
        <div className="userCard shadow-custom ">
          <div className="image">
            {userInfo.image && <img className='img' src={userInfo.image} alt="" />}
            {!userInfo.image && (<div className='img'>
              {
                (!userInfo.firstName && !userInfo.lastName) ?
                  <span>АП</span> :
                  <span>{userInfo.firstName[0]}{userInfo.lastName[0]}</span>
              }
            </div>)}
          </div>
          <div className="name">
            {
              (!userInfo.firstName && !userInfo.lastName) ?
                <h1>Анонимный пользователь</h1> :
                <h1>{userInfo.firstName} {userInfo.lastName}</h1>
            }
          </div>
          <div className="actions">
            {/* {!selfPage && <Button>Открыть диалог</Button>} */}
            {/* {!selfPage && <Button variant='outline-danger'>Пожаловаться</Button>} */}
            {selfPage && <Link href='/controlPanel'><Button>Панель управления</Button></Link>}
            {/* {selfPage && <Button variant='outline-danger'>Закрыть профиль</Button>} */}
          </div>
          <Card className='badges'>
            <Card.Header>Награды пользователя</Card.Header>
            <Card.Body className="content">
              {userInfo.courses && userInfo.courses.filter(el=>el.status!='archive').length > 0 && (
                <Button className="badge" onClick={() => { setList('courses') }}>
                  <GiFountainPen className='icon' />
                  <div className="label">Автор курсов ({userInfo.courses.filter(el=>el.status!='archive').length})</div>
                </Button>
              )}
              {userInfo.purchases && userInfo.purchases.length > 0 && (
                <Button className="badge" onClick={() => { setList('purchases') }}>
                  <GiOpenBook className='icon' />
                  <div className="label">Студент курсов({userInfo.purchases.length})</div>
                </Button>
              )}
            </Card.Body>
          </Card>
        </div>
      </div>)}

      {list == "courses" && (
        <Row className='mt-5'>
          <Col sm={12} className='masonry_wrapper'>
            <Masonry>
              {userInfo.courses.filter(el=>el.status!='archive').map(course => {
                return (
                  <div key={course.ID} className='item'>
                    <CourseCard data={course} />
                  </div>
                )
              })}
            </Masonry>
          </Col>
        </Row>
      )}

      {list == "purchases" && (
        <Row className='mt-5'>
          <Col sm={12} className='masonry_wrapper'>
            <Masonry>
              {userInfo.purchases.map(purchase => {
                return (
                  <div key={purchase.ID} className='item'>
                    <CourseCard data={purchase.course} />
                  </div>
                )
              })}
            </Masonry>
          </Col>
        </Row>
      )}
    </Container>
  </>)

}


Page.getInitialProps = async (ctx) => {
  var atob = require('atob');
  var redirect = require('~/lib/redirect').default;

  var { id } = ctx.query;

  const checkLoggedIn = require('~/lib/checkLoggedIn').default;
  const AccessToken = checkLoggedIn(ctx);

  const b64DecodeUnicode = (str) => {
    return decodeURIComponent(atob(str).split('').map(function (c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
  }

  const userID = AccessToken ? JSON.parse(b64DecodeUnicode(AccessToken.split('.')[1])).userId : false;

  if (id == 'me') {
    if(userID){
      id = userID
    } else {
      redirect(ctx, '/login')
      return {};
    }
  }
  if (id == 'admin') { id = 1 }

  const userInfo = await ctx.apolloClient.query({
    query: USER_INFO,
    variables: {
      id: id
    }
  })
    .then(({ data }) => {
      return data.userInfo
    })
    .catch(() => {
      return false;
    })


  return {
    userID, user: userInfo, selfPage: userID == userInfo.ID
  }
};

export default withApollo(Page)