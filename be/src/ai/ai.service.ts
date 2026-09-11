import { HttpException, Injectable, Logger } from '@nestjs/common';

/**
 * Client goi AI service (pha 03).
 *
 * API la ben DUY NHAT duoc goi AI service - AI service khong mo ra internet.
 * API nap du lieu tu Postgres roi truyen vao request, vi AI service khong
 * doc database.
 */
@Injectable()
export class AiService {
  private readonly log = new Logger(AiService.name);
  private readonly base = process.env.AI_SERVICE_URL ?? 'http://ai:8000';
  private readonly token = process.env.AI_SERVICE_TOKEN ?? '';

  private async call<T>(path: string, body: unknown, timeoutMs = 120_000): Promise<T> {
    if (!this.token) {
      throw new HttpException('AI service token not configured', 503);
    }
    // AbortController: RAG co the mat vai chuc giay, nhung khong duoc treo
    // request cua nguoi dung vo han.
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), timeoutMs);
    try {
      const res = await fetch(`${this.base}${path}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.token}`,
        },
        body: JSON.stringify(body),
        signal: ac.signal,
      });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        this.log.error(`AI ${path} tra ${res.status}: ${text.slice(0, 300)}`);
        throw new HttpException('AI service error', 502);
      }
      return (await res.json()) as T;
    } catch (e) {
      if (e instanceof HttpException) throw e;
      if (e instanceof Error && e.name === 'AbortError') {
        throw new HttpException('AI service timed out', 504);
      }
      this.log.error(e instanceof Error ? e.message : String(e));
      throw new HttpException('AI service unreachable', 502);
    } finally {
      clearTimeout(timer);
    }
  }

  answer(input: {
    question: string;
    language?: string;
    history?: { sender: string; text: string }[];
    without_rag?: boolean;
  }): Promise<{ answer: string; language: string }> {
    return this.call('/rag/answer', input);
  }

  summarize(input: {
    messages: { sender: string; text: string }[];
    language?: string;
  }): Promise<{ summary: string; topics: string[] }> {
    return this.call('/summarize', input);
  }

  detectLanguage(text: string): Promise<{ language: string }> {
    return this.call('/detect-language', { text }, 15_000);
  }
}
