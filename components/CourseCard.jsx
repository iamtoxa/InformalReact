import React, { useState } from 'react';
import { Spinner, Button } from 'react-bootstrap'
import { RiStarLine } from 'react-icons/ri';
import { MdMoneyOff, MdClose } from 'react-icons/md';
import { BsEyeSlash, BsArchive } from 'react-icons/bs';
import { AiOutlineFileSearch } from 'react-icons/ai';

import Link from 'next/link'

import { withCookies } from 'react-cookie';
import { withApollo } from '@apollo/react-hoc';
import { useDispatch } from "react-redux";

import { CREATE_TOAST, CREATE_MODAL } from "../redux/actions";

import { gql } from 'apollo-boost';

const COURSE_FAVORITE = gql`
    mutation courseFavorite($id: ID!, $value: Boolean!){
      courseFavorite(id: $id, value: $value)
    }
`;

const COURSE_INFO = gql`
query courseInfo($id: ID!) {
  courseInfo(id: $id) {
    ID
    name
    short
    price
    image
    favorite
    status
  }
}
`;

const CourseCard = ({data, fetch, client: apolloClient, template, cookies}) => {
  const dispatch = useDispatch();

  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState({});

  const [init, setInit] = useState(true);

  if (data && !fetch) {
    if (init && !deepEqual(data, course)) {
      setCourse(data)
      setLoading(false);
      setInit(false);
    }
  } else {

  }

  const favoriteToggle = ()=>{
    apolloClient.mutate({
      mutation: COURSE_FAVORITE,
      variables: {
        id: course.ID,
        value: !course.favorite
      }
    })
      .then(({ data }) => {
        setCourse({...course, favorite: !course.favorite});
        
        if(!course.favorite){
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

        return true;
      })
      .catch(() => {
        dispatch({
          type: CREATE_TOAST, props: {
            type: "danger",
            title: "Избранное",
            body: <span>Что-то пошло не так. Обратитесь в <a href='mailto:iamtoxa00@gmail.com'>службу поддержки</a></span>
          }
        });

        return false
      })
  }


  return (<>
    <div className={`CourseCard ${loading ? "loading" : ""}`}>
      <div>
        {!loading ? (
          <>
            <div className='header'>
              {!template ? <Link href='/course/[id]' as={`/course/${course.ID}`}>
                <img alt='' style={{ cursor: "pointer" }} src={course.image ? course.image : "https://user-images.githubusercontent.com/194400/49531010-48dad180-f8b1-11e8-8d89-1e61320e1d82.png"} />
              </Link> : <>
                <img alt='' src={course.image ? course.image : "https://user-images.githubusercontent.com/194400/49531010-48dad180-f8b1-11e8-8d89-1e61320e1d82.png"} />
              </>}
              <div className='badges'>
                {course.favorite && <div title='В избранном' className='badge'><RiStarLine size={20} title='В избранном'/></div>}
                {course.price == 0 && <div title='Бесплатный' className='badge'><MdMoneyOff size={20} title='Бесплатный'/></div>}


                {(course.status != "showed" || template) && <div title='Скрытый курс' className='badge'><BsEyeSlash size={20} /></div>}
                {(course.status == "moderate") && <div title='На модерации' className='badge'><AiOutlineFileSearch size={20} /></div>}
                {(course.status == "rejected") && <div title='Отклонён от размещения' className='badge'><MdClose size={20} /></div>}
                {(course.status == "archive") && <div title='В архиве' className='badge'><BsArchive size={20} /></div>}
              </div>
            </div>
            <div className='body'>
              <h2 className={`title ${!course.name && "skeleton"}`}>{course.name}</h2>
              <p className={`description ${!course.short && "skeleton"}`}>{course.short}</p>
              {!template && (
                <div className='actions'>
                  {cookies.get('accessToken') && <Button size='sm' className="btn-icon" onClick={favoriteToggle}><RiStarLine size={18} /></Button>}
                  <Link href='/course/[id]' as={`/course/${course.ID}`}>
                    <Button size='sm'>Подробнее</Button>
                  </Link>
                </div>
              )}
            </div>
          </>
        ) : (
            <>
              <div className='header skeleton'>
                <Spinner animation="border" />
                <div className='badges'>
                  <div className='badge'></div>
                  <div className='badge'></div>
                </div>
              </div>
              <div className='body'>
                <h2 className='title skeleton'></h2>
                <p className='description skeleton'></p>
                <div className='actions'>
                  <Button size='sm'>Loading...</Button>
                </div>
              </div>
            </>
          )}
      </div>
    </div>
  </>)

}

export default withCookies(withApollo(CourseCard))



function deepEqual(object1, object2) {
  const keys1 = Object.keys(object1);
  const keys2 = Object.keys(object2);

  if (keys1.length !== keys2.length) {
    return false;
  }

  for (const key of keys1) {
    const val1 = object1[key];
    const val2 = object2[key];
    const areObjects = isObject(val1) && isObject(val2);
    if (
      areObjects && !deepEqual(val1, val2) ||
      !areObjects && val1 !== val2
    ) {
      return false;
    }
  }

  return true;
}

function isObject(object) {
  return object != null && typeof object === 'object';
}