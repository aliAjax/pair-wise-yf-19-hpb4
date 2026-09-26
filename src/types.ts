export interface StaffMember {
  id: string;
  name: string;
}

export interface StoreRoom {
  id: string;
  name: string;
}

/** 环境台账条目：值班员每班登记一条 */
export interface EnvReading {
  id: string;
  roomId: string;
  temperature: number;
  humidity: number;
  shift: string;
  recorderId: string;
  recordedAt: string;
}

export interface Cabinet {
  id: string;
  roomId: string;
  frozen: boolean;
  frozenAt: string | null;
  freezeReason: string | null;
  /** 异常已消除、等待另一名值班员复核（复核前仍冻结） */
  pendingReview: boolean;
  clearedByReadingId: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
}

export interface Specimen {
  id: string;
  species: string;
  location: string;
  altitude: number;
  habitat: string;
  collector: string;
  pressing: string;
  idStatus: string;
  cabinetId: string | null;
}
