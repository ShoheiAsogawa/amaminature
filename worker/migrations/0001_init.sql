-- AMAMI NATURE 初期スキーマ（Cloudflare D1 / SQLite）

-- LINEユーザー（id = LINEのユーザーID。LINEログインとMessaging APIは同一プロバイダー配下に置くこと）
CREATE TABLE users (
  id            TEXT PRIMARY KEY,
  display_name  TEXT NOT NULL DEFAULT '',
  picture_url   TEXT,
  nickname      TEXT NOT NULL DEFAULT '',
  pledged       INTEGER NOT NULL DEFAULT 0,
  plus_plan     TEXT,
  plus_until    TEXT,
  is_friend     INTEGER NOT NULL DEFAULT 0,
  created_at    TEXT NOT NULL,
  last_seen_at  TEXT
);

-- 観察記録。希少種は lat/lng を保存しない（サーバー側でも強制）
CREATE TABLE sightings (
  id                  TEXT PRIMARY KEY,
  user_id             TEXT NOT NULL REFERENCES users(id),
  species_id          TEXT,
  custom_name         TEXT,
  nickname            TEXT NOT NULL DEFAULT '',
  memo                TEXT NOT NULL DEFAULT '',
  observed_at         TEXT NOT NULL,
  created_at          TEXT NOT NULL,
  updated_at          TEXT NOT NULL,
  area_id             TEXT,
  lat                 REAL,
  lng                 REAL,
  location_protected  INTEGER NOT NULL DEFAULT 0,
  kind                TEXT NOT NULL CHECK (kind IN ('photo', 'sign')),
  road_report         TEXT CHECK (road_report IN ('roadkill', 'injured', 'on-road')),
  photo_key           TEXT,
  photo_hash          TEXT
);
CREATE INDEX idx_sightings_user ON sightings(user_id, observed_at);
CREATE INDEX idx_sightings_area ON sightings(area_id, observed_at);
CREATE INDEX idx_sightings_species ON sightings(species_id);
CREATE INDEX idx_sightings_photo_hash ON sightings(photo_hash);

-- 路上レポートの正確な位置（行政・保護機関への提供用。アプリでは公開しない）
CREATE TABLE road_reports (
  sighting_id  TEXT PRIMARY KEY REFERENCES sightings(id) ON DELETE CASCADE,
  user_id      TEXT NOT NULL,
  type         TEXT NOT NULL CHECK (type IN ('roadkill', 'injured', 'on-road')),
  species_id   TEXT,
  area_id      TEXT,
  lat          REAL,
  lng          REAL,
  observed_at  TEXT NOT NULL,
  status       TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'forwarded', 'closed'))
);
CREATE INDEX idx_road_reports_area ON road_reports(area_id, observed_at);

-- セーフドライブ宣言（1日1回、日付はJST）
CREATE TABLE safe_drives (
  user_id     TEXT NOT NULL,
  date        TEXT NOT NULL,
  created_at  TEXT NOT NULL,
  PRIMARY KEY (user_id, date)
);

-- ポイント交換（景品の発送・クーポン発行は status で管理）
CREATE TABLE redemptions (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL,
  reward_id   TEXT NOT NULL,
  points      INTEGER NOT NULL,
  status      TEXT NOT NULL DEFAULT 'requested' CHECK (status IN ('requested', 'fulfilled', 'cancelled')),
  created_at  TEXT NOT NULL
);
CREATE INDEX idx_redemptions_user ON redemptions(user_id);

-- AI判定の利用回数（日付はJST）
CREATE TABLE ai_usage (
  user_id  TEXT NOT NULL,
  date     TEXT NOT NULL,
  count    INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, date)
);

-- 共有カード（公開URLで配信する画像。位置情報は含まない）
CREATE TABLE shares (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL,
  created_at  TEXT NOT NULL
);

-- 提携先（自治体・保護機関）。キーはSHA-256ハッシュで保存
CREATE TABLE partners (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  api_key_hash  TEXT NOT NULL UNIQUE,
  -- 'all' または市町村IDのカンマ区切り（例: 'amami,yamato'）
  scope         TEXT NOT NULL DEFAULT 'all',
  created_at    TEXT NOT NULL
);
