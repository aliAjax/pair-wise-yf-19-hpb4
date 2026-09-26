export interface EnvReading {
  id: string;
  cabinetId: string; // 库房编号（柜位）
  temperature: number; // ℃
  humidity: number; // %RH
  staff: string; // 值班员
  shift: string; // 班次
  time: string; // 登记时间
}

export interface Cabinet {
  id: string;
  room: string;
  note: string;
}

export interface CabinetRuntime {
  frozen: boolean;
  frozenAt?: string;
  reviewedBy?: string;
  reviewedAt?: string;
}

export interface Specimen {
  id: string;
  code: string; // 采集号
  species: string; // 物种名称
  location: string; // 采集地点
  altitude: string; // 海拔
  habitat: string; // 生境描述
  collector: string; // 采集人
  pressing: string; // 压制状态
  idStatus: string; // 鉴定状态
  cabinetId: string; // 馆藏位置
  status: string; // 队列状态：待压制 / 待鉴定 / 已入库 / 需补照
}

// 库房环境上限：超过即算异常
export const TEMP_LIMIT = 24; // ℃
export const HUMIDITY_LIMIT = 60; // %RH

export const cabinets: Cabinet[] = [
  { id: "A-01", room: "一号库房", note: "种子植物·已鉴定区" },
  { id: "A-02", room: "一号库房", note: "蕨类与待压制周转" },
  { id: "B-12-04", room: "二号库房", note: "菊科与杜鹃花科" },
  { id: "C-03", room: "三号库房", note: "高山标本暂存" },
];

export const seedReadings: EnvReading[] = [
  { id: "r1", cabinetId: "A-01", temperature: 21.2, humidity: 52, staff: "王岚", shift: "早班", time: "09-25 08:05" },
  { id: "r2", cabinetId: "B-12-04", temperature: 23.1, humidity: 58, staff: "赵岑", shift: "早班", time: "09-25 08:10" },
  { id: "r3", cabinetId: "A-02", temperature: 22.4, humidity: 55, staff: "王岚", shift: "早班", time: "09-25 08:15" },
  { id: "r4", cabinetId: "C-03", temperature: 23.0, humidity: 57, staff: "李牧", shift: "晚班", time: "09-25 20:05" },
  { id: "r5", cabinetId: "A-01", temperature: 21.8, humidity: 54, staff: "王岚", shift: "晚班", time: "09-25 20:10" },
  { id: "r6", cabinetId: "B-12-04", temperature: 25.6, humidity: 66, staff: "赵岑", shift: "晚班", time: "09-25 20:15" },
  { id: "r7", cabinetId: "A-02", temperature: 22.1, humidity: 56, staff: "李牧", shift: "早班", time: "09-26 08:05" },
  { id: "r8", cabinetId: "A-01", temperature: 22.0, humidity: 53, staff: "李牧", shift: "早班", time: "09-26 08:10" },
  { id: "r9", cabinetId: "C-03", temperature: 25.2, humidity: 63, staff: "李牧", shift: "早班", time: "09-26 08:15" },
  { id: "r10", cabinetId: "B-12-04", temperature: 26.4, humidity: 69, staff: "赵岑", shift: "早班", time: "09-26 08:20" },
];

export const seedSpecimens: Specimen[] = [
  { id: "s1", code: "HX-240615-01", species: "槭属待定种", location: "云南大理·点苍山", altitude: "1420m", habitat: "中山针阔混交林缘", collector: "陈曦", pressing: "已压制", idStatus: "待鉴定", cabinetId: "A-01", status: "待鉴定" },
  { id: "s2", code: "HX-240615-08", species: "肾蕨", location: "云南高黎贡山", altitude: "1680m", habitat: "阴湿沟谷", collector: "陈曦", pressing: "压制中", idStatus: "待鉴定", cabinetId: "A-02", status: "待压制" },
  { id: "s3", code: "HX-240616-03", species: "蒲公英属", location: "四川卧龙", altitude: "2230m", habitat: "林缘草甸", collector: "林蔚", pressing: "已压制", idStatus: "已鉴定", cabinetId: "B-12-04", status: "已入库" },
  { id: "s4", code: "HX-240616-05", species: "杜鹃花属", location: "四川峨眉山", altitude: "1950m", habitat: "常绿阔叶林下", collector: "林蔚", pressing: "已压制", idStatus: "待鉴定", cabinetId: "B-12-04", status: "需补照" },
  { id: "s5", code: "HX-240617-02", species: "禾本科待定", location: "云南香格里拉", altitude: "3180m", habitat: "高山草甸", collector: "赵其", pressing: "压制中", idStatus: "待鉴定", cabinetId: "C-03", status: "待鉴定" },
  { id: "s6", code: "HX-240617-09", species: "悬钩子属", location: "浙江天目山", altitude: "1060m", habitat: "山谷灌丛", collector: "陈曦", pressing: "已压制", idStatus: "已鉴定", cabinetId: "A-01", status: "已入库" },
  { id: "s7", code: "HX-240618-01", species: "虾脊兰属", location: "福建武夷山", altitude: "1210m", habitat: "溪谷阴湿处", collector: "赵其", pressing: "未压制", idStatus: "待鉴定", cabinetId: "A-02", status: "待压制" },
  { id: "s8", code: "HX-240618-04", species: "胡枝子属", location: "安徽黄山", altitude: "880m", habitat: "山坡疏林", collector: "林蔚", pressing: "已压制", idStatus: "待鉴定", cabinetId: "B-12-04", status: "待鉴定" },
];

export const isAbnormal = (r: EnvReading): boolean =>
  r.temperature > TEMP_LIMIT || r.humidity > HUMIDITY_LIMIT;

export function cabinetReadings(readings: EnvReading[], cabinetId: string): EnvReading[] {
  return readings.filter((r) => r.cabinetId === cabinetId);
}

export function latestReading(readings: EnvReading[], cabinetId: string): EnvReading | undefined {
  const list = cabinetReadings(readings, cabinetId);
  return list[list.length - 1];
}

/** 从最新一班往回数，连续异常的班次数 */
export function consecutiveAbnormal(readings: EnvReading[], cabinetId: string): number {
  const list = cabinetReadings(readings, cabinetId);
  let n = 0;
  for (let i = list.length - 1; i >= 0; i -= 1) {
    if (isAbnormal(list[i])) n += 1;
    else break;
  }
  return n;
}
