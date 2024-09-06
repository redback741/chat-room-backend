import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ChatroomService {

  @Inject(PrismaService)
  private prismaService: PrismaService;

  async createOneToOneChatroom(friendId: number, userId: number) {
    const { id } = await this.prismaService.chatroom.create({
      data: {
        name: '聊天室' + Math.random().toString().slice(2, 8),
        type: false
      },
      select: {
        id: true
      }
    })

    await this.prismaService.userChatroom.create({
      data: {
        userId,
        chatroomId: id,
      }
    })

    await this.prismaService.userChatroom.create({
      data: {
        userId: friendId,
        chatroomId: id,
      }
    })
    return '创建成功'
  }

  
}
