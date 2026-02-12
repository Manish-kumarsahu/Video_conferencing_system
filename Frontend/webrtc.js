const localVideo = document.getElementById("localVideo");

let localStream;

navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true
})
.then(stream => {
    localStream = stream;
    localVideo.srcObject = stream;
})
.catch(err => console.error(err));

function toggleMute() {
    localStream.getAudioTracks()[0].enabled =
        !localStream.getAudioTracks()[0].enabled;
}

function endMeeting() {
    if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
    }
    window.location.href = "index.html";
}

async function shareScreen() {
    try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
            video: true
        });
        localVideo.srcObject = screenStream;
    } catch (err) {
        console.error(err);
    }
}