import { Logger, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Room } from 'src/room/entities/room.entity';
import { SocketGateway } from './socket.gateway';
import { SocketService } from './socket.service';

@Module({
  imports: [TypeOrmModule.forFeature([Room])],
  providers: [SocketGateway, SocketService, Logger],
})
export class SocketModule {}
