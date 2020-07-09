import { createStore} from "redux";
import rootReducer from "./reducers";

let initialState = {preferences:{darkThemeEnabled: false, access: false, appendToast: null}};

const store = createStore(rootReducer, initialState);
export default store;