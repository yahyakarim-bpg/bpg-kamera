/**
 * BPG Kamera — Album Bersama (Google Apps Script)
 * Menyimpan gambar ke Google Drive (satu folder setiap acara) dan merekod log dalam Google Sheets.
 *
 * Deploy: Deploy > New deployment > Web app
 *   Execute as: Me   |   Who has access: Anyone
 * Salin URL /exec ke CONFIG.ALBUM_URL dalam index.html (atau Tetapan dalam app).
 */

const FOLDER_ID = '';   // Kosongkan untuk auto-cipta folder "BPG Kamera - Album" dalam Drive anda
const KUNCI     = '';   // Pilihan: kunci ringkas supaya hanya warga BPG boleh hantar/lihat
const HAD_SENARAI = 300; // Bilangan gambar terkini dipaparkan dalam tab Album

function doGet(e) {
  const p = (e && e.parameter) || {};
  try {
    if (p.action === 'list') {
      if (KUNCI && p.key !== KUNCI) return json_({ ok: false, error: 'Kunci album tidak sah' });
      return json_({ ok: true, items: senarai_(p.acara || '') });
    }
    return json_({ ok: true, app: 'BPG Kamera API', versi: '1.1' });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

function doPost(e) {
  try {
    const d = JSON.parse(e.postData.contents);
    if (KUNCI && d.key !== KUNCI) return json_({ ok: false, error: 'Kunci album tidak sah' });
    if (d.action === 'upload') return json_(muatNaik_(d));
    return json_({ ok: false, error: 'Tindakan tidak dikenali' });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

function muatNaik_(d) {
  if (!d.image) throw new Error('Tiada imej');
  const m = d.meta || {};
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  let folder;
  try { folder = subFolder_(akar_(), bersih_(m.acara) || 'Umum'); }
  finally { lock.releaseLock(); }

  const nama = String(d.name || ('BPG_' + Date.now() + '.jpg')).replace(/[\\/:*?"<>|]/g, '_');
  const blob = Utilities.newBlob(Utilities.base64Decode(d.image), 'image/jpeg', nama);
  const f = folder.createFile(blob);
  f.setDescription(JSON.stringify({
    acara: m.acara || '', kategori: m.kategori || '', nama: m.nama || '',
    caption: m.caption || '', lokasi: m.lokasi || '', t: m.t || Date.now(),
    cabaran: m.cabaran || '', tarikh: m.tarikh || '', tempat: m.tempat || ''
  }));
  try { f.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); }
  catch (x) {
    // Polisi domain mungkin menyekat perkongsian awam — cuba kongsi dalam domain
    try { f.setSharing(DriveApp.Access.DOMAIN_WITH_LINK, DriveApp.Permission.VIEW); } catch (y) {}
  }
  log_(f, m);
  return { ok: true, id: f.getId(), url: f.getUrl() };
}

function senarai_(acara) {
  const root = akar_();
  const folders = [];
  if (acara) {
    const it = root.getFoldersByName(bersih_(acara));
    if (!it.hasNext()) return [];
    folders.push(it.next());
  } else {
    folders.push(root);
    const it = root.getFolders();
    while (it.hasNext()) folders.push(it.next());
  }
  const out = [];
  folders.forEach(fo => {
    const fi = fo.getFilesByType(MimeType.JPEG);
    let n = 0;
    while (fi.hasNext() && n < 400) {
      const f = fi.next(); n++;
      let meta = {};
      try { meta = JSON.parse(f.getDescription() || '{}'); } catch (x) {}
      const id = f.getId();
      out.push({
        id: id, name: f.getName(), t: f.getDateCreated().getTime(),
        thumb: 'https://drive.google.com/thumbnail?id=' + id + '&sz=w600',
        big: 'https://drive.google.com/thumbnail?id=' + id + '&sz=w1600',
        view: f.getUrl(), meta: meta
      });
    }
  });
  out.sort((a, b) => b.t - a.t);
  return out.slice(0, HAD_SENARAI);
}

function akar_() {
  if (FOLDER_ID) return DriveApp.getFolderById(FOLDER_ID);
  const props = PropertiesService.getScriptProperties();
  const id = props.getProperty('ROOT');
  if (id) { try { return DriveApp.getFolderById(id); } catch (x) {} }
  const f = DriveApp.createFolder('BPG Kamera - Album');
  props.setProperty('ROOT', f.getId());
  return f;
}

function subFolder_(parent, name) {
  const it = parent.getFoldersByName(name);
  return it.hasNext() ? it.next() : parent.createFolder(name);
}

function log_(f, m) {
  try {
    const props = PropertiesService.getScriptProperties();
    let ss, id = props.getProperty('SHEET');
    if (id) { try { ss = SpreadsheetApp.openById(id); } catch (x) {} }
    if (!ss) {
      ss = SpreadsheetApp.create('BPG Kamera - Log Gambar');
      ss.getSheets()[0].appendRow(['Masa terima', 'Acara', 'Kategori', 'Jurugambar', 'Kapsyen', 'Lokasi', 'Masa gambar', 'Pautan', 'Cabaran']);
      ss.getSheets()[0].setFrozenRows(1);
      DriveApp.getFileById(ss.getId()).moveTo(akar_());
      props.setProperty('SHEET', ss.getId());
    }
    ss.getSheets()[0].appendRow([new Date(), m.acara || '', m.kategori || '', m.nama || '', m.caption || '',
      m.lokasi || '', m.t ? new Date(m.t) : '', f.getUrl(), m.cabaran || '']);
  } catch (x) { console.warn(x); }
}

function bersih_(s) { return String(s || '').replace(/[\\/:*?"<>|]/g, ' ').trim().slice(0, 80); }

function json_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}

/** Jalankan sekali dari editor untuk memberi kebenaran Drive & Sheets */
function sediakan() {
  const r = akar_();
  Logger.log('Folder album: ' + r.getUrl());
}
