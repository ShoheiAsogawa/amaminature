// framer-motion の機能（アニメーション、ジェスチャー、layoutId のレイアウト）。
// App.tsx の <LazyMotion> が起動後に非同期で読み込む（メインのチャンクを軽くするため。docs/DESIGN_SYSTEM.md §13.2）。
// 画面では motion.* ではなく m.* を使う（LazyMotion の strict で motion.* は使えない）。
import { domMax } from 'framer-motion';

export default domMax;
