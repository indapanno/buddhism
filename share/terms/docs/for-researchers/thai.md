# ตัวนำทางประวัติคำศัพท์บาลี — สำหรับนักวิจัยและนักพัฒนา

เอกสารทางเทคนิค อธิบายสถาปัตยกรรม โครงสร้างข้อมูล และวิธีการติดตั้งเว็บไซต์แบบ static
สำหรับคำแนะนำการเพิ่มคำศัพท์ผ่านหน้าเว็บ โปรดดู
[how-to-add-term_thai.html](../../html/how-to-add-term_thai.html)

## เทคโนโลยีที่ใช้

- Frontend: HTML/CSS/vanilla JS ล้วน ไม่ใช้ framework หรือ bundler (ไม่มี webpack/vite)
- การ build: สคริปต์ Node.js ทำงานบน GitHub Actions (ไม่ต้องมี Node ในเครื่อง หากไม่แก้โค้ด build)
- Hosting: GitHub Pages, `Deploy from branch main, /root`
- ข้อมูล: ไฟล์ JSON เก็บใน git ไม่มีฐานข้อมูลหรือ backend
- การตรวจสอบข้อมูล: JSON Schema (draft-07) + ตัวตรวจสอบฝั่งไคลเอนต์ที่ไม่ต้องพึ่ง library ภายนอก
- สถิติผู้เข้าชม: GoatCounter (ตัวนับภายนอก ไม่ใช้ cookies)

## โครงสร้าง repository

```
share/terms/
├── json/
│   ├── <id>_ru.json          # ข้อมูลต้นทาง หนึ่งไฟล์ต่อหนึ่งภาษาต่อหนึ่งคำศัพท์
│   ├── <id>_thai.json
│   ├── index_ru.json         # ไฟล์รายการสำหรับค้นหา — สร้างอัตโนมัติ ห้ามแก้ด้วยมือ
│   └── index_thai.json
├── schema/
│   ├── term.schema.ru.json    # JSON Schema (draft-07) สำหรับ <id>_ru.json — แก้ไขด้วยมือ
│   └── term.schema.thai.json  # เช่นเดียวกัน สำหรับ <id>_thai.json
├── js/
│   ├── render-term.js        # โมดูลเรนเดอร์การ์ดคำศัพท์ร่วมกัน (Node + เบราว์เซอร์)
│   ├── term-prompt-ru.js     # ข้อความพรอมต์สำหรับให้ AI สร้างคำศัพท์ (RU)
│   ├── term-prompt-thai.js   # เช่นเดียวกัน สำหรับภาษาไทย
│   ├── term-prompt-widget.js # ตรรกะของปุ่ม «คัดลอกพรอมต์»
│   ├── json-validator.js     # แกนหลักของตัวตรวจสอบ JSON แบบออนไลน์ (ไม่พึ่ง library ทำงานได้ทั้งในเบราว์เซอร์และ Node)
│   ├── validator-page.js     # ตรรกะของหน้า «ตรวจสอบ JSON» (how-to-check-json_*.html)
│   ├── search.js, lang.js, theme.js, burger-menu.js,
│   │   footer-counter.js, term-count.js, thai-numerals.js
├── css/
│   ├── style.css
│   └── validator.css          # สไตล์ของหน้า «ตรวจสอบ JSON»
├── template/                  # แม่แบบ — แก้ไขด้วยมือ
│   ├── _template_ru.html      # แม่แบบการ์ด
│   ├── _template_thai.html
│   ├── _template_nav_ru.html  # แม่แบบหน้านำทาง
│   └── _template_nav_thai.html
├── html/                      # หน้าเว็บทั้งหมด (path ของ css/js อยู่สูงขึ้นหนึ่งระดับ)
│   ├── <id>_ru.html            # สร้างอัตโนมัติจากแม่แบบ + JSON ห้ามแก้ด้วยมือ
│   ├── <id>_thai.html
│   ├── nav_ru.html, nav_ru_2.html, …   # สร้างอัตโนมัติ แบ่งหน้าละ 10 คำศัพท์
│   ├── nav_thai.html, …
│   ├── how-to-add-term_ru.html    # ไฟล์คงที่ แก้ไขด้วยมือ
│   ├── how-to-add-term_thai.html
│   ├── how-to-translate-term_ru.html
│   ├── how-to-translate-term_thai.html
│   ├── how-to-check-json_ru.html  # ไฟล์คงที่ แก้ไขด้วยมือ — หน้า «ตรวจสอบ JSON»
│   └── how-to-check-json_thai.html
├── sitemap.xml                 # สร้างอัตโนมัติ ห้ามแก้ด้วยมือ
└── docs/for-researchers/ru.md, thai.md   # เอกสารนี้

.github/
├── scripts/build-terms.js     # สคริปต์ Node.js สำหรับ build
└── workflows/build-terms.yml  # trigger: push เข้า share/terms/json/**
```

นอกจาก `share/terms/` แล้ว ที่ root ของ repository ยังมีไฟล์ยืนยันความเป็นเจ้าของสำหรับ
search engine (`google<code>.html`, `yandex_<code>.html`) — เป็นไฟล์คงที่ อย่าลบหลังยืนยัน
สำเร็จแล้ว Yandex ต่างจาก Google และ Bing ตรงที่ยืนยันสิทธิ์ได้เฉพาะระดับทั้งโดเมน
`indapanno.github.io` เท่านั้น ไม่รองรับ path `/buddhism/` — จึงต้องมี repository แยก
ชื่อ `indapanno.github.io` (ชื่อสงวนสำหรับหน้าเว็บส่วนตัวของบัญชี GitHub) ที่เผยแพร่หน้า
redirect จาก root ของโดเมนไปยังตัวนำทาง repository นี้แยกจาก `buddhism` โดยสิ้นเชิง
และไม่อยู่ในขอบเขตของเอกสารฉบับนี้

**กฎสำคัญ:** ไฟล์ `<id>_*.html`, `nav_*.html` และ `sitemap.xml` เป็นผลลัพธ์จากการ build
เท่านั้น การแก้ด้วยมือจะอยู่ได้จนกว่าจะมี push ครั้งถัดไปเข้า `json/**` แล้วจะถูกเขียนทับ
ไฟล์ที่แก้ไขด้วยมือได้มีเพียง `_template_*.html`, `js/*.js`, `css/*.css`,
`schema/*.json`, `how-to-*.html`, `docs/**`

## สถาปัตยกรรมการ build

1. Push ที่มีการเปลี่ยนแปลงใน `share/terms/json/**` จะ trigger `build-terms.yml`
2. `build-terms.js` อ่านไฟล์ `<id>_ru.json` / `<id>_thai.json` ทั้งหมด รวม id จากทั้งสองภาษาเข้าด้วยกัน
3. สร้างการ์ดคำศัพท์สำหรับแต่ละ id ในแต่ละภาษา (`<id>_ru.html`, `<id>_thai.html`) — หากยังไม่มีคำแปล จะแสดงข้อความ «ยังไม่มีคำแปล» พร้อมลิงก์ไปยัง `how-to-translate-term_*.html` และ `<meta name="robots" content="noindex">` การ์ดที่มีคำแปลจะได้ `canonical`, `hreflang` (ru/th/x-default หากมีคำแปลทั้งสองภาษา), `meta description` (จาก `interpretation` หรือ `reason_introduced`) และ Open Graph
4. สร้างไฟล์ `index_ru.json` / `index_thai.json` ใหม่ (รายการสำหรับการค้นหาฝั่งไคลเอนต์: `id`, `term_ru`/`term_thai`, `later_count`)
5. สร้างหน้านำทางแบบแบ่งหน้าใหม่ (หน้าละ 10 คำศัพท์ เป็นไฟล์ static จริง เช่น `nav_ru_2.html` ไม่ใช่ `?page=N` — สำคัญต่อการทำ indexing และให้ใช้งานได้แม้ไม่มี JS) พร้อม `canonical`/`prev`/`next` และในหน้าแรกของแต่ละภาษา — `hreflang` กับ `meta description`/Open Graph ภาษาที่ยังไม่มีคำศัพท์เลยจะได้ `noindex` แทน
6. ลบการ์ดที่ไม่มี id ใน json/ แล้ว (orphaned) และหน้าแบ่งหน้าที่เกินความจำเป็น
7. สร้าง `sitemap.xml` — เฉพาะการ์ดที่มีคำแปลจริง (ไม่รวมการ์ด «ยังไม่มีคำแปล») และหน้านำทาง พร้อม `hreflang` ระหว่างเวอร์ชันภาษาของแต่ละคำศัพท์ ไม่มี `lastmod` (วันที่จาก git ใน GitHub Actions ไม่น่าเชื่อถือ)
8. commit ผลลัพธ์ด้วยแท็ก `[skip ci]` (เพื่อป้องกัน trigger วนลูปไม่สิ้นสุด)

`render-term.js` เป็นโมดูลที่ใช้ร่วมกันระหว่าง Node (เรียกผ่าน `require()` ใน
`build-terms.js`) และเบราว์เซอร์ (ปัจจุบันไม่ได้ใช้งานในหน้าที่ build แล้ว เพราะเนื้อหาถูก
ฝังลงใน HTML ตั้งแต่ขั้นตอน build; โมดูลนี้เก็บไว้สำหรับกรณีในอนาคตที่ต้องการเรนเดอร์
ฝั่งไคลเอนต์ เช่น live-preview ในตัวตรวจสอบ JSON)

## โครงสร้าง JSON ของคำศัพท์

หนึ่งไฟล์ต่อหนึ่งภาษา key ที่ต่างกันระหว่างสองภาษามีเพียง `term_ru` ↔ `term_thai`

| Key | ชนิดข้อมูล | คำอธิบาย |
|---|---|---|
| `id` | string | อักษรโรมันตัวพิมพ์เล็ก ไม่มีเครื่องหมายกำกับเสียง — ตรงกับชื่อไฟล์ |
| `term_ru` / `term_thai` | string | คำศัพท์ในภาษาของการ์ด — ตัวอักษรแรกจะถูกทำให้เป็นตัวพิมพ์ใหญ่อัตโนมัติเมื่อ build (เฉพาะภาษารัสเซีย ภาษาไทยไม่มีตัวพิมพ์ใหญ่-เล็ก) |
| `term_iast` | string | อักษรโรมัน IAST ไม่ถูกแปลงตัวพิมพ์ |
| `term_composition` | object | `{is_compound, components: [{part_iast, part_meaning}], note}` — ดูรายละเอียดด้านล่าง |
| `origin` | object | `{type, source_tradition, attestation_before_term, etymology_versions[]}` |
| `dating` | array | `[{type, value, comment}]` |
| `attribution` | object | `{traditional, academic, consensus}` |
| `recorded_by` | string | ผู้บันทึกเป็นลายลักษณ์อักษร |
| `school_tradition` | string | นิกาย/ชั้นของประเพณี |
| `reason_introduced` | string | เหตุผลที่ต้องมีคำนี้ — ใช้ภาษาง่าย |
| `interpretation` | string | ความหมาย — ใช้ภาษาง่าย |
| `language` | string | โดยทั่วไปคือ `"บาลี"` พร้อมคำอธิบายเพิ่มเติมหากซับซ้อน |
| `sources` | array | `[{status, title, location, transmission_tradition, language, source_type, discrepancies}]` |
| `later_mentions` | array | `[{id, parent, author_id, date_updated, updated_by, reason_for_update, what_is_new, school_tradition, source_type, language, source: {title}}]` — key เหมือนกันทั้งสองภาษา ต่างกันเฉพาะค่า |

**`term_composition`** — ใช้สำหรับคำศัพท์ที่ประกอบด้วยคำบาลีที่เป็นคำอิสระตั้งแต่สองคำ
ขึ้นไป (เช่น `paṭicca`+`samuppāda`, `sati`+`upaṭṭhāna`) การแยกคำเป็นอุปสรรค+รากศัพท์
ภายในคำเดียว (เช่น `du-`+`kha` ใน `dukkha`) ไม่นับรวมในที่นี้ — นั่นคือนิรุกติศาสตร์
พื้นบ้าน ใช้ `origin.etymology_versions` แทน `render-term.js` จะเรนเดอร์บล็อก
«คำนี้ประกอบด้วยคำใดบ้าง» เฉพาะเมื่อ `is_compound: true` เท่านั้น

ตัวอย่างไฟล์อ้างอิงฉบับสมบูรณ์ — ดูไฟล์ที่มีอยู่แล้ว เช่น `json/dukkha_ru.json`

### JSON Schema อย่างเป็นทางการ

`schema/term.schema.ru.json` และ `schema/term.schema.thai.json` (draft-07) แปลงตาราง
ด้านบนให้เป็นกฎที่ตรวจสอบได้จริง และผ่านการทดสอบกับทุกคำศัพท์ใน repository แล้ว
ฟิลด์ที่มีชุดค่าปิด — `origin.type`, `origin.etymology_versions[].type`,
`dating[].type`, `sources[].status` — ตรวจด้วย pattern แบบ «รากคำ + ส่วนขยายในวงเล็บ
(ไม่บังคับ)» ไม่ใช่รายการปิดตายตัว: ค่ารากเหล่านี้ถูกกำหนดไว้แน่นอน (ตรงกับตัวเลือกใน
`term-prompt-*.js`) แต่ผู้เขียนยังเพิ่มคำอธิบายในวงเล็บได้ ส่วน `sources[].source_type`
และ `later_mentions[].source_type` จงใจปล่อยเป็นข้อความอิสระ — เพราะเป็นคำศัพท์ที่
เพิ่มขึ้นเรื่อย ๆ ไม่ใช่รายการไม่กี่แบบ ทั้งสอง schema ถูกใช้โดยตัวตรวจสอบออนไลน์
(ดูหัวข้อถัดไป) และนำไปใช้เติมคำอัตโนมัติใน editor ได้เช่นกัน

## ตัวตรวจสอบ JSON แบบออนไลน์

หน้า `how-to-check-json_ru.html` / `_thai.html`: วาง JSON ที่ได้จาก AI แล้วได้รายการ
ข้อผิดพลาดเทียบกับ schema เป็นภาษาที่เข้าใจง่าย ก่อนสร้าง pull request ทำงานในเบราว์เซอร์
ทั้งหมด ไม่ต้องมี backend: `json-validator.js` เป็นการ implement ชุดคำสั่งย่อยของ JSON
Schema draft-07 ที่จำเป็นด้วยตัวเอง (ไม่พึ่ง library ภายนอก ใช้ได้ทั้งในเบราว์เซอร์และ
Node) ผ่านการเทียบผลกับ library อ้างอิง `jsonschema` (Python) แล้วไม่มีความต่างแม้แต่
กรณีเดียวจากตัวอย่างคำศัพท์จริงและ JSON ที่จงใจทำให้ผิด ภาษาของการ์ด (`ru`/`thai`) จะถูก
ตรวจจับอัตโนมัติจากการมี `term_ru` หรือ `term_thai` แล้วโหลด schema ที่ตรงกันจากเว็บไซต์
ผ่าน `fetch('../schema/term.schema.*.json')`

หน้านี้เป็นหน้าทางเทคนิค เหมาะสำหรับผู้ที่ได้ JSON จาก AI มาแล้ว จึงไม่ได้ใส่ไว้ในเมนูหลัก
ของเว็บไซต์ — ลิงก์ไปหน้านี้มีอยู่เฉพาะใน `how-to-add-term_*.html` เป็นขั้นตอนแยกระหว่าง
«ได้ JSON แล้ว» กับ «สร้างไฟล์»

## SEO และการ index

- การ์ดคำศัพท์และหน้านำทางทุกหน้ามี `canonical`, `hreflang` (เมื่อมีทั้งสองภาษา) และ
  Open Graph — ดู «สถาปัตยกรรมการ build» ด้านบน
- `sitemap.xml` สร้างขึ้นอัตโนมัติ (ขั้นตอนที่ 7 ของการ build) และส่งเข้า Google Search
  Console, Bing Webmaster Tools และ Yandex Webmaster แล้ว
- ยังไม่มีรูปสำหรับพรีวิวลิงก์ (`og:image`) — วาง Open Graph ไว้แล้ว แต่พรีวิวในแอปแชท
  ยังเป็นแบบข้อความล้วน
- ไม่มี `robots.txt`: เว็บไซต์อยู่ที่ path `/buddhism/` ส่วน `robots.txt` จะถูกอ่านเฉพาะที่
  root ของโดเมนเท่านั้น — เว็บไซต์ไม่ได้ปิดกั้นอะไรอยู่แล้ว และส่ง sitemap ให้ search
  engine โดยตรงผ่านแผงควบคุมของแต่ละเจ้า

## การติดตั้งด้วยตนเอง (fork)

1. Fork repository `indapanno/buddhism`
2. Settings → Pages → Source: `Deploy from a branch`, Branch: `main`, `/root`
3. Settings → Actions → General → Workflow permissions: `Read and write permissions` (จำเป็นสำหรับ `build-terms.yml` ในการ commit อัตโนมัติ)
4. เปลี่ยนค่าคงที่ `SITE_BASE_URL` ใน `.github/scripts/build-terms.js` ให้เป็นที่อยู่ของคุณเอง — `canonical`, `hreflang`, Open Graph และ `sitemap.xml` ทั้งหมดอ้างอิงจากค่านี้
5. เว็บไซต์จะพร้อมใช้งานที่ `https://<username>.github.io/buddhism/share/terms/`
6. พัฒนาในเครื่อง: รัน `node .github/scripts/build-terms.js` จาก root ของ repository — จะ build HTML และ `sitemap.xml` ใหม่โดยไม่ต้อง push เพื่อตรวจสอบก่อน commit

## ข้อจำกัดที่ทราบอยู่แล้ว

- คำศัพท์ทั้งหมดที่มีอยู่ตอนนี้แปลเป็นภาษาไทยแล้ว แต่ผู้แปลไม่ใช่เจ้าของภาษา ควรให้
  เจ้าของภาษาตรวจสอบก่อนเผยแพร่ในวงกว้าง
- พรอมต์สำหรับให้ AI สร้างคำศัพท์ (`term-prompt-ru.js`/`-thai.js`) และ JSON Schema
  ช่วยลดแต่ไม่ได้ขจัดข้อผิดพลาดทั้งหมด — schema ตรวจแค่โครงสร้างและชนิดข้อมูล ไม่ตรวจ
  ข้อเท็จจริง AI แต่ละตัวตีความคำสั่งต่างกัน อาจมีข้อมูลผิดพลาดหรืออ้างอิงแหล่งที่มาไม่
  ถูกต้อง จำเป็นต้องมีการตรวจสอบโดยมนุษย์ก่อน merge เสมอ
- ด่านเดียวที่กัน JSON ที่ผิดพลาดตอนนี้คือตัวตรวจสอบ ซึ่งผู้ส่งอาจข้ามไปก็ได้ (ลิงก์ไม่ได้
  บังคับให้กด) ยังไม่มีการตรวจสอบอัตโนมัติฝั่ง PR (ดู «แนวทางการพัฒนาต่อไป»)

## แนวทางการพัฒนาต่อไป

1. **ลิงก์เชื่อมโยงระหว่างคำศัพท์ (cross-references).** ให้ขั้นตอน build แปลงการกล่าวถึง id ของคำศัพท์ที่มีอยู่แล้ว (ใน `later_mentions[].source.title`, `term_composition`, หรือข้อความในฟิลด์ต่าง ๆ) ให้เป็น `<a href="<id>_thai.html">` โดยอัตโนมัติ — เมื่อคลังคำศัพท์เติบโตขึ้น จะกลายเป็นเครือข่ายความเชื่อมโยงระหว่างแนวคิดโดยไม่ต้องกำกับลิงก์ด้วยมือ
2. **GitHub Action บน pull_request** — ตรวจสอบตาม JSON Schema แบบเดียวกับที่ `json-validator.js` ทำในเบราว์เซอร์ แต่ทำอัตโนมัติฝั่ง PR แสดงข้อผิดพลาดเป็นคอมเมนต์ให้ผู้ส่งเห็นเอง และอาจตั้งค่าให้ merge อัตโนมัติหากไม่พบข้อผิดพลาด schema และตัวตรวจสอบพร้อมใช้แล้ว เหลือแค่ทำตัว Action เอง
3. **การตรวจสอบความสมเหตุสมผลของแหล่งอ้างอิง** — ตรวจรูปแบบของ `sources[].location` เชิง heuristic (เช่น ช่วงเลขที่ของนิกาย) เพื่อจับความผิดปกติที่ชัดเจน โดยไม่ได้อ้างว่าเป็นการตรวจสอบข้อเท็จจริงแบบสมบูรณ์
4. **ชุดทดสอบสำหรับ `build-terms.js`** — smoke test ด้วย `node:test` ในตัว (Node 18+ ไม่ต้องติดตั้งเพิ่ม): การสร้างการ์ดไม่ error เมื่อ JSON ถูกต้อง, การทำตัวพิมพ์ใหญ่ทำงานถูกต้อง, `renderComposition` คืนค่าว่างเมื่อ `is_compound: false`
5. **`og:image`** — รูป 1200×630 สำหรับพรีวิวลิงก์ในแอปแชทและโซเชียล โครงสร้าง Open Graph รองรับไว้แล้ว ขาดแต่ตัวรูป

Repository: https://github.com/indapanno/buddhism
