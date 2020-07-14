import { useState, useRef } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'

import { Container, Button, Form, OverlayTrigger, Tooltip } from 'react-bootstrap'
import { FaGoogle, FaVk, FaYandex } from 'react-icons/fa'
import { MdSend, MdLockOpen } from 'react-icons/md'

import { UPDATE_ACCESS, CREATE_TOAST } from "~/redux/actions";
import { useDispatch, useSelector } from "react-redux";

import redirect from '~/lib/redirect'

import { gql } from 'apollo-boost';
import { withApollo } from '@apollo/react-hoc';

import { withCookies } from 'react-cookie';

import { CopyToClipboard } from 'react-copy-to-clipboard';

const EMAIL_IN = gql`
    mutation email($email: String!){
      codeGen(email:$email)
    }
`;

const CODE_IN = gql`
    mutation email($email: String!, $code: String!, $unlimited: Boolean!){
      login(email: $email, code: $code, unlimited: $unlimited){
        token
        refresh
      }
    }
`;

function renderTooltip(props) {
  return (
    <Tooltip id="button-tooltip" {...props}>
      connect@informalplace.ru
    </Tooltip>
  );
}


const Page = ({ client: apolloClient, cookies }) => {
  const dispatch = useDispatch();
  const router = useRouter();

  const email = useRef();
  const code = useRef();

  const [codeOpen, setCodeOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const handleMailSubmit = (event) => {
    event.preventDefault();

    console.log("send code to: ", email.current.value)

    apolloClient.mutate({
      mutation: EMAIL_IN,
      variables: {
        email: email.current.value
      }
    })
      .then(({ data }) => {
        apolloClient.resetStore();
        setCodeOpen(true);
        console.log(data);

        dispatch({
          type: CREATE_TOAST, props: {
            type: "success",
            title: "Авторизация",
            body: "Одноразовый код авторизации отправлен вам на почту"
          }
        });

        return { data }
      })
      .catch(() => {
        dispatch({
          type: CREATE_TOAST, props: {
            type: "danger",
            title: "Авторизация",
            body: <span>Что-то пошло не так. Проверьте корректность данных. или обратитесь в <a href='mailto:iamtoxa00@gmail.com'>службу поддержки</a></span>
          }
        });

        return { data: {} }
      })
  }

  const hasCode = () => {
    setCodeOpen(true)
  }

  const handleCodeVerify = () => {
    if (!email.current.value) {
      dispatch({
        type: CREATE_TOAST, props: {
          type: "danger",
          title: "Авторизация",
          body: "Введите почту в поле выше"
        }
      });

      return false;
    }

    apolloClient.mutate({
      errorPolicy: "all",
      mutation: CODE_IN,
      variables: {
        email: email.current.value,
        code: code.current.value,
        unlimited: true
      }
    })
      .then(({ data, errors }) => {
        apolloClient.resetStore();
        console.log(data)

        if (errors) {
          const err = errors[0].message;

          if (err === "Invalid code") {
            dispatch({
              type: CREATE_TOAST, props: {
                type: "danger",
                title: "Авторизация",
                body: "Неверный код"
              }
            });
          } else if (err === "You need to generate code") {
            dispatch({
              type: CREATE_TOAST, props: {
                type: "danger",
                title: "Авторизация",
                body: "Вам нужно сгенерировать код"
              }
            });
          } else {
            dispatch({
              type: CREATE_TOAST, props: {
                type: "danger",
                title: "Авторизация",
                body: <span>Что-то пошло не так. Проверьте корректность данных. или обратитесь в&nbsp;
              <OverlayTrigger
                    placement="top"
                    overlay={renderTooltip}
                  >
                    <CopyToClipboard text="connect@informalplace.ru"
                      onCopy={() => {
                        dispatch({
                          type: CREATE_TOAST, props: {
                            type: "info",
                            title: "Буфер обмена",
                            body: "Текст успешно скопирован"
                          }
                        });
                      }}>
                      <b>службу поддержки</b>
                    </CopyToClipboard>
                  </OverlayTrigger>
                </span>
              }
            });
          }
          return false;
        }

        dispatch({
          type: CREATE_TOAST, props: {
            type: "success",
            title: "Авторизация",
            body: "Авторизация прошла успешно"
          }
        });

        cookies.set('accessToken', data.login.token, { maxAge: 30 * 24 * 60 * 60, path: "/" });
        dispatch({ type: UPDATE_ACCESS, value: data.login.token })
        router.push('/')

        return true
      })
  }


  return (
    <>
      <Head>
        <title>Авторизация</title>
        <meta name="description" content={`Страница авторицации на ресурсе InformalPlace.`} />
      </Head>

      <Container className='py-3' fluid>
        <div className='AuthPanel mx-auto'>
          <div className='email'>
            <div className='brand'>
              <h1>Авторизация</h1>
            </div>
            <Form onSubmit={handleMailSubmit} className="mb-4">
              <Form.Control ref={email} as="input" type="email" placeholder="Почта" name='email' required pattern="^[-a-z0-9!#$%&'*+/=?^_`{|}~]+(?:\.[-a-z0-9!#$%&'*+/=?^_`{|}~]+)*@(?:[a-z0-9]([-a-z0-9]{0,61}[a-z0-9])?\.)*(?:aero|arpa|asia|biz|cat|com|coop|edu|gov|info|int|jobs|mil|mobi|museum|name|net|org|pro|tel|travel|[a-z][a-z])$" />
              <Button type='submit' className='sendBtn'>Отправить<MdSend className='icon' size={20} /></Button>
            </Form>
            {/* <span>Или авторизуйтесь через</span> */}
            <Button onClick={hasCode} variant='link' className='hasCode'>У меня уже есть код</Button>
          </div>

          {/* <div className='socials'>
            <Button>
              <FaGoogle size={25} color="primary" />
            </Button>
            <Button>
              <FaVk size={25} color="primary" />
            </Button>
            <Button>
              <FaYandex size={25} color="primary" />
            </Button>
          </div> */}

          <div className={`code pt-5 ${codeOpen ? "open" : ""}`}>
            <span>
              Мы отправили вам на почту одноразовый код. Введите его здесь.
                </span>
            <Form>
              {email.current && <Form.Control hidden readOnly as="input" type="email" name='email' value={email.current.value} required pattern="^[-a-z0-9!#$%&'*+/=?^_`{|}~]+(?:\.[-a-z0-9!#$%&'*+/=?^_`{|}~]+)*@(?:[a-z0-9]([-a-z0-9]{0,61}[a-z0-9])?\.)*(?:aero|arpa|asia|biz|cat|com|coop|edu|gov|info|int|jobs|mil|mobi|museum|name|net|org|pro|tel|travel|[a-z][a-z])$" />}
              <Form.Control ref={code} as="input" type="text" placeholder="Код доступа" name='code' required pattern="^[0-9]{5,5}$" />
              <Button onClick={handleCodeVerify} type='button' className='sendBtn' variant='white'>Ввести<MdLockOpen className='icon' size={20} /></Button>
            </Form>
          </div>

        </div>

      </Container>
    </>
  )
}



Page.getInitialProps = async (ctx) => {
  const apolloClient = ctx.apolloClient;

  const checkLoggedIn = require('~/lib/checkLoggedIn').default;
  const AccessToken = checkLoggedIn(ctx);

  if (AccessToken) {
    redirect(ctx, '/')
    return {};
  }

  return { AccessToken };
};


export default withCookies(withApollo(Page))