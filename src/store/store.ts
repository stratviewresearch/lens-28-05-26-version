import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import categoryReducer from './slices/categorySlice';
import subscriptionReducer from './slices/subscriptionSlice';
import searchReducer from './slices/searchSlice';
import notificationReducer from './slices/notificationSlice';
import inquiryReducer from './slices/inquirySlice';

export const store = configureStore({
    reducer: {
        auth: authReducer,
        categories: categoryReducer,
        subscriptions: subscriptionReducer,
        search: searchReducer,
        notifications: notificationReducer,
        inquiry: inquiryReducer,
    },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
