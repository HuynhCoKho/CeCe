# CeCe Global Stats Backend

Backend nay la Google Apps Script nhe cho game CeCe. Lan dau chay, script se tao Google Sheet `CeCe Ocean Typing Stats` trong Drive cua ban va luu:

- `Visitors`: nguoi choi an danh theo trinh duyet.
- `Plays`: so luot bam Bat dau.
- `Scores`: diem khi ket thuc luot choi.

## Cach deploy

1. Vao [script.google.com](https://script.google.com/) va tao project moi.
2. Dan noi dung `Code.gs` vao project.
3. Chay ham `setupCeCeStats` mot lan va cap quyen.
4. Bam `Deploy` > `New deployment`.
5. Chon type `Web app`.
6. `Execute as`: `Me`.
7. `Who has access`: `Anyone`.
8. Copy URL ket thuc bang `/exec`.
9. Dan URL do vao `config.js`:

```js
window.CECE_GAME_CONFIG = {
  STATS_WEB_APP_URL: 'https://script.google.com/macros/s/.../exec'
};
```

Sau do publish lai game len GitHub Pages.
