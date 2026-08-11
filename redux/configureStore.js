import { configureStore, combineReducers } from "@reduxjs/toolkit";
import storage from "./storage";
import { persistReducer, persistStore } from "redux-persist";
import authReducer from "./reducer/authReducer";
import cartReducer from "./reducer/cartReducer";

const rootReducer = combineReducers({
  authStore: authReducer,
  cartStore: cartReducer,
});

const persistConfig = {
  key: "root",
  storage,
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ serializableCheck: false }),
});

export const persistor = persistStore(store);
