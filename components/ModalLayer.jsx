import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch, useStore } from "react-redux";
import { Modal, Button } from 'react-bootstrap'

const ModalLayer = () => {
  var [items, setItems] = useState([]);
  const [lastModal, setLastModal] = useState();
  const [lastID, setLastId] = useState(0);

  const itemsRef = useRef(items);
  itemsRef.current = items;

  const newModal = useSelector((state) => state.preferences.appendModal);
  if (newModal != lastModal) {
    console.log('new modal')
    setLastModal(newModal)
    newModal.id = lastID + 1;
    setLastId(lastID + 1)
    setItems([...itemsRef.current, newModal])
  }

  const removeModal = (id) => {
    if (itemsRef.current.some((item) => item.id === id)) {
      setItems(itemsRef.current.filter(item => item.id !== id));
    }
  }


  return (<>
    <div className='modalsPanel'>
      {items.map(modal => {
        return(
          <Modal show={true} onHide={()=>{removeModal(modal.id)}} key={modal.id}>
            <Modal.Header closeButton>
              <Modal.Title>{modal.title}</Modal.Title>
            </Modal.Header>
            <Modal.Body>{modal.body}</Modal.Body>
            <Modal.Footer>
              {modal.cancel && (
                <Button variant='outline-danger' onClick={() => { removeModal(modal.id) }}>Закрыть</Button>
              )}
              {modal.action && (
                <Button variant='primary' onClick={() => { modal.action(); removeModal(modal.id) }}>{modal.actionLabel}</Button>
              )}
            </Modal.Footer>
          </Modal>
        )
      })}
    </div>
  </>)

}

export default ModalLayer
