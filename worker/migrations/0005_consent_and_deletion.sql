-- 利用規約・プライバシーポリシーへの同意（版と日時）
ALTER TABLE users ADD COLUMN terms_version TEXT;
ALTER TABLE users ADD COLUMN privacy_version TEXT;
ALTER TABLE users ADD COLUMN consented_at TEXT;

-- 路上レポートの正確な位置を提携先（自治体・保護団体）に渡すことへの同意。撤回したら NULL に戻す
ALTER TABLE users ADD COLUMN road_consent_version TEXT;
ALTER TABLE users ADD COLUMN road_consent_at TEXT;

-- お問い合わせ番号（AN-XXXXXXXX）。利用者が問い合わせる時に、運営がアカウントを探すため
ALTER TABLE users ADD COLUMN support_code TEXT;
CREATE INDEX idx_users_support_code ON users(support_code);

-- 退会（データ削除）した利用者。LINE ユーザー ID は残さずハッシュだけを置き、退会前に発行したログインを使えなくする
CREATE TABLE deleted_users (
  id_hash     TEXT PRIMARY KEY,
  deleted_at  TEXT NOT NULL
);
