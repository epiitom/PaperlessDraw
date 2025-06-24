"use client"

import { useEffect, useState } from "react";
import { useSocket } from "../hooks/useSocket"

export function ChatRoomClient({
    messages,
    id
}: {
    messages: { message: string }[];
    id: string
}) {
    const { socket, loading } = useSocket();
    const [currentMessage, setCurrentMessage] = useState("");
    const [chats, setChats] = useState(messages || []); // Handle undefined messages

    useEffect(() => {
        if (socket && !loading) {
            socket.send(JSON.stringify({
                type: "join_room",
                roomId: id
            }))

            socket.onmessage = (event) => {
                const parsedData = JSON.parse(event.data);
                console.log("Received WebSocket data:", parsedData); // Debug log
                
                if (parsedData.type === "chat") {
                    // Handle different possible data structures
                    if (parsedData.message) {
                        // Single message object
                        setChats(c => [...c, { message: parsedData.message }]);
                    } else if (parsedData.messages) {
                        // Could be array or single message object
                        if (Array.isArray(parsedData.messages)) {
                            setChats(c => [...c, ...parsedData.messages]);
                        } else if (parsedData.messages.message) {
                            setChats(c => [...c, parsedData.messages]);
                        }
                    }
                }
            }
        }
    }, [socket, loading, id])

    return (
        <div>
            <div>
                {chats
                    .filter(m => m && m.message) // Filter out invalid messages
                    .map((m, index) => (
                        <div key={index}>{m.message}</div>
                    ))
                }
            </div>

            <div style={{ marginTop: '20px' }}>
                <input 
                    type="text" 
                    value={currentMessage} 
                    onChange={e => {
                        setCurrentMessage(e.target.value);
                    }}
                    placeholder="Type your message..."
                />
                
                <button onClick={() => {
                    if (currentMessage.trim()) {
                        socket?.send(JSON.stringify({
                            type: "chat",
                            roomId: id,
                            message: currentMessage
                        }))
                        setCurrentMessage("");
                    }
                }}>
                    Send message
                </button>
            </div>

         
           
        </div>
    )
}