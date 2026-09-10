// Smoke test cho schema Postgres. Chay: npm run smoke
//
// Muc dich: chung minh nhung thu KHONG the doc ra tu schema.prisma -
// uuid tu sinh, khoa ngoai co that su chan, cascade co xoa keo theo,
// enum co tu choi gia tri la, va timestamptz tra ve dung mui gio.
//
// Script tu don sach sau khi chay, nen chay bao nhieu lan cung duoc.

import { PrismaClient } from '@prisma/client'
import assert from 'node:assert/strict'

const db = new PrismaClient()
const tag = `smoke-${Date.now()}`

async function main() {
  // --- uuid tu sinh, khong phai app tu tao ---
  const user = await db.user.create({
    data: {
      email: `${tag}@example.test`,
      name: 'Smoke User',
      passwordHash: '$2b$12$khong-phai-hash-that',
      businessInfo: { business_name: 'Cty Du lich', industry: 'Tourism' },
      permissions: { locations: ['read', 'write'] },
    },
  })
  assert.match(user.id, /^[0-9a-f-]{36}$/, 'id phai la uuid do DB sinh')
  assert.equal(user.provider, 'email', 'provider phai mac dinh la email')
  assert.equal(user.isActive, true)
  assert.equal(user.businessInfo.industry, 'Tourism', 'jsonb phai doc lai duoc')

  // --- khoa ngoai phai chan userId khong ton tai ---
  // Ban MySQL cu de conversations.user_id la VARCHAR(36) khong khoa ngoai,
  // nen ghi duoc hoi thoai tro tới user khong co that.
  await assert.rejects(
    db.conversation.create({
      data: { userId: '00000000-0000-0000-0000-000000000000', title: 'Mo' },
    }),
    /Foreign key constraint/i,
    'FK phai chan userId khong ton tai',
  )

  // --- hoi thoai + tin nhan ---
  const conv = await db.conversation.create({
    data: {
      userId: user.id,
      title: 'Hoi ve Vinh Ha Long',
      messages: {
        create: [
          { text: 'Vinh Ha Long co gi hay?', sender: 'user', language: 'vi' },
          { text: 'Vinh Ha Long la di san UNESCO...', sender: 'bot', language: 'vi' },
        ],
      },
    },
    include: { messages: true },
  })
  assert.equal(conv.messages.length, 2)
  assert.equal(conv.title, 'Hoi ve Vinh Ha Long')

  // --- enum phai tu choi gia tri la ---
  await assert.rejects(
    db.message.create({
      data: { conversationId: conv.id, text: 'x', sender: 'assistant' },
    }),
    'enum MessageSender chi nhan user|bot',
  )

  // --- dia diem + anh, enum co gia tri mac dinh ---
  const loc = await db.location.create({
    data: {
      name: 'Vinh Ha Long',
      nameEn: 'Ha Long Bay',
      category: 'island',
      district: 'Ha Long',
      latitude: '20.91011000',
      longitude: '107.18391000',
      keywords: 'ha long, vinh, di san, unesco',
      images: {
        create: [
          { imageUrl: '/static/images/halong-1.jpg', imageType: 'main', displayOrder: 0 },
          { imageUrl: '/static/images/halong-2.jpg', displayOrder: 1 },
        ],
      },
    },
    include: { images: true },
  })
  assert.equal(loc.images.length, 2)
  assert.equal(loc.images[1].imageType, 'gallery', 'imageType phai mac dinh gallery')
  assert.equal(Number(loc.latitude).toFixed(5), '20.91011', 'Decimal(10,8) phai giu do chinh xac')

  // --- tim kiem mo, dung duong dan ma GIN trigram index phuc vu ---
  const found = await db.$queryRaw`
    SELECT id FROM locations WHERE lower(name) LIKE ${'%ha long%'}
  `
  assert.ok(found.length >= 1, 'LIKE khong dau % phai tim ra dia diem vua tao')

  // --- DataFile: filename unique ---
  const f = await db.dataFile.create({
    data: {
      filename: `${tag}.txt`,
      content: 'Noi dung mau cho RAG',
      fileHash: 'a'.repeat(64),
      fileSize: 20,
      metadata: { line_count: 1, word_count: 4 },
    },
  })
  assert.equal(f.status, 'active')
  await assert.rejects(
    db.dataFile.create({
      data: { filename: `${tag}.txt`, content: 'x', fileHash: 'b'.repeat(64), fileSize: 1 },
    }),
    /Unique constraint/i,
    'filename phai unique',
  )

  // --- timestamptz: doc lai dung thoi diem, khong lech mui gio ---
  const drift = Math.abs(Date.now() - user.createdAt.getTime())
  assert.ok(drift < 60_000, `createdAt lech ${drift}ms - kiem tra lai timestamptz`)

  // --- cascade: xoa user phai keo theo hoi thoai va tin nhan ---
  await db.user.delete({ where: { id: user.id } })
  assert.equal(await db.conversation.count({ where: { id: conv.id } }), 0,
    'xoa user phai cascade sang conversations')
  assert.equal(await db.message.count({ where: { conversationId: conv.id } }), 0,
    'xoa conversation phai cascade sang messages')

  // --- cascade: xoa location phai keo theo anh ---
  await db.location.delete({ where: { id: loc.id } })
  assert.equal(await db.locationImage.count({ where: { locationId: loc.id } }), 0,
    'xoa location phai cascade sang location_images')

  await db.dataFile.delete({ where: { id: f.id } })

  console.log('smoke OK - 7 bang, uuid, FK, cascade, enum, jsonb, Decimal, timestamptz')
}

main()
  .catch((e) => { console.error('smoke THAT BAI:', e.message); process.exit(1) })
  .finally(() => db.$disconnect())
