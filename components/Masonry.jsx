import Masonry from 'react-masonry-component';
import { useEffect, useState } from 'react'

const component = (props) => {  
  var masonry;

  const [init, setInit] = useState(true);

  const handleImageLoading = () => {
    window.setTimeout(() => {
      if (masonry.needsResizeLayout()) {
        masonry.layout()
      }
    }, 1000)
  }

  var interval;

  useEffect(() => {
    masonry.layout()
    
    if (!interval) {
      interval = window.setInterval(() => {
        masonry.layout()
      }, 2000)
    }

    if(init){
      setInit(false);
    }
  })

  return (
      <Masonry
        className="masonry"
        elementType="div"
        onImagesLoaded={handleImageLoading}
        options={{
          fitWidth: true,
          itemSelector: ".item",
          gutter: 20,
          horizontalOrder: true
        }}
        ref={function (c) { masonry = masonry || c.masonry; }.bind(this)}
        style={{opacity: init?0:1}}
      >
        {props.children}
      </Masonry>
  )
}

export default component



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