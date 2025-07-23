/* eslint-disable @typescript-eslint/no-unused-vars */
'use client'

import React, { useState, useEffect } from 'react';
import { 
  Share2, 
  Users2, 
  Sparkles, 
  Github, 
  Download, 
  ArrowRight, 
  Palette, 
  Zap,
  Moon,
  Sun,
  LucideIcon
} from "lucide-react";
import Link from 'next/link';
//import axios from 'axios';





interface ButtonProps {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "md" | "lg";
  className?: string;
}

const Button = ({ children, variant = "primary", size = "md", className = "", ...props }: ButtonProps) => {
  const baseClasses = "inline-flex items-center justify-center font-medium rounded-lg transition-all duration-300";
  const sizeClasses = {
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base"
  };
  const variantClasses = {
    primary: "bg-primary text-white hover:bg-primary/90 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700",
    secondary: "bg-secondary text-gray-900 hover:bg-secondary/90 dark:bg-secondary dark:text-white dark:hover:bg-secondary/90",
    outline: "border border-gray-300 dark:border-gray-600 dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700",
    ghost: "text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
  };

  return (
    <button 
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};


interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

const FeatureCard = ({ icon: Icon, title, description }: FeatureCardProps) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="group p-6 transition-all duration-300 hover:bg-gray-50 dark:text-white dark:hover:bg-gray-800/50 rounded-xl"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative flex items-center gap-6">
        <div className={`p-3 rounded-xl bg-primary/10 transition-colors duration-300 ${isHovered ? 'bg-primary/20' : ''}`}>
          <Icon className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h3 className="text-xl font-semibold mb-2">{title}</h3>
          <p className="text-muted-foreground">{description}</p>
        </div>
      </div>
    </div>
  );
};

function Landing() {

  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [login, setLogin] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [isDark, setIsDark] = useState(false);


  useEffect(() => {
      
    const token = localStorage.getItem('token');
    const email = localStorage.getItem('userEmail');
    
    if (token && email) {
      setLogin(true);
      setUserEmail(email);
    }
  
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
   const handleLogout = () => {
    setLogin(false);
    setUserEmail('');
    localStorage.removeItem('token');
    localStorage.removeItem('userEmail');
  };

  const features = [
    {
      icon: Share2,
      title: "Real-time Collaboration",
      description: "Work together with your team in real-time. Share your drawings instantly with a simple link."
    },
    {
      icon: Users2,
      title: "Multiplayer Editing",
      description: "Multiple users can edit the same canvas simultaneously. See who's drawing what in real-time."
    },
    {
      icon: Sparkles,
      title: "Smart Drawing",
      description: "Intelligent shape recognition and drawing assistance helps you create perfect diagrams."
    }
  ];

  return (
    <div className={`min-h-screen relative ${isDark ? 'dark' : ''}`}>
      <div className="fixed inset-0 -z-10">
        {/* Base Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-white to-gray-100 dark:from-gray-900 dark:to-black" />
        
        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:64px_64px]" />

        {/* Animated Shapes Container */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Modern Gradient Circle */}
          <div 
            className="absolute w-[500px] h-[500px] rounded-full blur-3xl mix-blend-multiply dark:mix-blend-normal"
            style={{
              left: '10%',
              top: '20%',
              background: 'linear-gradient(45deg, rgba(59,130,246,0.2), rgba(147,51,234,0.2))',
              animation: 'float-circle 20s infinite linear'
            }}
          />
          <div 
            className="absolute w-[600px] h-[600px] rounded-full blur-3xl mix-blend-multiply dark:mix-blend-normal"
            style={{
              right: '15%',
              bottom: '15%',
              background: 'linear-gradient(45deg, rgba(236,72,153,0.2), rgba(139,92,246,0.2))',
              animation: 'float-circle 25s infinite linear reverse'
            }}
          />

          {/* Glowing Lines */}
          <div 
            className="absolute h-[2px] w-[300px]"
            style={{
              left: '0',
              top: '40%',
              background: 'linear-gradient(90deg, transparent, rgba(99,102,241,0.3), transparent)',
              boxShadow: '0 0 20px rgba(99,102,241,0.2)',
              animation: 'move-line 15s infinite linear'
            }}
          />
          <div 
            className="absolute h-[2px] w-[300px]"
            style={{
              right: '0',
              bottom: '30%',
              background: 'linear-gradient(90deg, transparent, rgba(6,182,212,0.3), transparent)',
              boxShadow: '0 0 20px rgba(6,182,212,0.2)',
              animation: 'move-line 18s infinite linear reverse'
            }}
          />

          {/* Modern Geometric Shapes */}
          <div 
            className="absolute w-64 h-64 rounded-[2rem] backdrop-blur-3xl"
            style={{
              left: '25%',
              top: '60%',
              background: 'linear-gradient(135deg, rgba(16,185,129,0.2), rgba(5,150,105,0.1))',
              transform: 'rotate(45deg)',
              animation: 'move-diagonal 30s infinite linear'
            }}
          />
          <div 
            className="absolute w-48 h-48 rounded-[2rem] backdrop-blur-3xl"
            style={{
              right: '25%',
              top: '30%',
              background: 'linear-gradient(135deg, rgba(244,63,94,0.2), rgba(217,70,239,0.1))',
              transform: 'rotate(-12deg)',
              animation: 'move-diagonal 25s infinite linear reverse'
            }}
          />
        </div>
      </div>

      {/* Navbar */}{/*
      <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/70 dark:bg-gray-900/70 backdrop-blur-lg shadow-lg' : ''}`}>
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 group">
              <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 p-2 rounded-xl group-hover:scale-110 transition-transform">
                <Palette className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
                Drawcelia
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsDark(!isDark)}
                className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label="Toggle theme"
              >
                {isDark ? 
                  <Sun className="h-5 w-5" /> : 
                  <Moon className="h-5 w-5" />
                }
              </button>
              <Link href="/signin">
                <Button size="md" variant="outline">Sign In</Button> 
              </Link>
              <Link href="/signup">
                <Button size="md" variant="outline">Sign Up</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav> */}
      <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/70 dark:bg-gray-900/70 backdrop-blur-lg shadow-lg' : ''}`}>
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 p-2 rounded-xl">
            <Palette className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
          </div>
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-white">
            PaperlessDraw
          </h1>
        </div>

        {/* Hamburger Button */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          aria-label="Toggle menu"
        >
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* Menu  */}
    {/* Menu */}
   
     <div className="hidden md:flex items-center gap-4">
        
        
        {login ? (
          // Show when logged in
          <div className="flex items-center gap-4">
            <span className="text-gray-700 dark:text-gray-300 text-sm font-medium">
              {userEmail}
            </span>
           <div onClick={handleLogout}>
      <Button size="md" variant="outline">Logout</Button>
        </div>
          </div>
        ) : (
          // Show when not logged in
          <>
            <Link href="/signin">
              <Button size="md" variant="outline">Sign In</Button>
            </Link>
            <Link href="/signup">
              <Button size="md" variant="outline">Sign Up</Button>
            </Link>
          </>
        )}
      </div>
    </div>
      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden absolute top-full inset-x-0 bg-white dark:bg-gray-900 shadow-lg p-4 space-y-4">
        
          <Link href="/signin">
            <Button size="md" variant="outline" className="w-full">Sign In</Button>
          </Link>
          <Link href="/signup">
            <Button size="md" variant="outline" className="w-full">Sign Up</Button>       
          </Link>
        </div>
      )}
    </nav>


      {/* Hero Section */}
      <header className="pt-32 pb-20 relative overflow-hidden">
  <div className="container mx-auto px-4">
    <div className="text-center max-w-5xl mx-auto">
      <div className="inline-block animate-float">
        <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 p-3 rounded-2xl mb-8">
          <Sparkles className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
        </div>
      </div>
      <h2 className="text-4xl md:text-7xl font-bold tracking-tight text-gray-900 dark:text-white">
        Collaborative Whiteboarding
        <span className="block mt-4 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          Made Simple
        </span>
      </h2>
      <p className="mt-8 text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed">
        Create, collaborate, and share beautiful diagrams and sketches with our intuitive drawing tool.
        {login ? " Welcome back!" : " sign-up required."}
      </p>
      <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
        {login ? (
          // Show when logged in - direct link to canvas
          <Link href="/Room">
            <Button
              variant="outline"
              size="lg"
              className="w-full sm:w-auto group animate-fade-in"
            >
              Start Drawing
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        ) : (
          // Show when not logged in - redirect to signin
          <Link href="/signin">
            <Button
              variant="outline"
              size="lg"
              className="w-full sm:w-auto group animate-fade-in"
            >
              Sign In to Start Drawing
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        )}
        <Button
          variant="outline"
          size="lg"
          className="w-full sm:w-auto animate-fade-in [animation-delay:200ms]"
        >
          Watch Demo
        </Button>
      </div>
    </div>
  </div>
</header>

      {/* Features Section */}
      <section className="py-32 relative">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="animate-fade-in" style={{ animationDelay: `${index * 200}ms` }}>
                <FeatureCard {...feature} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 relative">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-[2.5rem] p-12 sm:p-24 relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,#ffffff1a,transparent)]" />
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:24px_24px]" />
            <div className="relative text-center max-w-2xl mx-auto">
              <div className="inline-block p-3 bg-white/10 rounded-2xl mb-8">
                <Zap className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                Ready to start creating?
              </h2>
              <p className="text-xl text-white/90 mb-12 leading-relaxed">
                Join thousands of users who are already creating amazing diagrams and sketches.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
                <Button 
                  variant="secondary" 
                  size="lg" 
                  className="w-full sm:w-auto group"
                >
                  {/*<Link href="http://localhost:3000/canvas/1"> */}
                    Open Canvas
                 {/* </Link >*/}
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="lg" 
                  className="w-full sm:w-auto"
                >
                  View Gallery
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-gray-200 dark:border-gray-800 relative">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              © 2025 PaperlessDraw. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <a 
                href="https://github.com" 
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
              >
                <Github className="h-5 w-5" />
              </a>
              <a 
                href="#" 
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
              >
                <Download className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>
      </footer>

      <style jsx global>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out forwards;
          opacity: 0;
        }
        @keyframes float-circle {
          0%, 100% { transform: translate(0, 0); }
          25% { transform: translate(50px, 100px); }
          50% { transform: translate(100px, 0); }
          75% { transform: translate(50px, -100px); }
        }

        @keyframes move-diagonal {
          0% { transform: rotate(45deg); }
          100% { transform: rotate(405deg); }
        }

        @keyframes move-line {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100vw); }
        }
      `}</style>
    </div>
  );
}

export default Landing;