import { BadRequestException, Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateRoomDto } from './dto/create-room.dto';
import { Room } from './entities/room.entity';
import { RoomType } from './entities/roomType.enum';
import { History } from './entities/history.entity';

@Injectable()
export class RoomService implements OnModuleInit {
  constructor(
    @InjectRepository(Room)
    private readonly roomRepository: Repository<Room>,
    @InjectRepository(History)
    private readonly historyRepository: Repository<History>,
  ) {}

  async onModuleInit() {
    await this.roomRepository
      .createQueryBuilder()
      .update(Room)
      .set({ users: [] })
      .execute();
  }

  async create(createRoomDto: CreateRoomDto, ip: string) {
    if (await this.roomRepository.existsBy({ title: createRoomDto.title })) {
      throw new BadRequestException('해당 이름은 이미 사용중입니다.');
    }

    const newPartialRoom: Partial<Room> = {
      title: createRoomDto.title,
      maxUser: createRoomDto.maxUser,
      type: RoomType.Common,
      ip: ip,
      users: [],
    };

    await this.roomRepository.save(newPartialRoom);
  }

  async findAll() {
    const rooms = await this.roomRepository
      .createQueryBuilder('room')
      .orderBy('array_length(room.users, 1)', 'ASC')
      .where({ type: RoomType.Common })
      .getMany();
    return rooms.map((room) => {
      return {
        id: room.id,
        title: room.title,
        userCount: room.users.length,
        maxUser: room.maxUser,
        ip: room.ip.split('.').slice(0, 2).join('.') + '.xxx.xxx',
      };
    });
  }

  async getSocketCount() {
    const rooms = await this.roomRepository
      .createQueryBuilder('room')
      .getMany();

    const count = rooms.reduce((acc, room) => acc + room.users.length, 0);

    return {
      count: count,
    };
  }

  async getRoomHistory(roomId: string) {
    const room = await this.roomRepository.findOneBy({
      id: roomId,
    });

    const histories = await this.historyRepository.find({
      where: { room: room },
      order: { createdAt: 'ASC' },
    });

    return histories.map((history) => {
      return {
        id: history.id,
        clientId: history.clientId,
        content: history.content,
      };
    });
  }
}
