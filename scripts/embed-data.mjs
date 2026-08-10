// dist-single/index.html 에 data/ 폴더의 JSON 일체를 인라인 → 진정한 단일 HTML 생성
// 결과: dist-single/index_embedded.html (더블클릭 실행, file:// CORS 차단 회피)
//
// 키는 앱이 쓰는 base 상대 경로와 동일하게 'data/...' 형태로 넣는다
// (src/utils/dataLoader.js 의 fetchData 가 window.__EMBEDDED_DATA__[relPath] 를 먼저 본다).
import fs from 'node:fs';
import path from 'node:path';

const dist = 'dist-single';
const srcHtml = path.join(dist, 'index.html');
const outHtml = path.join(dist, 'index_embedded.html');

if (!fs.existsSync(srcHtml)) {
  console.error('단일 HTML 빌드(dist-single/index.html)가 없음. 먼저 `npm run build:single` 실행.');
  process.exit(1);
}

const dataDir = path.join(dist, 'data');
if (!fs.existsSync(dataDir)) {
  console.error(`데이터 폴더가 없음: ${dataDir}`);
  process.exit(1);
}

const dataFiles = {};
function walk(dir, prefix) {
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    const rel = path.posix.join(prefix, f);
    if (fs.statSync(p).isDirectory()) walk(p, rel);
    else if (/\.(json|topojson)$/i.test(f)) dataFiles[rel] = JSON.parse(fs.readFileSync(p, 'utf8'));
  }
}
walk(dataDir, 'data');
console.log('인라인 대상 데이터 파일 수:', Object.keys(dataFiles).length);

let html = fs.readFileSync(srcHtml, 'utf8');
// </script> 문자열이 JSON 안에 있으면 HTML 파싱이 깨지므로 이스케이프
const payload = JSON.stringify(dataFiles).replace(/<\//g, '<\\/');
const inline = `<script>window.__EMBEDDED_DATA__=${payload};</script>`;

// 문서의 첫 <head> 바로 뒤에 삽입한다.
//  - 앱 번들보다 먼저 실행되어야 데이터가 준비된 상태로 시작한다.
//  - '</head>' 문자열 치환은 쓸 수 없다: 인라인된 xlsx 번들 안에 HTML 조각 문자열이
//    들어 있어 첫 '</head>'가 번들 내부에 잡히고, 그 자리에 끼워 넣으면 번들이 깨진다.
const headMatch = html.match(/<head(\s[^>]*)?>/i);
if (!headMatch) {
  console.error('index.html 에서 <head> 태그를 찾지 못함.');
  process.exit(1);
}
const at = headMatch.index + headMatch[0].length;
html = html.slice(0, at) + inline + html.slice(at);

fs.writeFileSync(outHtml, html);
const sizeMB = (fs.statSync(outHtml).size / 1024 / 1024).toFixed(2);
console.log(`생성 완료: ${outHtml} (${sizeMB} MB)`);
