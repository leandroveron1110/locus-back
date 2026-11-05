import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Socket } from 'socket.io';

import {
  REALTIME_ROOMS,
  RealtimeIdentity,
  RealtimeRoom,
} from '../rooms/realtime-room.types';

interface RealtimeJwtPayload {
  sub?: string;
  permissions?: string[];
}

@Injectable()
export class RoomAuthorizationService {
  constructor(private readonly jwtService: JwtService) {}

  async authenticate(client: Socket): Promise<RealtimeIdentity> {
    const token = this.extractToken(client);
    
    if (!token) {
      throw new Error('Token no proporcionado');
    }

    const payload =
      await this.jwtService.verifyAsync<RealtimeJwtPayload>(token);

    if (typeof payload.sub !== 'string' || payload.sub.length === 0) {
      throw new Error('Identidad inválida');
    }

    const identity: RealtimeIdentity = {
      userId: payload.sub,
    };

    client.data.realtimeIdentity = identity;

    return identity;
  }

  canJoinRoom(client: Socket, room: RealtimeRoom): boolean {
    const identity = client.data.realtimeIdentity as
      | RealtimeIdentity
      | undefined;

    if (!identity) {
      return false;
    }

    // 1. Validar acceso a la sala de Delivery
    if (room === REALTIME_ROOMS.DELIVERY_OPERATIONS) {
      return true; 
    }

    // 2. Validar acceso a salas dinámicas de Negocios (ej: business:uuid:operations)
    if (room.startsWith('business:')) {
      // V1: Permitimos el acceso si está autenticado. 
      // (En la V2 aquí puedes extraer el ID con room.split(':')[1] y validar en DB si el usuario es dueño)
      return true;
    }

    return false;
  }

  private extractToken(client: Socket): string | null {
    const authToken = client.handshake.auth?.token;

    if (typeof authToken === 'string' && authToken.length > 0) {
      return authToken;
    }

    const authorization = client.handshake.headers.authorization;

    if (typeof authorization === 'string') {
      const [scheme, token] = authorization.split(' ');

      if (scheme?.toLowerCase() === 'bearer' && token) {
        return token;
      }
    }

    return null;
  }
}