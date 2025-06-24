import {useEffect, useState} from "react";
import {WS_URL} from "../app/config";

export function useSocket(){
    const[loading,setLoading] = useState(true);
    const[socket,setSocket] = useState<WebSocket>();

    useEffect(() => {
        const ws = new WebSocket(`${WS_URL}?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIyMDA3M2MxNS04NWY5LTQ1YmYtOWZmNS1lNzQ5NTRiMTljOGQiLCJpYXQiOjE3NTA0NDM3Njh9.VFDf6FDcB6WM1nkbfBEo-A_R8AYelPcNVi78B3354qk`);
        ws.onopen =() => {
            setLoading(false);
            setSocket(ws);
        }
    },[]);

    return {
        socket,
        loading
    }
}
 