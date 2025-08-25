"use client"
import React from 'react'
import AnimatedCanvas from './animate-canvas'
import PencilDrawingBackground from "../components/pencile"
import { useRouter } from 'next/navigation';
import { useAuth } from "@/context/AuthContext";
const New = () => {
    const router = useRouter();
     const { user } = useAuth();
 
       const handleOnClick = () => {
        console.log("Current user from AuthContext:", user);
        
        // Check if user exists and has an id
        if (user && user.id) {
            console.log("Valid user found, redirecting to /Room");
            router.push('/Room');
        } else {
            console.log("No valid user found, redirecting to /signup");
            router.push('/signup');
        }
    }

    return (
        <div className="min-h-[calc(100vh-170px)] flex flex-col items-center justify-center gap-7 px-4 py-8">
            <PencilDrawingBackground />
            {/* Badge */}
            <div className="relative mt-9 group cursor-pointer">
                <div className="absolute inset-0 rounded-md blur-sm opacity-50 group-hover:opacity-100 bg-monochrome-gradient"></div>
                <p className="relative text-white bg-[#0a0b0b] px-8 py-0.5 rounded-md border border-neutral-400">
                    Real time Collaborations
                </p>
            </div>
            
            {/* Main Heading */}
            <h1 className="max-w-3xl bg-gradient-to-b from-white to-neutral-500 text-7xl font-bold bg-clip-text text-center tracking-tight text-transparent leading-none">
                One Infinite Canvas. Endless Minds. Your Vision.
            </h1>
            
            {/* Description */}
            <p className="max-w-3xl text-center text-neutral-500 selection:bg-white">
                PaperlessDraw is a real-time collaborative whiteboard built for teams, creators, and classrooms.
                Whether you are brainstorming, teaching, or building together — draw, share ideas, and sync with others on a shared infinite canvas.
            </p>
            
            {/* Buttons */}
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mt-2">
                <button 
                    className="bg-white px-6 py-3 rounded-md text-black hover:bg-gray-300 cursor-pointer transition-all duration-200" 
                    onClick={handleOnClick}
                >
                    <span className="font-medium">Create Rooms</span>
                </button>
                
                <button className="text-white relative border border-neutral-400 rounded-md px-6 py-3 cursor-pointer hover:bg-neutral-800 transition-all duration-200">
                    <div className="absolute inset-x-0 -bottom-px h-px w-full bg-gradient-to-r from-transparent via-sky-600 to-transparent" />
                    Watch demo
                </button>
            </div>
            
            {/* Animated Canvas - Replaces the static image */}
            <AnimatedCanvas />
            
            {/* Trusted Companies Section */}
            <div className="w-full max-w-7xl mt-20 px-4">
                <div className="text-center">
                    <p className="text-[#fefffe] text-3xl font-medium tracking-wider mb-8">
                        Trusted by world-class teams
                    </p>
                    
                    {/* Companies Marquee Effect */}
                    <div className="relative overflow-hidden">
                        <div className="flex animate-marquee space-x-16 items-center justify-center py-8">
                            {/* First Set */}
                            <div className="flex items-center justify-center min-w-[120px] h-12 text-neutral-300 hover:text-white transition-colors duration-300 cursor-pointer">
                                <span className="text-xl font-bold tracking-tight">Cursor</span>
                            </div>
                            
                            <div className="flex items-center justify-center min-w-[120px] h-12 text-neutral-300 hover:text-white transition-colors duration-300 cursor-pointer">
                                <span className="text-xl font-bold tracking-tight">Shadcn</span>
                            </div>
                            
                            <div className="flex items-center justify-center min-w-[120px] h-12 text-neutral-300 hover:text-white transition-colors duration-300 cursor-pointer">
                                <span className="text-xl font-bold tracking-tight">Sarvam AI</span>
                            </div>
                            
                            <div className="flex items-center justify-center min-w-[120px] h-12 text-neutral-300 hover:text-white transition-colors duration-300 cursor-pointer">
                                <span className="text-xl font-bold tracking-tight">DeepSeek</span>
                            </div>
                            
                            <div className="flex items-center justify-center min-w-[120px] h-12 text-neutral-300 hover:text-white transition-colors duration-300 cursor-pointer">
                                <span className="text-xl font-bold tracking-tight">OpenAI</span>
                            </div>
                            
                            <div className="flex items-center justify-center min-w-[120px] h-12 text-neutral-300 hover:text-white transition-colors duration-300 cursor-pointer">
                                <span className="text-xl font-bold tracking-tight">tldraw</span>
                            </div>
                            
                            <div className="flex items-center justify-center min-w-[120px] h-12 text-neutral-300 hover:text-white transition-colors duration-300 cursor-pointer">
                                <span className="text-xl font-bold tracking-tight">Notion</span>
                            </div>
                            
                            <div className="flex items-center justify-center min-w-[120px] h-12 text-neutral-300 hover:text-white transition-colors duration-300 cursor-pointer">
                                <span className="text-xl font-bold tracking-tight">Claude</span>
                            </div>

                            {/* Duplicate set for seamless loop */}
                            <div className="flex items-center justify-center min-w-[120px] h-12 text-neutral-300 hover:text-white transition-colors duration-300 cursor-pointer">
                                <span className="text-xl font-bold tracking-tight">Cursor</span>
                            </div>
                            
                            <div className="flex items-center justify-center min-w-[120px] h-12 text-neutral-300 hover:text-white transition-colors duration-300 cursor-pointer">
                                <span className="text-xl font-bold tracking-tight">Shadcn</span>
                            </div>
                            
                            <div className="flex items-center justify-center min-w-[120px] h-12 text-neutral-300 hover:text-white transition-colors duration-300 cursor-pointer">
                                <span className="text-xl font-bold tracking-tight">Sarvam AI</span>
                            </div>
                            
                            <div className="flex items-center justify-center min-w-[120px] h-12 text-neutral-300 hover:text-white transition-colors duration-300 cursor-pointer">
                                <span className="text-xl font-bold tracking-tight">DeepSeek</span>
                            </div>
                        </div>
                        
                        {/* Fade edges for seamless effect */}
                        <div className="absolute left-0 top-0 w-20 h-full bg-gradient-to-r from-[oklch(43.9%_0_0)] to-transparent pointer-events-none"></div>
                        <div className="absolute right-0 top-0 w-20 h-full bg-gradient-to-l from-[oklch(43.9%_0_0)] to-transparent pointer-events-none"></div>
                    </div>
                    
                    {/* Alternative Static Grid for Mobile */}
                    <div className="md:hidden grid grid-cols-2 gap-6 mt-8">
                        {['Cursor', 'Shadcn', 'Sarvam AI', 'DeepSeek', 'OpenAI', 'tldraw', 'Notion', 'Claude'].map((company) => (
                            <div key={company} className="flex items-center justify-center h-12 text-neutral-300 hover:text-white transition-colors duration-300">
                                <span className="text-lg font-semibold">{company}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default New