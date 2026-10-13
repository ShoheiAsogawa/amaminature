import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CollectibleCard } from '../components/CollectibleCard';
import { IconCloudCheck, IconWarning, IconWarningCircleFill } from '../components/icons';
import { loadPhotoUrl } from '../components/PhotoImg';
import {
  Button,
  ConfirmDialog,
  EmptyState,
  Field,
  Group,
  InfoRow,
  Input,
  ListRow,
  ScreenHeader,
  Sheet,
  Textarea,
  toast,
  useDocumentTitle,
} from '../components/ui';
import { AREA_BY_ID } from '../data/areas';
import { SPECIES_BY_ID } from '../data/species';
import { renderShareCard, shareCard } from '../lib/share';
import type { Sighting } from '../lib/types';
import { deleteEverywhere } from '../store/sync';
import { useStore } from '../store/useStore';

// 記録詳細（docs/DESIGN_SYSTEM.md §8.6）。図鑑カード（影なし、裏返らない）と、記録の項目のグループ。

const ROAD_LABEL = { roadkill: '交通事故にあった生き物', injured: 'けがをしている生き物', 'on-road': '路上にいた生き物' } as const;

/** 位置の行の値（座標そのものは出さない） */
function locationText(s: Sighting): string {
  if (s.locationProtected) return '希少種のため座標は保存していません';
  if (s.lat != null && s.lng != null) return '約100mぼかして保存';
  return '詳しい位置は保存していません';
}

/** 同期の行。LINE 連携していない（端末だけに保存した）記録は出さない */
const REJECT_TEXT: Record<NonNullable<Sighting['rejectReason']>, { title: string; note: string }> = {
  duplicate: { title: '保存されていません', note: '同じ写真の記録があるため、クラウドに保存していません。ポイントの対象外です' },
  invalid: { title: '保存されていません', note: '日時が古すぎるなど、クラウドに保存できない記録でした。ポイントの対象外です' },
  revoked: { title: 'ポイントの対象外', note: '運営の確認により、この記録はポイントの対象外になりました' },
};

function SyncValue({ state, reason }: { state: NonNullable<Sighting['syncState']>; reason?: Sighting['rejectReason'] }) {
  if (state === 'synced') {
    return (
      <span className="inline-flex items-center gap-1.5">
        同期済み
        <IconCloudCheck size={16} className="shrink-0 text-success" />
      </span>
    );
  }
  if (state === 'pending') {
    return (
      <>
        <span className="inline-flex items-center gap-1.5">
          未同期
          <IconWarning size={16} className="shrink-0 text-warning" />
        </span>
        <span className="mt-0.5 block text-sub text-fg-2">電波が戻ったら送信します</span>
      </>
    );
  }
  const text = REJECT_TEXT[reason ?? 'duplicate'];
  return (
    <>
      <span className="inline-flex items-center gap-1.5">
        {text.title}
        <IconWarningCircleFill size={16} className="shrink-0 text-danger" />
      </span>
      <span className="mt-0.5 block text-sub text-fg-2">{text.note}</span>
    </>
  );
}

export default function SightingDetail() {
  const { id = '' } = useParams();
  const sighting = useStore((s) => s.sightings.find((x) => x.id === id));
  const sp = sighting?.speciesId ? SPECIES_BY_ID[sighting.speciesId] : null;
  // §7.3 ニックネーム（なければ和名）
  useDocumentTitle(sighting ? sighting.nickname || sp?.name || sighting.customName || '記録' : '記録');

  if (!sighting) {
    return (
      <main>
        <ScreenHeader variant="nav" title="記録" />
        <EmptyState title="記録が見つかりません" body="削除されたか、別の端末の記録です" actionLabel="ホームへ" to="/" />
      </main>
    );
  }
  return <Detail sighting={sighting} />;
}

function Detail({ sighting }: { sighting: Sighting }) {
  const navigate = useNavigate();
  const updateSighting = useStore((s) => s.updateSighting);
  const lineMode = useStore((s) => s.account.mode === 'line');
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [nickname, setNickname] = useState(sighting.nickname ?? '');
  const [memo, setMemo] = useState(sighting.memo ?? '');
  const [busy, setBusy] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const sp = sighting.speciesId ? SPECIES_BY_ID[sighting.speciesId] : null;
  const area = sighting.areaId ? AREA_BY_ID[sighting.areaId] : null;
  const title = sighting.nickname || sp?.name || sighting.customName || '記録';

  const share = async () => {
    if (busy) return;
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

  const openEdit = () => {
    setNickname(sighting.nickname ?? '');
    setMemo(sighting.memo ?? '');
    setEditing(true);
  };

  return (
    <main className="pb-[calc(32px+var(--safe-bottom))]">
      <ScreenHeader variant="nav" title={title} />

      {/* 図鑑カードを fill の台に置き、白いページから切り離す（カードに日付と市町村が入っているので、項目には繰り返さない） */}
      <div className="mt-2 flex justify-center bg-fill px-4 py-8">
        <CollectibleCard
          species={sp}
          nickname={sighting.nickname}
          name={sighting.customName}
          photoId={sighting.photoId}
          observedAt={sighting.observedAt}
          areaName={area?.name}
        />
      </div>

      <div className="mt-6 flex gap-2 px-4">
        {/* 共有が主な操作。LINE の中では LINE で送る。LINE の外（デモ）では LINE グリーンを使わない */}
        <Button variant={lineMode ? 'line' : 'primary'} size="md" className="flex-[2]" onClick={share} aria-busy={busy}>
          {lineMode ? 'LINEで送る' : '画像を共有'}
        </Button>
        <Button variant="secondary" size="md" className="flex-1" onClick={openEdit}>
          編集
        </Button>
      </div>

      <Group className="mt-6">
        {sighting.roadReport && <InfoRow label="路上レポート">{ROAD_LABEL[sighting.roadReport]}</InfoRow>}
        {/* 希少種のカードには市町村名を入れないので、ここにだけ出す */}
        {sp?.sensitive && area && <InfoRow label="地域">{area.name}</InfoRow>}
        {sighting.memo && (
          <InfoRow label="メモ">
            <span className="whitespace-pre-wrap">{sighting.memo}</span>
          </InfoRow>
        )}
        {sighting.kind === 'sign' && <InfoRow label="写真">なし（声・痕跡・目撃の記録）</InfoRow>}
        <InfoRow label="位置">{locationText(sighting)}</InfoRow>
        {sighting.syncState && (
          <InfoRow label="同期">
            <SyncValue state={sighting.syncState} reason={sighting.rejectReason} />
          </InfoRow>
        )}
      </Group>

      <div className="mt-6">
        {sp && <ListRow to={`/species/${sp.id}`} title="この生き物の図鑑を見る" chevron />}
      </div>
      <div className="px-3 pt-2">
        <Button variant="danger-text" size="hit" onClick={() => setConfirmDelete(true)}>
          この記録を削除
        </Button>
      </div>

      <Sheet open={editing} onClose={() => setEditing(false)} title="記録を編集" keyboard>
        <div className="space-y-4">
          <Field label="ニックネーム">
            <Input value={nickname} onChange={(e) => setNickname(e.target.value)} maxLength={24} />
          </Field>
          <Field label="メモ">
            <Textarea value={memo} onChange={(e) => setMemo(e.target.value)} rows={4} maxLength={500} />
          </Field>
          <Button
            onClick={async () => {
              await updateSighting({ ...sighting, nickname: nickname.trim(), memo: memo.trim() });
              setEditing(false);
              toast('保存しました');
            }}
          >
            保存する
          </Button>
        </div>
      </Sheet>

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="この記録を削除しますか？"
        body="写真もあわせて削除されます。この操作は取り消せません。"
        confirmLabel="削除する"
        busy={deleting}
        onConfirm={async () => {
          setDeleting(true);
          try {
            await deleteEverywhere(sighting);
            toast('削除しました');
            navigate(-1);
          } catch {
            toast('削除できませんでした。もう一度お試しください');
            setDeleting(false);
          }
        }}
      />
    </main>
  );
}
