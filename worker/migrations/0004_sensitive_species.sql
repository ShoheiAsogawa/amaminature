-- 採集・営巣地の保護が必要な種を「位置を保存しない種」に加えた（フェリエベニボシカミキリ・オーストンオオアカゲラ）。
-- すでに保存している約100mの座標も消す（市町村は残す）
UPDATE sightings SET lat = NULL, lng = NULL, location_protected = 1
WHERE species_id IN ('ferie-beniboshi', 'ooston-ooakagera') AND (lat IS NOT NULL OR lng IS NOT NULL);
