import { useState, useRef, useEffect } from 'react';
import Head from 'next/head'
import { withApollo } from '@apollo/react-hoc';

import dynamic from 'next/dynamic'
const Masonry = dynamic(() => import('~/components/Masonry'))
import CourseCard from '~/components/CourseCard';
import { CREATE_TOAST } from "~/redux/actions";

import { Container, Row, Col, Form, Button } from 'react-bootstrap';
import { GoSearch  } from 'react-icons/go';

import { gql } from 'apollo-boost';

import { withCookies } from 'react-cookie';

import { useDispatch } from "react-redux";

const GET_COURSES = gql`
  query coursesList($limit: Int!, $start: ID, $sortBy: CourseSort, $filter: [CourseFilter]){
    coursesList(limit: $limit, start: $start, sortBy: $sortBy, filter: $filter){
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

function Page({ cookies, categories, client: apolloClient }) {
  const dispatch = useDispatch();
  const [items, setItems] = useState([]);
  const [init, setInit] = useState(true);

  const sortBy = useRef('none');
  const category = useRef('none');
  const tags = useRef('');
  const favorites = useRef(false);
  const free = useRef(false);
  const EditorsChoice = useRef(false);
  
  const filterUpdate = (event)=>{
    event.preventDefault();
    updateItems();
    console.log('update items')
  }

  const loadMore = ()=>{
    console.log(items)
    apolloClient.query({
      query: GET_COURSES,
      variables: {
        limit: 10,
        sortBy: sortBy.current.value != 'none' ? sortBy.current.value : undefined,
        start: items.length > 0 ? items[items.length - 1].ID : undefined, 
        filter: [
          { key: "category", value: category.current.value },
          { key: "tags", value: tags.current.value },
          { key: "favorites", value: favorites.current.checked },
          { key: "free", value: free.current.checked },
          { key: "EditorsChoice", value: EditorsChoice.current.checked }]
            .filter(el => el.value && el.value != "none" && el.value != "")
            .map((val) => { return { key: val.key, value: val.value.toString() } })
      }
    })
      .then(({ data }) => {
        if(data.coursesList.length == 0) {
          dispatch({
            type: CREATE_TOAST, props: {
              type: "info",
              title: "Содержимое страницы",
              body: "Больше нет курсов для загрузки. Попробуйте обновить страницу, если хотите увидеть новые."
            }
          });
          return false;
        }
        setItems([...items, ...data.coursesList]);
        return true
      })
      .catch(() => {
        return false;
      })
  }

  const updateItems = ()=>{
    apolloClient.query({
      query: GET_COURSES,
      variables: {
        limit: 10,
        sortBy: sortBy.current.value != 'none' ? sortBy.current.value : undefined,
        filter: [
          { key: "category", value: category.current.value },
          { key: "tags", value: tags.current.value },
          { key: "favorites", value: favorites.current.checked },
          { key: "free", value: free.current.checked },
          { key: "EditorsChoice", value: EditorsChoice.current.checked }]
            .filter(el => el.value && el.value != "none" && el.value != "")
            .map((val) => { return { key: val.key, value: val.value.toString() } })
      }
    })
      .then(({ data }) => {
        setItems(data.coursesList);
        return true
      })
      .catch(() => {
        return false;
      })
  }


  if(init){
    updateItems();
    setInit(false);
  }

  return (
    <>
      <Head>
        <title>Informal Place</title>
        <link rel="icon" href="/favicon.ico" />
        <meta name="Description" content="Informal Place - education service" />
      </Head>

      <Container fluid>

        <Row className="p-0 mb-4">
          <Col sm={12} className="p-0">
            <Form className='filter' onSubmit={filterUpdate}>
              <div className='inputs'>
                <div className='flex-row flex-row__mr2'>

                  <Form.Control ref={category} as="select" name='category'>
                    <option value='none'>Все категории</option>
                    {categories.map(el => { return (<option value={el.ID} key={el.ID}>{el.name}</option>) })}
                  </Form.Control>
                  <Form.Control ref={sortBy} as="select" name='sortBy'>
                    <option value='none'>Сортировать по...</option>
                    <option value='popular'>По популярности</option>
                    <option value='newest'>От новых к давним</option>
                    <option value='oldest'>От давних к новым</option>
                    <option value='priceLow'>По возрастанию цены</option>
                    <option value='priceHigh'>По убыванию цены</option>
                  </Form.Control>

                  <Form.Control ref={tags} as="input" type="text" placeholder="Тег поиска" name='tags'/>

                </div>
                

                <div className='group'>
                  <Form.Group controlId="freeCheckbox" className='mb-0'>
                    <Form.Check ref={free} name='free' type="checkbox" label="Бесплатные" />
                  </Form.Group>

                  {cookies.get('accessToken') && <Form.Group controlId="favoritesCheckbox" className='mb-0'>
                    <Form.Check ref={favorites} name='favorites' type="checkbox" label="В избранном" />
                  </Form.Group>}

                  <Form.Group controlId="EditorsChoiceCheckbox" className='mb-0'>
                    <Form.Check ref={EditorsChoice} name='EditorsChoice' type="checkbox" label="Выбор редакции" />
                  </Form.Group>
                </div>
              </div>
              <Button className='search_btn' type="submit">
                <GoSearch size={36} className='icon' />
                <span style={{display: "none"}}>Search</span>
              </Button>
            </Form>
          </Col>
        </Row>

        <Row>
          <Col sm={12} className='masonry_wrapper'>
            <Masonry>
              {items.map(course=>{
                return (<div key={course.ID} className='item'>
                  <CourseCard data={course}/>
                </div>)
              })}
              
            </Masonry>
          </Col>
        </Row>
        <Row className='mb-2 px-2'>
          <Button as={Col} sm={{span: 8, offset:2}}  md={{span: 6, offset:3}} lg={{span: 2, offset:5}} variant='outline-primary' onClick={loadMore} className='loadMoreBtn'>
            Загрузить ещё
          </Button>
        </Row>
      </Container>
    </>
  )
}



const GET_CATEGORIES = gql`
  query{
    categoriesList{
      ID
      name
    }
  }
`;

Page.getInitialProps = async (ctx) => {
  const apolloClient = ctx.apolloClient;

  const { categories } = await apolloClient
    .query({ query: GET_CATEGORIES })
    .then(({ data }) => {
      return { categories: data.categoriesList }
    })
    .catch(() => {
      return { categories: [] }
    })

  return { categories };
};

export default withCookies(withApollo(Page))