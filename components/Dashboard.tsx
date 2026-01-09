
import React, { useMemo, useState, useEffect } from 'react';
import { Room, BedStatus, CleaningStatus, RoomGenderPolicy, Guest, SystemSettings } from '../types';
import { ETHNIC_GROUPS } from '../constants';

interface DashboardProps {
  rooms: Room[];
  guests: Guest[];
  settings: SystemSettings;
  onBedAction: (bedId: string, updates: any) => void;
  onQuickBook: (bedId: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ rooms, guests, settings, onBedAction, onQuickBook }) => {
  const [filterGender, setFilterGender] = useState<'男' | '女' | '不限'>('不限');
  const [filterEthnicity, setFilterEthnicity] = useState<string>('全部民族');
  const [filterPeopleCount, setFilterPeopleCount] = useState<number>(1);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const stats = useMemo(() => {
    const revenue = rooms.reduce((sum, r) => sum + r.beds.filter(b => b.status === BedStatus.OCCUPIED).reduce((s, b) => s + b.pricePerNight, 0), 0);
    const totalRevenue = guests.reduce((sum, g) => sum + g.totalPaid, 0);
    const totalBeds = rooms.reduce((sum, r) => sum + r.beds.length, 0);
    const occupiedBeds = rooms.reduce((sum, r) => sum + r.beds.filter(b => b.status === BedStatus.OCCUPIED).length, 0);
    const occupancy = totalBeds ? Math.round((occupiedBeds / totalBeds) * 100) : 0;
    const dirtyBeds = rooms.reduce((s, r) => s + r.beds.filter(b => b.cleaningStatus === CleaningStatus.DIRTY).length, 0);
    
    return { revenue, totalRevenue, occupancy, dirtyBeds };
  }, [rooms, guests]);

  // 超时提醒逻辑：检测今天应该退房但仍未退房的客人
  const overdueGuests = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const [configHour, configMin] = settings.checkOutTime.split(':').map(Number);
    const checkOutThreshold = new Date();
    checkOutThreshold.setHours(configHour, configMin + settings.overtimeAlertMinutes, 0, 0);

    return guests.filter(g => {
      // 如果日期已经过去，或者日期是今天且当前时间超过阈值
      const isPastDate = g.checkOut < today;
      const isToday = g.checkOut === today;
      const isStillIn = rooms.some(r => r.beds.some(b => b.guestId === g.id && b.status === BedStatus.OCCUPIED));
      
      return isStillIn && (isPastDate || (isToday && currentTime > checkOutThreshold));
    });
  }, [guests, rooms, settings, currentTime]);

  const recommendedRooms = useMemo(() => {
    return rooms.map(room => {
      let score = 0;
      const availableBeds = room.beds.filter(b => b.status === BedStatus.AVAILABLE && b.cleaningStatus === CleaningStatus.CLEAN);
      const occupiedBeds = room.beds.filter(b => b.status === BedStatus.OCCUPIED);
      const guestsInRoom = guests.filter(g => occupiedBeds.some(b => b.guestId === g.id));

      if (availableBeds.length < filterPeopleCount) return null;
      if (filterGender !== '不限' && guestsInRoom.length > 0) {
        if (guestsInRoom.some(g => g.gender !== filterGender)) return null;
      }

      if (guestsInRoom.length > 0) score += 20;
      if (filterEthnicity !== '全部民族' && guestsInRoom.some(g => g.ethnicity === filterEthnicity)) score += 30;
      if (filterGender !== '不限' && guestsInRoom.every(g => g.gender === filterGender)) score += 15;

      return { room, score, availableBeds, guestsInRoom };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4);
  }, [rooms, guests, filterGender, filterEthnicity, filterPeopleCount]);

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
        <StatCard title="今日预估" value={`¥${stats.revenue}`} color="bg-emerald-500" />
        <StatCard title="累计总额" value={`¥${stats.totalRevenue}`} color="bg-indigo-500" />
        <StatCard title="实时入住率" value={`${stats.occupancy}%`} color="bg-blue-500" />
        <StatCard title="待清理床位" value={stats.dirtyBeds} color="bg-amber-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* 超时提醒 Banner */}
          {overdueGuests.length > 0 && (
            <div className="bg-red-50 border-2 border-red-100 p-6 rounded-[2.5rem] flex flex-col sm:flex-row items-center justify-between gap-4 animate-pulse">
              <div className="flex items-center space-x-4">
                <div className="bg-red-500 text-white p-3 rounded-2xl shadow-lg shadow-red-200">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                </div>
                <div>
                  <h4 className="text-red-800 font-black text-lg tracking-tighter">超时退房警报</h4>
                  <p className="text-red-600 text-xs font-bold">共有 {overdueGuests.length} 位访客已超过预定退房时间 ({settings.checkOutTime})</p>
                </div>
              </div>
              <div className="flex -space-x-3">
                {overdueGuests.slice(0, 5).map(g => (
                  <div key={g.id} className="w-10 h-10 rounded-full border-4 border-red-50 bg-red-100 flex items-center justify-center text-xs font-black text-red-700 shadow-sm" title={g.name}>{g.name[0]}</div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <h3 className="text-xl font-black text-slate-800 tracking-tighter">智能房间推荐</h3>
              <div className="flex flex-wrap gap-2 w-full md:w-auto">
                <select value={filterGender} onChange={e => setFilterGender(e.target.value as any)} className="px-3 py-1.5 bg-slate-100 rounded-xl text-xs font-bold outline-none border-none">
                  <option value="不限">性别不限</option><option value="男">仅男生房</option><option value="女">仅女生房</option>
                </select>
                <select value={filterEthnicity} onChange={e => setFilterEthnicity(e.target.value)} className="px-3 py-1.5 bg-slate-100 rounded-xl text-xs font-bold outline-none border-none max-w-[120px]">
                  <option value="全部民族">民族不限</option>{ETHNIC_GROUPS.map(e => <option key={e} value={e}>{e}</option>)}
                </select>
                <input type="number" min="1" value={filterPeopleCount} onChange={e => setFilterPeopleCount(parseInt(e.target.value) || 1)} className="w-16 px-3 py-1.5 bg-slate-100 rounded-xl text-xs font-bold outline-none border-none" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {recommendedRooms.map(({ room, availableBeds, guestsInRoom, score }) => (
                <div key={room.id} className="relative p-5 bg-slate-50/50 border border-slate-100 rounded-3xl hover:border-indigo-300 transition-all group overflow-hidden">
                  {score > 20 && <div className="absolute top-0 right-0 bg-indigo-600 text-white text-[9px] font-black px-3 py-1 rounded-bl-xl uppercase tracking-tighter">最优匹配</div>}
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="text-lg font-black text-slate-800">{room.number} 号房</h4>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">{room.type} · {availableBeds.length} 空位</p>
                    </div>
                    <button onClick={() => onQuickBook(availableBeds[0].id)} className="bg-indigo-600 text-white p-2 rounded-xl hover:scale-105 active:scale-95 transition-all shadow-md">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
                    </button>
                  </div>
                  <div className="flex items-center space-x-2">
                    {guestsInRoom.length > 0 ? (
                      <div className="flex items-center space-x-2">
                        <div className="flex -space-x-2">
                          {guestsInRoom.slice(0, 3).map(g => <div key={g.id} className="w-8 h-8 rounded-full border-2 border-white bg-indigo-100 flex items-center justify-center text-[10px] font-bold text-indigo-700 shadow-sm">{g.name[0]}</div>)}
                        </div>
                        <span className="text-[10px] text-slate-500 font-bold truncate">{guestsInRoom.length} 位同性住客</span>
                      </div>
                    ) : (
                      <div className="text-[10px] text-slate-400 italic">空房，极佳静谧体验</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm h-fit">
          <h3 className="text-xl font-black text-slate-800 mb-6 tracking-tighter">打扫任务清单</h3>
          <div className="space-y-3">
             {rooms.flatMap(r => r.beds).filter(b => b.cleaningStatus !== CleaningStatus.CLEAN).slice(0, 5).map(bed => {
               const room = rooms.find(r => r.id === bed.roomId);
               return (
                <div key={bed.id} className="group flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-transparent hover:border-indigo-100 transition-all">
                  <div className="flex flex-col">
                    <span className="text-xs font-black text-slate-800">{room?.number} 房 · {bed.name}</span>
                    <span className="text-[10px] text-amber-600 font-bold uppercase mt-0.5">待清扫</span>
                  </div>
                  <button onClick={() => onBedAction(bed.id, { cleaningStatus: CleaningStatus.CLEAN })} className="p-2 bg-white text-emerald-600 rounded-xl shadow-sm hover:bg-emerald-50 active:scale-90 transition-all border border-slate-100">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  </button>
                </div>
               )
             })}
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, color }: any) => (
  <div className="bg-white p-5 md:p-6 rounded-3xl border border-slate-200 shadow-sm transition-all hover:shadow-md group">
    <div className="text-slate-500 text-[10px] md:text-xs font-black uppercase tracking-widest mb-2 group-hover:text-slate-800 transition-colors">{title}</div>
    <div className="text-2xl md:text-4xl font-black text-slate-800 tracking-tighter">{value}</div>
    <div className={`mt-4 h-1.5 w-12 rounded-full ${color} transition-all group-hover:w-full`}></div>
  </div>
);

export default Dashboard;
