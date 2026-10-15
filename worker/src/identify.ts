/**
 * 写真から奄美のいきもの候補を返す（OpenAI の画像入力つきモデル。Responses API を fetch で呼ぶ）
 *
 * 判定は図鑑に載っている種の中からだけ選ばせ、自信がなければ "unknown" を返させる。
 * 呼び出し側（index.ts）で回数上限・Plus・AI判定の同意を確認してから使うこと。
 * モデルは wrangler.toml の OPENAI_MODEL で変えられる（正答率と費用を見て決める）。
 */
import { AREA_BY_ID } from '../../src/data/areas';
import { SPECIES } from '../../src/data/species';

/** 既定のモデル（大量に使う用途向けの安いモデル）。OPENAI_MODEL で上書きする */
export const DEFAULT_MODEL = 'gpt-6-luna';
const ENDPOINT = 'https://api.openai.com/v1/responses';
/** 判定を待つ上限。超えたら upstream_error（回数は返す） */
const TIMEOUT_MS = 25_000;
export const MAX_IMAGE_BASE64_LENGTH = 6_500_000; // 約4.8MB

const SPECIES_IDS = SPECIES.map((s) => s.id);
const KNOWN = new Set(SPECIES_IDS);

const CATALOG = SPECIES.map((s) => `- ${s.id}: ${s.name}（${s.sci} / ${s.en}）見られる月: ${s.months.join(',')}`).join('\n');

const SYSTEM = `あなたは奄美群島（奄美大島・喜界島・徳之島・沖永良部島・与論島など）の動植物にくわしいナチュラリストです。
ユーザーが撮影した写真に写っている生き物を、次の図鑑リストの中から同定してください。

# 図鑑リスト（id: 和名（学名 / 英名）見られる月）
${CATALOG}

# ルール
- 候補は図鑑リストの id からのみ選び、確からしい順に最大3件まで返す。
- confidence は 0〜1 の数値。写真から判断できる特徴にもとづいて控えめに見積もる。
- 生き物が写っていない、ぼやけて判断できない、図鑑リストにない生き物だと考えられる場合は speciesId を "unknown" にした候補を1件だけ返す。
- reason には判断の決め手になった特徴を、日本語で40字以内で書く。
- 撮影月や地域の情報があれば、季節性・分布の参考にする（ただし写真の特徴を優先する）。
- 写真に人の顔や車のナンバーなどが写っていても、それについては何も書かない。`;

const OUTPUT_SCHEMA = {
  type: 'object',
  properties: {
    candidates: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          speciesId: { type: 'string', enum: [...SPECIES_IDS, 'unknown'] },
          confidence: { type: 'number' },
          reason: { type: 'string' },
        },
        required: ['speciesId', 'confidence', 'reason'],
        additionalProperties: false,
      },
    },
  },
  required: ['candidates'],
  additionalProperties: false,
};

export interface Candidate {
  speciesId: string;
  confidence: number;
  reason: string;
}

export class IdentifyError extends Error {
  constructor(public code: 'refused' | 'rate_limited' | 'upstream_error' | 'unparseable_response') {
    super(code);
  }
}

export type ImageMediaType = 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif';

/** Responses API の返り値のうち、使うところだけ */
interface ResponsesResult {
  status?: string;
  output?: { type: string; content?: { type: string; text?: string; refusal?: string }[] }[];
}

/** 返り値から、構造化出力の JSON の文字列を取り出す（断られた時は refused） */
export function extractOutputText(result: ResponsesResult): string {
  for (const item of result.output ?? []) {
    if (item.type !== 'message') continue;
    for (const part of item.content ?? []) {
      if (part.type === 'refusal') throw new IdentifyError('refused');
      if (part.type === 'output_text' && typeof part.text === 'string') return part.text;
    }
  }
  throw new IdentifyError('unparseable_response');
}

export async function identifySpecies(opts: {
  apiKey: string;
  model?: string;
  imageBase64: string;
  mediaType?: ImageMediaType;
  month?: number;
  areaId?: string | null;
}): Promise<Candidate[]> {
  const hints: string[] = [];
  if (opts.month && opts.month >= 1 && opts.month <= 12) hints.push(`撮影月: ${opts.month}月`);
  const area = opts.areaId ? AREA_BY_ID[opts.areaId] : undefined;
  if (area) hints.push(`地域: ${area.name}（${area.island}）`);

  let res: Response;
  try {
    res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { Authorization: `Bearer ${opts.apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: opts.model || DEFAULT_MODEL,
        instructions: SYSTEM,
        input: [
          {
            role: 'user',
            content: [
              { type: 'input_image', image_url: `data:${opts.mediaType ?? 'image/jpeg'};base64,${opts.imageBase64}`, detail: 'high' },
              { type: 'input_text', text: `この写真の生き物を図鑑リストから同定してください。${hints.length ? `\n${hints.join(' / ')}` : ''}` },
            ],
          },
        ],
        text: { format: { type: 'json_schema', name: 'species_candidates', strict: true, schema: OUTPUT_SCHEMA } },
        max_output_tokens: 2000,
        // 写真と判定の結果を OpenAI 側に保存させない（Responses API の既定は保存する）
        store: false,
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch {
    // 時間切れ・通信の失敗
    throw new IdentifyError('upstream_error');
  }
  if (res.status === 429) throw new IdentifyError('rate_limited');
  if (!res.ok) {
    console.warn('openai identify failed', res.status, (await res.text().catch(() => '')).slice(0, 300));
    throw new IdentifyError('upstream_error');
  }

  const result = (await res.json().catch(() => null)) as ResponsesResult | null;
  if (!result) throw new IdentifyError('unparseable_response');
  // 出力の上限に当たるなどして途中で止まった
  if (result.status && result.status !== 'completed') throw new IdentifyError('unparseable_response');
  let parsed: { candidates?: Candidate[] };
  try {
    parsed = JSON.parse(extractOutputText(result)) as { candidates?: Candidate[] };
  } catch (e) {
    if (e instanceof IdentifyError) throw e;
    throw new IdentifyError('unparseable_response');
  }
  return normalizeCandidates(parsed.candidates ?? []);
}

export function normalizeCandidates(list: Candidate[]): Candidate[] {
  return list
    .filter((c) => c && (c.speciesId === 'unknown' || KNOWN.has(c.speciesId)))
    .map((c) => ({
      speciesId: c.speciesId,
      confidence: Math.max(0, Math.min(1, Number(c.confidence) || 0)),
      reason: String(c.reason ?? '').slice(0, 80),
    }))
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 3);
}
