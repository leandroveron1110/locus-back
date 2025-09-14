// sockets.gateway.ts
import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway({
  cors: { origin: '*' },
})
export class SocketsGateway {
  @WebSocketServer()
  server: Server;

  emitToBusiness(event: string, data: any) {
    this.server.to('business').emit(event, data);
  }

  emitToDelivery(event: string, data: any) {
    this.server.to('delivery').emit(event, data);
  }

  emitToCustomer(customerId: string, event: string, data: any) {
    this.server.to(`customer:${customerId}`).emit(event, data);
  }
}
