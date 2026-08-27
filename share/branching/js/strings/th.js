window.UI_STRINGS = {
  fetchError: "ไม่สามารถโหลด ",
  loadError: "เกิดข้อผิดพลาดในการโหลดข้อมูล: ",
  eventPrefix: "เหตุการณ์ที่ ",
  eventOfMiddle: " จาก ",
  visitedYes: "คุณเคยศึกษาเหตุการณ์นี้แล้ว",
  visitedNo: "คุณยังไม่ได้ศึกษาเหตุการณ์นี้",
  cause: "สาเหตุ",
  result: "ผลลัพธ์",
  keyFigures: "บุคคลสำคัญ",
  lifespan: "ระยะเวลาที่ดำรงอยู่",
  status2026: "สถานะในปี พ.ศ. ๒๕๖๙",
  regionToday: "ภูมิภาคที่แพร่หลายในปัจจุบัน",
  followers2026: "จำนวนผู้นับถือ (พ.ศ. ๒๕๖๙)",
  noData: "ไม่มีข้อมูล",
  note: "หมายเหตุ",
  sources: "แหล่งที่มา",
  leafHeading: "จุดสิ้นสุดของสาขา",
  leafText: "เหตุการณ์นี้ไม่มีเหตุการณ์ย่อยในแผนภูมิ",
  childrenHeading: "เหตุการณ์ย่อย",
  formatNumber: function (n) {
    var thaiDigits = ["๐", "๑", "๒", "๓", "๔", "๕", "๖", "๗", "๘", "๙"];
    return String(n).replace(/[0-9]/g, function (d) { return thaiDigits[+d]; });
  }
};

window.APP_CONFIG = {
  dataUrl: "json/th.json"
};
