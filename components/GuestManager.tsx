
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

  const getBedInfo = (bedId: string) => {
    for (const room of rooms) {
      const bed = room.beds.find(b => b.id === bedId);
      if (bed) return { roomNum: room.number, bedName: bed.name };
    }
    return { roomNum: '未知', bedName: '未知' };
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm animate-in slide-in-from-right-4 duration-500">
      <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h3 className="text-xl font-bold text-slate-800">访客名录</h3>
        <div className="relative">
          <input 
            type="text" 
            placeholder="通过姓名或手机号搜索..." 
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
              <th className="px-6 py-4">联系方式</th>
              <th className="px-6 py-4">房间/床位</th>
              <th className="px-6 py-4">入住 / 退房日期</th>
              <th className="px-6 py-4">支付总额</th>
              <th className="px-6 py-4 text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredGuests.map((guest) => {
              const info = getBedInfo(guest.bedId);
              return (
                <tr key={guest.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-9 h-9 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center font-bold">
                        {guest.name.charAt(0)}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-800">{guest.name}</div>
                        <div className="text-xs text-slate-400">{guest.idNumber}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-slate-600 font-medium">{guest.phone}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="inline-flex items-center px-2 py-1 bg-slate-100 text-slate-700 rounded text-xs font-bold">
                      {info.roomNum} 房 - {info.bedName}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-xs text-slate-500 font-medium">
                      <span className="text-green-600">{guest.checkIn}</span>
                      <span className="mx-1">→</span>
                      <span className="text-red-500">{guest.checkOut}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-bold text-slate-800">¥{guest.totalPaid}</div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-slate-400 hover:text-indigo-600 p-2 rounded-lg transition-colors">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                      </svg>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filteredGuests.length === 0 && (
          <div className="p-12 text-center">
            <div className="text-slate-400 mb-2 font-medium">未找到符合条件的访客</div>
            <button className="text-indigo-600 font-bold hover:underline">办理新访客入住</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default GuestManager;
