# BPG Kamera: panduan pemasangan

BPG Kamera ialah aplikasi web (PWA). Pengguna hanya perlu mengimbas QR untuk membukanya, tanpa memasang apa-apa. Boleh juga ditambah ke Skrin Utama supaya dibuka seperti aplikasi biasa dan tetap berfungsi tanpa internet.

## Fail
| Fail | Fungsi |
|---|---|
| `index.html` | Keseluruhan aplikasi: kamera, editor, galeri, album, QR dan tetapan |
| `manifest.json`, `sw.js`, `icon-*.png` | Membolehkan app dipasang dan berfungsi luar talian |
| `Code.gs` | Pelayan Album Bersama BPG (Google Apps Script → Google Drive + Sheets) |

## Langkah 1: Album Bersama (Apps Script)
1. Pergi ke script.google.com dan cipta projek baharu bernama **BPG Kamera API**. Tampal kandungan `apps-script/Code.gs`.
2. (Pilihan) Isikan `KUNCI` jika mahu album berkunci.
3. Jalankan fungsi `sediakan` sekali, kemudian benarkan akses Drive & Sheets.
4. Pilih **Deploy → New deployment → Web app**, tetapkan *Execute as: Me* dan *Who has access: Anyone*.
5. Salin URL `.../exec`.

Gambar akan masuk ke folder **"BPG Kamera - Album"** dalam Drive anda, dengan satu subfolder untuk setiap acara. Setiap gambar juga direkodkan dalam Sheet **"BPG Kamera - Log Gambar"**.

## Langkah 2: Hos aplikasi (HTTPS diperlukan untuk kamera)
Cara paling mudah ialah **GitHub Pages**:
1. Cipta repo `bpg-kamera` (cth. di akaun `yahyakarim-bpg`) dan muat naik semua fail kecuali `Code.gs`.
2. Buka **Settings → Pages**, pilih *Deploy from branch* → `main` / root.
3. Pautan app anda akan jadi seperti `https://yahyakarim-bpg.github.io/bpg-kamera/`.

Dalam `index.html`, tampal URL Apps Script pada `CONFIG.ALBUM_URL` (dan `ALBUM_KEY` jika ada). Selepas itu semua pengguna terus bersambung ke album tanpa perlu menetapkan apa-apa.

## Langkah 3: QR
Buka app dan pergi ke tab **QR**:
- **QR Aplikasi**: untuk poster umum BPG.
- **QR Acara**: taip nama acara untuk menjana QR khas. Peserta yang mengimbasnya akan terus berada dalam acara itu, dan gambar mereka masuk ke folder acara yang sama.
- **Poster QR** menghasilkan poster A4 yang sedia dicetak.

## Nota
- iPhone: kamera berfungsi dalam Safari (iOS 14.3 ke atas). Lampu suluh hanya disokong di Android Chrome.
- Jika polisi domain moe.gov.my menyekat perkongsian awam, pratonton dalam tab Album hanya akan dipaparkan kepada pengguna yang log masuk akaun KPM. Fail tetap disimpan seperti biasa.
- Gambar dalam Galeri disimpan dalam peranti pengguna (IndexedDB). Album Bersama pula ialah salinan rasmi dalam Drive.
