import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthedRequest, JwtGuard } from '../auth/jwt.guard';
import { ChatService } from './chat.service';
import {
  AddMessageDto,
  CreateConversationDto,
  ListQueryDto,
  SearchQueryDto,
  UpdateConversationDto,
} from './dto';

/**
 * Hoi thoai va tin nhan.
 *
 * Mot controller, HAI duong dan: ban Flask co hai blueprint rieng
 * (/api/chat/* tren Mongo va /api/mysql-chat/* tren MySQL) va frontend goi
 * CA HAI. Gio ca hai deu tro ve cung bang Postgres nen phuc vu chung mot
 * controller - khong phai sua frontend, va khong con hai nguon su that.
 *
 * Pha 06 bo /api/mysql-chat/* khi frontend duoc viet lai.
 *
 * Hinh dang response giu {status:'success', data:...} cua ban cu:
 * fe/src/services/mysqlConversationService.js kiem `data.status === 'success'`.
 */
@Controller()
@UseGuards(JwtGuard)
export class ChatController {
  constructor(private readonly chat: ChatService) {}

  private uid(req: AuthedRequest): string {
    return req.auth!.id;
  }

  @Post(['api/chat/conversations', 'api/mysql-chat/conversations'])
  async create(@Req() req: AuthedRequest, @Body() dto: CreateConversationDto) {
    return { status: 'success', data: await this.chat.create(this.uid(req), dto) };
  }

  @Get(['api/chat/conversations', 'api/mysql-chat/conversations'])
  async list(@Req() req: AuthedRequest, @Query() q: ListQueryDto) {
    return {
      status: 'success',
      data: await this.chat.list(this.uid(req), q.limit ?? 50, q.skip ?? 0),
    };
  }

  // Dat TRUOC route ':id' de "search" khong bi hieu la mot id.
  @Get(['api/chat/search', 'api/mysql-chat/search'])
  async search(@Req() req: AuthedRequest, @Query() q: SearchQueryDto) {
    return {
      status: 'success',
      data: await this.chat.search(this.uid(req), q.q, q.limit ?? 20),
    };
  }

  @Get(['api/chat/stats', 'api/mysql-chat/stats'])
  async stats(@Req() req: AuthedRequest) {
    return { status: 'success', data: await this.chat.stats(this.uid(req)) };
  }

  @Get(['api/chat/export', 'api/mysql-chat/export'])
  async exportAll(@Req() req: AuthedRequest) {
    return { status: 'success', data: await this.chat.exportAll(this.uid(req)) };
  }

  @Get(['api/chat/conversations/:id', 'api/mysql-chat/conversations/:id'])
  async get(@Req() req: AuthedRequest, @Param('id', ParseUUIDPipe) id: string) {
    return { status: 'success', data: await this.chat.get(this.uid(req), id) };
  }

  @Put(['api/chat/conversations/:id', 'api/mysql-chat/conversations/:id'])
  async rename(
    @Req() req: AuthedRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateConversationDto,
  ) {
    return { status: 'success', data: await this.chat.rename(this.uid(req), id, dto.title) };
  }

  @Delete(['api/chat/conversations/:id', 'api/mysql-chat/conversations/:id'])
  async remove(@Req() req: AuthedRequest, @Param('id', ParseUUIDPipe) id: string) {
    return { status: 'success', data: await this.chat.remove(this.uid(req), id) };
  }

  @Post([
    'api/chat/conversations/:id/messages',
    'api/mysql-chat/conversations/:id/messages',
  ])
  async addMessage(
    @Req() req: AuthedRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AddMessageDto,
  ) {
    return { status: 'success', data: await this.chat.addMessage(this.uid(req), id, dto) };
  }

  @Delete([
    'api/chat/conversations/:id/messages/:messageId',
    'api/mysql-chat/conversations/:id/messages/:messageId',
  ])
  async removeMessage(
    @Req() req: AuthedRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('messageId', ParseUUIDPipe) messageId: string,
  ) {
    return {
      status: 'success',
      data: await this.chat.removeMessage(this.uid(req), id, messageId),
    };
  }

  @Get([
    'api/chat/conversations/:id/summary',
    'api/mysql-chat/conversations/:id/summary',
  ])
  async summary(@Req() req: AuthedRequest, @Param('id', ParseUUIDPipe) id: string) {
    return { status: 'success', data: await this.chat.summary(this.uid(req), id) };
  }
}
