import {RoomCanvas} from "@/components/RoomCanvas"

// Required by Next.js for dynamic routes in the app directory
export async function generateStaticParams() {
  // No pre-rendered paths; all are generated on demand
  return [];
}

export default async function CanvasPage({ params }: {
    params: Promise<{ roomId: string }>
}) {
    const { roomId } = await params;
    console.log(roomId);
    return <RoomCanvas roomId={roomId} />
}