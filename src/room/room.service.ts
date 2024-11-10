import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateRoomDto } from './dto/create-room.dto';
import { Room } from './entities/room.entity';
import { RoomType } from './entities/roomType.enum';

@Injectable()
export class RoomService implements OnModuleInit {
  constructor(
    @InjectRepository(Room)
    private readonly roomRepository: Repository<Room>,
  ) {}

  async onModuleInit() {
    await this.roomRepository
      .createQueryBuilder()
      .update(Room)
      .set({ users: [] })
      .execute();
  }

  async create(createRoomDto: CreateRoomDto) {
    const originTitle = createRoomDto.title;
    const isExistTitle = await this.roomRepository.existsBy({
      slug: originTitle,
    });

    const sameTitleCount = await this.roomRepository.countBy({
      slug: originTitle,
    });
    const countedTitle = isExistTitle
      ? `${originTitle} [${sameTitleCount}]`
      : originTitle;

    const newPartialRoom: Partial<Room> = {
      slug: originTitle,
      title: countedTitle,
      maxUser: createRoomDto.maxUser,
      type: RoomType.Common,
      users: [],
    };
    const newRoom: Room = await this.roomRepository.save(newPartialRoom);
    return newRoom.id;
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
      };
    });
  }
}
