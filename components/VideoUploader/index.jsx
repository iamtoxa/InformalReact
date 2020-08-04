import React, { useState, useRef } from 'react';
import { Form, Button } from 'react-bootstrap'
import { useDispatch } from 'react-redux';
import { CREATE_TOAST } from "../../redux/actions";
import { CREATE_MODAL } from "../../redux/actions";

import MD5 from '../../lib/md5'

const Loader = (props) => {
  const latestProps = useRef();
  const progressBar = useRef()
  const dispatch = useDispatch();

  const startUpload = async (event) => {
    var file = latestProps.current.files[0];
    if (file) {

      if(file.size > 1.5*1024*1024*1024){
        dispatch({
          type: CREATE_TOAST, props: {
            type: "danger",
            title: "Загрузка видео",
            body: "Слишком большой размер файла. Максимально допустимый - 1.5 ГБ"
          }
        });

        return false;
      } else {
        dispatch({
          type: CREATE_TOAST, props: {
            type: "info",
            title: "Загрузка видео",
            body: "Загрузка видео началась"
          }
        });
      }

      

      var lastStartByte = null;
      var lastPrec = 0;
      const Upload = async () => {
        let fileId = MD5(file.name + '-' + file.size + '-' + +file.lastModifiedDate);

        let response = await window.fetch('https://storage.informalplace.ru/video/status/', {
          headers: {
            'X-File-Id': fileId
          }
        });


        // сервер получил столько-то байтов
        let startByte = +await response.text();

        console.log(startByte);

        if (lastStartByte != null && startByte < lastStartByte + 50000000) {
          Upload()
          return false
        }

        lastStartByte = startByte
        var xhr = new XMLHttpRequest();

        xhr.open("POST", "https://storage.informalplace.ru/video/upload/", true);

        // Идентификатор файла, чтобы сервер знал, что мы загружаем
        xhr.setRequestHeader('X-File-Id', fileId);

        // Номер байта, начиная с которого мы будем отправлять данные.
        // Таким образом, сервер поймёт, с какого момента мы возобновляем загрузку
        xhr.setRequestHeader('X-Start-Byte', startByte);

        // Номер байта, начиная с которого мы будем отправлять данные.
        // Таким образом, сервер поймёт, с какого момента мы возобновляем загрузку
        xhr.setRequestHeader('x-file-size', file.size);


        xhr.upload.onprogress = (e) => {
          // console.log(`Uploaded ${startByte + e.loaded} of ${startByte + e.total}`);
          progressBar.current.style.setProperty('--precentage', ((startByte + e.loaded)/(file.size)*100)+"%")
          setProgress((startByte + e.loaded)/(file.size)*100)
        };

        xhr.upload.onloadend = (e) => {
          // console.log(`Uploaded ${startByte + e.loaded} of ${startByte + e.total} finished`);
          if (startByte + e.loaded < file.size) {
            Upload()
          }
        };

        xhr.onloadend = (e) => {
          if (xhr.response) {
            if (JSON.parse(xhr.response)) {
              setRemoteSrc(JSON.parse(xhr.response).src)
              progressBar.current.style.setProperty('--precentage', "100%")
              setProgress(100)

              if (props.onUpload) props.onUpload(JSON.parse(xhr.response).src);
            }
          }
        };


        xhr.send(file.slice(startByte, startByte + 50000000));
      }
      Upload()
    }
  }

  const [remoteSrc, setRemoteSrc] = useState(false)
  const [defSet, setDefSet] = useState(false)
  const [progress, setProgress] = useState(0)

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
  }

  return (<>
    <Form.Group className='VideoUploader' controlId="InputVideo">
      <Form.Label>{props.label}</Form.Label>
      <div>
        <Form.Label className='btn btn-block btn-primary'>Загрузить видео</Form.Label>
        <Form.File accept="video/mp4,video/x-m4v,video/*" name='image' onChange={handleChange} ref={latestProps} />
        
  <div style={{display:progress > 0?"flex":"none"}} className='progress' ref={progressBar}>{progress == 100 ? <span>Загрузка завершена</span> : <span>{progress.toFixed(2)}%</span>}</div>
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
