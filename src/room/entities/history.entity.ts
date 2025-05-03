import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Room } from './room.entity';

@Entity()
export class History {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  content: string;

  @Column()
  clientId: string;

  @ManyToOne(() => Room)
  room: Room;

  @CreateDateColumn()
  createdAt: Date;
}
