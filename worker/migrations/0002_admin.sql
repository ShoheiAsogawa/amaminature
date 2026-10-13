-- 運営（アマリンク）の管理画面用

-- 不正な記録の取り消し（取り消した記録はポイント・図鑑・提携先の集計に数えない。記録そのものは残す）
ALTER TABLE sightings ADD COLUMN revoked_at TEXT;
ALTER TABLE sightings ADD COLUMN revoke_reason TEXT;
CREATE INDEX idx_sightings_created ON sightings(created_at);

-- 景品の交換申請の対応日時とメモ（発送番号など）
ALTER TABLE redemptions ADD COLUMN updated_at TEXT;
ALTER TABLE redemptions ADD COLUMN note TEXT NOT NULL DEFAULT '';
CREATE INDEX idx_redemptions_status ON redemptions(status, created_at);

-- 路上レポートの対応日時
ALTER TABLE road_reports ADD COLUMN updated_at TEXT;
CREATE INDEX idx_road_reports_status ON road_reports(status, observed_at);

-- 管理画面での操作の記録（誰がいつ何をしたかを後から確かめるため）
CREATE TABLE admin_actions (
  id          TEXT PRIMARY KEY,
  action      TEXT NOT NULL,
  target_id   TEXT NOT NULL,
  detail      TEXT NOT NULL DEFAULT '',
  created_at  TEXT NOT NULL
);
CREATE INDEX idx_admin_actions_created ON admin_actions(created_at);
