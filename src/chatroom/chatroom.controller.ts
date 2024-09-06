import { BadRequestException, Controller, Get, Query } from '@nestjs/common';
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
}
