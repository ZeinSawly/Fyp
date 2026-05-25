import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, ActivityIndicator } from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './config/api';

import LoginScreen from './Pages/LoginScreen';

import InstructorDashboard from './Pages/Instructor/InstructorDashboard';
import InstructorSchedule from './Pages/Instructor/InstructorSchedule';
import InstructorCourses from './Pages/Instructor/InstructorCourses';
import InstructorProfile from './Pages/Instructor/InstructorProfile';
import InstructorAttendance from './Pages/Instructor/InstructorAttendance';
import InstructorGrading from './Pages/Instructor/InstructorGrading';

import StudentDashboard from './Pages/Student/StudentDashboard';
import StudentSchedule from './Pages/Student/StudentSchedule';
import StudentProfile from './Pages/Student/StudentProfile';
import LandingScreen from './Pages/LandingPage';
import FinancialAccount from './Pages/Student/FinancialAccount';
import PaymentHistory from './Pages/Student/PaymentHistory';
import StudentCourses from './Pages/Student/StudentCourses';
import CourseDetails from './Pages/Student/CourseDetails';
import ShoppingCart from './Pages/Student/ShoppingCart';
import ManageClasses from './Pages/Student/ManageClasses';
import DropCourse from './Pages/Student/DropCourse';
import SwapCourse from './Pages/Student/SwapCourse';
import StudentAttendance from './Pages/Student/StudentAttendance';
import StudentGrades from './Pages/Student/StudentGrades';
import QuizIntro from './Pages/Student/QuizIntro';
import QuizScreen from './Pages/Student/QuizScreen';
import QuizFeedback from './Pages/Student/QuizFeedback';
import QuizResults from './Pages/Student/QuizResults';
import Transcript from './Pages/Student/Transcript';


import AdminDashboard from './Pages/Admin/AdminDashboard';
import AddStudent from './Pages/Admin/AddStudent';
import DeleteStudent from './Pages/Admin/DeleteStudent';
import AddInstructor from './Pages/Admin/AddInstructor';
import DeleteInstructor from './Pages/Admin/DeleteInstructor';
import AddPayment from './Pages/Admin/AddPayment';
import MarkPayment from './Pages/Admin/MarkPayment';
import AdminProfile from './Pages/Admin/AdminProfile';
import GradeComponents from './Pages/Admin/GradeComponents';

const Stack = createNativeStackNavigator();

export default function App() {
  const [isLanding, setIsLanding] = useState(true);
  const [isChecking, setIsChecking] = useState(true);

  // Verify token on app startup — before showing anything
  useEffect(() => {
    const verifyToken = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (token) {
          // Call backend to verify token is valid AND account is active
          await api.get('/api/verify');
          // Token valid + account active → proceed normally
        }
      } catch (err) {
        // 403 = deactivated, 401 = expired → force logout
        if (err.response?.status === 403 || err.response?.status === 401) {
          await AsyncStorage.removeItem('token');
        }
      } finally {
        setIsChecking(false);
      }
    };
    verifyToken();
  }, []);

  // Show spinner while verifying token
  if (isChecking) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1a365d' }}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  // Show landing screen only after token check is done
  if (isLanding) {
    return <LandingScreen onFinish={() => setIsLanding(false)} />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={{
          headerShown: false,
          animation: 'fade',
        }}
      >
        <Stack.Screen name="Login" component={LoginScreen} />

        <Stack.Screen name="StudentDashboard" component={StudentDashboard} />
        <Stack.Screen name="StudentSchedule" component={StudentSchedule} />
        <Stack.Screen name="StudentProfile" component={StudentProfile} />
        <Stack.Screen name="StudentCourses" component={StudentCourses} />
        <Stack.Screen name="FinancialAccount" component={FinancialAccount} />
        <Stack.Screen name="PaymentHistory" component={PaymentHistory} />
        <Stack.Screen name="CourseDetails" component={CourseDetails} />
        <Stack.Screen name="ShoppingCart" component={ShoppingCart} />
        <Stack.Screen name="ManageClasses" component={ManageClasses} />
        <Stack.Screen name="DropCourse" component={DropCourse} />
        <Stack.Screen name="SwapCourse" component={SwapCourse} />
        <Stack.Screen name="StudentAttendance" component={StudentAttendance} />
        <Stack.Screen name="StudentGrades" component={StudentGrades} />
        <Stack.Screen name="QuizIntro" component={QuizIntro} />
        <Stack.Screen name="QuizScreen" component={QuizScreen} />
        <Stack.Screen name="QuizFeedback" component={QuizFeedback} />
        <Stack.Screen name="QuizResults" component={QuizResults} />
        <Stack.Screen name="Transcript" component={Transcript}/>

        <Stack.Screen name="InstructorDashboard" component={InstructorDashboard} />
        <Stack.Screen name="InstructorSchedule" component={InstructorSchedule} />
        <Stack.Screen name="InstructorCourses" component={InstructorCourses} />
        <Stack.Screen name="InstructorProfile" component={InstructorProfile} />
        <Stack.Screen name="InstructorAttendance" component={InstructorAttendance} />
        <Stack.Screen name="InstructorGrading" component={InstructorGrading} />

        <Stack.Screen name="AdminDashboard" component={AdminDashboard} />
        <Stack.Screen name="AddStudent" component={AddStudent} />
        <Stack.Screen name="DeleteStudent" component={DeleteStudent} />
        <Stack.Screen name="AddInstructor" component={AddInstructor} />
        <Stack.Screen name="DeleteInstructor" component={DeleteInstructor} />
        <Stack.Screen name="AddPayment" component={AddPayment} />
        <Stack.Screen name="MarkPayment" component={MarkPayment} />
        <Stack.Screen name="AdminProfile" component={AdminProfile} />
        <Stack.Screen name="GradeComponents" component={GradeComponents} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}