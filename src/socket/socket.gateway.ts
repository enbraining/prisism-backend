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
import { RoomType } from 'src/room/entities/roomType.enum';
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
    const room = await this.roomRepository
      .createQueryBuilder('room')
      .where(':clientId = ANY(room.users)', { clientId: client.id })
      .getOne();

    if (room) {
      this.wsServer.emit(`sub-message-${room.id}`, {
        message: '상대방이 방을 나갔습니다.',
        client: 'END',
      });

      await this.roomRepository
        .createQueryBuilder()
        .update()
        .set({
          users: () => 'array_remove(users, :clientId)',
        })
        .where('id = :roomId', { roomId: room.id })
        .setParameter('clientId', client.id)
        .execute();

      if (room.type == RoomType.Random) {
        await this.roomRepository.delete({ id: room.id });
      }
    }

    this.logger.log(`kor disConnected! - ${client.id}`);
  }

  @SubscribeMessage('pub-message')
  async subMessage(
    @MessageBody() data: any,
    @ConnectedSocket() client: Socket,
  ) {
    const message = data.message as string;
    if (message.length > 80) {
      return;
    }

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

    this.wsServer.emit(`sub-message-${currentRoom.id}`, {
      message: '상대방과 매칭되었습니다.',
      client: 'JOIN',
    });
  }

  @SubscribeMessage('random-join')
  async joinRandomRoom(@ConnectedSocket() client: Socket) {
    const randomRoom = await this.roomRepository
      .createQueryBuilder('room')
      .where({ type: RoomType.Random })
      .andWhere('array_length(room.users, 1) = 1')
      .orderBy('room.createdAt', 'DESC')
      .getOne();

    if (!randomRoom) {
      const newRoom = await await this.roomRepository.save({
        type: RoomType.Random,
        users: [client.id],
        maxUser: 2,
      });

      client.emit('get-room', {
        roomId: newRoom.id,
      });
    } else {
      randomRoom['users'] = [...randomRoom.users, client.id];
      const joinedRoom = await this.roomRepository.save(randomRoom);
      client.emit('get-room', {
        roomId: joinedRoom.id,
      });

      if (joinedRoom.users.length >= 2) {
        this.wsServer.emit(`sub-message-${joinedRoom.id}`, {
          message: '상대방과 매칭되었습니다.',
          client: 'JOIN',
        });
      }
    }
  }
}
