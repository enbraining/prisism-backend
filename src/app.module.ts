import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { Room } from './room/entities/room.entity';
import { RoomModule } from './room/room.module';
import { SocketModule } from './socket/socket.module';

@Module({
  imports: [
    SocketModule,
    RoomModule,
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      username: 'postgres',
      password: '1234',
      database: 'wstest',
      port: 5432,
      entities: [Room],
      synchronize: false,
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
