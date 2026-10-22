import { Controller, Post, Get, Body, Query, HttpStatus, HttpException } from '@nestjs/common';
import { AuthorityService, AuthorityCheckResult } from './authority.service';

export interface CheckAuthorityDto {
  rawMessage?: string;
  equipmentId?: string;
  userType?: 'OP' | 'ME' | string;
  userId?: string;
  div?: string;
}

@Controller('api/authority')
export class AuthorityController {
  constructor(private readonly authorityService: AuthorityService) {}

  /**
   * Endpoint POST /api/authority/check
   * Hỗ trợ gửi chuỗi raw bản tin hoặc các trường JSON riêng lẻ
   */
  @Post('check')
  async checkAuthority(@Body() body: CheckAuthorityDto): Promise<{
    success: boolean;
    result: AuthorityCheckResult | null;
  }> {
    let rawStr = body.rawMessage;

    // Nếu không có rawMessage, tự tạo từ parameters
    if (!rawStr && body.equipmentId && body.userType && body.userId) {
      const div = body.div || 'AUTHORITY     ';
      rawStr = `${body.equipmentId}S002${div};${body.userType.toUpperCase()}^${body.userId}^${body.userId}@;${div}`;
    }

    if (!rawStr) {
      throw new HttpException(
        'Vui lòng cung cấp rawMessage hoặc các trường equipmentId, userType, userId',
        HttpStatus.BAD_REQUEST
      );
    }

    const result = await this.authorityService.processAuthorityMessage(rawStr, body.equipmentId);
    return {
      success: !!result?.isValid,
      result,
    };
  }

  /**
   * Endpoint GET /api/authority/test
   * Ví dụ: /api/authority/test?equipment=REFLOW12A&type=ME&userId=VM3193023
   */
  @Get('test')
  async testAuthority(
    @Query('equipment') equipment = 'REFLOW12A',
    @Query('type') userType = 'ME',
    @Query('userId') userId = 'VM3193023'
  ) {
    const rawStr = `${equipment}S002AUTHORITY     ;${userType.toUpperCase()}^${userId}^${userId}@;AUTHORITY     `;
    const result = await this.authorityService.processAuthorityMessage(rawStr, equipment);
    return {
      testMessage: rawStr,
      success: !!result?.isValid,
      result,
    };
  }
}
