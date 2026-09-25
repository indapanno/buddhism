# ตัวนำทางประวัติคำศัพท์บาลี — สำหรับนักวิจัยและนักพัฒนา

เอกสารทางเทคนิค อธิบายสถาปัตยกรรม โครงสร้างข้อมูล และวิธีการติดตั้งเว็บไซต์แบบ static
สำหรับคำแนะนำการเพิ่มคำศัพท์ผ่านหน้าเว็บ โปรดดู
[how-to-add-term_thai.html](../../how-to-add-term_thai.html)

## เทคโนโลยีที่ใช้

- Frontend: HTML/CSS/vanilla JS ล้วน ไม่ใช้ framework หรือ bundler (ไม่มี webpack/vite)
- การ build: สคริปต์ Node.js ทำงานบน GitHub Actions (ไม่ต้องมี Node ในเครื่อง หากไม่แก้โค้ด build)
- Hosting: GitHub Pages, `Deploy from branch main, /root`
- ข้อมูล: ไฟล์ JSON เก็บใน git ไม่มีฐานข้อมูลหรือ backend
- สถิติผู้เข้าชม: GoatCounter (ตัวนับภายนอก ไม่ใช้ cookies)

## โครงสร้าง repository

```
share/terms/
├── json/
│   ├── <id>_ru.json          # ข้อมูลต้นทาง หนึ่งไฟล์ต่อหนึ่งภาษาต่อหนึ่งคำศัพท์
│   ├── <id>_thai.json
│   ├── index_ru.json         # ไฟล์รายการสำหรับค้นหา — สร้างอัตโนมัติ ห้ามแก้ด้วยมือ
│   └── index_thai.json
├── js/
│   ├── render-term.js        # โมดูลเรนเดอร์การ์ดคำศัพท์ร่วมกัน (Node + เบราว์เซอร์)
│   ├── term-prompt-ru.js     # ข้อความพรอมต์สำหรับให้ AI สร้างคำศัพท์ (RU)
│   ├── term-prompt-thai.js   # เช่นเดียวกัน สำหรับภาษาไทย
│   ├── term-prompt-widget.js # ตรรกะของปุ่ม «คัดลอกพรอมต์»
│   ├── search.js, lang.js, theme.js, burger-menu.js,
│   │   footer-counter.js, term-count.js, thai-numerals.js
├── css/style.css
├── _template_ru.html         # แม่แบบการ์ด — แก้ไขด้วยมือ
├── _template_thai.html
├── _template_nav_ru.html     # แม่แบบหน้านำทาง
├── _template_nav_thai.html
├── <id>_ru.html               # สร้างอัตโนมัติจากแม่แบบ + JSON ห้ามแก้ด้วยมือ
├── <id>_thai.html
├── nav_ru.html, nav_ru_2.html, …   # สร้างอัตโนมัติ แบ่งหน้าละ 10 คำศัพท์
├── nav_thai.html, …
├── how-to-add-term_ru.html    # ไฟล์คงที่ แก้ไขด้วยมือ
├── how-to-add-term_thai.html
├── how-to-translate-term_ru.html
├── how-to-translate-term_thai.html
└── docs/for-researchers/ru.md, thai.md   # เอกสารนี้

.github/
├── scripts/build-terms.js     # สคริปต์ Node.js สำหรับ build
└── workflows/build-terms.yml  # trigger: push เข้า share/terms/json/**
```

**กฎสำคัญ:** ไฟล์ `<id>_*.html` และ `nav_*.html` เป็นผลลัพธ์จากการ build เท่านั้น
การแก้ด้วยมือจะอยู่ได้จนกว่าจะมี push ครั้งถัดไปเข้า `json/**` แล้วจะถูกเขียนทับ
ไฟล์ที่แก้ไขด้วยมือได้มีเพียง `_template_*.html`, `js/*.js`, `css/style.css`,
`how-to-*.html`, `docs/**`

## สถาปัตยกรรมการ build

1. Push ที่มีการเปลี่ยนแปลงใน `share/terms/json/**` จะ trigger `build-terms.yml`
2. `build-terms.js` อ่านไฟล์ `<id>_ru.json` / `<id>_thai.json` ทั้งหมด รวม id จากทั้งสองภาษาเข้าด้วยกัน
3. สร้างการ์ดคำศัพท์สำหรับแต่ละ id ในแต่ละภาษา (`<id>_ru.html`, `<id>_thai.html`) — หากยังไม่มีคำแปล จะแสดงข้อความ «ยังไม่มีคำแปล» พร้อมลิงก์ไปยัง `how-to-translate-term_*.html`
4. สร้างไฟล์ `index_ru.json` / `index_thai.json` ใหม่ (รายการสำหรับการค้นหาฝั่งไคลเอนต์: `id`, `term_ru`/`term_thai`, `later_count`)
5. สร้างหน้านำทางแบบแบ่งหน้าใหม่ (หน้าละ 10 คำศัพท์ เป็นไฟล์ static จริง เช่น `nav_ru_2.html` ไม่ใช่ `?page=N` — สำคัญต่อการทำ indexing และให้ใช้งานได้แม้ไม่มี JS)
6. ลบการ์ดที่ไม่มี id ใน json/ แล้ว (orphaned) และหน้าแบ่งหน้าที่เกินความจำเป็น
7. commit ผลลัพธ์ด้วยแท็ก `[skip ci]` (เพื่อป้องกัน trigger วนลูปไม่สิ้นสุด)

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
| `later_mentions` | array | `[{id, date_updated, updated_by, reason_for_update, what_is_new, school_tradition, source: {title}}]` — โครงสร้างฝั่งภาษาไทยเรียบง่ายกว่า ไม่มี `parent`/`author_id`/`source_type`/`language` |

**`term_composition`** — ใช้สำหรับคำศัพท์ที่ประกอบด้วยคำบาลีที่เป็นคำอิสระตั้งแต่สองคำ
ขึ้นไป (เช่น `paṭicca`+`samuppāda`, `sati`+`upaṭṭhāna`) การแยกคำเป็นอุปสรรค+รากศัพท์
ภายในคำเดียว (เช่น `du-`+`kha` ใน `dukkha`) ไม่นับรวมในที่นี้ — นั่นคือนิรุกติศาสตร์
พื้นบ้าน ใช้ `origin.etymology_versions` แทน `render-term.js` จะเรนเดอร์บล็อก
«คำนี้ประกอบด้วยคำใดบ้าง» เฉพาะเมื่อ `is_compound: true` เท่านั้น

ตัวอย่างไฟล์อ้างอิงฉบับสมบูรณ์ — ดูไฟล์ที่มีอยู่แล้ว เช่น `json/dukkha_ru.json`

## การติดตั้งด้วยตนเอง (fork)

1. Fork repository `indapanno/buddhism`
2. Settings → Pages → Source: `Deploy from a branch`, Branch: `main`, `/root`
3. Settings → Actions → General → Workflow permissions: `Read and write permissions` (จำเป็นสำหรับ `build-terms.yml` ในการ commit อัตโนมัติ)
4. เว็บไซต์จะพร้อมใช้งานที่ `https://<username>.github.io/buddhism/share/terms/`
5. พัฒนาในเครื่อง: รัน `node .github/scripts/build-terms.js` จาก root ของ repository — จะ build HTML ใหม่โดยไม่ต้อง push เพื่อตรวจสอบก่อน commit

## ข้อจำกัดที่ทราบอยู่แล้ว

- คำแปลภาษาไทยปัจจุบันทำเสร็จสมบูรณ์เพียงคำเดียว (`dukkha`) เป็น proof of concept ผู้แปลไม่ใช่เจ้าของภาษา ควรให้เจ้าของภาษาตรวจสอบก่อนเผยแพร่ในวงกว้าง
- พรอมต์สำหรับให้ AI สร้างคำศัพท์ (`term-prompt-ru.js`/`-thai.js`) ช่วยลดแต่ไม่ได้ขจัดข้อผิดพลาดทั้งหมด — AI แต่ละตัวตีความคำสั่งต่างกัน อาจมีข้อมูลผิดพลาดหรืออ้างอิงแหล่งที่มาไม่ถูกต้อง จำเป็นต้องมีการตรวจสอบโดยมนุษย์ก่อน merge เสมอ
- โครงสร้าง JSON ยังไม่ได้จัดทำเป็น JSON Schema อย่างเป็นทางการ — ยังไม่มีการตรวจสอบความถูกต้องอัตโนมัติ (ดูหัวข้อ «แนวทางการพัฒนาต่อไป»)

## แนวทางการพัฒนาต่อไป

1. **ลิงก์เชื่อมโยงระหว่างคำศัพท์ (cross-references).** ให้ขั้นตอน build แปลงการกล่าวถึง id ของคำศัพท์ที่มีอยู่แล้ว (ใน `later_mentions[].source.title`, `term_composition`, หรือข้อความในฟิลด์ต่าง ๆ) ให้เป็น `<a href="<id>_thai.html">` โดยอัตโนมัติ — เมื่อคลังคำศัพท์เติบโตขึ้น จะกลายเป็นเครือข่ายความเชื่อมโยงระหว่างแนวคิดโดยไม่ต้องกำกับลิงก์ด้วยมือ
2. **JSON Schema อย่างเป็นทางการ** (`term.schema.json`, draft-07/2020-12) — เป็นแหล่งอ้างอิงเดียวสำหรับทั้งตัวตรวจสอบและ CI พร้อมระบบเติมคำอัตโนมัติใน editor
3. **ตัวตรวจสอบ JSON แบบออนไลน์** — หน้าเว็บฝั่งไคลเอนต์ วาง JSON ที่ได้จาก AI แล้วได้รายการข้อผิดพลาดเทียบกับ schema ทีละบรรทัด ก่อนสร้าง pull request
4. **GitHub Action บน pull_request** — ตรวจสอบ JSON ที่ส่งเข้ามาโดยอัตโนมัติ แสดงข้อผิดพลาดเป็นคอมเมนต์ใน PR ให้ผู้ส่งเห็นเอง และอาจตั้งค่าให้ merge อัตโนมัติหากไม่พบข้อผิดพลาด
5. **การตรวจสอบความสมเหตุสมผลของแหล่งอ้างอิง** — ตรวจรูปแบบของ `sources[].location` เชิง heuristic (เช่น ช่วงเลขที่ของนิกาย) เพื่อจับความผิดปกติที่ชัดเจน โดยไม่ได้อ้างว่าเป็นการตรวจสอบข้อเท็จจริงแบบสมบูรณ์
6. **`sitemap.xml` + `robots.txt`** — ให้ตัว build สร้างไฟล์เหล่านี้อัตโนมัติ ช่วยให้เว็บไซต์ที่กำลังเติบโตถูก index โดย search engine ได้ดีขึ้น
7. **ชุดทดสอบสำหรับ `build-terms.js`** — smoke test ด้วย `node:test` ในตัว (Node 18+ ไม่ต้องติดตั้งเพิ่ม): การสร้างการ์ดไม่ error เมื่อ JSON ถูกต้อง, การทำตัวพิมพ์ใหญ่ทำงานถูกต้อง, `renderComposition` คืนค่าว่างเมื่อ `is_compound: false`

Repository: https://github.com/indapanno/buddhism
