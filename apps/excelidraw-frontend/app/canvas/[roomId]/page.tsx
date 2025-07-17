import {RoomCanvas} from "@/components/RoomCanvas"

export default async function CanvasPage({ params }: {
    params: Promise<{ roomId: string }>
}) {
    const { roomId } = await params;
    console.log(roomId);
    return <RoomCanvas roomId={roomId} />
}