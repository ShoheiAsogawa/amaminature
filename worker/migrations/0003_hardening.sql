-- 不正対策と端末間の同期

-- サーバーが記録を受け取った日時（1日の記録数の上限はこちらで数える。created_at は端末の申告なので使わない）
ALTER TABLE sightings ADD COLUMN received_at TEXT;
UPDATE sightings SET received_at = updated_at WHERE received_at IS NULL;
CREATE INDEX idx_sightings_received ON sightings(user_id, received_at);

-- 削除した記録の印（別の端末に削除を伝え、古い端末からの再送で生き返らないようにする）
CREATE TABLE sighting_tombstones (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL,
  deleted_at  TEXT NOT NULL
);
CREATE INDEX idx_sighting_tombstones_user ON sighting_tombstones(user_id);

-- 管理画面の記録一覧・集計はサーバーが受け取った順に並べる
DROP INDEX IF EXISTS idx_sightings_created;
CREATE INDEX idx_sightings_received_all ON sightings(received_at);
