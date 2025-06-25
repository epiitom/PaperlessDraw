"use client"
import {initDraw} from "@/draw"
import {Canvas} from "./Canvas"
import {WS_URL} from "@/config"
import {useState,useEffect , useRef} from "react";
export function RoomCanvas({roomId}: {roomId:string}){
   
    const [socket,setSocket] = useState<WebSocket | null>(null)

    useEffect(() => {
      const ws = new WebSocket(`${WS_URL}?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIyMDA3M2MxNS04NWY5LTQ1YmYtOWZmNS1lNzQ5NTRiMTljOGQiLCJpYXQiOjE3NTA0NDM3Njh9.VFDf6FDcB6WM1nkbfBEo-A_R8AYelPcNVi78B3354qk`)
     ws.onopen = () => {
            setSocket(ws);
            const data = JSON.stringify({
                type: "join_room",
                roomId
            });
            console.log(data);
            ws.send(data)
        }
        
    }, [])

  
    
  if(!socket){
    return 
     <div> connecting to server....</div>
  }
    return <div>
     <Canvas roomId ={roomId} socket={socket}/>

    </div>
}