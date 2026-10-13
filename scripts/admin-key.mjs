#!/usr/bin/env node
// 運営の管理画面のキーを作る。キーは運営スタッフに安全な方法で渡し、サーバーにはハッシュだけを置く。
// 使い方: npm run admin:key
//   表示された 2 行目のコマンドで、本番の Worker にハッシュを登録する（キー本体はサーバーに置かない）。
import { createHash, randomBytes } from 'node:crypto';

const key = `ak_${randomBytes(32).toString('base64url')}`;
const hash = createHash('sha256').update(key).digest('hex');
console.log(`管理キー（スタッフに渡す。再表示できません）:\n  ${key}\n`);
console.log(`サーバーに登録するコマンド:\n  printf '%s' '${hash}' | npx wrangler secret put ADMIN_KEY_SHA256\n`);
