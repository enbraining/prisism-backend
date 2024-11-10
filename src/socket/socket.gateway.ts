import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
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
import { Server, Socket } from 'socket.io';
import { Room } from 'src/room/entities/room.entity';
import { Repository } from 'typeorm';

@WebSocketGateway(3030, {
  transports: ['websocket'],
  namespace: 'chat',
})
export class SocketGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  constructor(
    private readonly logger: Logger,
    @InjectRepository(Room)
    private readonly roomRepository: Repository<Room>,
  ) {}
  @WebSocketServer()
  wsServer: Server;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  afterInit(server: any) {
    this.logger.log('kor ws gateway started!');
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async handleConnection(client: Socket, ...args: any[]) {
    this.logger.log(`kor connected! - ${client.id}`);
  }

  async handleDisconnect(client: Socket) {
    const clientId = client.id;
    const room = await this.roomRepository
      .createQueryBuilder('room')
      .where(':clientId = ANY(room.users)', { clientId })
      .getOne();

    if (room) {
      room.users = room.users.filter((user) => user != client.id);
      this.roomRepository.save(room);
    }

    this.logger.log(`kor disConnected! - ${client.id}`);
  }

  @SubscribeMessage('pub-message')
  async subMessage(
    @MessageBody() data: any,
    @ConnectedSocket() client: Socket,
  ) {
    const clientId = client.id;
    const room = await this.roomRepository
      .createQueryBuilder('room')
      .where(':clientId = ANY(room.users)', { clientId })
      .getOne();

    this.wsServer.emit(`sub-message-${room.id}`, {
      message: data.message,
      client: client.id,
    });
  }

  @SubscribeMessage('join')
  async joinRoom(@MessageBody() data: any, @ConnectedSocket() client: Socket) {
    const roomId = data.roomId;
    const currentRoom = await this.roomRepository.findOneBy({
      id: roomId,
    });

    if (currentRoom.users.length >= currentRoom.maxUser) {
      client.emit('error', {
        message: 'already-full',
      });
      return;
    }

    const prevUsers = currentRoom ? currentRoom.users : [];
    currentRoom.users = [...prevUsers, client.id];
    this.roomRepository.save(currentRoom);
  }
}
