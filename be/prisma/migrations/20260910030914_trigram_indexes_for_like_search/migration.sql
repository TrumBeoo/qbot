-- Index GIN trigram cho tim kiem dia diem.
--
-- Truy van thuc te trong be/services/simple_image_service.py:
--     WHERE LOWER(l.name) LIKE %s OR LOWER(l.name_en) LIKE %s
--        OR LOWER(l.keywords) LIKE %s
-- voi tham so dang '%tu khoa%'.
--
-- Btree khong dung duoc cho LIKE co % o dau. MySQL cu co index FULLTEXT
-- tren keywords nhung FULLTEXT chi phuc vu MATCH ... AGAINST, khong phuc vu
-- LIKE - nghia la index do chua tung duoc dung tới lan nao.
--
-- Index dat tren lower(cot) de khop dung bieu thuc trong truy van; dat tren
-- cot tho thi planner khong dung.
-- Prisma khong dien dat duoc index tren bieu thuc, nen migration nay viet tay
-- va se khong bi `prisma migrate dev` sinh lai.

CREATE INDEX "locations_name_trgm_idx"
  ON "locations" USING GIN (lower("name") gin_trgm_ops);

CREATE INDEX "locations_nameEn_trgm_idx"
  ON "locations" USING GIN (lower("nameEn") gin_trgm_ops);

CREATE INDEX "locations_keywords_trgm_idx"
  ON "locations" USING GIN (lower("keywords") gin_trgm_ops);
