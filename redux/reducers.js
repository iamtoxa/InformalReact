import * as actions from "./actions";
import { combineReducers } from "redux";

const preferences = (state = { darkThemeEnabled: false, access: false, appendToast: null}, action) => {
  switch (action.type) {
    case actions.TOGGLE_DARKTHEME:
      return { ...state, darkThemeEnabled: !state.darkThemeEnabled };
    case actions.UPDATE_ACCESS:
      return { ...state, access: action.value };
    case actions.DELETE_AUCH:
      return { ...state, access: false };
    case actions.CREATE_TOAST:
      return { ...state, appendToast: action.props };
    case actions.CREATE_MODAL:
      return { ...state, appendModal: action.props };
    default:
      return state;
  }
};

export default combineReducers({ preferences });