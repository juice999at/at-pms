
export enum RoomType {
  STANDARD = '标准间',
  SUPERIOR = '豪华间'
}

export enum BedStatus {
  AVAILABLE = '空闲',
  OCCUPIED = '已入住',
  RESERVED = '已预订'
}

export enum CleaningStatus {
  CLEAN = '已清洁',
  DIRTY = '待打扫',
  CLEANING = '清扫中'
}

export enum RoomGenderPolicy {
  MALE = '男宿舍',
  FEMALE = '女宿舍',
  MIXED = '男女混住'
}

export interface Bed {
  id: string;
  name: string;
  roomId: string;
  status: BedStatus;
  cleaningStatus: CleaningStatus;
  guestId?: string;
  pricePerNight: number;
}

export interface Room {
  id: string;
  number: string;
  type: RoomType;
  beds: Bed[];
  genderPolicy: RoomGenderPolicy;
}

export interface Guest {
  id: string;
  name: string;
  phone: string;
  idNumber: string;
  gender: '男' | '女';
  ethnicity: string;
  checkIn: string;
  checkOut: string;
  bedIds: string[]; // 改为数组：支持一人登记占用多床
  totalPaid: number;
  peopleCount: number;
}

export interface SystemSettings {
  standardPrice: number;
  superiorPrice: number;
  checkOutTime: string; // HH:mm
  overtimeAlertMinutes: number;
}

export type ViewType = 'dashboard' | 'rooms' | 'guests' | 'analytics' | 'settings';
