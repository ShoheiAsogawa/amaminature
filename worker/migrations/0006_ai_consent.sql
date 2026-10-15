-- AI判定で写真を外国（米国）の事業者（OpenAI）に送ることへの同意（版と日時）。撤回したら NULL に戻す
ALTER TABLE users ADD COLUMN ai_consent_version TEXT;
ALTER TABLE users ADD COLUMN ai_consent_at TEXT;
