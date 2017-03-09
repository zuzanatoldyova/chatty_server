// server.js

const express = require('express');
const WebSocket = require('ws');
const SocketServer = require('ws').Server;
const uuid = require('node-uuid');
const PORT = 3001;

const server = express()

  .use(express.static('public'))
  .listen(PORT, '0.0.0.0', 'localhost', () => console.log(`Listening on ${ PORT }`));


const wss = new SocketServer({ server });

function extractUrl(message) {
  const url = new RegExp(/((([A-Za-z]{3,9}:(?:\/\/)?)(?:[-;:&=\+\$,\w]+@)?[A-Za-z0-9.-]+|(?:www.|[-;:&=\+\$,\w]+@)[A-Za-z0-9.-]+)((?:\/[\+~%\/.\w-_]*)?\??(?:[-\+=&;%@.\w_]*)#?(?:[\w]*))?)\.(png|jpg|gif)/);
  if (message.content.match(url)) {
    message.url = message.content.match(url)[0];
    message.content = message.content.replace(url, '');
  }
  return;
}

function broadCast(message) {
  wss.clients.forEach(function each(client) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  });
}


wss.on('connection', (ws) => {

  console.log('Client connected');
  broadCast({connections: wss.clients.size});
  ws.on('message', function incoming(message) {
    const data = JSON.parse(message);
    const output = {
      content: data.content,
      id: uuid.v1()
    };

    if (data.type === "postMessage") {
      output.type = "incomingMessage";
      output.color = data.color;
      output.username = data.username;
      extractUrl(output);
    }
    if (data.type === "postNotification") {
      output.type = "incomingNotification";
    }
    broadCast({message: output});
  });


  ws.on('close', () => {
    console.log('Client disconnected');
    broadCast({connections: wss.clients.size});
  });
});