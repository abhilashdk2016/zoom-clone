const messageList = document.querySelector("ul");
const messageForm = document.querySelector("#message");
const nickNameForm = document.querySelector("#nickname");
const socket = new WebSocket(`ws://${window.location.host}`);
socket.addEventListener("open", _ => {
    console.log("Connected to Server");
});
socket.addEventListener("message", message => {
    const li = document.createElement("li");
    li.innerText = message.data;
    messageList.append(li);
});
socket.addEventListener("close", () => {
    console.log('DisConnected from Server');
});

const handleSubmit = e => {
    e.preventDefault();
    const input = messageForm.querySelector('input');
    socket.send(JSON.stringify({ type: "message", payload: input.value }));
    const li = document.createElement("li");
    li.innerText = `You: ${input.value}`;
    messageList.append(li);
    input.value = "";
}

const handleNickName = e => {
    e.preventDefault();
    const input = nickNameForm.querySelector('input');
    socket.send(JSON.stringify({ type: "nickname", payload: input.value}));
    input.value = "";
}

messageForm.addEventListener('submit', handleSubmit);
nickNameForm.addEventListener('submit', handleNickName);