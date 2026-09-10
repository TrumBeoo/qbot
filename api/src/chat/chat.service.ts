import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { AiService } from '../ai/ai.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  toWireConversation,
  toWireMessage,
  type WireConversation,
  type WireMessage,
} from '../common/wire';
import type { AddMessageDto, CreateConversationDto } from './dto';

/**
 * Hoi thoai va tin nhan tren Postgres.
 *
 * Thay CA HAI ben cu cung mot luc: MongoDB `chat_history` (danh dau primary)
 * va MySQL conversations/messages (danh dau legacy), cong
 * services/hybrid_chat_service.py 497 dong chi de dong bo hai ben. Mot store
 * thi khong con gi de dong bo.
 *
 * Moi truy van deu loc theo userId. Ban cu co cho chi loc theo
 * conversation_id nen nguoi dung khac doc duoc hoi thoai cua nhau neu biet id.
 */
@Injectable()
export class ChatService {
  constructor(
    private readonly db: PrismaService,
    private readonly ai: AiService,
  ) {}

  /** Xac nhan hoi thoai ton tai VA thuoc user nay. */
  private async own(userId: string, conversationId: string): Promise<void> {
    const c = await this.db.conversation.findUnique({
      where: { id: conversationId },
      select: { userId: true },
    });
    if (!c) throw new NotFoundException('Conversation not found');
    // 404 chu khong 403 cho id cua nguoi khac: tra 403 la tiet lo rang id do
    // co that.
    if (c.userId !== userId) throw new NotFoundException('Conversation not found');
  }

  async create(userId: string, dto: CreateConversationDto): Promise<WireConversation> {
    const first = dto.user_message?.trim();
    const lang = dto.language ?? 'vi';

    if (!first) {
      const c = await this.db.conversation.create({
        data: { userId, title: dto.title?.trim() || 'New Conversation' },
        include: { _count: { select: { messages: true } } },
      });
      return toWireConversation(c);
    }

    // Tieu de sinh tu tin nhan dau, giong _generate_conversation_title cua
    // ban cu: cat 50 ky tu roi them dau ba cham.
    const title =
      dto.title?.trim() || (first.length > 50 ? `${first.slice(0, 50)}...` : first);

    const bot = dto.bot_response?.trim();
    const c = await this.db.conversation.create({
      data: {
        userId,
        title,
        messages: {
          create: [
            { text: first, sender: 'user', language: lang },
            ...(bot ? [{ text: bot, sender: 'bot' as const, language: lang }] : []),
          ],
        },
      },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });
    return toWireConversation(c);
  }

  async list(userId: string, limit = 50, skip = 0): Promise<WireConversation[]> {
    const rows = await this.db.conversation.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      take: limit,
      skip,
      // Dem tin nhan thay vi nap het: danh sach hoi thoai khong can noi dung.
      include: { _count: { select: { messages: true } } },
    });
    return rows.map(toWireConversation);
  }

  async get(userId: string, id: string): Promise<WireConversation> {
    await this.own(userId, id);
    const c = await this.db.conversation.findUniqueOrThrow({
      where: { id },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });
    return toWireConversation(c);
  }

  async rename(userId: string, id: string, title: string): Promise<WireConversation> {
    await this.own(userId, id);
    const c = await this.db.conversation.update({
      where: { id },
      data: { title: title.trim() },
      include: { _count: { select: { messages: true } } },
    });
    return toWireConversation(c);
  }

  async remove(userId: string, id: string): Promise<{ deleted: string }> {
    await this.own(userId, id);
    // Tin nhan tu bien mat theo onDelete: Cascade trong schema, khong phai
    // xoa tay nhu ban cu.
    await this.db.conversation.delete({ where: { id } });
    return { deleted: id };
  }

  async addMessage(userId: string, id: string, dto: AddMessageDto): Promise<WireMessage> {
    await this.own(userId, id);
    const [m] = await this.db.$transaction([
      this.db.message.create({
        data: {
          conversationId: id,
          text: dto.text,
          sender: dto.sender,
          language: dto.language ?? 'vi',
        },
      }),
      // Cham vao hoi thoai de no len dau danh sach. Trong cung transaction:
      // them tin nhan ma khong cap nhat updatedAt thi thu tu danh sach sai.
      this.db.conversation.update({ where: { id }, data: { updatedAt: new Date() } }),
    ]);
    return toWireMessage(m);
  }

  async removeMessage(userId: string, id: string, messageId: string): Promise<{ deleted: string }> {
    await this.own(userId, id);
    const m = await this.db.message.findUnique({
      where: { id: messageId },
      select: { conversationId: true },
    });
    if (!m || m.conversationId !== id) throw new NotFoundException('Message not found');
    await this.db.message.delete({ where: { id: messageId } });
    return { deleted: messageId };
  }

  async search(userId: string, q: string, limit = 20): Promise<WireConversation[]> {
    // Tim trong tieu de HOAC noi dung tin nhan, chi trong hoi thoai cua user.
    const rows = await this.db.conversation.findMany({
      where: {
        userId,
        OR: [
          { title: { contains: q, mode: 'insensitive' } },
          { messages: { some: { text: { contains: q, mode: 'insensitive' } } } },
        ],
      },
      orderBy: { updatedAt: 'desc' },
      take: limit,
      include: { _count: { select: { messages: true } } },
    });
    return rows.map(toWireConversation);
  }

  async stats(userId: string): Promise<Record<string, number>> {
    const [conversations, messages, userMessages] = await Promise.all([
      this.db.conversation.count({ where: { userId } }),
      this.db.message.count({ where: { conversation: { userId } } }),
      this.db.message.count({ where: { conversation: { userId }, sender: 'user' } }),
    ]);
    return {
      total_conversations: conversations,
      total_messages: messages,
      user_messages: userMessages,
      bot_messages: messages - userMessages,
    };
  }

  async exportAll(userId: string): Promise<WireConversation[]> {
    const rows = await this.db.conversation.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });
    return rows.map(toWireConversation);
  }

  /** Tom tat hoi thoai - nap tin nhan tu Postgres roi goi AI service. */
  async summary(userId: string, id: string): Promise<{ summary: string; topics: string[] }> {
    await this.own(userId, id);
    const msgs = await this.db.message.findMany({
      where: { conversationId: id },
      orderBy: { createdAt: 'asc' },
      select: { sender: true, text: true },
    });
    if (msgs.length === 0) throw new ForbiddenException('Conversation has no messages');
    // AI service khong doc database: tin nhan di trong request.
    return this.ai.summarize({ messages: msgs });
  }
}
