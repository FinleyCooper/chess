import { Suspense } from 'react'
import { Route, Routes } from "react-router-dom";

import { routes, loggedInRoutes } from "./routes"
import LoggedInRoute from './routes/LoggedInRoute';
import LoggedInContextProvider from './LoggedInContextProvider';

import './App.css'


function App() {
  return (
    <div className="App">
      <Suspense>
        <Routes>
          {routes.map((route, index) => (
            <Route
              key={`path-${route.path}-${index}`}
              path={route.path}
              element={<route.element />}
            />
          ))}
          {loggedInRoutes.map((route, index) => (
            <Route key={`path-${route.path}-${index}`} path={route.path} element={<LoggedInRoute />}>
              <Route path={route.path} element={
                <LoggedInContextProvider>
                  <route.element />
                </LoggedInContextProvider>
              } />
            </Route>
          ))}
        </Routes>
      </Suspense>
    </div>
  )
}

export default App
