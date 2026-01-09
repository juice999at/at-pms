
import React, { useMemo, useState, useEffect } from 'react';
import { Room, BedStatus, CleaningStatus, RoomGenderPolicy, Guest, SystemSettings } from '../types';
import { ETHNIC_GROUPS } from '../constants';

interface DashboardProps {
  rooms: Room[];
  guests: Guest[];
  settings: SystemSettings;
  onBedAction: (bedId: string, updates: any) => void;
  onQuickBook: (bedId: string) => void;
  onExtendStay: (guestId: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ rooms, guests, settings, onBedAction, onQuickBook, onExtendStay }) => {
  const [filterGender, setFilterGender] = useState<'男' | '女' | '不限'>('不限');
  const [filterEthnicity, setFilterEthnicity] = useState<string>('全部民族');
  const [filterPeopleCount, setFilterPeopleCount] = useState<number>(1);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // 用于追踪已被用户点击“标记已处理”的住客ID
  const [processedIds, setProcessedIds] = useState<string[]>([]);

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

  // 超时提醒逻辑
  const overdueGuests = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const [configHour, configMin] = settings.checkOutTime.split(':').map(Number);
    const checkOutThreshold = new Date();
    checkOutThreshold.setHours(configHour, configMin + settings.overtimeAlertMinutes, 0, 0);

    return guests.filter(g => {
      if (processedIds.includes(g.id)) return false;
      
      const isPastDate = g.checkOut < today;
      const isToday = g.checkOut === today;
      const room = rooms.find(r => r.beds.some(b => b.guestId === g.id && b.status === BedStatus.OCCUPIED));
      
      return room && (isPastDate || (isToday && currentTime > checkOutThreshold));
    }).map(g => {
      const room = rooms.find(r => r.beds.some(b => b.guestId === g.id));
      const bed = room?.beds.find(b => b.guestId === g.id);
      return { ...g, roomNumber: room?.number, bedName: bed?.name };
    });
  }, [guests, rooms, settings, currentTime, processedIds]);

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

  const handleMarkProcessed = (id: string) => {
    setProcessedIds(prev => [...prev, id]);
  };

  const handleExtendConfirm = (guest: any) => {
    if (window.confirm(`确认要为住客 ${guest.name} (${guest.roomNumber}房) 办理续住吗？\n离店日期将顺延一天。`)) {
      onExtendStay(guest.id);
    }
  };

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500">
      {/* 顶部统计 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
        <StatCard title="今日预估" value={`¥${stats.revenue}`} color="bg-emerald-500" />
        <StatCard title="累计总额" value={`¥${stats.totalRevenue}`} color="bg-indigo-500" />
        <StatCard title="实时入住率" value={`${stats.occupancy}%`} color="bg-blue-500" />
        <StatCard title="待清理床位" value={stats.dirtyBeds} color="bg-amber-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        <div className="lg:col-span-2 space-y-6">
          
          {/* 超期预警工作台 */}
          <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-rose-50/30">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-rose-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-rose-200">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-800 tracking-tighter">超期预警工作台</h3>
                  <p className="text-[10px] text-rose-600 font-bold uppercase tracking-wider">应退未退访客实时监控</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-black text-rose-500 bg-rose-100 px-3 py-1 rounded-full">{overdueGuests.length} 位待处理</span>
              </div>
            </div>
            
            <div className="divide-y divide-slate-50">
              {overdueGuests.map(guest => (
                <div key={guest.id} className="px-8 py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between hover:bg-slate-50 transition-colors group">
                  <div className="flex items-center space-x-4 mb-3 sm:mb-0">
                    <div className="w-12 h-12 bg-slate-100 rounded-2xl flex flex-col items-center justify-center text-slate-400 font-black group-hover:bg-rose-100 group-hover:text-rose-500 transition-colors">
                      <span className="text-xs">{guest.roomNumber}</span>
                      <span className="text-[8px] uppercase">{guest.bedName?.slice(-1)}</span>
                    </div>
                    <div>
                      <h4 className="font-black text-slate-800 text-sm">{guest.name}</h4>
                      <p className="text-[10px] text-slate-400 font-bold italic">原定离店: {guest.checkOut} · {settings.checkOutTime}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 w-full sm:w-auto">
                    <button 
                      onClick={() => handleExtendConfirm(guest)}
                      className="flex-1 sm:flex-none px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-black hover:bg-indigo-600 hover:text-white transition-all active:scale-95"
                    >
                      申请续住
                    </button>
                    <button 
                      onClick={() => handleMarkProcessed(guest.id)}
                      className="flex-1 sm:flex-none px-4 py-2 bg-slate-100 text-slate-500 rounded-xl text-xs font-black hover:bg-slate-800 hover:text-white transition-all active:scale-95"
                    >
                      标记已处理
                    </button>
                  </div>
                </div>
              ))}
              {overdueGuests.length === 0 && (
                <div className="py-12 flex flex-col items-center justify-center text-slate-400">
                  <svg className="w-12 h-12 mb-3 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <p className="text-sm font-bold">暂无超期访客，运行平稳</p>
                </div>
              )}
            </div>
          </div>

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
             {rooms.flatMap(r => r.beds).filter(b => b.cleaningStatus !== CleaningStatus.CLEAN).slice(0, 8).map(bed => {
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
