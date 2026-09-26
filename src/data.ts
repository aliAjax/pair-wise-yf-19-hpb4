import type { Cabinet, EnvReading, Specimen, StaffMember, StoreRoom } from "./types";
import { applyReading } from "./env";

export const PRESSING_OPTIONS = ["待压制", "压制中", "已压制"];
export const ID_STATUS_OPTIONS = ["待鉴定", "鉴定中", "已鉴定", "需补照"];

export const staff: StaffMember[] = [
  { id: "s1", name: "林一苇" },
  { id: "s2", name: "沈青杨" },
  { id: "s3", name: "杜若" },
  { id: "s4", name: "苏木" },
];

export const rooms: StoreRoom[] = [
  { id: "A", name: "A库 · 种子植物区" },
  { id: "B", name: "B库 · 蕨类苔藓区" },
];

const baseCabinets: Cabinet[] = ["A-01", "A-02", "A-03", "B-01", "B-02", "B-03"].map((id) => ({
  id,
  roomId: id.slice(0, 1),
  frozen: false,
  frozenAt: null,
  freezeReason: null,
  pendingReview: false,
  clearedByReadingId: null,
  reviewedBy: null,
  reviewedAt: null,
}));

export const seedReadings: EnvReading[] = [
  { id: "r1", roomId: "A", temperature: 21.8, humidity: 52, shift: "早班", recorderId: "s1", recordedAt: "2026-09-26 08:10" },
  { id: "r2", roomId: "B", temperature: 20.9, humidity: 49, shift: "早班", recorderId: "s2", recordedAt: "2026-09-26 08:15" },
  { id: "r3", roomId: "A", temperature: 25.6, humidity: 66, shift: "中班", recorderId: "s2", recordedAt: "2026-09-26 14:05" },
  { id: "r4", roomId: "B", temperature: 21.4, humidity: 51, shift: "中班", recorderId: "s3", recordedAt: "2026-09-26 14:12" },
  { id: "r5", roomId: "A", temperature: 26.8, humidity: 71, shift: "晚班", recorderId: "s1", recordedAt: "2026-09-26 20:02" },
  { id: "r6", roomId: "B", temperature: 21.1, humidity: 50, shift: "晚班", recorderId: "s4", recordedAt: "2026-09-26 20:09" },
];

export const seedSpecimens: Specimen[] = [
  { id: "HX-240615-01", species: "槭属待定 Acer sp.", location: "云南·高黎贡山", altitude: 1420, habitat: "常绿阔叶林缘，溪谷旁阴湿处", collector: "林一苇", pressing: "已压制", idStatus: "待鉴定", cabinetId: "A-01" },
  { id: "HX-240615-08", species: "鳞毛蕨属 Dryopteris sp.", location: "云南·高黎贡山", altitude: 1560, habitat: "阴湿沟谷，苔藓覆盖岩壁", collector: "沈青杨", pressing: "已压制", idStatus: "鉴定中", cabinetId: "A-02" },
  { id: "HX-240616-03", species: "紫菀属 Aster sp.", location: "四川·卧龙", altitude: 2100, habitat: "亚高山草甸，林缘空地", collector: "杜若", pressing: "已压制", idStatus: "已鉴定", cabinetId: "B-01" },
  { id: "HX-240617-02", species: "杜鹃花属 Rhododendron sp.", location: "四川·卧龙", altitude: 2350, habitat: "杜鹃灌丛，山坡上部", collector: "苏木", pressing: "压制中", idStatus: "待鉴定", cabinetId: null },
  { id: "HX-240617-11", species: "报春花属 Primula sp.", location: "云南·白马雪山", altitude: 3200, habitat: "高山流石滩边缘，碎石隙间", collector: "林一苇", pressing: "已压制", idStatus: "需补照", cabinetId: "A-03" },
  { id: "HX-240618-05", species: "蒿属 Artemisia sp.", location: "甘肃·兴隆山", altitude: 2400, habitat: "山地草原，阳坡", collector: "沈青杨", pressing: "待压制", idStatus: "待鉴定", cabinetId: null },
  { id: "HX-240618-09", species: "薹草属 Carex sp.", location: "甘肃·兴隆山", altitude: 2280, habitat: "林缘湿地，溪边草丛", collector: "杜若", pressing: "已压制", idStatus: "已鉴定", cabinetId: "B-02" },
  { id: "HX-240619-01", species: "龙胆属 Gentiana sp.", location: "云南·白马雪山", altitude: 3450, habitat: "高山草甸，湿润处", collector: "苏木", pressing: "压制中", idStatus: "鉴定中", cabinetId: "B-03" },
];

/** 按台账顺序回放，得到当前柜位冻结状态（A库已连续两班异常） */
export function buildInitialCabinets(): Cabinet[] {
  return seedReadings.reduce(
    (acc, reading, index) => applyReading(acc, seedReadings.slice(0, index), reading),
    baseCabinets
  );
}
