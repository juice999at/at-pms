
import React, { useState } from 'react';
import { Room, BedStatus, CleaningStatus, RoomType, RoomGenderPolicy, Guest } from '../types';

interface RoomManagerProps {
  rooms: Room[];
  guests: Guest[];
  onBedAction: (bedId: string, updates: any) => void;
  onDeleteRoom: (roomId: string) => void;
  onOpenBooking: (bedId: string) => void;
  onBatchAdd: (startNum: number, count: number, beds: number, type: RoomType) => void;
}

const RoomManager: React.FC<RoomManagerProps> = ({ rooms, guests, onBedAction, onDeleteRoom, onOpenBooking, onBatchAdd }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | RoomType>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | BedStatus>('ALL');
  const [showBatchModal, setShowBatchModal] = useState(false);

  // 增强版搜索逻辑：支持按房号、床位名、住客姓名、电话搜索
  const filteredRooms = rooms.map(room => {
    const beds = room.beds.filter(bed => {
      const guest = guests.find(g => g.id === bed.guestId);
      const guestMatch = guest ? (guest.name.includes(searchTerm) || guest.phone.includes(searchTerm)) : false;
      const matchSearch = room.number.includes(searchTerm) || bed.name.includes(searchTerm) || guestMatch;
      const matchStatus = statusFilter === 'ALL' || bed.status === statusFilter;
      return matchSearch && matchStatus;
    });
    return { ...room, beds };
  }).filter(room => {
    const matchType = typeFilter === 'ALL' || room.type === typeFilter;
    return matchType && room.beds.length > 0;
  });

  return (
    <div className="space-y-4 md:space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      {/* 增强搜索工具栏 */}
      <div className="bg-white p-4 md:p-6 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col md:flex-row items-stretch md:items-center gap-4">
        <div className="flex-1 relative group">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-indigo-500">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </span>
          <input 
            type="text" 
            placeholder="搜房号、床位、姓名或手机..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium"
          />
        </div>
        <div className="flex gap-2">
          <select 
            value={typeFilter} 
            onChange={(e) => setTypeFilter(e.target.value as any)}
            className="flex-1 md:flex-none px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none font-black text-slate-600 focus:ring-2 focus:ring-indigo-500"
          >
            <option value="ALL">全部房型</option>
            <option value={RoomType.STANDARD}>标准间</option>
            <option value={RoomType.SUPERIOR}>豪华间</option>
          </select>
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="flex-1 md:flex-none px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none font-black text-slate-600 focus:ring-2 focus:ring-indigo-500"
          >
            <option value="ALL">全部状态</option>
            <option value={BedStatus.AVAILABLE}>待预订</option>
            <option value={BedStatus.OCCUPIED}>已入住</option>
          </select>
        </div>
        <button 
          onClick={() => setShowBatchModal(true)}
          className="bg-indigo-600 text-white px-6 py-3 rounded-2xl text-sm font-black shadow-lg shadow-indigo-200 hover:bg-indigo-700 active:scale-95 transition-all"
        >
          批量添加房间
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
        {filteredRooms.map((room) => (
          <div key={room.id} className="bg-white rounded-[3rem] border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl transition-all flex flex-col">
            <div className="bg-slate-50/80 px-8 py-6 border-b border-slate-200 flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm ${
                  room.genderPolicy === RoomGenderPolicy.MALE ? 'bg-blue-500 text-white' : 
                  room.genderPolicy === RoomGenderPolicy.FEMALE ? 'bg-pink-500 text-white' : 'bg-slate-400 text-white'
                }`}>
                  {room.genderPolicy}
                </div>
                <h3 className="text-2xl font-black text-slate-800 tracking-tighter">{room.number} 号房间</h3>
                <div className="text-[10px] text-slate-400 font-bold bg-white px-3 py-1 rounded-xl border border-slate-100 uppercase">{room.type}</div>
              </div>
              <button 
                onClick={() => onDeleteRoom(room.id)}
                className="text-slate-300 hover:text-red-500 p-2.5 hover:bg-red-50 rounded-2xl transition-all"
                title="删除此客房"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </button>
            </div>
            
            <div className="p-6 space-y-4 flex-1">
              {room.beds.map((bed) => {
                const guest = guests.find(g => g.id === bed.guestId);
                return (
                  <div key={bed.id} className={`group p-5 rounded-[2rem] border-2 transition-all ${
                    bed.status === BedStatus.OCCUPIED 
                      ? 'border-indigo-100 bg-indigo-50/20' 
                      : 'border-slate-50 bg-slate-50/30 hover:border-slate-100'
                  }`}>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-5">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl shadow-md transition-all group-hover:scale-110 ${
                          bed.status === BedStatus.OCCUPIED ? 'bg-indigo-600 text-white shadow-indigo-200' : 'bg-white text-slate-400 border border-slate-100'
                        }`}>
                          {bed.name.slice(-1)}
                        </div>
                        <div className="min-w-0">
                          <span className="text-sm font-black text-slate-800 block">{bed.name}</span>
                          {guest ? (
                            <div className="mt-1.5 flex flex-col">
                              <span className="text-sm font-bold text-slate-900 leading-tight">{guest.name}</span>
                              <span className="text-[11px] text-slate-400 font-bold mt-0.5 tracking-tighter">{guest.phone}</span>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400 font-medium italic opacity-60">空闲床位</span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end gap-3">
                        <span className="text-[10px] font-black text-slate-500 bg-white px-3 py-1 rounded-xl border border-slate-100 shadow-sm">¥{bed.pricePerNight}</span>
                        <div className="flex items-center space-x-1.5">
                          {bed.status === BedStatus.AVAILABLE ? (
                            <button 
                              onClick={() => onOpenBooking(bed.id)} 
                              className="p-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-100 active:scale-90 transition-all"
                              title="办理入住"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
                            </button>
                          ) : (
                            <button 
                              onClick={() => onBedAction(bed.id, { status: BedStatus.AVAILABLE, guestId: undefined, cleaningStatus: CleaningStatus.DIRTY })} 
                              className="p-2.5 bg-red-100 text-red-600 rounded-xl hover:bg-red-200 active:scale-90 transition-all"
                              title="办理退房"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 16l4-4m0 0l-4-4m4 4H7" /></svg>
                            </button>
                          )}
                          <button 
                            onClick={() => onBedAction(bed.id, { cleaningStatus: bed.cleaningStatus === CleaningStatus.CLEAN ? CleaningStatus.DIRTY : CleaningStatus.CLEAN })}
                            className={`p-2.5 rounded-xl active:scale-90 transition-all border ${
                              bed.cleaningStatus === CleaningStatus.CLEAN ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'
                            }`}
                            title="切换清洁状态"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547" /></svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {showBatchModal && (
        <BatchAddModal 
          onClose={() => setShowBatchModal(false)}
          onConfirm={(...args: any[]) => { onBatchAdd(args[0], args[1], args[2], args[3]); setShowBatchModal(false); }}
        />
      )}
    </div>
  );
};

const BatchAddModal = ({ onClose, onConfirm }: any) => {
  const [data, setData] = useState({ start: 101, count: 5, beds: 4, type: RoomType.STANDARD });
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full max-w-md rounded-[3rem] p-10 space-y-8 shadow-2xl overflow-y-auto max-h-[95vh]">
        <div className="space-y-2">
          <h2 className="text-3xl font-black text-slate-800 tracking-tighter">客房批量创建</h2>
          <p className="text-sm text-slate-400 font-medium tracking-tight">快速初始化您的青年旅舍房间和床位。</p>
        </div>
        
        <div className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">起始房号</label>
            <input type="number" value={data.start} onChange={e => setData({...data, start: +e.target.value})} className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold transition-all" />
          </div>
          <div className="grid grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">生成数量</label>
              <input type="number" value={data.count} onChange={e => setData({...data, count: +e.target.value})} className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">床位数/房</label>
              <input type="number" value={data.beds} onChange={e => setData({...data, beds: +e.target.value})} className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold" />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">客房类型</label>
            <select value={data.type} onChange={e => setData({...data, type: e.target.value as any})} className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-black text-slate-600 appearance-none">
              <option value={RoomType.STANDARD}>标准客房 (床位合住)</option>
              <option value={RoomType.SUPERIOR}>豪华客房 (尊享空间)</option>
            </select>
          </div>
        </div>

        <div className="flex gap-4 pt-4">
          <button onClick={onClose} className="flex-1 py-5 bg-slate-100 rounded-[2rem] font-black text-slate-500 hover:bg-slate-200 transition-all">取消</button>
          <button onClick={() => onConfirm(data.start, data.count, data.beds, data.type)} className="flex-1 py-5 bg-indigo-600 text-white rounded-[2rem] font-black shadow-xl shadow-indigo-200 transition-all active:scale-95">确认生成</button>
        </div>
      </div>
    </div>
  );
}

export default RoomManager;
