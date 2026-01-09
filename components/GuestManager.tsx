
import React, { useState } from 'react';
import { Guest, Room } from '../types';

interface GuestManagerProps {
  guests: Guest[];
  rooms: Room[];
}

const GuestManager: React.FC<GuestManagerProps> = ({ guests, rooms }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredGuests = guests.filter(g => 
    g.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    g.phone.includes(searchTerm)
  );

  const getBedsInfo = (bedIds: string[]) => {
    const results: { roomNum: string, bedNames: string[] }[] = [];
    
    bedIds.forEach(bid => {
      for (const room of rooms) {
        const bed = room.beds.find(b => b.id === bid);
        if (bed) {
          const existing = results.find(r => r.roomNum === room.number);
          if (existing) {
            existing.bedNames.push(bed.name);
          } else {
            results.push({ roomNum: room.number, bedNames: [bed.name] });
          }
          break;
        }
      }
    });
    return results;
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm animate-in slide-in-from-right-4 duration-500">
      <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h3 className="text-xl font-bold text-slate-800">访客名录</h3>
        <div className="relative">
          <input 
            type="text" 
            placeholder="搜姓名或手机号..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all w-full md:w-64"
          />
          <svg className="w-5 h-5 absolute left-3 top-2.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider">
            <tr>
              <th className="px-6 py-4">访客</th>
              <th className="px-6 py-4">入住规模</th>
              <th className="px-6 py-4">占用床位</th>
              <th className="px-6 py-4">起止日期</th>
              <th className="px-6 py-4">累计支付</th>
              <th className="px-6 py-4 text-right">管理</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredGuests.map((guest) => {
              const bedsInfo = getBedsInfo(guest.bedIds);
              return (
                <tr key={guest.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-9 h-9 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center font-bold">
                        {guest.name.charAt(0)}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-800">{guest.name}</div>
                        <div className="text-[10px] text-slate-400 font-bold">{guest.idNumber || '未登记录证件'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-black">
                      {guest.peopleCount} 人同行
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {bedsInfo.map((info, idx) => (
                        <div key={idx} className="bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded text-[10px] font-black border border-indigo-100">
                          {info.roomNum}房: {info.bedNames.join(',')}
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-[11px] font-bold">
                      <span className="text-emerald-600">{guest.checkIn}</span>
                      <span className="mx-1 text-slate-300">/</span>
                      <span className="text-rose-500">{guest.checkOut}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-black text-slate-800 tracking-tighter">¥{guest.totalPaid}</div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-slate-300 hover:text-indigo-600 transition-colors p-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default GuestManager;
