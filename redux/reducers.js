import * as actions from "./actions";
import { combineReducers } from "redux";

const theme = (prevState, action) => {
  if(prevState == undefined){
    return {darkThemeEnabled: false}
  }

  switch (action.type) {
    case actions.SET_DARKTHEME:
      return { ...prevState, darkThemeEnabled: action.value };
    default:
      return prevState;
  }
};


const auch = (prevState, action) => {
  if(prevState == undefined){
    return {access: undefined}
  }

  switch (action.type) {
    case actions.SET_AUCH:
      return { ...prevState, access: action.value };
    default: 
      return prevState;
  }
}


const modals = (prevState, action) => {
  if(prevState == undefined){
    return {appendToast: null, appendModal: null}
  }

  switch (action.type) {
    case actions.CREATE_TOAST:
      return { ...prevState, appendToast: action.props };
    case actions.CREATE_MODAL:
      return { ...prevState, appendModal: action.props };
    default: 
      return prevState;
  }
}




export default combineReducers({ theme, auch, modals });