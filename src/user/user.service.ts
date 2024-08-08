import { HttpException, HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { RedisService } from 'src/redis/redis.service';
import { RegisterUserDto } from './dto/register-user.dto';
import { md5 } from 'src/utils';
import { LoginUserDto } from './dto/login-user.dto';
import { UpdateUserPasswordDto } from './dto/update-user-password.dto';
import { PrismaService } from 'src/prisma/prisma.service';

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

  // 登录
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

  // 查询信息
  async findUserById(id: number) {
    const user = this.prismaService.user.findUnique({
      where: {
        id
      },
      select: {
        id: true,
        username: true,
        nickName: true,
        email: true,
        headPic: true,
        createdAt: true
      }
    })
    return user
  }

  async updatePassword(passwordDto: UpdateUserPasswordDto) {
    const captcha = await this.redisService.get(`update_password_captcha_${passwordDto.email}`)

    if(!captcha) {
      throw new HttpException('验证码已失效', HttpStatus.BAD_REQUEST)
    }

    if(passwordDto.captcha !== captcha) {
      throw new HttpException('验证码错误', HttpStatus.BAD_REQUEST)
    }

    const foundUser = await this.prismaService.user.findUnique({
      where: {
        username: passwordDto.username
      }
    })

    foundUser.password = passwordDto.password

    try {
      await this.prismaService.user.update({
        where: {
          id: foundUser.id
        },
        data: foundUser
      })
      return "密码修改成功"
    } catch(e) {
      this.logger.error(e, UserService)
      throw new HttpException('修改失败', HttpStatus.BAD_REQUEST)
    }
  }

}
