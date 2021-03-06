import { useEffect, useState } from 'react'
import { DragDropContext, Droppable, Draggable, resetServerContext } from 'react-beautiful-dnd'
import { ListGroup } from 'react-bootstrap'
import Link from 'next/link'
import { BsArrowUpDown } from 'react-icons/bs';

const component = (props) => {
  const [data, setData] = useState(props.initData || [])

  const onDragEnd = (result) => {
    const { destination, source, draggableId } = result;

    if (!destination) {
      return;
    }

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const column = data;
    const newOrder = Array.from(data)


    newOrder.splice(source.index, 1)
    newOrder.splice(destination.index, 0, data.find(el => (el[props.indexField] == draggableId)))

    setData(newOrder)
    if (props.onChangeOrder) props.onChangeOrder(newOrder)
  }

  resetServerContext();

  return (
    <>
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId='main'>
          {(provided) => (
            <div {...provided.droppableProps} ref={provided.innerRef}>
              {data.map((item, index) => {
                return (
                  <Draggable key={item[props.indexField]} index={index} draggableId={item[props.indexField].toString()}>
                    {(provided) => {
                      return (<>
                        {props.href ? (
                          <div className='flex-row flex-row__mr0 flex-row__stretch' {...provided.draggableProps}>
                            <div className='drag' {...provided.dragHandleProps}>
                              <BsArrowUpDown size={20}/>
                            </div>
                            <Link href={props.href} as={props.asBase + item[props.indexField]}>
                              <ListGroup.Item ref={provided.innerRef} action className='draggbleItem'>
                                <span>{item.title || item.name || item.label || item.value}</span>
                              </ListGroup.Item>
                            </Link>
                          </div>
                        ) : (
                            <ListGroup.Item {...provided.draggableProps} {...provided.dragHandleProps} ref={provided.innerRef} className='draggbleItem'>
                              <div className='drag'>
                                <BsArrowUpDown size={20}/>
                              </div>                           
                              <span>{item.title || item.name || item.label || item.value}</span>
                            </ListGroup.Item>
                          )}
                      </>)
                    }}
                  </Draggable>
                )
              })}
              <div style={{ opacity: 0 }}>{provided.placeholder}</div>
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </>
  )
}

export default component
