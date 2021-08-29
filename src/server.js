import express from 'express';
//import WebSocket from 'ws';
import http from 'http';
import SocketIo, { Server } from 'socket.io';
import { instrument } from '@socket.io/admin-ui';

const app = express();

app.set('view engine', 'pug');
app.set("views", __dirname + "/views");
app.use("/public", express.static(__dirname + "/public"));

app.get("/", (req, res) => res.render("home"))
app.get('/*', (req, res) => res.redirect("/"));
const handleListen = () => console.log(`Listening on http://localhost:8000`);
const httpServer = http.createServer(app);
// const wsServer = new Server(httpServer, {
//     cors: {
//         origin: ["https://admin.socket.io"],
//         credentials: true
//     }
// });
// instrument(wsServer, { auth: false });
const wsServer = SocketIo(httpServer);

// WebRTC
wsServer.on('connection', socket => {
    socket["nickname"] = "Anonymous";
    socket.on("join_room", (roomName, done) => {
        socket.join(roomName);
        done();
    });
    socket.on("nickname", (nickname, roomName, done) => { 
        socket["nickname"] = nickname;
        done();
        socket.to(roomName).emit("welcome");
    });
    socket.on("offer", (offer, roomName) => socket.to(roomName).emit("offer", offer));
    socket.on("answer", (answer, roomName) => {
        socket.to(roomName).emit("answer", answer);
    });
    socket.on("ice", (ice, roomName) => {
        socket.to(roomName).emit("ice", ice);
    });
});

// Chat Rooms Code
// const publicRooms = () => {
//     const {
//         sockets : {
//             adapter : { sids, rooms}
//         }
//     } = wsServer;
//     const publicRooms = [];
//     rooms.forEach((_, key) => {
//         if(sids.get(key) === undefined) {
//             publicRooms.push(key);
//         } 
//     });
//     return publicRooms;
// }

// const countRoom = roomName => wsServer.sockets.adapter.rooms.get(roomName)?.size;

// wsServer.on('connection', socket => {
//     socket["nickname"] = "Anonymous";
//     socket.on("enter_room", (roomName, done) => {
//         socket.join(roomName);
//         done();
//         socket.to(roomName).emit("welcome", socket.nickname, countRoom(roomName));
//         wsServer.sockets.emit("room_change", publicRooms());
//     });
//     socket.on('disconnecting', () => {
//         socket.rooms.forEach(room => socket.to(room).emit("bye", socket.nickname, countRoom(room) - 1));
//     });
//     socket.on('disconnect', () => wsServer.sockets.emit("room_change", publicRooms()));
//     socket.on('new_message', (msg, roomName, done) => {
//         socket.to(roomName).emit("new_message", `${socket.nickname}: ${msg}`);
//         done();
//     });
//     socket.on("nickname", (nickname, done) => { 
//         socket["nickname"] = nickname;
//         done();
//     });
// });

// const wss = new WebSocket.Server({ server });
// const sockets = [];

// wss.on('connection', socket => {
//     sockets.push(socket);
//     socket["nickname"] = "Anonymous";
//     socket.on("close", () => console.log("Disconnected from Client"));
//     socket.on("message", (data, isBinary) => {
//         const message = isBinary ? data : JSON.parse(data);
//         switch(message.type) {
//             case "message":
//                 sockets.forEach(aSocket => aSocket.send(`${socket.nickname}: ${message.payload}`));
//                 break;
//             case 'nickname':
//                 socket["nickname"] = message.payload;
//                 break;
//         }
//     });
// });
httpServer.listen(8000, handleListen);