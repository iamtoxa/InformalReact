import { useState, useRef } from 'react'
import Head from 'next/head'

import { Container, Button, Form, Card, Col, Row, ListGroup } from 'react-bootstrap'
import { FaGoogle, FaVk, FaYandex } from 'react-icons/fa'
import { MdSend, MdLockOpen } from 'react-icons/md'

import { useMutation, useQuery } from '@apollo/react-hooks';

import { useDispatch, useSelector } from "react-redux";
import { useRouter } from 'next/router'

import { gql } from 'apollo-boost';
import { CREATE_TOAST, CREATE_MODAL } from "~/redux/actions";
import { withApollo } from '@apollo/react-hoc';

import { Formik } from 'formik';
import { object as yupObject, number as yupNumber, string as yupString, setLocale } from 'yup';

setLocale({
  mixed: {
    required: 'Обязательное поле',
  },
  number: {
    min: 'Не менее ${min}',
    max: 'Не более ${max}',
    integer: 'Число не может быть дробным'
  }
});


let schema = yupObject({
  m_amount: yupNumber().required().min(10).max(10000).integer().typeError('Необходимо указать целое число'),
}).defined();


function b64DecodeUnicode(str) {
  return decodeURIComponent(atob(str).split('').map(function (c) {
    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
  }).join(''));
}

function utf8_to_b64(str) {
  return window.btoa(unescape(encodeURIComponent(str)));
}

const USER_INFO = gql`
  query {
    me{
      ID
      balance
    }
  }
`;

const GENERATE_HASH = gql`
    mutation hashPayment($m_curr: Curr!, $m_amount: Int!){
      hashPayment(info:{m_curr: $m_curr, m_amount:$m_amount})
    }
`;

const PAY_OUT = gql`
    mutation payOut($amount: String!, $ps: PaymentSystem!, $psId: String!){
      payOut(amount: $amount, ps: $ps, psId:$psId)
    }
`;



const GET_PS_INFO = gql`
    query info($ps: PaymentSystem!){
      psInfo(ps:$ps, curr:RUB){
        min
        max
        commission_site_percent
        gate_commission
        
        r_fields{
          name
          example
          reg_expr
        }
      }
    }
`;

const Page = ({client: apolloClient, user}) => {
  const dispatch = useDispatch();
  const router = useRouter();
  const [userInfo, setUser] = useState(user);

  const outRefForm = useRef()

  const [generateHash] = useMutation(GENERATE_HASH);
  const [payOut] = useMutation(PAY_OUT);

  const handleAddMoney = (values) => {
    generateHash({
      variables: {
        m_amount: Number(values.m_amount),
        m_curr: "RUB",
      }
    }).then((data) => {
      apolloClient.resetStore();
      var sign = data.data.hashPayment;
      console.log(sign);
      if (sign.length > 1) {

        let form = document.createElement('form');
        form.action = 'https://payeer.com/merchant/';
        form.method = 'POST';
        form.style.visibility = "hidden";

        form.innerHTML = `
          <input type="hidden" name="m_shop" value="1046037552">
          <input type="hidden" name="m_orderid" value=${userInfo.ID}>
          <input type="hidden" name="m_amount" value=${values.m_amount + ".00"}>
          <input type="hidden" name="m_curr" value="RUB">
          <input type="hidden" name="m_desc" value=${Buffer.from("Пополнение баланса").toString('base64')}>
          <input type="hidden" name="m_sign" value=${sign}>
        `


        document.body.appendChild(form);
        form.submit()
      }
    })
  }

  const handleOutMoney = (values) => {
    if (psData && !psData.psInfo.gate_commission && !psData.psInfo.commission_site_percent) {
      values.amount = (Number(values.amount)).toFixed(2);
    }

    if (psData && psData.psInfo.gate_commission && psData.psInfo.gate_commission.split("+")[1] && psData.psInfo.commission_site_percent == "0") {
      values.amount = (Number(values.amount) + Number(psData.psInfo.gate_commission.split("+")[1]) + (Number(values.amount) * Number(psData.psInfo.gate_commission.split("+")[0].slice(0, -1)) / 100)).toFixed(2)
    }

    if (psData && psData.psInfo.gate_commission && !psData.psInfo.gate_commission.split("+")[1] && psData.psInfo.commission_site_percent == "0") {
      values.amount = (Number(values.amount) + (Number(values.amount) * Number(psData.psInfo.gate_commission.slice(0, -1)) / 100)).toFixed(2)
    }

    if (psData && !psData.psInfo.gate_commission && psData.psInfo.commission_site_percent != "0") {
      values.amount = (Number(values.amount) + (Number(values.amount) * Number(psData.psInfo.commission_site_percent) / 100)).toFixed(2)
    }

    if (psData && psData.psInfo.gate_commission && !psData.psInfo.gate_commission.split("+")[1] && psData.psInfo.commission_site_percent != "0") {
      values.amount = (Number(values.amount) + (Number(values.amount) * Number(psData.psInfo.gate_commission.slice(0, -1)) / 100) + (Number(values.amount) * Number(psData.psInfo.commission_site_percent) / 100)).toFixed(2)
    }


    dispatch({
      type: CREATE_MODAL, props: {
        title: "Перевод средств",
        body: `Вы уверены, что хотите перевести ${values.amount} (С учётом коммисии) рублей на счет: "${values.psId}"`,
        cancel: true,
        action: () => {
          payOut({
            variables: {
              amount: values.amount.toString(),
              ps: values.ps,
              psId: values.psId
            }
          }).then((data) => {
            apolloClient.resetStore();
            console.log(data)
            refetchMe()

            if (data.data.payOut == true) {
              dispatch({
                type: CREATE_TOAST, props: {
                  type: "success",
                  title: "Вывод средств",
                  body: "Средства успешно выведены"
                }
              });

              router.push('/controlPanel')
            } else {
              dispatch({
                type: CREATE_TOAST, props: {
                  type: "danger",
                  title: "Ошибка списания",
                  body: "Неизвестная ошибка"
                }
              });
            }
          }).catch(err => {
            refetchMe()
            err = err.toString()
            err = err.substring(err.indexOf('error:') + 7)
            if (err === "not enough money") {
              dispatch({
                type: CREATE_TOAST, props: {
                  type: "danger",
                  title: "Ошибка списания",
                  body: "На вашем балансе недостаточно средств"
                }
              });
            }
          })
        },
        actionLabel: "Перевести средства"
      }
    })
  }

  const { loading, error, data: psData, refetch: psRefetch } = useQuery(GET_PS_INFO, {
    variables: {
      ps: "Payeer"
    }
  });
  const handleGetPs = (value) => {
    psRefetch({
      ps: value
    })
  }

  if (!loading && psData && psData.psInfo) {
    var patt = new RegExp(psData.psInfo.r_fields[0].reg_expr.slice(1, -1));
    var schemaOut = yupObject({
      amount: yupNumber().required().min(psData.psInfo.min || 10).max(psData.psInfo.max || 10000).integer().typeError('Необходимо указать целое число'),
      ps: yupString().required(),
      psId: yupString().required().matches(patt, "Неверный формат")
    }).defined();

    if (outRefForm.current) {
      outRefForm.current.setFieldValue("amount", 0, true)
      outRefForm.current.setFieldValue("psId", "", true)
    }
  }

  return (
    <>
      <Head>
        <title>Пополнение баланса</title>
      </Head>

        <Container className='py-3' fluid>
          <Row>
            <Col md={12} lg={6}>
              {userInfo && (<>
                <Card className="mb-3">
                  <Card.Header>Платёжная информация</Card.Header>
                  <ListGroup>
                    <ListGroup.Item>
                      Баланс: {userInfo.balance} руб.
                    </ListGroup.Item>
                  </ListGroup>
                </Card>
              </>)}

              <Card>
                <Card.Header>Пополнение баланса</Card.Header>
                <Card.Body>
                  <Row>
                    <Col xs={12}>

                      <Formik enableReinitialize onSubmit={handleAddMoney} validationSchema={schema} initialValues={{ amount: 0 }}>
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
                                <Form.Control type="hidden" name="m_curr" value="RUB" />

                                <Form.Row>
                                  <Form.Group as={Col} md="12" controlId="control_m_amount">
                                    <Form.Label>Сумма пополнения</Form.Label>
                                    <Form.Control
                                      type="text"
                                      name="m_amount"
                                      value={values.m_amount}
                                      onChange={handleChange}
                                      isInvalid={!touched.m_amount && errors.m_amount}
                                    />
                                    <Form.Control.Feedback type='invalid'>
                                      {errors.m_amount}
                                    </Form.Control.Feedback>
                                  </Form.Group>
                                </Form.Row>

                                <Form.Row>
                                  <Button as={Col} md="3" block disabled={!isValid} variant='primary' type="button" onClick={handleSubmit}>Оплатить</Button>
                                </Form.Row>


                              </Form>
                            </>
                          )}

                      </Formik>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            </Col>

            <Col md={12} lg={6}>
              <Card>
                <Card.Header>Вывод средств</Card.Header>
                <Card.Body>
                  <Formik enableReinitialize onSubmit={handleOutMoney} validationSchema={schemaOut} initialValues={{ amount: 0, ps: "Payeer" }} innerRef={outRefForm}>
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
                              <Form.Group as={Col} md="12" controlId="control_ps">
                                <Form.Label>Платёжная система</Form.Label>
                                <Form.Control
                                  as='select'
                                  name="ps"
                                  onChange={handleChange}
                                  onChangeCapture={(e) => { handleGetPs(e.currentTarget.value) }}
                                  isInvalid={!touched.ps && errors.ps}
                                  isValid={values.ps && !errors.ps}
                                  defaultValue='Payeer'
                                >
                                  <option value="MIR">Мир</option>
                                  <option value="VISA">VISA</option>
                                  <option value="MasterCard">MasterCard</option>
                                  <option value="Yandex">Яндекс.Деньги</option>
                                  <option value="Payeer">Payeer</option>
                                  <option value="QIWI">QIWI</option>
                                </Form.Control>
                                <Form.Control.Feedback type='invalid'>
                                  {errors.ps}
                                </Form.Control.Feedback>
                                <Form.Control.Feedback>
                                  Коммисия:
                                  {psData && psData.psInfo.gate_commission && <span> {psData.psInfo.gate_commission}</span>}
                                  {psData && psData.psInfo.commission_site_percent > 0 && <span> {psData.psInfo.gate_commission && "+ "}{psData.psInfo.commission_site_percent}%</span>}
                                  {psData && !psData.psInfo.gate_commission && !psData.psInfo.commission_site_percent && <span>Без коммисии</span>}
                                </Form.Control.Feedback>
                              </Form.Group>
                            </Form.Row>

                            <Form.Row>
                              <Form.Group as={Col} md="12" controlId="control_psId">
                                <Form.Label>Номер счёта</Form.Label>
                                <Form.Control
                                  name="psId"
                                  onChange={handleChange}
                                  isInvalid={!touched.psId && errors.psId}
                                  placeholder={psData && psData.psInfo.r_fields && "Например: " + psData.psInfo.r_fields[0].example}
                                />
                                <Form.Control.Feedback type='invalid'>
                                  {errors.psId}
                                </Form.Control.Feedback>
                              </Form.Group>
                            </Form.Row>

                            <Form.Row>
                              <Form.Group as={Col} md="12" controlId="control_amount">
                                <Form.Label>Сумма списания</Form.Label>
                                <Form.Control
                                  type="text"
                                  name="amount"
                                  value={values.amount}
                                  onChange={handleChange}
                                  isInvalid={!touched.amount && errors.amount}
                                  isValid={values.amount && !errors.amount}
                                />
                                <Form.Control.Feedback type='invalid'>
                                  {errors.amount}
                                </Form.Control.Feedback>
                                <Form.Control.Feedback>
                                  С учётом коммисии
                                  {psData && !psData.psInfo.gate_commission && !psData.psInfo.commission_site_percent && <span>{values.amount}</span>}

                                  {psData && psData.psInfo.gate_commission && psData.psInfo.gate_commission.split("+")[1] && psData.psInfo.commission_site_percent == "0" &&
                                    (<span> {values.ps}: {(Number(values.amount) + Number(psData.psInfo.gate_commission.split("+")[1]) + (Number(values.amount) * Number(psData.psInfo.gate_commission.split("+")[0].slice(0, -1)) / 100)).toFixed(2)}</span>)
                                  }

                                  {psData && psData.psInfo.gate_commission && !psData.psInfo.gate_commission.split("+")[1] && psData.psInfo.commission_site_percent == "0" &&
                                    (<span> {values.ps}: {(Number(values.amount) + (Number(values.amount) * Number(psData.psInfo.gate_commission.slice(0, -1)) / 100)).toFixed(2)}</span>)
                                  }

                                  {psData && !psData.psInfo.gate_commission && psData.psInfo.commission_site_percent != "0" &&
                                    (<span> {values.ps}: {(Number(values.amount) + (Number(values.amount) * Number(psData.psInfo.commission_site_percent) / 100)).toFixed(2)}</span>)
                                  }

                                  {psData && psData.psInfo.gate_commission && !psData.psInfo.gate_commission.split("+")[1] && psData.psInfo.commission_site_percent != "0" &&
                                    (<span> {values.ps}: {Number(values.amount) + ((Number(values.amount) * Number(psData.psInfo.gate_commission.slice(0, -1)) / 100) + (Number(values.amount) * Number(psData.psInfo.commission_site_percent) / 100)).toFixed(2)}</span>)
                                  }
                                </Form.Control.Feedback>
                              </Form.Group>
                            </Form.Row>

                            <Form.Row>
                              <Button as={Col} md="3" block disabled={!isValid} variant='primary' type="button" onClick={handleSubmit}>Списать средства</Button>
                            </Form.Row>

                          </Form>
                        </>
                      )}

                  </Formik>


                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
    </>
  )
}

Page.getInitialProps = async (ctx) => {
    var atob = require('atob');
    var redirect = require('~/lib/redirect').default;

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

    const userInfo = await ctx.apolloClient.query({
        query: USER_INFO,
      })
        .then(({ data }) => {
          return data.me
        })
        .catch(() => {
          return false;
        })


    

    return { userID, user: userInfo };
}

export default withApollo(Page)
