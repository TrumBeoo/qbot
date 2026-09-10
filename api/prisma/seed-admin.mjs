// Tao/cap nhat tai khoan admin. Thay cho be/create_admin.py.
//
// Khac ban Python o hai cho:
//   - Bam bang bcrypt, khong phai SHA-256 + salt. SHA-256 qua nhanh nen
//     brute-force re; day la ly do bo cot password_salt o pha 02.
//   - Khong hoi tuong tac (ban cu goi input() nen khong chay duoc trong CI
//     hay trong container). Idempotent: chay lai thi cap nhat.
//
// Chay:  node prisma/seed-admin.mjs
// Mat khau lay tu ADMIN_PASSWORD, khong dat thi sinh ngau nhien va in ra.

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'
import { randomBytes } from 'node:crypto'

const db = new PrismaClient()

const email = (process.env.ADMIN_EMAIL ?? 'admin@servicehub.com').toLowerCase()
const name = process.env.ADMIN_NAME ?? 'Admin'
const generated = !process.env.ADMIN_PASSWORD
const password = process.env.ADMIN_PASSWORD ?? randomBytes(12).toString('base64url')

const data = {
  name,
  passwordHash: await bcrypt.hash(password, 12),
  role: 'admin',
  isActive: true,
  isVerified: true,
  businessInfo: {
    business_name: name,
    business_type: 'Quản trị hệ thống',
    industry: 'Technology',
    phone: '',
    address: 'Quảng Ninh, Việt Nam',
  },
  // Token cap moi moi lan chay: token cu coi nhu bi thu hoi.
  apiToken: randomBytes(24).toString('base64url'),
  refreshToken: randomBytes(24).toString('base64url'),
}

const admin = await db.admin.upsert({
  where: { email },
  update: data,
  create: { email, ...data },
})

console.log(`admin san sang: ${admin.email} (id ${admin.id})`)
if (generated) {
  console.log(`mat khau sinh tu dong: ${password}`)
  console.log('Dat ADMIN_PASSWORD de tu chon mat khau.')
}
await db.$disconnect()
