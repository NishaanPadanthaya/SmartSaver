import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { enableDevMode, isDevMode } from '../utils/authUtils';

const NavBar = () => {
  const { currentUser, logout } = useAuth();
  const location = useLocation();
  const isDev = process.env.NODE_ENV === 'development';

  const navItems = [
    { path: '/dashboard', label: 'Dashboard' },
    { path: '/budget', label: 'Budget' },
    { path: '/savings', label: 'Savings' },
    { path: '/profile', label: 'Profile' },
  ];

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const toggleDevMode = () => {
    enableDevMode(!isDevMode());
    // Force refresh to apply changes
    window.location.reload();
  };

  return (
    <nav className="bg-blue-700 text-white shadow-lg">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex justify-between">
          <div className="flex space-x-4">
            <div>
              <Link to="/" className="flex items-center py-5 px-2 text-white">
                <span className="font-bold text-xl">SmartSaver</span>
              </Link>
            </div>
            
            {currentUser && (
              <div className="hidden md:flex items-center space-x-1">
                {navItems.map((item) => (
                  <Link 
                    key={item.path} 
                    to={item.path} 
                    className={`py-5 px-3 hover:text-blue-200 transition duration-300 ${
                      location.pathname === item.path ? 'text-white font-bold border-b-2 border-white' : ''
                    }`}>
                    {item.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
          
          <div className="hidden md:flex items-center space-x-4">
            {currentUser ? (
              <>
                <span className="text-sm text-blue-200">
                  {currentUser.displayName || currentUser.email}
                </span>
                <button
                  onClick={handleLogout}
                  className="py-2 px-3 bg-blue-800 hover:bg-blue-900 text-white rounded transition duration-300"
                >
                  Logout
                </button>
                {isDev && (
                  <button
                    onClick={toggleDevMode}
                    className={`py-1 px-2 text-xs rounded transition duration-300 ${
                      isDevMode() ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-600 hover:bg-gray-700'
                    }`}
                    title="Toggle development mode"
                  >
                    {isDevMode() ? 'Dev Mode: ON' : 'Dev Mode: OFF'}
                  </button>
                )}
              </>
            ) : (
              <>
                <Link 
                  to="/login" 
                  className="py-2 px-3 bg-blue-800 hover:bg-blue-900 text-white rounded transition duration-300"
                >
                  Login
                </Link>
                <Link 
                  to="/register" 
                  className="py-2 px-3 bg-white text-blue-700 hover:bg-blue-100 rounded transition duration-300"
                >
                  Register
                </Link>
                {isDev && (
                  <button
                    onClick={toggleDevMode}
                    className={`py-1 px-2 text-xs rounded transition duration-300 ${
                      isDevMode() ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-600 hover:bg-gray-700'
                    }`}
                    title="Toggle development mode"
                  >
                    {isDevMode() ? 'Dev Mode: ON' : 'Dev Mode: OFF'}
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default NavBar; 