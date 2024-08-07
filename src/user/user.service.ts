import { HttpException, HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { RedisService } from 'src/redis/redis.service';
import { RegisterUserDto } from './dto/register-user.dto';
import { md5 } from 'src/utils';
import { LoginUserDto } from './dto/login-user.dto';

@Injectable()
export class UserService {

  @Inject(PrismaService)
  private prismaService: PrismaService

  @Inject(RedisService)
  private redisService: RedisService

  private logger = new Logger()

  async create(user: RegisterUserDto) {
    
    const captcha = await this.redisService.get(`captcha_${user.email}`)
    console.log( captcha, user.email)

    if (!captcha) {
      throw new HttpException('验证码已失效', HttpStatus.BAD_REQUEST)
    }

    if (user.captcha !== captcha) {
      throw new HttpException('验证码错误', HttpStatus.BAD_REQUEST)
    }

    const foundUser = await this.prismaService.user.findUnique({
      where: {
        username: user.username
      }
    })

    if (foundUser) {
      throw new HttpException('用户已存在', HttpStatus.BAD_REQUEST)
    }

    try {
      await this.prismaService.user.create({ 
        data: {
          username: user.username,
          password: md5(user.password),
          nickName: user.nickName,
          email: user.email
        },
        select: {
          id: true,
          username: true,
          nickName: true,
          email: true,
          headPic: true,
          createdAt: true
        }
      });
      return "注册成功"
    } catch (error) {
      this.logger.error(error, UserService)
      throw new HttpException('注册失败', HttpStatus.BAD_REQUEST)
    }
  }

  async login(user: LoginUserDto) {
    
    const foundUser = await this.prismaService.user.findUnique({
      where: {
        username: user.username
      }
    })

    if (!foundUser) {
      throw new HttpException('用户不存在', HttpStatus.BAD_REQUEST)
    }

    if (foundUser.password !== md5(user.password)) {
      throw new HttpException('密码错误', HttpStatus.BAD_REQUEST)
    }

    delete foundUser.password
    return foundUser
  }
}
