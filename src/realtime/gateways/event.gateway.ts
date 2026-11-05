import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';

import { Logger } from '@nestjs/common';
import { Namespace, Socket } from 'socket.io';

import { RoomAuthorizationService } from '../services/room-authorization.service';

import { DeliveryRoom, REALTIME_ROOMS, RealtimeRoom } from '../rooms/realtime-room.types';

interface JoinRoomPayload {
  room?: string;
}

@WebSocketGateway({
  namespace: '/ws',
  cors: {
    origin: (process.env.REALTIME_CORS_ORIGINS ?? '')
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean),
    credentials: true,
  },
})
export class EventGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  private namespace!: Namespace;

  private readonly logger = new Logger(EventGateway.name);

  constructor(
    private readonly roomAuthorizationService: RoomAuthorizationService,
  ) {}

  afterInit(namespace: Namespace): void {
    this.namespace = namespace;

    namespace.use((client, next) => {
      this.roomAuthorizationService
        .authenticate(client)
        .then(() => next())
        .catch(() => {
          this.logger.warn(`Conexión rechazada: ${client.id}`);

          next(new Error('Unauthorized'));
        });
    });

    this.logger.log('Realtime Gateway inicializado');
  }

  handleConnection(client: Socket): void {
    this.logger.log(`Cliente conectado: ${client.id}`);
  }

  handleDisconnect(client: Socket): void {
    this.logger.log(`Cliente desconectado: ${client.id}`);
  }

  @SubscribeMessage('room:join')
  async handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: JoinRoomPayload,
  ) {
    if (!data || typeof data.room !== 'string') {
      return {
        success: false,
        message: 'Sala inválida',
      };
    }

    const room = data.room;

    const isAllowedRoom = Object.values(REALTIME_ROOMS).includes(
      room as DeliveryRoom,
    );

    if (!isAllowedRoom) {
      return {
        success: false,
        message: 'Sala no permitida',
      };
    }

    const authorized = this.roomAuthorizationService.canJoinRoom(
      client,
      room as RealtimeRoom,
    );

    if (!authorized) {
      return {
        success: false,
        message: 'No tenés autorización para acceder a esta sala',
      };
    }

    await client.join(room);

    this.logger.log(`Cliente ${client.id} ingresó a ${room}`);

    return {
      success: true,
      room,
    };
  }

  @SubscribeMessage('room:leave')
  async handleLeaveRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: JoinRoomPayload,
  ) {
    if (
      !data ||
      typeof data.room !== 'string' ||
      !Object.values(REALTIME_ROOMS).includes(data.room as DeliveryRoom)
    ) {
      return {
        success: false,
        message: 'Sala inválida',
      };
    }

    await client.leave(data.room);

    return {
      success: true,
      room: data.room,
    };
  }

  getNamespace(): Namespace | null {
    return this.namespace ?? null;
  }
}
