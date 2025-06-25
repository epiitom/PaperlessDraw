
import {initDraw} from "@/draw"
import {useState,useEffect,useRef} from "react"
import {Circle, Pencil, RectangleHorizontalIcon} from "lucide-react"
import {IconButton} from "./IconsButton"
import { Game } from "@/draw/Game";
 export type Tool = "circle"|"rect"|"pencil";
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
        game?.setTool(selectedTool);
    }, [selectedTool, game]);

    useEffect(() => {

        if (canvasRef.current) {
            const g = new Game(canvasRef.current, roomId, socket);
            setGame(g);

            return () => {
                g.destroy();
            }
        }


    }, [canvasRef]);

    return (
        <div style ={{
            height:"100vh",
            background: "red",
            overflow: "hidden"
        }}>
            <canvas ref= {canvasRef} width={window.innerWidth} height={window.innerHeight}> </canvas>
            <Topbar setSelectedTool ={setSelectedTool}  selectedTool ={selectedTool}/>
        
        </div>
    )
}
 function Topbar({selectedTool,setSelectedTool}:{
    selectedTool:Shape,
    setSelectedTool: (s:Shape) => void
 }){
    return <div style ={{
        position:"fixed",
        top : 10,
        left:10
    }}>
        <div className="flex gap-t">
            <IconButton onClick ={() => {
                setSelectedTool("pencil")
            }} activated={selectedTool === "pencil"} icon ={< Pencil/>}/>
                <IconButton onClick ={() => {
                setSelectedTool("rect")
            }} activated={selectedTool === "rect"} icon ={< RectangleHorizontalIcon/>}/>
                <IconButton onClick ={() => {
                setSelectedTool("circle")
            }} activated={selectedTool === "circle"} icon ={< Circle/>}/>

        </div>

    </div>
 }
