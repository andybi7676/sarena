import React from 'react';
import ReactDOM from 'react-dom/client';
import reportWebVitals from './reportWebVitals';
import {
  createRoutesFromElements,
  createBrowserRouter,
  RouterProvider,
  Route,
} from "react-router-dom";
import 'semantic-ui-css/semantic.min.css';
import './index.css';
// import App from './App';
import Root from './routes/Root';
import Blank from './routes/Blank';
import ErrorPage from './routes/ErrorPage';
import ChallengePage from './routes/challenges/ChallengePage';
import Track3 from './routes/challenges/track3/Track3';
import Track2 from './routes/challenges/track2/Track2';


const router = createBrowserRouter(
  createRoutesFromElements(
    <Route
      path="/"
      element={<Root />}
      // loader={rootLoader}
      // action={rootAction}
      errorElement={<ErrorPage />}
    >
      <Route errorElement={<ErrorPage />}>
        <Route index element={<Blank />} />
        <Route
          path="challenges"
          element={<ChallengePage />}
          // loader={contactLoader}
          // action={contactAction}
        />
        <Route
          path="challenges/track2"
          element={<Track2 />}
          // loader={contactLoader}
          // action={contactAction}
        />
        <Route
          path="challenges/track3/*"
          element={<Track3 />}
          // loader={contactLoader}
          // action={editAction}
        />
      </Route>
    </Route>
  )
// [
//   {
//     path: "/",
//     element: <Root />,
//     errorElement: <ErrorPage />,
//     children: [
//       {
//         path: "challenges",
//         element: <ChallengePage />,
//       },
//       {
//         path: "challenges/track3",
//         element: <Track3 />,
//       },
//     ],
//   },
// ]
);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
