import WebSocket, { WebSocketServer } from 'ws';

const PORT = 3002;
const wss = new WebSocketServer({ port: PORT });

console.log(`WebSocket server запущен на ws://localhost:${PORT}`);


wss.on('connection', (ws) => {
  console.log('Клиент подключился');

  ws.on('message', (message) => {
    const data = JSON.parse(message.toString());
    console.log('Получено сообщение от клиента:', data);


    if (data.type === 'message' && data.payload) {
      const reply = {
        ...data.payload
      };

      wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({
            type: 'message',
            payload: reply
          }));
        }
      });
    }
  });

  ws.on('close', () => {
    console.log('Клиент отключился');
  });
});


function sendRandomMessage() {
  const chatId = Math.floor(Math.random() * 6) + 1;
  const message = {
    text: `Авто сообщение ${new Date().toLocaleTimeString()}`,
    created_at: new Date().toISOString(),
    chatId,
    User: {
      id: 1,
      full_name: `Павловский Роман`,
      avatar: '/public/testData/Avatar.jpg'
    }
  };

  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({
        type: 'message',
        payload: message
      }));
    }
  });
}

setInterval(sendRandomMessage, 5000);
