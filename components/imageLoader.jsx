import React, { useState, useRef } from 'react';

import { Form, Button } from 'react-bootstrap'

const Loader = (props) => {
  const latestProps = useRef();
  
  const startUpload = async (event) => {
    var file = latestProps.current.files[0];
    if (file) {
      let formData = new FormData();
      formData.append("fileToUpload", file);

      let response = await window.fetch(`https://storage.informalplace.ru/${props.uploadType}`, {
        method: 'POST',
        body: formData
      }).then(res => res.json());

      setRemoteSrc(`https://storage.informalplace.ru/${response.Key}`)
      setSrc(`https://storage.informalplace.ru/${response.Key}`)

      if (props.onUpload) props.onUpload(response);
      if (props.onChange) props.onChange(event);

    }
  }

  const [src, setSrc] = useState(false)
  const [remoteSrc, setRemoteSrc] = useState(false)
  const [defSet, setDefSet] = useState(false)

  const handleChange = (event) => {
    startUpload(event)
  }

  if (props.value && props.value != remoteSrc) {
    setDefSet(true)
    setRemoteSrc(props.value)
  }

  if (props.initValue && !defSet) {
    setDefSet(true)
    setRemoteSrc(props.initValue)
    setSrc(props.initValue)
  }

  return (<>
    <Form.Group className='ImageUploader' controlId="InputImage">
      <Form.Label>{props.label}</Form.Label>
      <div>
        <Form.Label className='btn btn-block btn-primary'>Загрузить изображение</Form.Label>
        <Form.File name='image' onChange={handleChange} ref={latestProps} />
        <div className="image">
          {remoteSrc && (<img src={remoteSrc} alt='' />)}
        </div>
      </div>
    </Form.Group>

    <style jsx>{`
      .image{
        padding-bottom: ${1 / props.ratio * 100}%;
      }
    `}</style>
  </>)

}

export default Loader
