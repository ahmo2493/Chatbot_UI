// src/App.jsx
import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

const Home = lazy(() => import('./components/Home'));
const Login = lazy(() => import('./components/Login'));
const EditWidget = lazy(() => import('./components/EditWidget/EditWidget')); // adjust path if your file is elsewhere
const TrainingWidget = lazy(() => import('./components/TrainingWidget'));

export default function App() {
  return (
    <Suspense fallback={<div style={{ textAlign: 'center', paddingTop: 100 }}>Loading...</div>}>
      <Routes>
        {/* Login lives at "/" */}
        <Route path="/" element={<Login />} />

        {/* App pages */}
        <Route path="/home" element={<Home />} />
        <Route path="/edit-widget/:projectId" element={<EditWidget />} />
        <Route path="/training-widget/:projectId" element={<TrainingWidget />} />

        {/* Catch-all → send unknown routes to Login */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
