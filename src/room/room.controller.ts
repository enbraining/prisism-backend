import { Body, Controller, Get, Post } from '@nestjs/common';
import { CreateRoomDto } from './dto/create-room.dto';
import { RoomService } from './room.service';
import { RealIP } from 'nestjs-real-ip';

@Controller('/room')
export class RoomController {
  constructor(private readonly roomService: RoomService) {}

  @Post()
  create(@Body() createRoomDto: CreateRoomDto, @RealIP() ip: string) {
    return this.roomService.create(createRoomDto, ip);
  }

  @Get()
  findAll() {
    return this.roomService.findAll();
  }

  @Get('/count')
  getSocketCount() {
    return this.roomService.getSocketCount();
  }
}
