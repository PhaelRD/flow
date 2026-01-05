
import React from 'react';
/* Fix: Using namespace import for react-router-dom to resolve export issues */
import * as ReactRouterDOM from 'react-router-dom';
const { HashRouter, Routes, Route, Navigate } = ReactRouterDOM as any;
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import CourseDetails from './pages/CourseDetails';
import StudentDashboard from './pages/StudentDashboard';
import CoursePlayer from './pages/CoursePlayer';
import StudentSupport from './pages/StudentSupport';
import TeacherDashboard from './pages/TeacherDashboard';
import TeacherCourseEditor from './pages/TeacherCourseEditor';
import TeacherInbox from './pages/TeacherInbox';
import AdminDashboard from './pages/AdminDashboard';
import TermsOfService from './pages/TermsOfService';
import CertificatePage from './pages/CertificatePage';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <HashRouter>
        <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
          <Navbar />
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<AuthPage />} />
            <Route path="/terms" element={<TermsOfService />} />
            <Route path="/course/:id" element={<CourseDetails />} />

            {/* Student Routes */}
            <Route path="/dashboard" element={
              <ProtectedRoute allowedRoles={['student', 'admin', 'teacher']}>
                <StudentDashboard />
              </ProtectedRoute>
            } />
            <Route path="/player/:id" element={
              <ProtectedRoute allowedRoles={['student', 'admin', 'teacher']}>
                <CoursePlayer />
              </ProtectedRoute>
            } />
            <Route path="/certificate/:courseId" element={
              <ProtectedRoute allowedRoles={['student', 'admin', 'teacher']}>
                <CertificatePage />
              </ProtectedRoute>
            } />
            <Route path="/support" element={
              <ProtectedRoute allowedRoles={['student']}>
                <StudentSupport />
              </ProtectedRoute>
            } />

            {/* Teacher Routes */}
            <Route path="/teacher/dashboard" element={
              <ProtectedRoute allowedRoles={['teacher']}>
                <TeacherDashboard />
              </ProtectedRoute>
            } />
            <Route path="/teacher/create-course" element={
              <ProtectedRoute allowedRoles={['teacher']}>
                <TeacherCourseEditor />
              </ProtectedRoute>
            } />
            <Route path="/teacher/edit-course/:courseId" element={
              <ProtectedRoute allowedRoles={['teacher']}>
                <TeacherCourseEditor />
              </ProtectedRoute>
            } />
             <Route path="/teacher/inbox" element={
              <ProtectedRoute allowedRoles={['teacher']}>
                <TeacherInbox />
              </ProtectedRoute>
            } />

            {/* Admin Routes */}
            <Route path="/admin/dashboard" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            } />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </HashRouter>
    </AuthProvider>
  );
};

export default App;
