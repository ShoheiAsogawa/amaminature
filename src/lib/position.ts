/** 端末の現在地（ブラウザ専用。geo.ts はWorkerと共有するため分けている） */
export function getCurrentPosition(timeoutMs = 10000): Promise<{ lat: number; lng: number }> {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('この端末では位置情報を利用できません'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => reject(new Error(err.code === 1 ? '位置情報の利用が許可されていません' : '現在地を取得できませんでした')),
      { enableHighAccuracy: true, timeout: timeoutMs, maximumAge: 60000 },
    );
  });
}
