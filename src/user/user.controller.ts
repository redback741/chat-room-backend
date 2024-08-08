import { Body, Controller, Get, Inject, Post, Query, Req } from '@nestjs/common';
import { UserService } from './user.service';
import { RegisterUserDto } from './dto/register-user.dto';
import { EmailService } from 'src/email/email.service';
import { RedisService } from 'src/redis/redis.service';
import { LoginUserDto } from './dto/login-user.dto';
import { JwtService } from '@nestjs/jwt';
import { RequireLogin, UserInfo } from 'src/custom.decorator';
import { UpdateUserPasswordDto } from './dto/update-user-password.dto';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Inject(EmailService)
  private emailService: EmailService;

  @Inject(RedisService)
  private redisService: RedisService;

  @Inject(JwtService)
  private jwtService: JwtService;

  @Post('register')
  async register(@Body() registerUser: RegisterUserDto) {  
    return await this.userService.create(registerUser);
  }

  @Get('regiset-captcha')
  async captcha(@Query('address') address: string) {
    const code = Math.random().toString().slice(2, 8);
    await this.redisService.set(`captcha_${address}`, code, 5 * 60);

    await this.emailService.sendEmail({
      to: address,
      subject: '注册验证码',
      html: `<h1>您的验证码是${code}</h1>`,
    });
    return 'send success'
  }

  @Post('login')
  async login(@Body() loginUser: LoginUserDto) {
    const user = await this.userService.login(loginUser);
    
    return {
      user,
      token: this.jwtService.sign({ 
        userId: user.id,
        username: user.username
      }, {
        expiresIn: '7d'
      })
    }
  }

  @Get('info')
  @RequireLogin()
  async info(@UserInfo('userId') userId: number) {
    return await this.userService.findUserById(userId);
  }

  // 修改密码
  @Post('update_password')
  // @RequireLogin()
  async updatePassword(@Body() passwordDto: UpdateUserPasswordDto) {
    console.log(passwordDto)
    return await this.userService.updatePassword(passwordDto);
  }
  // 修改密码发送验证码
  @Get('update-captcha')
  @RequireLogin()
  async updateCaptcha(@UserInfo('userId') userId: number) {
    const {email: address} = await this.userService.findUserById(userId);

    const code = Math.random().toString().slice(2, 8);
    await this.redisService.set(`update_password_captcha_${address}`, code, 5 * 60);

    await this.emailService.sendEmail({
      to: address,
      subject: '更改用户信息验证码',
      html: `<h1>您的验证码是${code}</h1>`,
    });
    return 'send success'
  }


}
