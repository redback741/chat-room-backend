import { Body, Controller, Post, Get, BadRequestException, Param } from '@nestjs/common';
import { FriendshipService } from './friendship.service';
import { RequireLogin, UserInfo } from 'src/custom.decorator';
import { FriendAddDto } from './dto/friend-add.dto';

@Controller('friendship')
@RequireLogin()
export class FriendshipController {
  constructor(private readonly friendshipService: FriendshipService) {}

  @Get('list')
  @RequireLogin()
  async friendship(@UserInfo('userId') userId: number) {
    return await this.friendshipService.getFriendship(userId);
  }

  @Post('add')
  async add(@Body() friendAddDto: FriendAddDto, @UserInfo('userId') userId: number) {
    return await this.friendshipService.add(friendAddDto, userId);
  }

  @Get('request_list')
  async list(@UserInfo('userId') userId: number) {
    return await this.friendshipService.list(userId);
  }
  
  // 同意添加好友
  @Get('agree/:id')
  async agree(@Param('id') friendId: number, @UserInfo('userId') userId: number) {
    if(!friendId) {
      throw new BadRequestException('添加的好友 ID 不能为空');
    }
    return await this.friendshipService.agree(friendId, userId);
  }

  // 拒绝添加好友
  @Get('reject/:id')
  async reject(@Param('id') friendId: number, @UserInfo('userId') userId: number) {
    if(!friendId) {
      throw new BadRequestException('添加的好友 ID 不能为空');
    }
    return await this.friendshipService.reject(friendId, userId);
  }

  @Get('remove/:id')
  async remove(@Param('id') friendId: number, @UserInfo('userId') userId: number) {
    return await this.friendshipService.remove(friendId, userId);
  }
}
