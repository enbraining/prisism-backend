import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { RoomType } from './roomType.enum';

@Entity()
export class Room {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  slug?: string;

  @Column({ nullable: true })
  title?: string;

  @Column({
    type: 'enum',
    enum: RoomType,
    default: RoomType.Common,
  })
  type: RoomType;

  @Column('text', { array: true })
  users: string[];

  @Column()
  maxUser: number;

  @CreateDateColumn()
  createdAt: Date;
}
