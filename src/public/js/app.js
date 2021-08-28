const socket = io();
const welcome = document.getElementById("welcome");
const room = document.getElementById("room");
room.hidden = true;
let roomName = "";
const roomForm = welcome.querySelector('form');

const addMessage = message => {
    const ul = room.querySelector("ul");
    const li = document.createElement("li");
    li.innerText = message;
    ul.appendChild(li);
}

const handleMessageSubmit = e => {
    e.preventDefault();
    const input = room.querySelector('#message input');
    const value = input.value;
    socket.emit("new_message", value, roomName, () => {
        addMessage(`You: ${value}`);
    });
    input.value = "";
}

const showRoom = () => {
    welcome.hidden = true;
    room.hidden = false;
    const h3 = room.querySelector("h3")
    h3.innerText = `Room ${roomName}`;
    const messageForm = room.querySelector("#message");
    messageForm.addEventListener("submit", handleMessageSubmit);
}

const handleRoomSubmit = e => {
    e.preventDefault();
    const nickName = roomForm.querySelector('#nickname');
    socket.emit('nickname', nickName.value, () => {
        const input = roomForm.querySelector('input');
        socket.emit("enter_room", input.value, showRoom);
        roomName = input.value;
    });
    nickName.value = "";
}
roomForm.addEventListener("submit", handleRoomSubmit);

socket.on("welcome", (user, newCount) => {
    addMessage(`${user} Joined!`);
    const h3 = room.querySelector("h3")
    h3.innerText = `Room ${roomName} (${newCount})`;
});

socket.on("bye", (user, newCount) => {
    addMessage(`${user} Left!!!`);
    const h3 = room.querySelector("h3")
    h3.innerText = `Room ${roomName} (${newCount})`;
});

socket.on('new_message', addMessage);

socket.on("room_change", rooms => {
    const roomList = welcome.querySelector("ul");
    roomList.innerHTML = null;
    rooms.forEach(room => {
        const li = document.createElement("li");
        li.innerText = room;
        roomList.append(li);
    })
});