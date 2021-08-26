import express from 'express';
import WebSocket from 'ws';
import http from 'http';

const app = express();

app.set('view engine', 'pug');
app.set("views", __dirname + "/views");
app.use("/public", express.static(__dirname + "/public"));

app.get("/", (req, res) => res.render("home"))
app.get('/*', (req, res) => res.redirect("/"));
const handleListen = () => console.log(`Listening on http://localhost:8000`);
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const sockets = [];

wss.on('connection', socket => {
    sockets.push(socket);
    socket["nickname"] = "Anonymous";
    socket.on("close", () => console.log("Disconnected from Client"));
    socket.on("message", (data, isBinary) => {
        const message = isBinary ? data : JSON.parse(data);
        switch(message.type) {
            case "message":
                sockets.forEach(aSocket => aSocket.send(`${socket.nickname}: ${message.payload}`));
                break;
            case 'nickname':
                socket["nickname"] = message.payload;
                break;
        }
    });
});
server.listen(8000, handleListen);