# Vi sao dev khong dung `tsx`

`tsx` (va moi runner dua tren esbuild, ke ca `bun`) **khong chay duoc NestJS**
voi constructor injection.

esbuild khong ho tro `emitDecoratorMetadata`. Nest doc metadata
`design:paramtypes` do TypeScript sinh ra de biet phai inject gi vao
constructor. Khong co metadata thi moi service duoc inject deu la `undefined`,
va loi hien ra rat kho doan:

```
Cannot read properties of undefined (reading 'register')
```

Da thu that: voi `tsx watch`, `/health` bao `database: down` va moi route tra
loi tren. Doi sang `ts-node` (dung `tsc` ben duoi) thi chay dung ngay.

Nen `pnpm dev` o day la:

```
node --watch -r ts-node/register --env-file=../.env --env-file=.env src/main.ts
```

- `node --watch` khoi dong lai khi file doi (Node 20+), khong can nodemon
- `-r ts-node/register` bien dich TypeScript CO metadata decorator
- `--env-file` nap `.env`: root truoc (secret dung chung), roi `be/.env` ghi
  de `DATABASE_URL` ve `localhost` cho lan chay tren host

Trong Docker thi khac: build bang `tsc` roi chay `node dist/main.js`, khong
qua ts-node.
