let localStream;
let remoteStream;
let preeConnection;
let APP_ID="55476c7874064d37babe3b233a424b01";
let token=null;
let queryString=window.location.search;
let urlParams=new URLSearchParams(queryString);
let id=urlParams.get("room_id");
if(!id)
{
    window.location="lobby.html";
}


let uid=String(Math.floor(Math.random()*10000));
let client;
let channel;
const servers={
    iceServers:[
        {
            urls:[
                "stun:stun1.1.google.com:19302",
                "stun:stun2.1.google.com:19302"
            ]
        }
    ]
}
let init=async()=>{
    console.log("room id",id);
    client=await AgoraRTM.createInstance(APP_ID)
    await client.login({uid,token})
    channel=client.createChannel(id)
    // channel.on('MemberJoined', function (memberId) {
    //     console.log("hello joined");
    //     document.getElementById("log").appendChild(document.createElement('div')).append(memberId + " joined the channel")
    
    // })
    channel.on('MemberLeft', function (memberId) {
        document.getElementById("user2").style.display="none";
        document.getElementById("user1").classList.remove("smallFrame")
    })
    await channel.join()
    channel.on("MemberJoined",handleMemberJoined);
    client.on("MessageFromPeer",handleMessageFromPeer);
    localStream=await navigator.mediaDevices.getUserMedia({video:true,audio:ture})
    document.getElementById("user1").srcObject=localStream;
    createOffer();
}

let handleMemberJoined=async (MemberId)=>{
    console.log("a new user join haaaaaaaaa ",MemberId);
    console.log("idddd",MemberId);
    createOffer(MemberId);
}
let handleMessageFromPeer=async (message,MemberId)=>{
    let text=JSON.parse(message.text)
    console.log("message",text )
    if(text.type==="offer")
    {
        createAnswer(MemberId,text.offer);
    }
    if(text.type==="answer")
    {
        console.log("form if answer");
        addAnswer(text.answer);
    }
    if(text.type==="candidate")
    {
        if(preeConnection)
        {
            preeConnection.addIceCandidate(text.candidate);
        }
    }
}
let createConnection=async (MemberId)=>{
    preeConnection=new RTCPeerConnection(servers);
    remoteStream=new MediaStream();
    document.getElementById("user2").srcObject=remoteStream;
    document.getElementById("user2").style.display="block";
    document.getElementById("user1").classList.add("smallFrame")
    if(!localStream)
    {
        localStream=await navigator.mediaDevices.getUserMedia({video:true,audio:true})
        document.getElementById("user1").srcObject=localStream;
    }
    localStream.getTracks().forEach(track => {
        preeConnection.addTrack(track,localStream);
    });
    preeConnection.ontrack=async(event)=>{
        event.streams[0].getTracks().forEach(track=>{
            remoteStream.addTrack(track);
        })
    }
    preeConnection.onicecandidate=async(event)=>{
        if(event.candidate)
        {
            client.sendMessageToPeer({text:JSON.stringify({"type":"candidate","candidate":event.candidate})},MemberId);
        }

    }
}

let createOffer=async(MemberId)=>{
    await createConnection(MemberId);
    let offer=await preeConnection.createOffer();
    await preeConnection.setLocalDescription(offer);
    client.sendMessageToPeer({text:JSON.stringify({"type":"offer","offer":offer})},MemberId);
}

let createAnswer=async (MemberId,offer)=>{
    await createConnection(MemberId); 
    await preeConnection.setRemoteDescription(offer);
    let answer=await preeConnection.createAnswer();
    await preeConnection.setLocalDescription(answer);
    client.sendMessageToPeer({text:JSON.stringify({"type":"answer","answer":answer})},MemberId);


}

let addAnswer=async (answer)=>{
    if(!preeConnection.currentRemoteDescription)
    {
        console.log("form if pree connection answer");

        preeConnection.setRemoteDescription(answer)
    }
}
let leaveChannel=async()=>{
    await channel.leave();
    await client.logout();
}
let toggelCamera=async()=>{
    let videoTrack=localStream.getTracks().find(track=>track.kind==="video");
    if(videoTrack.enabled)
    {
        videoTrack.enabled=false;
        document.getElementById("camera-btn").style.backgroundColor="rgb(255,80,80)"
    }else{
        videoTrack.enabled=true;
        document.getElementById("camera-btn").style.backgroundColor="rgb(179,102,249,.9)"
    }
}

let toggelMic=async()=>{
    let audioTrack=localStream.getTracks().find(track=>track.kind==="audio");
    if(audioTrack.enabled)
    {
        audioTrack.enabled=false;
        document.getElementById("mic-btn").style.backgroundColor="rgb(255,80,80)"
    }else{
        audioTrack.enabled=true;
        document.getElementById("mic-btn").style.backgroundColor="rgb(179,102,249,.9)"
    }
}
window.addEventListener("beforeunload",leaveChannel);
document.getElementById("camera-btn").addEventListener("click",toggelCamera);
document.getElementById("mic-btn").addEventListener("click",toggelMic);
init();