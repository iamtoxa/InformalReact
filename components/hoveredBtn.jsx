import React from 'react';

const Component = (props) => {

    return (
            <div className={`hoveredBtn ${props.disabled?"hoveredBtn--disabled":""}`} onClick={props.onClick}>
                <div className="always">
                    {props.icon || props.label}
                </div>
                <div className="hovered">
                    {props.children}
                </div>
            </div>
            )

}

export default Component
