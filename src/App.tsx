import React, { useState, useEffect } from 'react';
import LoginForm from './components/LoginForm';
import Navbar from './components/Navbar';
import CompanyList from './components/CompanyList';
import CreateCompany from './components/CreateCompany';
// import UsersList from './components/users/UsersList';
import RolesList from './components/users/RolesList';
import type { PageType } from './types';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentPage, setCurrentPage] = useState<PageType>(() => {
    // Load the current page from localStorage or default to 'home'
    return (localStorage.getItem('currentPage') as PageType) || 'home';
  });

  // Save the current page to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('currentPage', currentPage);
  }, [currentPage]);

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentPage('home');
  };

  if (!isLoggedIn) {
    return <LoginForm onLogin={() => setIsLoggedIn(true)} />;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar 
        onNavigate={setCurrentPage}
        onLogout={handleLogout}
      />
      
      <div className="ml-64 p-8">
        {currentPage === 'home' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Welcome, Super Admin!</h1>
            <p className="text-gray-600">
              You can manage companies, users, and roles from the navigation menu on the left.
            </p>
          </div>
        )}
        
        {currentPage === 'companies' && (
          <CompanyList
            onNavigateBack={() => setCurrentPage('home')} // Navigate back to home
          />
        )}
        
        {currentPage === 'create' && (
          <CreateCompany
            onClose={() => setCurrentPage('companies')} // Navigate back to the company list
          />
        )}
        
        {/* {currentPage === 'users' && <UsersList />} */}
        {currentPage === 'roles' && <RolesList />}
      </div>
    </div>
  );
}