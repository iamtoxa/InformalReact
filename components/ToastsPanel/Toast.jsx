import React, { useState, useEffect } from 'react';
import { motion } from "framer-motion"
import { Toast } from 'react-bootstrap'

import {AiOutlineInfoCircle, AiOutlineCheckCircle} from 'react-icons/ai'
import {MdError} from 'react-icons/md'
import {RiAlarmWarningLine} from 'react-icons/ri'


const toast = (props) => {
  const [showed, setShowed] = useState(true);
  const [timer, setTimer] = useState();

  useEffect(()=>{
    if(!timer) {
      setTimer(setTimeout(()=>{
        handleClose()
      }, 5000))
    }
  })

  useEffect( () => () => {
    handleClose()
    clearTimeout(timer)
  }, [] );

  const handleClose = () => {
    setShowed(false);
    props.onExit()
  }

  var background = '';
  var icon;
  if (props.type) {
    switch (props.type) {
      case "info":
        background = 'info'
        icon = <AiOutlineInfoCircle/>;
        break;
      case "success":
        background = 'bg-success'
        icon = <AiOutlineCheckCircle/>;
        break;
      case "warning":
        background = 'bg-warning'
        icon = <RiAlarmWarningLine/>;
        break;
      case "danger":
        background = 'bg-danger'
        icon = <MdError/>;
        break;
    }
  }

  return (<>
    <motion.div transition={{ duration: 0.2, delay: 0 }} initial={{ opacity: 0, translateX: -50 }} animate={{ opacity: 1, translateX: 0 }} exit={{ opacity: 0, height: 0 }} >
      <Toast onClick={handleClose} className={background}>
        <Toast.Header>
          {icon ? React.cloneElement(icon, { size: 20, style: { marginRight: 5 } }) : ""}
          <strong className="mr-auto">{props.title}</strong>
        </Toast.Header>
        <Toast.Body>{props.body}</Toast.Body>
      </Toast>
    </motion.div>
  </>)

}

export default toast
