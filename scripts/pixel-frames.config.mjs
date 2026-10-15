// ドット絵の枠の絵（scripts/build-pixel-frames.mjs が読む）
//
// 枠は pixelBox() で「角の段々」「線の重なり（外から順）」「中の色」「下の厚み」から描く。
// 1 文字 = 1 ドット（U px）。'.' は透明。色はトークン名（index.css の --c-*）か、{ light, dark } か、#16進数・rgba()。
export const U = 3;

/**
 * 角が段々の箱を、文字の絵で作る。
 * corner: 角の行ごとの透明なドット数（例 [2, 1] は 2 段の角）
 * bands: 外から順の線の文字（例 ['O', 'H'] は外が O、内側に H の 1 ドットの線）
 * fill: 中の文字。lip: 下の厚みのドット数（厚みの色は 'L'）
 * ornament: 左上の角に重ねる飾り（[x, y, 文字]）。4 つの角に左右・上下を反転して置く
 * openBottom: 下の線を描かない（画面の下までのシート）。alias: 同じ枠を使うほかのセレクタ
 */
export function pixelBox({ corner = [2, 1], bands = ['O'], fill = 'F', lip = 1, ornament = [], unit = U, layoutBorder, colors, note, fillCenter = true, openBottom = false, alias, lipOutside = false }) {
  if (openBottom) lip = 0;
  const S = Math.max(corner.length, bands.length); // 角と線が収まる幅（ここから先はまっすぐ）
  const W = S * 2 + 1;
  const draw = (H) => {
    const inside = (x, y) => {
      if (x < 0 || y < 0 || x >= W) return false;
      if (y >= H) {
        if (!openBottom) return false;
        y = H - 1;
      }
      const insetX = (row) => (row < corner.length ? corner[row] : 0);
      const fromTop = y;
      const fromBottom = openBottom ? Infinity : H - 1 - y;
      const fromLeft = x;
      const fromRight = W - 1 - x;
      const row = Math.min(fromTop, fromBottom);
      const col = Math.min(fromLeft, fromRight);
      return col >= insetX(row);
    };
    // 外から何番目の線か（4 近傍で削っていく）
    const depth = Array.from({ length: H }, () => Array(W).fill(-1));
    let cur = (x, y) => inside(x, y);
    for (let k = 0; k <= bands.length; k++) {
      const prev = cur;
      const next = (x, y) => prev(x, y) && prev(x - 1, y) && prev(x + 1, y) && prev(x, y - 1) && prev(x, y + 1);
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (depth[y][x] < 0 && prev(x, y) && !next(x, y)) depth[y][x] = k;
      const memo = new Map();
      cur = (x, y) => {
        const key = `${x},${y}`;
        if (!memo.has(key)) memo.set(key, next(x, y));
        return memo.get(key);
      };
    }
    return Array.from({ length: H }, (_, y) =>
      Array.from({ length: W }, (_, x) => {
        if (!inside(x, y)) return '.';
        const d = depth[y][x];
        return d >= 0 && d < bands.length ? bands[d] : fill;
      }),
    );
  };
  // 飾りを 4 つの角に置く。bottom は下の角の基準の行（厚みの分だけ上）
  const place = (grid, H, bottom = H - 1) => {
    for (const [ox, oy, ch] of ornament) {
      const at = [
        [ox, oy],
        [W - 1 - ox, oy],
      ];
      if (!openBottom)
        at.push(
          [ox, bottom - oy],
          [W - 1 - ox, bottom - oy],
        );
      for (const [x, y] of at) grid[y][x] = ch;
    }
    return grid;
  };
  // lipOutside: 厚みの代わりに、箱の外に落ちる影（下に lip ドットずらした形）を描く。押した時の絵はない
  if (lipOutside) {
    const Hb = S * 2 + 1;
    const g = [...place(draw(Hb), Hb), ...Array.from({ length: lip }, () => Array(W).fill('.'))];
    for (let y = Hb; y < Hb + lip; y++)
      for (let x = 0; x < W; x++) for (let k = 1; k <= lip; k++) if (y - k >= 0 && y - k < Hb && g[y - k][x] !== '.' && g[y][x] === '.') g[y][x] = 'L';
    for (let y = 1; y < Hb; y++) for (let x = 0; x < W; x++) if (g[y][x] === '.' && g[y - 1][x] !== '.' && g[y - 1][x] !== 'L' && x < W && y > S) g[y][x] = 'L';
    return { note, unit, mid: [S, S], lip, art: g.map((r) => r.join('')), pressed: null, colors, fill: fillCenter, border: layoutBorder, alias };
  }
  // 押していない時：箱の高さ（2S+1）＋厚み。厚みは、各列のいちばん下の「外の線ではない」ドットを lip 個ぶん L にする
  const Hn = S * 2 + 1 + lip;
  const normal = draw(Hn);
  if (lip > 0)
    for (let x = 0; x < W; x++) {
      let n = 0;
      for (let y = Hn - 1; y >= 0 && n < lip; y--) {
        const ch = normal[y][x];
        if (ch === '.' || ch === bands[0]) continue;
        normal[y][x] = 'L';
        n++;
      }
    }
  place(normal, Hn, Hn - 1 - lip);
  // 押した時：厚みの分だけ下がる（絵は上に詰めて、下に透明な行を足す）
  const Hp = S * 2 + 1;
  const pressed = lip > 0 ? [...place(draw(Hp), Hp), ...Array.from({ length: lip }, () => Array(W).fill('.'))] : null;
  const toArt = (g) => g.map((r) => r.join(''));
  return {
    note,
    unit,
    mid: [S, S],
    lip,
    art: toArt(normal),
    pressed: pressed && toArt(pressed),
    colors,
    fill: fillCenter,
    border: layoutBorder,
    alias,
  };
}

/** 直径 d ドットの円の、角の行ごとの透明なドット数 */
export function circleProfile(d) {
  const r = d / 2;
  const out = [];
  for (let i = 0; ; i++) {
    const y = r - (i + 0.5);
    const inset = Math.round(r - Math.sqrt(Math.max(0, r * r - y * y)));
    if (inset <= 0) break;
    out.push(inset);
  }
  return out;
}

/**
 * 角を段々に切り抜く形（clip-path）。枠を描かない物（写真・タグ・バーの中身・丸いアイコンの地・グラデーションのカード）に使う。
 * 線のある丸は、外側の要素（線の色）と内側の要素（中の色）を重ねて、それぞれを切り抜く。
 */
export const CLIPS = {
  // 四角（角の段の数）
  'clip-1': [1],
  'clip-2': [2, 1],
  'clip-3': [3, 2, 1],
  // 丸（要素の大きさに合わせて選ぶ）。s: 〜28px、m: 32〜48px、l: 52〜72px、xl: 76px〜
  'circle-s': circleProfile(8),
  'circle-m': circleProfile(13),
  'circle-l': circleProfile(21),
  'circle-xl': circleProfile(31),
};

// 色の短縮（ドット絵の線・飾りの帯）
const INK = 'ink';
const SKY = 'band';

const raised = (colors, o = {}) => pixelBox({ colors, ...o });
const flat = (colors, o = {}) => pixelBox({ lip: 0, colors, ...o });

export const FRAMES = {
  // ── パネル・カード ──
  panel: raised({ O: INK, F: 'surface', L: 'edge' }, { note: 'パネル（白い面、墨の線、下に厚み）。.panel も同じ', alias: ['.panel'] }),
  'panel-flat': flat({ O: INK, F: 'surface' }, { note: '平らなパネル（厚みなし）' }),
  well: flat({ O: 'line', F: 'fill' }, { note: 'くぼみ（セグメントの溝、グループの中のチップ）' }),
  selected: raised({ O: 'brand', F: 'brand-soft', L: 'brand-pressed' }, { note: '選んでいる行・カード' }),
  deco: pixelBox({
    note: '飾りの窓（シート・ダイアログ・大事なパネル）。外は墨、空色の帯、内に細い墨、角に金のひし形',
    bands: ['O', 'S', 'S', 'I'],
    ornament: [[2, 1, 'G'], [1, 2, 'G'], [2, 2, 'G'], [3, 2, 'G'], [2, 3, 'G']],
    colors: { O: INK, S: SKY, I: INK, F: 'surface', L: 'edge', G: 'gold' },
    lipOutside: true,
  }),
  sheet: pixelBox({
    note: 'ボトムシート（上だけ飾り、下は画面の端まで）',
    bands: ['O', 'S', 'S', 'I'],
    ornament: [[2, 1, 'G'], [1, 2, 'G'], [2, 2, 'G'], [3, 2, 'G'], [2, 3, 'G']],
    openBottom: true,
    colors: { O: INK, S: SKY, I: INK, F: 'surface', G: 'gold' },
  }),
  bar: pixelBox({ note: '画面の下に固定するバー（上の角だけ段々）', openBottom: true, colors: { O: INK, F: 'surface' } }),
  msg: pixelBox({
    note: 'メッセージ窓（会話。テーマに関係なく白）',
    bands: ['O', 'S', 'S', 'I'],
    ornament: [[2, 1, 'G'], [1, 2, 'G'], [2, 2, 'G'], [3, 2, 'G'], [2, 3, 'G']],
    colors: { O: '#1B1F3B', S: '#9FB4E8', I: '#1B1F3B', F: '#FFFFFF', L: 'rgba(0,0,0,0.28)', G: '#FFC12E' },
    lipOutside: true,
  }),
  night: pixelBox({ note: '夜空のパネル（地のグラデーションを見せる。線は墨と紺の光）', bands: ['O', 'H'], fillCenter: false, colors: { O: { light: INK, dark: '#04071A' }, H: 'night-2', F: 'night', L: 'edge' } }),
  // 夜空の舞台（記録の演出）の上の半透明のパネル
  stage: flat({ O: 'rgba(255,255,255,0.28)', F: 'rgba(255,255,255,0.08)' }, { note: '舞台の上の半透明のパネル' }),
  'stage-gold': flat({ O: 'rgba(255,193,46,0.6)', F: 'rgba(255,193,46,0.15)' }, { note: '舞台の上の金のパネル（クエスト CLEAR）' }),
  'stage-danger': flat({ O: 'rgba(255,255,255,0.4)', F: 'danger' }, { note: '舞台の上の危険の注意' }),
  // お知らせ
  'notice-info': flat({ O: 'line', F: 'surface' }, { note: 'お知らせ（ふつう）' }),
  'notice-demo': flat({ O: 'line', F: 'fill' }, { note: 'お知らせ（デモデータの告知。くぼんだ地）' }),
  'notice-caution': flat({ O: 'gold-edge/0.7', F: 'gold-soft' }, { note: 'お知らせ（注意）' }),
  'notice-danger': flat({ O: 'danger/0.55', F: 'danger/0.07' }, { note: 'お知らせ（危険）' }),
  'notice-night': flat({ O: 'night-2/0.45', F: 'brand-soft' }, { note: 'お知らせ（夜）' }),
  toast: flat({ O: 'rgba(255,255,255,0.22)', F: 'toast' }, { note: 'トースト' }),
  // 入力
  field: flat({ O: 'line', F: 'surface' }, { note: '入力欄' }),
  'field-focus': flat({ O: 'brand', F: 'surface' }, { note: '入力欄（入力中）' }),
  // バー（細いので角は 1 段、線は 1 ドット）
  track: pixelBox({ note: '進み具合のバーの溝', corner: [1], lip: 0, colors: { O: 'line', F: 'fill' } }),
  'track-night': pixelBox({ note: 'XP バーの紺の溝', corner: [1], lip: 0, colors: { O: { light: 'night', dark: '#04071A' }, F: { light: 'night', dark: 'rgba(0,0,0,0.55)' } } }),
  // ── ボタン（押すと沈む）。H は内側の光の線 ──
  'btn-primary': raised({ O: 'brand-pressed', H: { light: '#5A8BF2', dark: '#5C88F5' }, F: 'brand-fill', L: 'brand-pressed' }, { bands: ['O', 'H'], note: 'ボタン（瑠璃）' }),
  'btn-secondary': raised({ O: INK, F: 'surface', L: 'edge' }, { note: 'ボタン（白）' }),
  'btn-gold': raised({ O: 'gold-edge', H: '#FFE08A', F: 'gold', L: 'gold-edge' }, { bands: ['O', 'H'], note: 'ボタン（金）' }),
  'btn-capture': raised({ O: 'capture-edge', H: '#FF8A80', F: 'capture', L: 'capture-edge' }, { bands: ['O', 'H'], note: 'ボタン（撮る・赤）' }),
  'btn-danger': raised({ O: '#78140E', H: { light: '#E0564B', dark: '#FFB0A8' }, F: 'danger', L: '#78140E' }, { bands: ['O', 'H'], note: 'ボタン（消す）' }),
  'btn-line': raised({ O: '#049640', H: '#4ADB86', F: 'line-green', L: '#049640' }, { bands: ['O', 'H'], note: 'ボタン（LINE）' }),
  'btn-stage': raised({ O: 'rgba(255,255,255,0.32)', F: 'rgba(255,255,255,0.12)', L: 'rgba(0,0,0,0.35)' }, { note: 'ボタン（夜空の上）' }),
  // 押せないボタン。ほかのボタンと同じ大きさの絵にする（index.css が :disabled で枠の絵だけ替える）
  'btn-disabled': raised({ O: 'line', F: 'fill-strong', L: 'fill-strong' }, { note: 'ボタン（押せない）' }),
  // ── チップ ──
  'chip-on': raised({ O: 'brand-pressed', F: 'brand-fill', L: 'brand-pressed' }, { note: 'チップ（選んでいる）' }),
  'chip-well': raised({ O: 'line', F: 'fill', L: 'edge' }, { note: 'チップ（グループ・シートの中）' }),
  'panel-danger': raised({ O: 'danger', F: 'surface', L: 'edge' }, { note: '取り消したもの（線が赤）' }),
  'gold-ticket': pixelBox({ note: '金のチケット（地の金のグラデーションを見せる。線は金の縁、内に金の光）', bands: ['O', 'H'], fillCenter: false, colors: { O: 'gold-edge', H: 'gold', F: 'gold', L: 'gold-edge' } }),
  // ── スイッチの溝（切 / 入） ──
  'switch-off': pixelBox({ note: 'スイッチの溝（切）', corner: [1], lip: 0, colors: { O: 'line', F: 'fill-strong' } }),
  'switch-on': pixelBox({ note: 'スイッチの溝（入）', corner: [1], lip: 0, colors: { O: 'xp-edge', F: 'xp' } }),
  // ── 小さな枠つきのタグ（角 1 段、線 1 ドット = 枠の太さ 3px） ──
  'tag-danger': pixelBox({ note: '赤い線の小さなタグ（天然記念物など）', corner: [1], lip: 0, colors: { O: 'capture', F: 'surface' } }),
  nametag: pixelBox({ note: 'メッセージ窓の名札（金）', corner: [1], lip: 0, colors: { O: '#1B1F3B', F: '#FFC12E' } }),
  tag: pixelBox({ note: '枠つきの小さなタグ（白）', corner: [1], lip: 0, colors: { O: INK, F: 'surface' } }),
  'pill-gold': raised({ O: 'gold-edge', F: 'gold-soft', L: 'gold-edge/0.55' }, { note: 'コインの数（金の淡い地）' }),
  // ── 図鑑のタイル（線はタイプの色。記録した種） ──
  ...Object.fromEntries(
    ['mammal', 'bird', 'herp', 'insect', 'aqua', 'plant'].map((t) => [`tile-${t}`, raised({ O: `type-${t}`, F: 'surface', L: 'edge' }, { note: `図鑑のタイル（${t}）` })]),
  ),
  'tile-legend': raised({ O: 'gold-edge', F: 'surface', L: 'edge' }, { note: '図鑑のタイル（幻・未発見）' }),
  // ── タイプの色の面（選んだタイプのチップなど）。線と厚みはタイプの色を暗くした色 ──
  ...Object.fromEntries(
    ['mammal', 'bird', 'herp', 'insect', 'aqua', 'plant'].map((t) => [`type-${t}`, raised({ O: `type-${t}*0.62`, F: `type-${t}`, L: `type-${t}*0.62` }, { note: `タイプの色の面（${t}）` })]),
  ),
  // ── 丸い線（中は透明）。記録ボタンの波紋 ──
  'ring-capture': pixelBox({ note: '記録ボタンの波紋（66px の丸）', corner: circleProfile(22), lip: 0, fillCenter: false, fill: '.', colors: { O: 'capture' } }),
};
