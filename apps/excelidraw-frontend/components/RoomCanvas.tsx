/* eslint-disable react-hooks/exhaustive-deps */
"use client"

import {Canvas} from "./Canvas"
import { WS_URL } from "@/config";
import {useState,useEffect} from "react";
import { useAuth } from "@/context/AuthContext"; // or get from localStorage

export function RoomCanvas({roomId}: {roomId:string}){
    const { token } = useAuth(); // or: const token = localStorage.getItem('token');
    const [socket,setSocket] = useState<WebSocket | null>(null)

    useEffect(() => {
      if (!token) return;
      const ws = new WebSocket(`${WS_URL}?token=${token}`);
      ws.onopen = () => {
            setSocket(ws);
            const data = JSON.stringify({
                type: "join_room",
                roomId
            });
            ws.send(data)
        }
    }, [roomId, token]);

    if(!socket){
      return <div> connecting to server....</div>
    }
    return <div>
      <Canvas roomId={roomId} socket={socket}/>
    </div>
}