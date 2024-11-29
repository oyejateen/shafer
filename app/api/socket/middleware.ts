import { Socket } from 'socket.io';

export const socketMiddleware = (socket: Socket, next: (err?: Error) => void) => {
  const clientIp = socket.handshake.address;
  console.log(`New connection from ${clientIp}`);

  // Add rate limiting
  const messageCount = new Map<string, number>();
  
  socket.use(([event, ...args], next) => {
    const count = messageCount.get(clientIp) || 0;
    if (count > 100) { // 100 messages per connection
      return next(new Error('Rate limit exceeded'));
    }
    messageCount.set(clientIp, count + 1);
    next();
  });

  socket.on('disconnect', () => {
    messageCount.delete(clientIp);
    console.log(`Client disconnected: ${clientIp}`);
  });

  next();
};