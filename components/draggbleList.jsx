import { useEffect, useState } from 'react'
import { DragDropContext, Droppable, Draggable, resetServerContext } from 'react-beautiful-dnd'
import { ListGroup } from 'react-bootstrap'
import Link from 'next/link'


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
                          <Link href={props.href} as={props.asBase + item[props.indexField]}>
                            <ListGroup.Item {...provided.draggableProps} {...provided.dragHandleProps} ref={provided.innerRef}>
                              {item.title || item.name || item.label || item.value}
                            </ListGroup.Item>
                          </Link>
                        ) : (
                            <ListGroup.Item {...provided.draggableProps} {...provided.dragHandleProps} ref={provided.innerRef}>
                              {item.title || item.name || item.label || item.value}
                            </ListGroup.Item>
                          )}
                      </>)
                    }}
                  </Draggable>
                )
              })}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </>
  )
}

export default component
