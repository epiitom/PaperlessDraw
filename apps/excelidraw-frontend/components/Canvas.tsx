import {useState,useEffect,useRef} from "react"
import {Circle, RectangleHorizontalIcon,Eraser,Scan,Pencil, MousePointer,Minus, Type} from "lucide-react"
import {IconButton} from "./IconsButton"
import { Game } from "@/draw/Game";


export type Tool = "circle"|"rect"|"pencil"| "eraser"|"line"|"multi-select"|"text";

export function Canvas ({
    roomId,
    socket
}: {
    roomId : string;
    socket:WebSocket
}) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [game, setGame] = useState<Game>();
    const [selectedTool, setSelectedTool] = useState<Tool>("circle")

    useEffect(() => {
        if (game) {
            game.setTool(selectedTool);
        }
    }, [selectedTool, game]);

    useEffect(() => {
        if (canvasRef.current) {
            const g = new Game(canvasRef.current, roomId, socket);
            setGame(g);
            
            // Set initial tool after game is created
            g.setTool(selectedTool);

            return () => {
                g.destroy();
            }
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [roomId, socket]);

    return (
        <div style={{
            height:"100vh",
            background: "#18181b",
            overflow: "hidden",
            position: "relative"
        }}>
            <canvas 
                ref={canvasRef} 
                width={window.innerWidth} 
                height={window.innerHeight}
                style={{
                    display: "block",
                    cursor: "crosshair"
                }}
            />
            <Topbar setSelectedTool={setSelectedTool} selectedTool={selectedTool}/>
        </div>
    )
}

function Topbar({selectedTool,setSelectedTool}:{
    selectedTool:Tool,
    setSelectedTool: (s:Tool) => void
}){
    return <div style={{
        background:"#27272a",
        position: "fixed",
        top: "5%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        borderRadius:"15px",
        padding: "8px",
        zIndex: 1000
    }}>
        <div className="flex gap-1">
            <IconButton onClick={() => {
                setSelectedTool("line")
            }} activated={selectedTool === "line"} icon={<Minus/>}/>
            <IconButton onClick={() => {
                setSelectedTool("pencil")
            }} activated={selectedTool === "pencil"} icon={<Pencil/>}/>
            <IconButton onClick={() => {
                setSelectedTool("rect")
            }} activated={selectedTool === "rect"} icon={<RectangleHorizontalIcon/>}/>
            <IconButton onClick={() => {
                setSelectedTool("circle")
            }} activated={selectedTool === "circle"} icon={<Circle/>}/>
            <IconButton onClick={() => {
                setSelectedTool("eraser")
            }} activated={selectedTool === "eraser"} icon={<Eraser/>}/>
            <IconButton onClick={() => setSelectedTool('multi-select')}
                activated={selectedTool === 'multi-select'}
                icon={<Scan/>} />
                 <IconButton onClick={() => {
                setSelectedTool("text")
            }} activated={selectedTool === "text"} icon={<Type/>}/>
        </div>
    </div>
}