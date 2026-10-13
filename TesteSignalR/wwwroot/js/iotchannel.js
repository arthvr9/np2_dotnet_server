"use strict";

var connection = new signalR.HubConnectionBuilder().withUrl("/iot").build();

document.getElementById("sendButton").disabled = true;

var cid = "";

connection.on("CID", function(receivedCid) {
    var p = document.createElement("li");
    
    document.getElementById("cid").appendChild(p)

    p.textContent = receivedCid;

    cid = receivedCid;
    console.log(receivedCid);
})

connection.on("ReceiveSignal", function (sender, receiver) {
    var li = document.createElement("li");
    document.getElementById("messagesList").appendChild(li);

    li.textContent = `${sender} pings ${receiver}`;
});

connection.start().then(function () {
    document.getElementById("sendButton").disabled = false;
}).catch(function (err) {
    return console.error(err.toString());
});

document.getElementById("sendButton").addEventListener("click", function (event) {
    var sender = Number(document.getElementById("senderInput").value);
    var receiver = document.getElementById("receiverInput").value;

    if (!Number.isInteger(sender)) {
        console.error("Sender must be a whole number.");
        return;
    }

    connection.invoke("SendSignal", sender, receiver).catch(function (err) {
        return console.error(err.toString());
    });
    event.preventDefault();
});
