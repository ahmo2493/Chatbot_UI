import { Routes, Route } from 'react-router-dom';
import React, { Suspense, lazy } from 'react';


// Lazy load components
const Home = lazy(() => import('./components/Home'));
const Login = lazy(() => import('./components/Login'));
const EditWidget = lazy(() => import('./components/EditWidget/EditWidget'));
const TrainingWidget = lazy(() => import('./components/TrainingWidget'));

function App() {
  return (
    <Suspense fallback={<div style={{ textAlign: 'center', paddingTop: '100px' }}>Loading...</div>}>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/home" element={<Home />} />
        <Route path="/edit-widget/:projectId" element={<EditWidget />} />
        <Route path="/training-widget" element={<TrainingWidget />} />
      </Routes>
    </Suspense>
  );
}

export default App;