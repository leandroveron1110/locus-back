import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Socket } from 'socket.io';

import {
  REALTIME_PERMISSIONS,
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
    console.log(
      'authenticate',
      token,
      client.handshake.auth,
      client.handshake.headers,
    );
    if (!token) {
      throw new Error('Token no proporcionado');
    }

    const payload =
      await this.jwtService.verifyAsync<RealtimeJwtPayload>(token);

    if (typeof payload.sub !== 'string' || payload.sub.length === 0) {
      throw new Error('Identidad inválida');
    }

    // const permissions = Array.isArray(payload.permissions)
    //   ? payload.permissions.filter(
    //       (permission): permission is string => typeof permission === 'string',
    //     )
    //   : [];

    const identity: RealtimeIdentity = {
      userId: payload.sub,
    //   permissions,
    };

    client.data.realtimeIdentity = identity;

    return identity;
  }

  canJoinRoom(client: Socket, room: RealtimeRoom): boolean {
    console.log('canJoinRoom', room, client.data.realtimeIdentity);
    const identity = client.data.realtimeIdentity as
      | RealtimeIdentity
      | undefined;

    if (!identity) {
      return false;
    }

    switch (room) {
      case REALTIME_ROOMS.DELIVERY_OPERATIONS:
        return true; // Reemplazar por validación de pertenencia.
      default:
        return false;
    }

    // en la v2 agregaremos un sistema de permisos más robusto, 
    // por ahora solo permitimos el acceso a la sala de operaciones 
    // de delivery para todos los usuarios autenticados
    // switch (room) {
    //   case REALTIME_ROOMS.DELIVERY_OPERATIONS:
    //     return identity.permissions.includes(
    //       REALTIME_PERMISSIONS.DELIVERY_OPERATIONS_READ,
    //     );

    //   default:
    //     return false;
    // }
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
