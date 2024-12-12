import { BadRequestException, Inject, Injectable } from '@nestjs/common';
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
  // 生成多人聊天室 
  async createGroupChatroom(name: string, userId: number) {
    const { id } = await this.prismaService.chatroom.create({
      data: {
        name,
        type: true
      }
    })

    await this.prismaService.userChatroom.create({
      data: {
        userId,
        chatroomId: id,
      }
    })
    return '创建成功'
  }

  /**
   * 查看全部群聊
   */
  async list(userId: number) {
    const chatRoomIds = await this.prismaService.userChatroom.findMany({
      where: {
        userId
      },
      select: {
        chatroomId: true
      }
    })

    const chatrooms = await this.prismaService.chatroom.findMany({
      where: {
        id: {
          in: chatRoomIds.map(item => item.chatroomId)
        }
      },
      select: {
        id: true,
        name: true,
        type: true,
        createdAt: true
      }
    })

    const res = []
    for (let i = 0; i < chatrooms.length; i++) {
      const userIds = await this.prismaService.userChatroom.findMany({
        where: {
          chatroomId: chatrooms[i].id
        },
        select: {
          userId: true
        }
      })

      const users = await this.prismaService.user.findMany({
        where: {
          id: {
            in: userIds.map(item => item.userId)
          }
        },
        select: {
          id: true,
          username: true,
          nickName: true,
          headPic: true,
          createdAt: true,
          email: true
        }
      })
      
      res.push({
        ...chatrooms[i],
        userCount: userIds.length,
        users
      })
    }

    return res
  }

  /**
   * 查看聊天室用户
   */
  async members(chatroomId: number) {
    const userIds = await this.prismaService.userChatroom.findMany({
      where: {
        chatroomId
      },
      select: {
        userId: true
      }
    })

    const users = await this.prismaService.user.findMany({
      where: {
        id: {
          in: userIds.map(item => item.userId)
        }
      },
      select: {
        id: true,
        username: true,
        nickName: true,
        headPic: true,
        createdAt: true,
        email: true
      }
    })
    return users
  }

  /**
   * 查看聊天室详情
   */
  async info(id: number) {
    const chatroom = await this.prismaService.chatroom.findUnique({
      where: {
        id
      },
    })

    return {...chatroom, user: await this.members(id)}
  }

  /**
   * 加入群聊
   */
  async join(id: number, joinUserId: number) {
    const chatroom = await this.prismaService.chatroom.findUnique({
      where: {
        id
      },
    })

    if (!chatroom) {
      throw new Error('聊天室不存在')
    }

    if (chatroom.type === false) {
      throw new BadRequestException('该聊天室为单聊')
    }
    await this.prismaService.userChatroom.create({
      data: {
        userId: joinUserId,
        chatroomId: id,
      }
    })
    return '加入成功'
  }

  /**
   * 退出群聊
   */
  async quit(id: number, quitUserId: number) {
    const chatroom = await this.prismaService.chatroom.findUnique({
      where: {
        id
      },
    })
    if(chatroom.type === false) {
      throw new BadRequestException('该聊天室为单聊,不能退出')
    }

    await this.prismaService.userChatroom.delete({
      where: {
        userId_chatroomId: {
          userId: quitUserId,
          chatroomId: id
        }
      }
    })
    return '退出成功'

  }
  
}
