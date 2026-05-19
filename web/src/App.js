import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './Pages/Login';

import FinanceDashboard from './Pages/Finance/FinanceDashboard';

import AdminDashboard from './Pages/Admin/AdminDashboard';
import AddStudent from './Pages/Admin/AddStudent';
import DeactivateStudent from './Pages/Admin/DeactivateStudent';

import AddInstructor from './Pages/Admin/AddInstructor';
import DeactivateInstructor from './Pages/Admin/DeactivateInstructor';

import AddFinanceOfficer from './Pages/Admin/AddFinanceOfficer';
import DeactivateFinanceOfficer from './Pages/Admin/DeactivateFinanceOfficer';

import CourseManagement from './Pages/Admin/CourseManagement';

import SemesterManagement from './Pages/Admin/SemesterManagement';


import './App.css';

const PrivateRoute = ({ children, role }) => {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  console.log('Token:', token);
  console.log('User:', user);
  console.log('Required role:', role);
  console.log('User role:', user.role);
  
  if (!token) return <Navigate to="/login" />;
  if (role && user.role !== role) return <Navigate to="/login" />;
  return children;
};


export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/admin" element={
          <PrivateRoute role="admin">
            <AdminDashboard />
          </PrivateRoute>
        } />


        {/* Student Management */}
        <Route path="/admin/add-student" element={
          <PrivateRoute role="admin"><AddStudent /></PrivateRoute>
        } />
        <Route path="/admin/delete-student" element={
          <PrivateRoute role="admin"><DeactivateStudent /></PrivateRoute>
        } />

       {/* Instructor Management */}
       <Route path="/admin/add-instructor" element={
          <PrivateRoute role="admin"><AddInstructor /></PrivateRoute>
        } />
        <Route path="/admin/delete-instructor" element={
          <PrivateRoute role="admin"><DeactivateInstructor /></PrivateRoute>
        } />

        {/* Finance Officer Management */}
       <Route path="/admin/add-finance-officer" element={
          <PrivateRoute role="admin"><AddFinanceOfficer /></PrivateRoute>
        } />
        <Route path="/admin/delete-finance-officer" element={
          <PrivateRoute role="admin"><DeactivateFinanceOfficer /></PrivateRoute>
        } />

        {/* Course Management */}
        <Route path="/admin/course-management" element={
          <PrivateRoute role="admin"><CourseManagement /></PrivateRoute>
        } />

        {/* Semester Management */}
        <Route path="/admin/semesters" element={
          <PrivateRoute role="admin"><SemesterManagement /></PrivateRoute>
        } />

        {/* Finance Officer Portal Routes */}
        <Route path="/finance" element={
          <PrivateRoute role="finance_officer">
            <FinanceDashboard />
          </PrivateRoute>
        } />

        <Route path="/finance/add-payment" element={
          <PrivateRoute role="finance_officer">
            <div>Add Payment Page - Coming Soon</div>
          </PrivateRoute>
        } />

        <Route path="/finance/mark-payment" element={
          <PrivateRoute role="finance_officer">
            <div>Mark Payment Page - Coming Soon</div>
          </PrivateRoute>
        } />

        <Route path="/finance/student-summary" element={
          <PrivateRoute role="finance_officer">
            <div>Student Summary Page - Coming Soon</div>
          </PrivateRoute>
        } />

        <Route path="/finance/payment-report" element={
          <PrivateRoute role="finance_officer">
            <div>Payment Reports Page - Coming Soon</div>
          </PrivateRoute>
        } />

        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}