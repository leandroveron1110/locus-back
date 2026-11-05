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
import { BUSINESS_REALTIME_ROOMS, BusinessRoom } from '../rooms/realtime-room.types';

interface JoinBusinessRoomPayload {
  businessId?: string;
}

@WebSocketGateway({
  namespace: '/ws/business',
  cors: {
    origin: (process.env.REALTIME_CORS_ORIGINS ?? '')
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean),
    credentials: true,
  },
})
export class BusinessGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  private namespace!: Namespace;

  private readonly logger = new Logger(BusinessGateway.name);

  constructor(
    private readonly businessAuthService: RoomAuthorizationService,
  ) {}

  afterInit(namespace: Namespace): void {
    this.namespace = namespace;
    console.log("ws:namespace", this.namespace);

    // Middleware de autenticación exclusivo para negocios
    namespace.use((client, next) => {
      this.businessAuthService
        .authenticate(client)
        .then(() => next())
        .catch(() => {
          this.logger.warn(`Conexión de negocio rechazada: ${client.id}`);
          next(new Error('Unauthorized Business'));
        });
    });

    this.logger.log('Business Realtime Gateway inicializado en /ws/business');
  }

  handleConnection(client: Socket): void {
    this.logger.log(`Negocio conectado: ${client.id}`);
  }

  handleDisconnect(client: Socket): void {
    this.logger.log(`Negocio desconectado: ${client.id}`);
  }

  @SubscribeMessage('room:join')
  async handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: JoinBusinessRoomPayload,
  ) {
    if (!data || typeof data.businessId !== 'string') {
      return {
        success: false,
        message: 'ID de negocio inválido',
      };
    }

    const businessId = data.businessId;
    const room = BUSINESS_REALTIME_ROOMS.operations(businessId) as BusinessRoom;

    const authorized = this.businessAuthService.canJoinRoom(
      client,
      room as BusinessRoom,
    );

    if (!authorized) {
      return {
        success: false,
        message: 'No tenés autorización para acceder a este negocio',
      };
    }

    await client.join(room);

    this.logger.log(`Negocio (Socket: ${client.id}) ingresó a la sala ${room}`);

    return {
      success: true,
      room,
    };
  }

  getNamespace(): Namespace | null {
    return this.namespace ?? null;
  }
}