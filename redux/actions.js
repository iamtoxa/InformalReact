export const TOGGLE_DARKTHEME = "TOGGLE_DARKTHEME";

export const toggleDarkTheme = () => ({
  type: TOGGLE_DARKTHEME,
});


export const UPDATE_ACCESS = "UPDATE_ACCESS";

export const updateAccess = (value) => ({
  type: UPDATE_ACCESS,
  value: value
});


export const DELETE_AUCH = "DELETE_AUCH";

export const deleteAccess = () => ({
  type: DELETE_AUCH
});


export const CREATE_TOAST = "CREATE_TOAST";

export const createToast = (props) => ({
  type: CREATE_TOAST,
  props: props
});

export const CREATE_MODAL = "CREATE_MODAL";

export const createModal = (props) => ({
  type: CREATE_MODAL,
  props: props
});