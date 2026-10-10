/**
 * 写真から奄美のいきもの候補を返す（Claude のビジョン）
 *
 * 判定は図鑑に載っている種の中からだけ選ばせ、自信がなければ "unknown" を返させる。
 * 呼び出し側（index.ts）で回数上限とPlus状態を確認してから使うこと。
 */
import Anthropic from '@anthropic-ai/sdk';
import { AREA_BY_ID } from '../../src/data/areas';
import { SPECIES } from '../../src/data/species';

const MODEL = 'claude-opus-5-5';
export const MAX_IMAGE_BASE64_LENGTH = 6_500_000; // 約4.8MB（Claudeの画像上限5MBの手前）

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
- 撮影月や地域の情報があれば、季節性・分布の参考にする（ただし写真の特徴を優先する）。`;

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

export async function identifySpecies(opts: {
  apiKey: string;
  imageBase64: string;
  mediaType?: ImageMediaType;
  month?: number;
  areaId?: string | null;
}): Promise<Candidate[]> {
  const client = new Anthropic({ apiKey: opts.apiKey });
  const hints: string[] = [];
  if (opts.month && opts.month >= 1 && opts.month <= 12) hints.push(`撮影月: ${opts.month}月`);
  const area = opts.areaId ? AREA_BY_ID[opts.areaId] : undefined;
  if (area) hints.push(`地域: ${area.name}（${area.island}）`);

  let response;
  try {
    response = await client.beta.messages.create({
      model: MODEL,
      max_tokens: 4000,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      output_config: {
        effort: 'low',
        format: { type: 'json_schema', schema: OUTPUT_SCHEMA },
      },
      system: [{ type: 'text', text: SYSTEM, cache_control: { type: 'ephemeral' } }],
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: opts.mediaType ?? 'image/jpeg', data: opts.imageBase64 } },
            {
              type: 'text',
              text: `この写真の生き物を図鑑リストから同定してください。${hints.length ? `\n${hints.join(' / ')}` : ''}`,
            },
          ],
        },
      ],
    });
  } catch (error) {
    if (error instanceof Anthropic.RateLimitError) throw new IdentifyError('rate_limited');
    if (error instanceof Anthropic.APIError) throw new IdentifyError('upstream_error');
    throw error;
  }

  if (response.stop_reason === 'refusal') throw new IdentifyError('refused');
  const text = response.content.find((b) => b.type === 'text');
  if (!text || text.type !== 'text') throw new IdentifyError('unparseable_response');

  let parsed: { candidates?: Candidate[] };
  try {
    parsed = JSON.parse(text.text) as { candidates?: Candidate[] };
  } catch {
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
