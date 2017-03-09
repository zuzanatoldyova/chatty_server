// server.js

const express = require('express');
const WebSocket = require('ws');
const SocketServer = require('ws').Server;
const uuid = require('node-uuid');
// Set the port to 3001
const PORT = 3001;

// Create a new express server
const server = express()
   // Make the express server serve static assets (html, javascript, css) from the /public folder
  .use(express.static('public'))
  .listen(PORT, '0.0.0.0', 'localhost', () => console.log(`Listening on ${ PORT }`));

// Create the WebSockets server
const wss = new SocketServer({ server });

function extractUrl(message) {
  const url = new RegExp(/((([A-Za-z]{3,9}:(?:\/\/)?)(?:[-;:&=\+\$,\w]+@)?[A-Za-z0-9.-]+|(?:www.|[-;:&=\+\$,\w]+@)[A-Za-z0-9.-]+)((?:\/[\+~%\/.\w-_]*)?\??(?:[-\+=&;%@.\w_]*)#?(?:[\w]*))?)\.(png|jpg|gif)/);
  if (message.content.match(url)) {
    message.url = message.content.match(url)[0];
    message.content = message.content.replace(url, '');
  }
  return;
}


// Set up a callback that will run when a client connects to the server
// When a client connects they are assigned a socket, represented by
// the ws parameter in the callback.
wss.on('connection', (ws) => {

  console.log('Client connected');
  console.log(wss.clients.size);
  wss.clients.forEach(function each(client) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({connections: wss.clients.size}));
    }
  });

  ws.on('message', function incoming(message) {

    const data = JSON.parse(message);
    const output = {
      color: data.color,
      content: data.content,
      username: data.username
    };
    extractUrl(output);
    if (data.type === "postMessage") {
      output.type = "incomingMessage";
    }
    if (data.type === "postNotification") {
      output.type = "incomingNotification";
    }

    output.id = uuid.v1();
    console.log(output);
    wss.clients.forEach(function each(client) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(output));
      }
    });
  });

  // Set up a callback for when a client closes the socket. This usually means they closed their browser.
  ws.on('close', () => {
    console.log('Client disconnected');

    wss.clients.forEach(function each(client) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({connections: wss.clients.size}));
      }
    });
  });
});