import { JSX } from 'react';
import { BrowserRouter, Route, Routes, Outlet } from 'react-router-dom';
import { Provider as ReduxProvider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { persistor, store } from '../redux/index.js';
import { Home } from './home/index.js';

export const App = (): JSX.Element => {
  return (
    <ReduxProvider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<AppLayout />}>
              <Route index={true} element={<Home />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </PersistGate>
    </ReduxProvider>
  );
};

const AppLayout = (): JSX.Element => {
  return (
    <div className="max-w-screen-md mx-auto">
      <Outlet />
    </div>
  );
};
