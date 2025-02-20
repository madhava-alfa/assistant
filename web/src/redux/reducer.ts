import { createSlice, Draft, PayloadAction } from '@reduxjs/toolkit';
import { persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';

export type ReduxState = {
  apiKey?: string;
};

export const rootSlice = createSlice({
  name: 'root',
  initialState: {},
  reducers: {
    setApiKey: (state: Draft<ReduxState>, action: PayloadAction<string>) => {
      state.apiKey = action.payload;
    },
  },
});

export const persistedReducer = persistReducer<ReduxState>(
  {
    key: 'root',
    storage: storage,
    whitelist: ['apiKey'],
  },
  rootSlice.reducer,
);
