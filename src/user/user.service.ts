import { HttpException, HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { RedisService } from 'src/redis/redis.service';
import { RegisterUserDto } from './dto/register-user.dto';
import { md5 } from 'src/utils';
import { LoginUserDto } from './dto/login-user.dto';
import { UpdateUserPasswordDto } from './dto/update-user-password.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import * as Client from 'ali-oss';
import * as dayjs from 'dayjs';

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
  

  async uploaddService() {
    // ARN
    // acs:ram::1388403628846357:role/ossaccesser

    let config = {
        // 填写你自己的 AccessKey 
        accessKeyId: 'LTAI5tAsAbM9V4YhdQgjaNrr',
        accessKeySecret: '',
        // 存储桶名字
        bucket: 'char-room',
        // 文件存储路径
        dir: 'images/',
    }
    const client = new Client(config)
   
    const date = new Date();
    // 时长加 1 天，作为签名的有限期
    date.setDate(date.getDate() + 1);
    const policy = {
      // 设置签名的有效期，格式为Unix时间戳
      expiration: date.toISOString(),
      conditions: [
        ['content-length-range', 0, 10485760000], // 设置上传文件的大小限制
      ],
    };
    // 生成签名，策略等信息
    const formData = await client.calculatePostSignature(policy);

    // 生成 bucket 域名，客户端将向此地址发送请求
    const location = await client.getBucketLocation();
    const host = `http://${config.bucket}.${location.location}.aliyuncs.com`;

    // 响应给客户端的签名和策略等信息
    return {
      expire: dayjs().add(1, 'days').unix().toString(),
      policy: formData.policy,
      signature: formData.Signature,
      accessId: formData.OSSAccessKeyId,
      host,
      dir: config.dir,
    };
  }
}
