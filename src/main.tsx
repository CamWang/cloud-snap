import React from 'react'
import ReactDOM from 'react-dom/client'
import {
  createBrowserRouter,
  RouterProvider
} from 'react-router-dom'
import Root from './routes/Root'
import './main.css'
import ErrorPage from './routes/ErrorPage'
import Home from './Home'
import Browse from './Browse'

import { Amplify } from 'aws-amplify';
import awsExports from './aws-exports';
import '@aws-amplify/ui-react/styles.css';
import { withAuthenticator } from '@aws-amplify/ui-react'
Amplify.configure(awsExports);

const router = createBrowserRouter([
  {
    path: '/',
    element: <Root />,
    errorElement: <ErrorPage />,
    children: [
      {
        path: '/',
        element: <Home />
      },
      {
        path: '/browse',
        element: <Browse />
      }
    ]
  }
])

function App() {
  return (
    <>
      <React.StrictMode>
        <RouterProvider router={router} />
      </React.StrictMode>
    </>
  )
}

const AuthApp = withAuthenticator(App)

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(<AuthApp />);
