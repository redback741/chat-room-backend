import { BadRequestException, Controller, Get, Param, Query } from '@nestjs/common';
import { ChatroomService } from './chatroom.service';
import { RequireLogin, UserInfo } from 'src/custom.decorator';

@Controller('chatroom')
@RequireLogin()
export class ChatroomController {
  constructor(private readonly chatroomService: ChatroomService) {}

  @Get('create-one-to-one')
  async OneToOne(@Query('firendId') firendId: number, @UserInfo('userId') userId: number ) {
    if (!firendId) {
      throw new BadRequestException('好友 ID 不能为空');
    }
    return await this.chatroomService.createOneToOneChatroom(firendId, userId);
  }

  @Get('create-group')
  async group(@Query('name') name: string, @UserInfo('userId') userId: number ) {
    if (!name) {
      throw new BadRequestException('群组名称不能为空');
    }
    return await this.chatroomService.createGroupChatroom(name, userId);
  }

  /**
   * 查看全部群聊
   */
  @Get('list')
  async list(@UserInfo('userId') userId: number) {
    if(!userId) {
      throw new BadRequestException('用户 ID 不能为空');
    }
    return this.chatroomService.list(userId);
  }

  /**
   * 查看聊天室用户
   */
  @Get('members')
  async members(@Query('chatroomId') chatroomId: number) {
    if(!chatroomId) {
      throw new BadRequestException('聊天室 chatroomId 不能为空');
    }
    return this.chatroomService.members(chatroomId);
  }

   /**
   * 查看单个群聊
   */
  @Get('info/:id')
  async info(@Param('id') id: number) {
    if(!id) {
      throw new BadRequestException('聊天室 ID 不能为空');
    }
    return this.chatroomService.info(id);
  }

  /**
   * 加入群聊
   */
  @Get('join/:id')
  async join(@Param('id') id: number, @Query('joinUserId')  joinUserId: number) {
    if(!id) {
      throw new BadRequestException('聊天室 ID 不能为空');
    }
    if(!joinUserId) {
      throw new BadRequestException('加入用户 ID 不能为空');
    }

    return this.chatroomService.join(id, joinUserId);
  }

  /**
   * 退出群聊
   */
  @Get('quit/:id')
  async quit(@Param('id') id: number, @Query('quitUserId')  quitUserId: number) {
    if(!id) {
      throw new BadRequestException('聊天室 ID 不能为空');
    }
    if(!quitUserId) {
      throw new BadRequestException('退出用户 ID 不能为空');
    }

    return this.chatroomService.quit(id, quitUserId);
  }
}
