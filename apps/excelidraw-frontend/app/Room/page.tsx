"use client"
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Palette, Users, Plus, ArrowRight } from "lucide-react";
import { HTTP_BACKEND } from "@/config";

export default function RoomEntryPage() {
  const [roomName, setRoomName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const router = useRouter();
  const { token } = useAuth();
  const API_BASE = HTTP_BACKEND;

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
      const res = await fetch(`${API_BASE}/v1/room`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ 
          name: roomName.trim()
        })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        console.log("Room created successfully:", data);
        if (data.roomId) {
          router.push(`/canvas/${data.roomId}`);
        } else {
          router.push(`/canvas/${data.slug}`);
        }
      } else {
        console.error("Failed to create room:", data);
        
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
      const res = await fetch(`${API_BASE}/v1/room/${roomName.trim()}`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      
      const data = await res.json();
      
      if (res.ok && data.room) {
        console.log("Room found:", data.room);
        if (data.room.id) {
          router.push(`/canvas/${data.room.id}`);
        } else {
          router.push(`/canvas/${data.room.slug}`);
        }
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
    <div className="min-h-screen bg-[#18181b] flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-3">
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 25% 25%, #333333 1px, transparent 1px), radial-gradient(circle at 75% 75%, #333333 1px, transparent 1px)',
          backgroundSize: '60px 60px'
        }}></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-[#C0C0C0] p-3 rounded-full shadow-lg">
              <Palette className="w-8 h-8 text-black" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">Paperless Draw</h1>
          <p className="text-gray-400 font-medium">Enter your collaborative workspace</p>
        </div>

        {/* Main Card */}
        <div className="bg-black backdrop-blur-md border border-gray-800 rounded-3xl p-8 shadow-2xl">
          {/* Room Name Input */}
          <div className="mb-8">
            <label className="block text-sm font-semibold text-gray-300 mb-3">
              Room Name
            </label>
            <div className="relative">
              <input
                type="text"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                placeholder="e.g. design-team, art-project"
                className="w-full p-4 bg-slate border border-gray-700 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white focus:border-white transition-all duration-300 font-medium"
                disabled={isCreating || isJoining}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && roomName.trim()) {
                    createRoom();
                  }
                }}
              />
              <div className="absolute inset-y-0 right-4 flex items-center">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-4">
            {/* Create Room Button */}
            <button 
              onClick={createRoom} 
              disabled={isCreating || isJoining || !roomName.trim()}
              className="w-full bg-white hover:bg-gray-100 text-black p-4 rounded-2xl font-bold transition-all duration-300 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {isCreating ? (
                <>
                  <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
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
              className="w-full bg-gray-800 hover:bg-gray-700 text-white p-4 rounded-2xl font-bold transition-all duration-300 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] border border-gray-700"
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
          <div className="mt-8 text-center">
            <p className="text-gray-400 text-sm font-medium leading-relaxed">
              Create a new collaborative canvas or join an existing one to start creating together
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-gray-600 text-sm font-medium">
            Powered by Prathmesh Kale
          </p>
        </div>
      </div>
    </div>
  );
}