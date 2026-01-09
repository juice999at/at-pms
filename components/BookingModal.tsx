
import React, { useState, useEffect } from 'react';
import { Room, BedStatus, RoomGenderPolicy, Guest } from '../types';
import { ETHNIC_GROUPS } from '../constants';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (guest: any) => void;
  rooms: Room[];
  guests: Guest[];
  preselectedBedId: string | null;
}

const BookingModal: React.FC<BookingModalProps> = ({ isOpen, onClose, onConfirm, rooms, guests, preselectedBedId }) => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    idNumber: '',
    gender: '男' as '男' | '女',
    ethnicity: '汉族',
    checkIn: new Date().toISOString().split('T')[0],
    checkOut: '',
    bedId: preselectedBedId || '',
    totalPaid: 0
  });

  useEffect(() => {
    if (preselectedBedId) {
      setFormData(prev => ({ ...prev, bedId: preselectedBedId }));
    }
  }, [preselectedBedId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(formData);
  };

  // 根据当前选择的性别过滤可用房间
  const availableRooms = rooms.filter(room => {
    // 允许混住，或者政策与客人性别一致
    if (room.genderPolicy === RoomGenderPolicy.MIXED) return true;
    if (formData.gender === '男' && room.genderPolicy === RoomGenderPolicy.MALE) return true;
    if (formData.gender === '女' && room.genderPolicy === RoomGenderPolicy.FEMALE) return true;
    return false;
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose} />
      <div className="relative bg-white w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="bg-indigo-600 p-6 flex justify-between items-center text-white">
          <h2 className="text-xl font-bold">办理入住登记</h2>
          <button onClick={onClose}><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[80vh] overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">访客姓名</label>
              <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border rounded-xl outline-none" placeholder="张三" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">手机号码</label>
              <input required type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border rounded-xl outline-none" placeholder="13x-xxxx-xxxx" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">性别</label>
              <div className="flex gap-4">
                {['男', '女'].map(g => (
                  <label key={g} className={`flex-1 flex items-center justify-center p-3 border rounded-xl cursor-pointer hover:bg-slate-50 transition-colors ${formData.gender === g ? 'border-indigo-600 bg-indigo-50/50' : 'border-slate-200'}`}>
                    <input type="radio" name="gender" value={g} checked={formData.gender === g} onChange={e => setFormData({...formData, gender: e.target.value as any})} className="hidden" />
                    <span className={`text-sm font-bold ${formData.gender === g ? 'text-indigo-600' : 'text-slate-400'}`}>{g}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">民族</label>
              <select value={formData.ethnicity} onChange={e => setFormData({...formData, ethnicity: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border rounded-xl outline-none">
                {ETHNIC_GROUPS.map(e => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-bold text-slate-700">身份证号码</label>
              <input required type="text" value={formData.idNumber} onChange={e => setFormData({...formData, idNumber: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border rounded-xl outline-none" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">入住日期</label>
              <input required type="date" value={formData.checkIn} onChange={e => setFormData({...formData, checkIn: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border rounded-xl outline-none" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">退房日期</label>
              <input required type="date" value={formData.checkOut} onChange={e => setFormData({...formData, checkOut: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border rounded-xl outline-none" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-bold text-slate-700">分配床位</label>
              <select required value={formData.bedId} onChange={e => setFormData({...formData, bedId: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border rounded-xl outline-none">
                <option value="">请选择床位</option>
                {availableRooms.map(room => (
                  <optgroup key={room.id} label={`${room.number} 房 (${room.type} - ${room.genderPolicy})`}>
                    {room.beds.filter(b => b.status === BedStatus.AVAILABLE).map(bed => (
                      <option key={bed.id} value={bed.id}>{bed.name} - ¥{bed.pricePerNight}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
              {availableRooms.length === 0 && (
                <p className="text-xs text-red-500 mt-1">没有符合当前性别的空余床位。</p>
              )}
            </div>
          </div>
          <div className="flex space-x-4">
            <button type="button" onClick={onClose} className="flex-1 py-4 bg-slate-100 rounded-2xl font-bold">取消</button>
            <button type="submit" className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-200">确认登记</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BookingModal;
