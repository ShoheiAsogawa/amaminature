// ブランドの印（src/components/Brand.tsx の MARK_L・MARK_S）の図形を作るスクリプト。
// 使い方: node scripts/logo-mark.mjs → { three, one16 } の path の配列を JSON で出力する（viewBox 0 0 48 48）。
// three: 丸に三つ羊歯（24px 以上）/ one16: 丸に一枚の羊歯（20px 以下）。
const f = (n) => +n.toFixed(1);
// 羽状の葉（羊歯）。基点 B から角度 a（ラジアン、0 = 上）へ長さ L、曲がり bend
function frond(o) { const { B, a, L, bend = 0, pairs = 5, l0 = 6, w0 = 2, rachis = 1.6, spread = 0.95, taper = 0.75, start = 0.18, curl = 0 } = o;
  const P = (t) => {
    // 中心線: 基点から a 方向へ、bend で横に曲げる
    const along = L * t, side = bend * t * t + (curl ? curl * Math.max(0, t - 0.8) ** 2 * 25 : 0);
    const ux = Math.sin(a), uy = -Math.cos(a); // 前
    const nx = Math.cos(a), ny = Math.sin(a); // 右
    return [B[0] + ux * along + nx * side, B[1] + uy * along + ny * side];
  };
  const dir = (t) => { const p = P(Math.max(0, t - 0.01)), q = P(Math.min(1, t + 0.01)); const l = Math.hypot(q[0] - p[0], q[1] - p[1]); return [(q[0] - p[0]) / l, (q[1] - p[1]) / l]; };
  const paths = [];
  // 軸（細い多角形）
  const N = 30, Lp = [], Rp = [];
  for (let i = 0; i <= N; i++) { const t = i / N, p = P(t), [dx, dy] = dir(t), w = rachis / 2 * (1 - t * 0.5); Lp.push([p[0] - dy * w, p[1] + dx * w]); Rp.push([p[0] + dy * w, p[1] - dx * w]); }
  paths.push('M' + [...Lp, ...Rp.reverse()].map(([x, y]) => `${f(x)} ${f(y)}`).join('L') + 'Z');
  const leaf = (p, ang, len, wid) => {
    const ux = Math.cos(ang), uy = Math.sin(ang), nx = -uy, ny = ux;
    const tip = [p[0] + ux * len, p[1] + uy * len];
    const m1 = [p[0] + ux * len * 0.35 + nx * wid, p[1] + uy * len * 0.35 + ny * wid];
    const m2 = [p[0] + ux * len * 0.35 - nx * wid, p[1] + uy * len * 0.35 - ny * wid];
    return `M${f(p[0])} ${f(p[1])}C${f(m1[0])} ${f(m1[1])} ${f(tip[0] + nx * wid * 0.4)} ${f(tip[1] + ny * wid * 0.4)} ${f(tip[0])} ${f(tip[1])}C${f(tip[0] - nx * wid * 0.4)} ${f(tip[1] - ny * wid * 0.4)} ${f(m2[0])} ${f(m2[1])} ${f(p[0])} ${f(p[1])}Z`;
  };
  for (let k = 0; k < pairs; k++) {
    const t = start + ((0.92 - start) * k) / pairs;
    const p = P(t), [dx, dy] = dir(t), base = Math.atan2(dy, dx);
    const prof = o.lance ? Math.sin(Math.PI * (0.12 + t * 0.86)) ** 0.9 : (1 - t * taper); const len = l0 * prof, wid = w0 * (0.35 + 0.65 * prof);
    paths.push(leaf(p, base - spread, len, wid));
    paths.push(leaf(p, base + spread, len, wid));
  }
  const tp = P(1), [dx, dy] = dir(1);
  paths.push(leaf(P(0.9), Math.atan2(dy, dx), L * 0.14, w0 * 0.5));
  return paths;
}
function kamon({ ring = true, ringW = 2.6, fronds }) {
  const out = [];
  if (ring) out.push(`M24 1.5A22.5 22.5 0 1 1 23.99 1.5ZM24 ${1.5 + ringW}A${22.5 - ringW} ${22.5 - ringW} 0 1 0 24.01 ${1.5 + ringW}Z`);
  for (const fr of fronds) out.push(...frond(fr));
  return out;
}
const R = Math.PI / 180;
const v = {
  three: kamon({ ringW: 2.4, fronds: [
    { B: [22.6, 42.5], a: -47 * R, L: 23, bend: -3.5, pairs: 7, l0: 6.2, w0: 1.6, rachis: 1.4, spread: 1.22, lance: true, start: 0.24 },
    { B: [25.4, 42.5], a: 47 * R, L: 23, bend: 3.5, pairs: 7, l0: 6.2, w0: 1.6, rachis: 1.4, spread: 1.22, lance: true, start: 0.24 },
    { B: [24, 43], a: 0, L: 34, pairs: 9, l0: 7.8, w0: 1.85, rachis: 1.6, spread: 1.25, lance: true, start: 0.2 },
  ] }),
  one16: kamon({ ringW: 3.4, fronds: [ { B: [14, 36], a: 42 * R, L: 29, bend: -2, pairs: 5, l0: 9.5, w0: 2.9, rachis: 2.8, spread: 1.12, lance: true, start: 0.14 } ] }),
};
console.log(JSON.stringify(v));