
import React, { useMemo, useState, useEffect } from 'react';
import { Room, BedStatus, CleaningStatus, RoomGenderPolicy, Guest, SystemSettings } from '../types';
import { ETHNIC_GROUPS } from '../constants';

interface DashboardProps {
  rooms: Room[];
  guests: Guest[];
  settings: SystemSettings;
  onBedAction: (bedId: string, updates: any) => void;
  onQuickBook: (bedId: string) => void;
  onExtendStay: (guestId: string, days: number) => void;
}

type ConfirmAction = {
  type: 'extend' | 'process' | 'clean' | 'checkout';
  targetId: string;
  title: string;
  message: string;
  guestName?: string;
  roomInfo?: string;
  pricePerNight?: number;
  currentCheckOut?: string;
  bedId?: string; // 用于执行退房的具体关联床位
};

const Dashboard: React.FC<DashboardProps> = ({ rooms, guests, settings, onBedAction, onQuickBook, onExtendStay }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [confirmState, setConfirmState] = useState<ConfirmAction | null>(null);
  const [extendDays, setExtendDays] = useState(1);
  const [processedIds, setProcessedIds] = useState<string[]>([]);

  // 推荐房源过滤状态
  const [filterPeopleCount, setFilterPeopleCount] = useState<number>(1);
  const [filterGender, setFilterGender] = useState<'男' | '女' | '不限'>('不限');
  const [filterEthnicity, setFilterEthnicity] = useState<string>('全部民族');

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // 深度智能推荐逻辑
  const recommendedRooms = useMemo(() => {
    return rooms
      .map(room => {
        const availableCleanBeds = room.beds.filter(
          b => b.status === BedStatus.AVAILABLE && b.cleaningStatus === CleaningStatus.CLEAN
        );

        let genderMatch = true;
        if (filterGender === '男') {
          genderMatch = room.genderPolicy === RoomGenderPolicy.MALE || room.genderPolicy === RoomGenderPolicy.MIXED;
        } else if (filterGender === '女') {
          genderMatch = room.genderPolicy === RoomGenderPolicy.FEMALE || room.genderPolicy === RoomGenderPolicy.MIXED;
        }

        const currentGuestIdsInRoom = room.beds
          .filter(b => b.status === BedStatus.OCCUPIED)
          .map(b => b.guestId);
        const roomGuests = guests.filter(g => currentGuestIdsInRoom.includes(g.id));

        let ethnicityMatch = true;
        let hasEthnicitySame = false;
        
        if (filterEthnicity !== '全部民族') {
          if (roomGuests.length > 0) {
            hasEthnicitySame = roomGuests.some(g => g.ethnicity === filterEthnicity);
            ethnicityMatch = hasEthnicitySame || roomGuests.length === 0;
          }
        }

        return { 
          ...room, 
          availableCount: availableCleanBeds.length, 
          firstAvailableBed: availableCleanBeds[0],
          genderMatch,
          ethnicityMatch,
          hasEthnicitySame
        };
      })
      .filter(r => 
        r.availableCount >= filterPeopleCount && 
        r.genderMatch && 
        r.ethnicityMatch 
      )
      .sort((a, b) => {
        if (a.hasEthnicitySame && !b.hasEthnicitySame) return -1;
        if (!a.hasEthnicitySame && b.hasEthnicitySame) return 1;
        return b.availableCount - a.availableCount;
      })
      .slice(0, 4);
  }, [rooms, guests, filterPeopleCount, filterGender, filterEthnicity]);

  const stats = useMemo(() => {
    // 今日营收：今日入住的客人总收费
    const todayStr = new Date().toISOString().split('T')[0];
    const todayRevenue = guests
      .filter(g => g.checkIn === todayStr)
      .reduce((sum, g) => sum + g.totalPaid, 0);

    // 累计营收：系统所有客人实付总额
    const totalRevenue = guests.reduce((sum, g) => sum + g.totalPaid, 0);
    
    const totalBeds = rooms.reduce((sum, r) => sum + r.beds.length, 0);
    const occupiedBeds = rooms.reduce((sum, r) => sum + r.beds.filter(b => b.status === BedStatus.OCCUPIED).length, 0);
    const occupancy = totalBeds ? Math.round((occupiedBeds / totalBeds) * 100) : 0;
    const dirtyBeds = rooms.reduce((s, r) => s + r.beds.filter(b => b.cleaningStatus === CleaningStatus.DIRTY).length, 0);
    
    return { todayRevenue, totalRevenue, occupancy, dirtyBeds };
  }, [rooms, guests]);

  const overdueGuests = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const [configHour, configMin] = settings.checkOutTime.split(':').map(Number);
    const checkOutThreshold = new Date();
    checkOutThreshold.setHours(configHour, configMin + settings.overtimeAlertMinutes, 0, 0);

    return guests.filter(g => {
      if (processedIds.includes(g.id)) return false;
      return g.checkOut < today || (g.checkOut === today && currentTime > checkOutThreshold);
    }).map(g => {
      const room = rooms.find(r => r.beds.some(b => g.bedIds.includes(b.id)));
      const beds = room?.beds.filter(b => g.bedIds.includes(b.id)) || [];
      const totalDailyPrice = beds.reduce((sum, b) => sum + b.pricePerNight, 0);
      return { ...g, roomNumber: room?.number, totalDailyPrice };
    });
  }, [guests, rooms, settings, currentTime, processedIds]);

  const handleExecuteConfirm = () => {
    if (!confirmState) return;
    if (confirmState.type === 'extend') onExtendStay(confirmState.targetId, extendDays);
    if (confirmState.type === 'process') setProcessedIds(prev => [...prev, confirmState.targetId]);
    if (confirmState.type === 'clean') onBedAction(confirmState.targetId, { cleaningStatus: CleaningStatus.CLEAN });
    if (confirmState.type === 'checkout' && confirmState.bedId) {
      onBedAction(confirmState.bedId, { status: BedStatus.AVAILABLE });
    }
    setConfirmState(null);
    setExtendDays(1);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="今日预订营收" value={`¥${stats.todayRevenue}`} color="bg-emerald-500" />
        <StatCard title="历史实收总计" value={`¥${stats.totalRevenue}`} color="bg-indigo-500" />
        <StatCard title="当前入住率" value={`${stats.occupancy}%`} color="bg-blue-500" />
        <StatCard title="待清扫任务" value={stats.dirtyBeds} color="bg-amber-500" />
      </div>

      <section className="space-y-4">
        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h3 className="text-lg font-black text-slate-800 tracking-tight flex items-center">
              <span className="w-2.5 h-2.5 bg-indigo-500 rounded-full mr-2 shadow-lg shadow-indigo-200 animate-pulse"></span>
              智能房源推荐
            </h3>
            
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center space-x-2 bg-slate-50 p-1 rounded-2xl border border-slate-100">
                <span className="text-[10px] font-black text-slate-400 pl-2 uppercase">人数</span>
                <select value={filterPeopleCount} onChange={(e) => setFilterPeopleCount(+e.target.value)} className="bg-white px-3 py-1.5 rounded-xl text-xs font-black text-indigo-600 outline-none shadow-sm">
                  {[1,2,3,4,6,8].map(n => <option key={n} value={n}>{n}人</option>)}
                </select>
              </div>

              <div className="flex items-center space-x-2 bg-slate-50 p-1 rounded-2xl border border-slate-100">
                <span className="text-[10px] font-black text-slate-400 pl-2 uppercase">性别</span>
                <div className="flex bg-white rounded-xl p-0.5 shadow-sm">
                  {['不限', '男', '女'].map(g => (
                    <button key={g} onClick={() => setFilterGender(g as any)} className={`px-3 py-1 rounded-lg text-xs font-black transition-all ${filterGender === g ? (g === '男' ? 'bg-blue-500 text-white shadow-md' : g === '女' ? 'bg-pink-500 text-white shadow-md' : 'bg-indigo-600 text-white shadow-md') : 'text-slate-400 hover:text-slate-600'}`}>
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center space-x-2 bg-slate-50 p-1 rounded-2xl border border-slate-100">
                <span className="text-[10px] font-black text-slate-400 pl-2 uppercase">民族</span>
                <select value={filterEthnicity} onChange={(e) => setFilterEthnicity(e.target.value)} className="bg-white px-3 py-1.5 rounded-xl text-xs font-black text-indigo-600 outline-none shadow-sm max-w-[100px]">
                  <option value="全部民族">全部</option>
                  {ETHNIC_GROUPS.map(e => <option key={e} value={e}>{e}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {recommendedRooms.map(room => (
              <button key={room.id} onClick={() => onQuickBook(room.firstAvailableBed!.id)} className="group relative bg-slate-50 p-6 rounded-[2rem] border border-transparent text-left hover:bg-white hover:border-indigo-500 hover:shadow-xl hover:shadow-indigo-100 transition-all active:scale-95 overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <svg className="w-12 h-12 text-indigo-600" fill="currentColor" viewBox="0 0 24 24"><path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                </div>
                <div className="flex justify-between items-start mb-2">
                  <div className="text-2xl font-black text-slate-800 tracking-tighter">{room.number} 房</div>
                  {room.hasEthnicitySame && (
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-600 rounded text-[8px] font-black uppercase">同民族室友</span>
                  )}
                </div>
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">{room.type} · {room.genderPolicy}</div>
                <div className="flex items-end justify-between">
                  <div className="space-y-1">
                    <span className="block text-xs font-bold text-indigo-600 bg-white px-2 py-0.5 rounded-lg w-fit shadow-sm">余 {room.availableCount} 床</span>
                    <span className="block text-[10px] font-black text-slate-400">¥{room.beds[0].pricePerNight}/床</span>
                  </div>
                  <div className="w-8 h-8 bg-slate-900 rounded-xl flex items-center justify-center text-white shadow-lg group-hover:bg-indigo-600 transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-rose-50/20">
              <h3 className="text-lg font-black text-slate-800 tracking-tight">异常监控 · 超期访客</h3>
              <span className="text-[10px] font-black text-rose-500 bg-rose-100 px-3 py-1 rounded-full uppercase">Realtime</span>
            </div>
            <div className="divide-y divide-slate-50">
              {overdueGuests.map(guest => (
                <div key={guest.id} className="px-8 py-5 flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center font-black text-xs">
                      {guest.roomNumber}
                    </div>
                    <div>
                      <h4 className="font-black text-slate-800 text-sm">{guest.name} <span className="text-slate-300 mx-1">|</span> {guest.peopleCount}人</h4>
                      <p className="text-[10px] text-slate-400 font-bold italic mt-0.5">应退: {guest.checkOut}</p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => setConfirmState({
                        type: 'checkout',
                        targetId: guest.id,
                        bedId: guest.bedIds[0],
                        title: '确认退房',
                        message: `是否立即为「${guest.name}」办理退房？`
                      })}
                      className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-[10px] font-black hover:bg-rose-50 hover:text-rose-600 transition-all"
                    >
                      办理退房
                    </button>
                    <button 
                      onClick={() => setConfirmState({
                        type: 'extend',
                        targetId: guest.id,
                        title: '续住处理',
                        message: `为「${guest.name}」办理延期。`,
                        currentCheckOut: guest.checkOut,
                        pricePerNight: guest.totalDailyPrice
                      })}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100"
                    >
                      快速续住
                    </button>
                  </div>
                </div>
              ))}
              {overdueGuests.length === 0 && (
                <div className="py-12 text-center text-slate-300 font-bold text-sm italic">当前无超期待处理事项</div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm">
          <h3 className="text-lg font-black text-slate-800 mb-6 px-2">待办 · 清扫清单</h3>
          <div className="space-y-3">
             {rooms.flatMap(r => r.beds).filter(b => b.cleaningStatus !== CleaningStatus.CLEAN).slice(0, 5).map(bed => {
               const roomNum = rooms.find(r => r.id === bed.roomId)?.number;
               return (
                <div key={bed.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-transparent hover:border-indigo-100 transition-all">
                  <div className="flex flex-col">
                    <span className="text-xs font-black text-slate-800">{roomNum} 房 · {bed.name}</span>
                    <span className="text-[9px] text-amber-600 font-black uppercase mt-0.5 tracking-tighter">待打扫</span>
                  </div>
                  <button onClick={() => onBedAction(bed.id, { cleaningStatus: CleaningStatus.CLEAN })} className="p-2 bg-white text-emerald-600 rounded-xl shadow-sm border border-slate-100 hover:bg-emerald-50 active:scale-90 transition-all">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                  </button>
                </div>
               );
             })}
          </div>
        </div>
      </div>

      {confirmState && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setConfirmState(null)} />
          <div className="relative bg-white w-full max-w-sm rounded-[3rem] p-10 shadow-2xl animate-in zoom-in-95 duration-200 text-center">
            <h4 className="text-2xl font-black text-slate-800 tracking-tighter mb-4">{confirmState.title}</h4>
            <p className="text-sm text-slate-500 font-medium mb-8 leading-relaxed">{confirmState.message}</p>
            {confirmState.type === 'extend' && (
              <div className="flex items-center justify-center space-x-6 mb-8">
                <button onClick={() => setExtendDays(Math.max(1, extendDays - 1))} className="w-10 h-10 bg-slate-100 rounded-xl text-xl font-black text-slate-600">-</button>
                <div className="text-center">
                  <span className="text-3xl font-black text-indigo-600">{extendDays}</span>
                  <span className="block text-[10px] font-black text-slate-400 uppercase">天</span>
                </div>
                <button onClick={() => setExtendDays(extendDays + 1)} className="w-10 h-10 bg-slate-100 rounded-xl text-xl font-black text-slate-600">+</button>
              </div>
            )}
            <div className="space-y-3">
              <button onClick={handleExecuteConfirm} className={`w-full py-4 text-white rounded-2xl font-black shadow-lg transition-all active:scale-95 ${confirmState.type === 'checkout' ? 'bg-rose-500 hover:bg-rose-600' : 'bg-slate-900 hover:bg-slate-800'}`}>确定执行</button>
              <button onClick={() => setConfirmState(null)} className="w-full py-4 bg-slate-100 text-slate-500 rounded-2xl font-black">取消</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const StatCard = ({ title, value, color }: any) => (
  <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm group hover:shadow-md transition-all">
    <div className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">{title}</div>
    <div className="text-3xl font-black text-slate-800 tracking-tighter">{value}</div>
    <div className={`mt-4 h-1 w-8 rounded-full ${color} transition-all group-hover:w-full`}></div>
  </div>
);

export default Dashboard;
