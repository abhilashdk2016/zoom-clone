const socket = io();
const myFace = document.getElementById("myFace");
const muteButton = document.getElementById("mute");
const cameraButton = document.getElementById("camera");
const camerasSelect = document.getElementById("cameras");
const welcome = document.getElementById("welcome");
const myStreamDiv = document.getElementById("myStream");
const peerStream = document.getElementById("peerStream");
const roomForm = welcome.querySelector("form");
myStreamDiv.hidden = true;
let myStream;
let myPeerConnection;
let muted = false;
let cameraOff = false;
let roomName = '';

const getCameras = async () => {
    try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const cameras = devices.filter(device => device.kind === "videoinput");
        const currentCamera = myStream.getVideoTracks()[0];
        cameras.forEach(camera => {
            const option = document.createElement("option");
            option.value = camera.deviceId;
            option.innerText = camera.label;
            if(currentCamera.label === camera.label) {
                option.selected = true;
            }
            camerasSelect.appendChild(option);
        });
    } catch (error) {
        
    }
}

const getMedia = async (deviceId) => {
    const initialConstraints = { audio: true, video: { facingMode: 'user' } };
    const cameraConstraints = { audio: true, video: { deviceId: { exact: deviceId} } };

    try {
        myStream = await navigator.mediaDevices.getUserMedia(deviceId ? cameraConstraints : initialConstraints);
        myFace.srcObject = myStream;
        if(!deviceId) {
            await getCameras();
        }
    } catch (error) {
        console.log(error);
    }
}

getMedia();

muteButton.addEventListener("click", e => {
    myStream.getAudioTracks().forEach(track => track.enabled = !track.enabled);
    if(!muted) {
        muteButton.innerText = "UnMute";
        muted = true;
    } else {
        muteButton.innerText = "Mute";
        muted = false;
    }
});

cameraButton.addEventListener("click", e => {
    myStream.getVideoTracks().forEach(track => track.enabled = !track.enabled);
    if(cameraOff) {
        cameraButton.innerText = "Camera Off";
        cameraOff = false;
    } else {
        cameraButton.innerText = "Camera On"
        cameraOff = true;
    }
});

camerasSelect.addEventListener("input", async () => {
    await getMedia(camerasSelect.value);
    if(myPeerConnection) {
        const videoTrack = myStream.getVideoTracks()[0];
        const videoSender = myPeerConnection.getSenders().find(sender => sender.track.kind === "video");
        videoSender.replaceTrack(videoTrack);
    }
});

const handleIce = data => {
    socket.emit("ice", data.candidate, roomName);
}

const handleAddStream = data => {
    console.log(data);
    peerStream.srcObject = data.stream;
}

const makeConnection = _ => {
    myPeerConnection = new RTCPeerConnection({ iceServers: [
        {
            urls: [
                "stun:stun.l.google.com:19302",
                "stun:stun1.l.google.com:19302",
                "stun:stun2.l.google.com:19302",
                "stun:stun3.l.google.com:19302",
                "stun:stun4.l.google.com:19302",
            ]
        }
    ]});
    myPeerConnection.addEventListener("icecandidate", handleIce);
    myPeerConnection.addEventListener("addstream", handleAddStream);
    myStream.getTracks().forEach(track => myPeerConnection.addTrack(track, myStream));
}

roomForm.addEventListener("submit", async e => {
    e.preventDefault();
    const roomInput = welcome.querySelector("input");
    roomName = roomInput.value;
    await getMedia();
    await  makeConnection();
    socket.emit("join_room", roomInput.value, () => {
        const nickName = welcome.querySelector("#nickname");
        socket.emit("nickname", nickName.value, roomName, async () => {
            welcome.hidden = true;
            myStreamDiv.hidden = false;
        });
    });
});

socket.on("welcome", async e => {
    const offer = await myPeerConnection.createOffer();
    myPeerConnection.setLocalDescription(offer);
    socket.emit("offer", offer, roomName);
});

socket.on("offer", async offer => {
    myPeerConnection.setRemoteDescription(offer);
    const answer = await myPeerConnection.createAnswer();
    myPeerConnection.setLocalDescription(answer);
    socket.emit("answer", answer, roomName);
});

socket.on("answer", answer => {
    myPeerConnection.setRemoteDescription(answer);
});

socket.on('ice', ice => {
    myPeerConnection.addIceCandidate(ice);
});



// Chat Room
// const welcome = document.getElementById("welcome");
// const room = document.getElementById("room");
// room.hidden = true;
// let roomName = "";
// const roomForm = welcome.querySelector('form');

// const addMessage = message => {
//     const ul = room.querySelector("ul");
//     const li = document.createElement("li");
//     li.innerText = message;
//     ul.appendChild(li);
// }

// const handleMessageSubmit = e => {
//     e.preventDefault();
//     const input = room.querySelector('#message input');
//     const value = input.value;
//     socket.emit("new_message", value, roomName, () => {
//         addMessage(`You: ${value}`);
//     });
//     input.value = "";
// }

// const showRoom = () => {
//     welcome.hidden = true;
//     room.hidden = false;
//     const h3 = room.querySelector("h3")
//     h3.innerText = `Room ${roomName}`;
//     const messageForm = room.querySelector("#message");
//     messageForm.addEventListener("submit", handleMessageSubmit);
// }

// const handleRoomSubmit = e => {
//     e.preventDefault();
//     const nickName = roomForm.querySelector('#nickname');
//     socket.emit('nickname', nickName.value, () => {
//         const input = roomForm.querySelector('input');
//         socket.emit("enter_room", input.value, showRoom);
//         roomName = input.value;
//     });
//     nickName.value = "";
// }
// roomForm.addEventListener("submit", handleRoomSubmit);

// socket.on("welcome", (user, newCount) => {
//     addMessage(`${user} Joined!`);
//     const h3 = room.querySelector("h3")
//     h3.innerText = `Room ${roomName} (${newCount})`;
// });

// socket.on("bye", (user, newCount) => {
//     addMessage(`${user} Left!!!`);
//     const h3 = room.querySelector("h3")
//     h3.innerText = `Room ${roomName} (${newCount})`;
// });

// socket.on('new_message', addMessage);

// socket.on("room_change", rooms => {
//     const roomList = welcome.querySelector("ul");
//     roomList.innerHTML = null;
//     rooms.forEach(room => {
//         const li = document.createElement("li");
//         li.innerText = room;
//         roomList.append(li);
//     })
// });