import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './Pages/Login';

import FinanceDashboard from './Pages/Finance/FinanceDashboard';
import StudentSearch from './Pages/Finance/StudentSearch';
import StudentAccount from './Pages/Finance/StudentAccount';
import GenerateBills from './Pages/Finance/GenerateBills';


import AdminDashboard from './Pages/Admin/AdminDashboard';
import AddStudent from './Pages/Admin/AddStudent';
import DeactivateStudent from './Pages/Admin/DeactivateStudent';
import AddInstructor from './Pages/Admin/AddInstructor';
import DeactivateInstructor from './Pages/Admin/DeactivateInstructor';
import AddFinanceOfficer from './Pages/Admin/AddFinanceOfficer';
import DeactivateFinanceOfficer from './Pages/Admin/DeactivateFinanceOfficer';
import CourseManagement from './Pages/Admin/CourseManagement';
import EditCourse from './Pages/Admin/EditCourse';
import SemesterManagement from './Pages/Admin/SemesterManagement';
import CreditPricing from './Pages/Admin/CreditPricing';
import FeeManagement from './Pages/Admin/FeeManagement';
import DiscountManagement from './Pages/Admin/DiscountManagement';
import GradeComponents from './Pages/Admin/GradeComponents';


import InstrcutorDashboard from './Pages/Instructor/InstrutorDashboard';
import MarkAttendance from './Pages/Instructor/MarkAttendance';
import AbsenceSummary from './Pages/Instructor/AbsenceSummary';
import ManageGrades from './Pages/Instructor/ManageGrades';
import FinalizeGrades from './Pages/Instructor/FinalizeGrades';
import Schedule from './Pages/Instructor/Schedule';



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
        
        {/* Admin Dashboard */}
        <Route path="/admin" element={
          <PrivateRoute role="admin"><AdminDashboard /></PrivateRoute>
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

        {/* Edit Course */}
        <Route path="/admin/course/:course_id/edit" element={
          <PrivateRoute role="admin"><EditCourse /></PrivateRoute>
        } />

        {/* Semester Management */}
        <Route path="/admin/semesters" element={
          <PrivateRoute role="admin"><SemesterManagement /></PrivateRoute>
        } />

        {/* Credit Pricing */}
        <Route path="/admin/credit-pricing" element={
          <PrivateRoute role="admin"><CreditPricing /></PrivateRoute>
        } />

        {/* Fee Management */}
        <Route path="/admin/fee-management" element={
          <PrivateRoute role="admin"><FeeManagement /></PrivateRoute>
        } />

        {/* Discount Management */}
        <Route path="/admin/discount-management" element={
          <PrivateRoute role="admin"><DiscountManagement /></PrivateRoute>
        } />

        <Route path="/admin/grade-components" element={
          <PrivateRoute role="admin"><GradeComponents /></PrivateRoute>
        } />

        {/* Finance Officer Portal Routes */}
        <Route path="/finance" element={
          <PrivateRoute role="finance_officer"><FinanceDashboard /></PrivateRoute>
        } />

        <Route path="/finance/student-summary" element={
          <PrivateRoute role="finance_officer">
            <StudentSearch />
          </PrivateRoute>
        } />

        <Route path="/finance/student/:student_id" element={
          <PrivateRoute role="finance_officer">
            <StudentAccount />
          </PrivateRoute>
        } />

        <Route path="/finance/generate-bills" element={
          <PrivateRoute role="finance_officer">
            <GenerateBills />
          </PrivateRoute>
        } />

        <Route path="/finance/payment-report" element={
          <PrivateRoute role="finance_officer">
            <div>Payment Reports Page - Coming Soon</div>
          </PrivateRoute>
        } />

        {/* Instructor Portal Routes */}

        <Route path="/instructor" element={
          <PrivateRoute role="instructor"><InstrcutorDashboard /></PrivateRoute>
        } />

        <Route path="/instructor/attendance/mark" element={
          <PrivateRoute role="instructor"><MarkAttendance /></PrivateRoute>
        } />

        <Route path="/instructor/attendance/summary" element={
          <PrivateRoute role="instructor"><AbsenceSummary /></PrivateRoute>
        } />

        <Route path="/instructor/grades/manage" element={
          <PrivateRoute role="instructor"><ManageGrades /></PrivateRoute>
        } />

        <Route path="/instructor/grades/finalize" element={
          <PrivateRoute role="instructor"><FinalizeGrades /></PrivateRoute>
        } />

        <Route path="/instructor/schedule" element={
          <PrivateRoute role="instructor"><Schedule /></PrivateRoute>
        } />

        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}