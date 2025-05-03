import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Room } from './entities/room.entity';
import { RoomController } from './room.controller';
import { RoomService } from './room.service';
import { History } from './entities/history.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Room, History])],
  controllers: [RoomController],
  providers: [RoomService],
})
export class RoomModule {}
