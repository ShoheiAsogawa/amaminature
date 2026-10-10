import { Calendar, CloudOff, EyeOff, MapPin, Pencil, Share2, Trash2, TriangleAlert } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { loadPhotoUrl, PhotoImg } from '../components/PhotoImg';
import { CategoryIcon, EmptyState, formatDate, PageHeader, RarityGems, Sheet, toast } from '../components/ui';
import { AREA_BY_ID } from '../data/areas';
import { CATEGORY_META, SPECIES_BY_ID } from '../data/species';
import { renderShareCard, shareCard } from '../lib/share';
import { deleteEverywhere } from '../store/sync';
import { useStore } from '../store/useStore';

const ROAD_LABEL = { roadkill: 'ロードキル報告', injured: 'けがをした動物の報告', 'on-road': '路上にいた生き物' } as const;

export default function SightingDetail() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const sighting = useStore((s) => s.sightings.find((x) => x.id === id));
  const updateSighting = useStore((s) => s.updateSighting);
  const lineMode = useStore((s) => s.account.mode === 'line');
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [nickname, setNickname] = useState(sighting?.nickname ?? '');
  const [memo, setMemo] = useState(sighting?.memo ?? '');
  const [busy, setBusy] = useState(false);

  if (!sighting) {
    return (
      <>
        <PageHeader back title="記録" />
        <EmptyState title="記録が見つかりません" action={<Link to="/" className="btn-ghost">ホームへ</Link>} />
      </>
    );
  }

  const sp = sighting.speciesId ? SPECIES_BY_ID[sighting.speciesId] : null;
  const area = sighting.areaId ? AREA_BY_ID[sighting.areaId] : null;

  const share = async () => {
    setBusy(true);
    try {
      const url = sighting.photoId ? await loadPhotoUrl(sighting.photoId, 'full') : null;
      const card = await renderShareCard({ sighting, species: sp, photoUrl: url });
      const how = await shareCard({ card, species: sp, lineMode });
      if (how === 'download') toast('カード画像を保存しました');
    } catch {
      toast('共有できませんでした');
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="pb-[calc(40px+var(--safe-bottom))]">
      <PageHeader
        back
        label="FIELD NOTE"
        title={sighting.nickname || sp?.name || sighting.customName || '記録'}
        right={
          <button onClick={share} disabled={busy} className="grid h-10 w-10 place-items-center rounded-full active:bg-ink/5" aria-label="共有">
            <Share2 className="h-5 w-5" />
          </button>
        }
      />

      <div className="px-4">
        {sighting.photoId ? (
          <PhotoImg photoId={sighting.photoId} size="full" alt={sp?.name ?? ''} className="aspect-[4/5] w-full rounded-4xl shadow-lift" />
        ) : (
          <div className="grid aspect-[4/3] place-items-center rounded-4xl text-white" style={{ background: sp ? CATEGORY_META[sp.category].color : '#808C86' }}>
            {sp && <CategoryIcon category={sp.category} className="h-16 w-16 opacity-70" />}
            <span className="text-[12px] text-white/80">写真なしの記録（声・痕跡・目撃）</span>
          </div>
        )}
      </div>

      {sighting.roadReport && (
        <div className="mx-4 mt-4 flex items-center gap-2 rounded-2xl bg-sango/10 px-4 py-3 text-[13px] font-bold text-sango">
          <TriangleAlert className="h-4 w-4" /> {ROAD_LABEL[sighting.roadReport]}
        </div>
      )}

      <section className="mx-4 mt-4 card p-5">
        {sp ? (
          <Link to={`/species/${sp.id}`} className="flex items-center justify-between">
            <div>
              <RarityGems rarity={sp.rarity} size={6} />
              <div className="mt-1 font-serif text-[22px] font-bold">{sp.name}</div>
              <div className="sci text-[14px] text-ink3">{sp.sci}</div>
            </div>
            <span className="text-[12px] font-bold text-accent">図鑑へ</span>
          </Link>
        ) : (
          <div>
            <div className="label">図鑑にない生き物</div>
            <div className="mt-1 font-serif text-[22px] font-bold">{sighting.customName || 'なぞの生き物'}</div>
          </div>
        )}
        {sighting.nickname && <div className="mt-3 text-[15px] font-bold text-kin">「{sighting.nickname}」</div>}
        {sighting.memo && <p className="mt-3 whitespace-pre-wrap text-[14px] leading-relaxed text-ink2">{sighting.memo}</p>}

        <dl className="mt-4 space-y-2 border-t hairline pt-4 text-[13px]">
          <div className="flex items-center gap-2 text-ink2">
            <Calendar className="h-4 w-4 text-ink3" />
            {formatDate(sighting.observedAt, true)}
          </div>
          <div className="flex items-center gap-2 text-ink2">
            <MapPin className="h-4 w-4 text-ink3" />
            {area ? `${area.name}（${area.island}）` : '地域未設定'}
          </div>
          {sighting.locationProtected && (
            <div className="flex items-center gap-2 text-ink2">
              <EyeOff className="h-4 w-4 text-ink3" /> 希少種のため座標は保存していません
            </div>
          )}
          {sighting.syncState === 'rejected' && (
            <div className="flex items-center gap-2 text-danger">
              <CloudOff className="h-4 w-4" /> 同じ写真の記録があるため、クラウドに保存されていません（ポイント対象外）
            </div>
          )}
          {sighting.syncState === 'pending' && (
            <div className="flex items-center gap-2 text-ink2">
              <CloudOff className="h-4 w-4 text-ink3" /> 電波が戻ったら送信します
            </div>
          )}
        </dl>
      </section>

      <div className="mx-4 mt-4 grid grid-cols-2 gap-2">
        <button className="btn-ghost" onClick={() => setEditing(true)}>
          <Pencil className="h-4 w-4" /> 編集
        </button>
        <button className="btn-ghost text-danger" onClick={() => setConfirmDelete(true)}>
          <Trash2 className="h-4 w-4" /> 削除
        </button>
      </div>

      <Sheet open={editing} onClose={() => setEditing(false)} title="記録を編集">
        <div className="space-y-4">
          <label className="block">
            <span className="label mb-1.5 block">ニックネーム</span>
            <input value={nickname} onChange={(e) => setNickname(e.target.value)} className="input" maxLength={24} />
          </label>
          <label className="block">
            <span className="label mb-1.5 block">メモ</span>
            <textarea value={memo} onChange={(e) => setMemo(e.target.value)} rows={4} className="input resize-none" maxLength={500} />
          </label>
          <button
            className="btn-primary w-full"
            onClick={async () => {
              await updateSighting({ ...sighting, nickname: nickname.trim(), memo: memo.trim() });
              setEditing(false);
              toast('保存しました');
            }}
          >
            保存する
          </button>
        </div>
      </Sheet>

      <Sheet open={confirmDelete} onClose={() => setConfirmDelete(false)} title="この記録を削除しますか？">
        <p className="text-[13px] text-ink2">写真もあわせて削除されます。この操作は取り消せません。</p>
        <div className="mt-5 grid gap-2">
          <button
            className="btn bg-danger text-white"
            onClick={async () => {
              await deleteEverywhere(sighting);
              toast('削除しました');
              navigate(-1);
            }}
          >
            削除する
          </button>
          <button className="btn-ghost" onClick={() => setConfirmDelete(false)}>
            やめる
          </button>
        </div>
      </Sheet>
    </main>
  );
}
