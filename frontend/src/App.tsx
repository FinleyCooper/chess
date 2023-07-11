import { Suspense, useEffect, useState } from 'react'
import { Route, Routes, useLocation, Navigate } from "react-router-dom";

import routes from "./routes"

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
        </Routes>
      </Suspense>
    </div>
  )
}

export default App
