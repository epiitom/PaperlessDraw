"use client"
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Palette, Users, Plus, ArrowRight } from "lucide-react";

export default function RoomEntryPage() {
  const [roomName, setRoomName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const router = useRouter();
  const { token } = useAuth();
  const API_BASE = "http://localhost:3002";

  const createRoom = async () => {
    if (!token) {
      alert("No authentication token found. Please login again.");
      router.push('/signin');
      return;
    }

    if (!roomName.trim()) {
      alert("Please enter a room name");
      return;
    }

    setIsCreating(true);
    
    try {
      const res = await fetch(`${API_BASE}/room`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ name: roomName.trim() })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        console.log("Room created successfully:", data);
        router.push(`/canvas/${data.slug}`);
      } else {
        console.error("Failed to create room:", data);
        
        // Handle specific error cases
        if (res.status === 401 || res.status === 403) {
          alert("Authentication failed. Please login again.");
          router.push('/signin');
        } else if (res.status === 409) {
          alert("Room already exists with this name. Please choose a different name.");
        } else {
          alert(data.message || "Failed to create room. Please try again.");
        }
      }
    } catch (error) {
      console.error("Network error:", error);
      alert("Network error. Please check your connection and try again.");
    } finally {
      setIsCreating(false);
    }
  };

  const joinRoom = async () => {
    if (!token) {
      alert("No authentication token found. Please login again.");
      router.push('/signin');
      return;
    }

    if (!roomName.trim()) {
      alert("Please enter a room name");
      return;
    }

    setIsJoining(true);
    
    try {
      const res = await fetch(`${API_BASE}/room/${roomName.trim()}`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      
      const data = await res.json();
      
      if (res.ok && data.room) {
        console.log("Room found:", data.room);
        router.push(`/canvas/${data.room.slug}`);
      } else {
        console.error("Room not found:", data);
        
        if (res.status === 401 || res.status === 403) {
          alert("Authentication failed. Please login again.");
          router.push('/signin');
        } else {
          alert("Room not found. Please check the room name and try again.");
        }
      }
    } catch (error) {
      console.error("Network error:", error);
      alert("Network error. Please check your connection and try again.");
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 25% 25%, #64748b 1px, transparent 1px), radial-gradient(circle at 75% 75%, #64748b 1px, transparent 1px)',
          backgroundSize: '50px 50px'
        }}></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-3 rounded-full">
              <Palette className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Paperless Draw</h1>
          <p className="text-slate-400">Enter your collaborative workspace</p>
        </div>

        {/* Main Card */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-8 shadow-2xl">
          {/* Room Name Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Room Name
            </label>
            <div className="relative">
              <input
                type="text"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                placeholder="e.g. design-team, art-project"
                className="w-full p-4 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                disabled={isCreating || isJoining}
              />
              <div className="absolute inset-y-0 right-4 flex items-center">
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-4">
            {/* Create Room Button */}
            <button 
              onClick={createRoom} 
              disabled={isCreating || isJoining || !roomName.trim()}
              className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white p-4 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-purple-500/25"
            >
              {isCreating ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Creating Canvas...
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5" />
                  Create New Canvas
                </>
              )}
            </button>

            {/* Join Room Button */}
            <button 
              onClick={joinRoom} 
              disabled={isCreating || isJoining || !roomName.trim()}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white p-4 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-blue-500/25"
            >
              {isJoining ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Joining Canvas...
                </>
              ) : (
                <>
                  <Users className="w-5 h-5" />
                  Join Existing Canvas
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>

          {/* Info Text */}
          <div className="mt-6 text-center">
            <p className="text-slate-400 text-sm">
              Create a new collaborative canvas or join an existing one to start creating together
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-slate-500 text-sm">
            Powered by collaborative creativity
          </p>
        </div>
      </div>
    </div>
  );
}