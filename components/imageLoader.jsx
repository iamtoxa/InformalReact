import React, { useState, useRef } from 'react';
import { Form, Button } from 'react-bootstrap'
import MD5 from '~/lib/md5'

const Loader = (props) => {
  const latestProps = useRef();
  const progressBar = useRef()

  const startUpload = async (event) => {
    var file = latestProps.current.files[0];
    let fileId = MD5(file.name + '-' + file.size + '-' + +file.lastModifiedDate);
    var startByte = 0;

    if (file) {
      let formData = new FormData();
      formData.append("fileToUpload", file);

      var size = 0;
      for(var pair of formData.entries()) {
        if (pair[1] instanceof Blob) 
          size += pair[1].size;
        else
          size += pair[1].length;
      }


      var xhr = new XMLHttpRequest();
      xhr.open("POST", `https://storage.informalplace.ru/${props.uploadType}`, true);

      xhr.upload.onprogress = (e) => {
        progressBar.current.style.setProperty('--precentage', ((startByte + e.loaded) / (size) * 100) + "%")
      };

      xhr.onloadend = (e) => {
        if (xhr.response) {
          if (JSON.parse(xhr.response)) {
            progressBar.current.style.setProperty('--precentage', "0")

            setRemoteSrc(`https://storage.informalplace.ru/${JSON.parse(xhr.response).Key}`)
            setSrc(`https://storage.informalplace.ru/${JSON.parse(xhr.response).Key}`)

            if (props.onUpload) props.onUpload(JSON.parse(xhr.response));
          }
        }
      };

      xhr.send(formData);
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
        <Form.File name='image' onChange={handleChange} ref={latestProps} accept="image/gif, image/jpeg, image/png"/>
        <div className="image">
          {remoteSrc && (<img src={remoteSrc} alt='' />)}
          <div className='progress' ref={progressBar}></div>
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
