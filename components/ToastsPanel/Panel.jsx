import React, { useState, useEffect, useRef } from 'react';
import { RiHome2Line, RiMoreLine, RiMoonLine, RiUser2Line, RiLoginBoxLine, RiLogoutBoxRLine, RiSettings4Line } from 'react-icons/ri';
import Link from 'next/link'
import { useRouter } from 'next/router'
import { AnimatePresence } from "framer-motion"
import { useSelector, useDispatch, useStore } from "react-redux";
import { TOGGLE_DARKTHEME } from "../../redux/actions";
import { DELETE_AUCH } from "../../redux/actions";

import Toast from './Toast'

const ToastPanel = () => {
  var [items, setItems] = useState([]);
  const [lastAdded, setLastAdded] = useState();
  const [lastID, setLastId] = useState(0);
  const store = useStore()

  const itemsRef = useRef(items);
  itemsRef.current = items;

  const appendToast = useSelector((state) => state.preferences.appendToast);
  if (appendToast != lastAdded) {
    setLastAdded(appendToast)
    appendToast.id = lastID + 1;
    setLastId(lastID + 1)
    setItems([...items, appendToast])
  }


  const removeToast = (id)=>{
    if(itemsRef.current.some((item)=>item.id === id)){
      setItems(itemsRef.current.filter(item => item.id !== id));
    }
  }

  return (<>
    <div className='toastsPanel'>
      <AnimatePresence>
        {itemsRef.current.map(toast=>{
          return (
            <Toast title={toast.title} body={toast.body} onExit={()=>removeToast(toast.id)} id={toast.id} icon={toast.icon} key={toast.id.toString()} type={toast.type}/>
          )
        })}
      </AnimatePresence>
    </div>
  </>)

}

export default ToastPanel
