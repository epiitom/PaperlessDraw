
"use client"
import React, { useState, useEffect } from 'react';
import Link from 'next/link';

// Mock user type - replace with your actual user type
interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

// Auth hook using localStorage pattern from your landing page
const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      try {
        const token = localStorage.getItem('token');
        const userEmail = localStorage.getItem('userEmail');
        
        if (token && userEmail) {
          // Create user object from stored email
          setUser({
            id: 'user-' + Date.now(), // Simple ID generation
            name: userEmail.split('@')[0], // Extract name from email
            email: userEmail,
            avatar: undefined
          });
        }
      } catch (error) {
        console.error('Auth check failed:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const logout = () => {
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('userEmail');
      setUser(null);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return { user, loading, logout };
};

const Navbar: React.FC = () => {
  const { user, loading, logout } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const navigationLinks = [
    { title: "Features", href: '#features' },
    { title: "Room", href: '#room' },
    { title: "Pricing", href: "#pricing" }
  ];

  const handleLogout = () => {
    logout();
    setIsDropdownOpen(false);
  };

  return (
    <nav className="bg-[#08080a] border-b border-neutral-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 font-bold text-xl hover:opacity-90 transition-opacity">
            <img
              src="/scaling.svg"
              alt="PaperlessDraw"
              className="w-8 h-8 rounded"
              loading="lazy"
            />
            <span>PaperlessDraw</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {/* Navigation Links */}
            <div className="flex items-center gap-6">
              {navigationLinks.map((link) => (
                <Link
                  key={link.title}
                  href={link.href}
                  className="text-neutral-400 hover:text-white hover:bg-neutral-800 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200"
                >
                  {link.title}
                </Link>
              ))}
            </div>

            {/* Auth Section */}
            {loading ? (
              <div className="w-20 h-8 bg-neutral-800 animate-pulse rounded-md" />
            ) : user ? (
              <div className="relative">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-2 p-2 rounded-md hover:bg-neutral-800 transition-colors"
                  aria-expanded={isDropdownOpen}
                  aria-haspopup="true"
                >
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-neutral-500 to-neutral-50 flex items-center justify-center text-sm font-semibold">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="text-sm font-medium max-w-32 truncate">{user.name}</span>
                  <svg 
                    className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Dropdown Menu */}
                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-neutral-900 rounded-md shadow-lg border border-neutral-800 py-1 z-50">
                    <Link
                      href="/profile"
                      className="block px-4 py-2 text-sm text-neutral-300 hover:bg-neutral-800 hover:text-white"
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      Profile Settings
                    </Link>
                    <Link
                      href="/dashboard"
                      className="block px-4 py-2 text-sm text-neutral-300 hover:bg-neutral-800 hover:text-white"
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      Dashboard
                    </Link>
                    <hr className="my-1 border-neutral-800" />
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-neutral-800 hover:text-red-300"
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  href="/signin"
                  className="px-4 py-2 rounded-md text-neutral-400 hover:text-white hover:bg-neutral-800 text-sm font-medium transition-all"
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  className="bg-white text-black px-4 py-2 rounded-md hover:bg-neutral-200 text-sm font-medium transition-all"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button className="text-neutral-400 hover:text-white p-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Click outside to close dropdown */}
      {isDropdownOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsDropdownOpen(false)}
          aria-hidden="true"
        />
      )}
    </nav>
  );
};

export default Navbar;