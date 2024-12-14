


import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import axios from 'axios';

import Home from './components/Home';
import Dashboard from './components/Dashboard';
import Login from './components/Navbar/Login';
import Nav from './components/Navbar/Nav';

import CourseTable from './components/Tables/courseTables';
import UserManagement from './components/Tables/userManagement';

import AddUser from './components/Tables/addUser';

import AllUsers from './components/Tables/allUsers';
import CourseCategoryTable from './components/Tables/courseCategory';
import ManageRoles from './components/Tables/rolesTables';
import PermissionRoles from './components/Tables/permissionTables';

import ProtectedRoute from './components/protectedRoute';

import TraineeHelloWorld from './components/Trainee/TraineeHelloWorld';
import UserSettings from './components/Trainee/userSettings';
import CourseDetails from './components/Trainee/CourseDetails/courseDetails';
import courseData from './components/Trainee/data.json';
import { Category, Course } from './components/Trainee/types';
import Footer from './components/Trainee/Footer/Footer';


import TrainerHelloWorld from './components/Trainer/TrainerHelloWorld';


import { Toaster } from 'sonner';


const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(
    () => localStorage.getItem('isAuthenticated') === 'true'
  );
  const [userRole, setUserRole] = useState<string>(() => localStorage.getItem('role') || '');
  const [userName, setUserName] = useState<string>(() => localStorage.getItem('userName') || '');
  const [loading, setLoading] = useState<boolean>(true);

  // Flatten all courses for easy access in CourseDetails route
  const allCourses: Course[] = (courseData as unknown as { categories: Category[] }).categories.flatMap(
    (category) => category.courses
  );

  console.log(allCourses);

  useEffect(() => {
    const authenticateWithToken = async () => {
      const token = localStorage.getItem('authToken');
      const userId = localStorage.getItem('userId');

      if (token && userId) {
        try {
          const response = await axios.get(`/users/${userId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          if (response.data && response.data.user) {
            const user = response.data.user;
            const fullName = `${user.firstName} ${user.lastName}`;

            setIsAuthenticated(true);
            setUserRole(user.role);
            setUserName(fullName);

            localStorage.setItem('isAuthenticated', 'true');
            localStorage.setItem('role', user.role);
            localStorage.setItem('userName', fullName);
          }
        } catch (error) {
          console.error('Token validation failed:', error);
          localStorage.clear();
          setIsAuthenticated(false);
        }
      }
      setLoading(false);
    };

    authenticateWithToken();
  }, []);

  if (loading) {
    return <div className="text-center mt-20">Loading...</div>;
  }

  return (
    <Router>
      <Nav
        isAuthenticated={isAuthenticated}
        setIsAuthenticated={setIsAuthenticated}
      />

      <Routes>
        {/* Admin Protected Routes */}
        <Route
          path="/admin/*"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <Home isAuthenticated={isAuthenticated} />
            </ProtectedRoute>
          }
        >
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="courses" element={<CourseTable />} />
          <Route path="course-category" element={<CourseCategoryTable />} />
          <Route path="manage-roles-and-permissions" element={<ManageRoles />} />
          <Route path="manage-permissions" element={<PermissionRoles />} />
          
          <Route path="allUsers" element={<AllUsers />}>
            <Route path=":roleName" element={<UserManagement />} />
            <Route path="add-user" element={<AddUser />} />
          </Route>
        </Route>



        <Route
          path="/trainee/*"
          element={
            <ProtectedRoute allowedRoles={['trainee']}>
              <>
                <TraineeHelloWorld isAuthenticated={isAuthenticated} />
                <Footer />
              </>
            </ProtectedRoute>
          }
        >
          {/* Child Routes */}
          <Route path="settings" element={<UserSettings />} />
          <Route path="course/:courseId" element={<CourseDetails courses={allCourses} />} />
        </Route>



        {/* Trainer Protected Routes */}
        <Route
          path="/trainer/*"
          element={
            <ProtectedRoute allowedRoles={['trainer']}>
              <TrainerHelloWorld />
            </ProtectedRoute>
          }
        >
        </Route>


        {/* Role-based Redirection */}
        <Route
          path="/"
          element={
            isAuthenticated ? (
              userRole === 'admin' ? (
                <Navigate to="/admin" replace />
              ) : userRole === 'trainer' ? (
                <Navigate to="/trainer" replace />
              ) : userRole === 'trainee' ? (
                <Navigate to="/trainee" replace />
              ) : (
                <Navigate to="/login" replace />
              )
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />


        {/* Login Route */}
        <Route
          path="/login"
          element={<Login setIsAuthenticated={setIsAuthenticated} setUserName={setUserName} />}
        />
      </Routes>

      <Toaster />
    </Router>
  );
};

export default App;
