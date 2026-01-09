
import { Room, RoomType, BedStatus, CleaningStatus, RoomGenderPolicy, Guest } from './types';

export const ETHNIC_GROUPS = [
  "汉族", "壮族", "满族", "回族", "苗族", "维吾尔族", "土家族", "彝族", "蒙古族", "藏族", "布依族", "侗族", "瑶族", "朝鲜族", "白族", "哈尼族", 
  "哈萨克族", "黎族", "傣族", "畲族", "傈僳族", "仡佬族", "东乡族", "高山族", "拉祜族", "水族", "佤族", "纳西族", "羌族", "土族", "仫佬族", 
  "锡伯族", "柯尔克孜族", "达斡尔族", "景颇族", "毛南族", "撒拉族", "布朗族", "塔吉克族", "阿昌族", "普米族", "鄂温克族", "怒族", "京族", 
  "基诺族", "德昂族", "保安族", "俄罗斯族", "裕固族", "乌孜别克族", "门巴族", "鄂伦春族", "独龙族", "塔塔尔族", "赫哲族", "珞巴族"
];

export const INITIAL_ROOMS: Room[] = [
  {
    id: 'r1',
    number: '101',
    type: RoomType.STANDARD,
    genderPolicy: RoomGenderPolicy.MIXED,
    beds: [
      { id: 'b1-1', name: '床位 A', roomId: 'r1', status: BedStatus.OCCUPIED, cleaningStatus: CleaningStatus.CLEAN, guestId: 'g1', pricePerNight: 50 },
      { id: 'b1-2', name: '床位 B', roomId: 'r1', status: BedStatus.AVAILABLE, cleaningStatus: CleaningStatus.DIRTY, pricePerNight: 50 },
      { id: 'b1-3', name: '床位 C', roomId: 'r1', status: BedStatus.AVAILABLE, cleaningStatus: CleaningStatus.CLEAN, pricePerNight: 50 },
      { id: 'b1-4', name: '床位 D', roomId: 'r1', status: BedStatus.AVAILABLE, cleaningStatus: CleaningStatus.CLEAN, pricePerNight: 50 },
    ]
  },
  {
    id: 'r2',
    number: '102',
    type: RoomType.SUPERIOR,
    genderPolicy: RoomGenderPolicy.FEMALE,
    beds: [
      { id: 'b2-1', name: '床位 A', roomId: 'r2', status: BedStatus.AVAILABLE, cleaningStatus: CleaningStatus.CLEAN, pricePerNight: 85 },
      { id: 'b2-2', name: '床位 B', roomId: 'r2', status: BedStatus.AVAILABLE, cleaningStatus: CleaningStatus.CLEAN, pricePerNight: 85 },
    ]
  }
];

export const INITIAL_GUESTS: Guest[] = [
  { id: 'g1', name: '张伟', phone: '13800000001', idNumber: '110101199001010001', gender: '男', ethnicity: '汉族', checkIn: '2024-05-20', checkOut: '2024-05-25', bedIds: ['b1-1'], totalPaid: 250, peopleCount: 1 },
];
