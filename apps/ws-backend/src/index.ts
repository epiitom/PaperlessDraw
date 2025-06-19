import {WebSocketServer} from "ws"

const  wss = new WebSocketServer({port:8080});

wss.on('connection', function connection(ws) { // client will come t o this point .
    ws.on('message', function message(data){ // here it sends the message to server
        ws.send('pong'); // here server sends the message to cliennt
    });
});