import test from "node:test";
import assert from "node:assert/strict";
import { MAKS_PERCOBAAN, catatGagal, sisaDetikTerkunci, sisaPercobaan, resetPercobaan } from "./loginThrottle.js";

test("kegagalan keenam mengunci 15 menit, refresh mempertahankan jeda, dan kedaluwarsa mereset hitungan", async () => {
  const originalNow = Date.now;
  const values = new Map();
  globalThis.localStorage = { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) };
  let now = 1000000;
  Date.now = () => now;
  try {
    resetPercobaan();
    assert.equal(MAKS_PERCOBAAN, 6);
    for (let i = 0; i < 5; i++) assert.equal(catatGagal().terkunci, false);
    assert.equal(sisaPercobaan(), 1);
    assert.equal(catatGagal().terkunci, true);
    assert.equal(sisaDetikTerkunci(), 900);
    const refreshed = await import("./loginThrottle.js?refresh");
    assert.equal(refreshed.sisaDetikTerkunci(), 900);
    now += 60000;
    catatGagal();
    assert.equal(sisaDetikTerkunci(), 840);
    now += 840000;
    assert.equal(sisaDetikTerkunci(), 0);
    assert.equal(sisaPercobaan(), 6);
    assert.deepEqual(catatGagal(), { terkunci: false, sisa: 5 });
    resetPercobaan();
    assert.equal(sisaPercobaan(), 6);
    // Mode tanpa localStorage tetap membatasi selama halaman terbuka.
    globalThis.localStorage = { getItem() { throw Error(); }, setItem() { throw Error(); }, removeItem() { throw Error(); } };
    for (let i = 0; i < 6; i++) catatGagal();
    assert.equal(sisaDetikTerkunci(), 900);
    now += 900000;
    assert.equal(sisaPercobaan(), 6);
  } finally {
    resetPercobaan();
    Date.now = originalNow;
    delete globalThis.localStorage;
  }
});
