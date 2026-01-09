
import React, { useState, useEffect, useMemo } from 'react';
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

const Label: React.FC<{ children: React.ReactNode, required?: boolean }> = ({ children, required }) => (
  <label className="text-sm font-black text-slate-700 flex items-center mb-2">
    {required && <span className="text-rose-500 mr-1">*</span>}
    {children}
  </label>
);

const BookingModal: React.FC<BookingModalProps> = ({ isOpen, onClose, onConfirm, rooms, guests, preselectedBedId }) => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    idNumber: '',
    gender: '男' as '男' | '女',
    ethnicity: '汉族',
    checkIn: new Date().toISOString().split('T')[0],
    checkOut: '',
    bedIds: [] as string[],
    totalPaid: 0,
    peopleCount: 1
  });

  const targetRoom = useMemo(() => {
    if (!preselectedBedId) return null;
    return rooms.find(r => r.beds.some(b => b.id === preselectedBedId)) || null;
  }, [preselectedBedId, rooms]);

  useEffect(() => {
    if (preselectedBedId) {
      setFormData(prev => ({ ...prev, bedIds: [preselectedBedId] }));
    } else {
      setFormData(prev => ({ ...prev, bedIds: [] }));
    }
  }, [preselectedBedId, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.bedIds.length !== formData.peopleCount) {
      alert(`您选择了 ${formData.peopleCount} 人入住，请勾选相应数量的床位（当前已选 ${formData.bedIds.length} 个）。`);
      return;
    }
    onConfirm(formData);
  };

  const toggleBedSelection = (bedId: string) => {
    setFormData(prev => {
      const isSelected = prev.bedIds.includes(bedId);
      if (isSelected) {
        return { ...prev, bedIds: prev.bedIds.filter(id => id !== bedId) };
      } else {
        if (prev.bedIds.length < prev.peopleCount) {
          return { ...prev, bedIds: [...prev.bedIds, bedId] };
        }
        return { ...prev, bedIds: [...prev.bedIds.slice(1), bedId] };
      }
    });
  };

  const availableBedsInRoom = useMemo(() => {
    if (!targetRoom) return [];
    return targetRoom.beds.filter(b => b.status === BedStatus.AVAILABLE || b.id === preselectedBedId);
  }, [targetRoom, preselectedBedId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose} />
      <div className="relative bg-white w-full max-w-xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-100">
        <div className="bg-slate-900 p-8 flex justify-between items-center text-white">
          <div className="flex flex-col">
            <h2 className="text-2xl font-black tracking-tighter">
              入住登记 {targetRoom ? ` - ${targetRoom.number} 房` : ''}
            </h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
              {formData.peopleCount > 1 ? `多人同行：需分配 ${formData.peopleCount} 个床位` : '标准单人入住'}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-2xl transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[75vh] overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <Label required>访客姓名</Label>
              <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold transition-all" placeholder="主入住人姓名" />
            </div>

            <div className="space-y-1">
              <Label required>性别</Label>
              <div className="flex bg-slate-100 p-1 rounded-2xl">
                {['男', '女'].map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setFormData({ ...formData, gender: g as '男' | '女' })}
                    className={`flex-1 py-3 rounded-xl text-sm font-black transition-all ${
                      formData.gender === g ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <Label required>民族</Label>
              <select 
                value={formData.ethnicity} 
                onChange={e => setFormData({...formData, ethnicity: e.target.value})}
                className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold appearance-none"
              >
                {ETHNIC_GROUPS.map(e => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>

            <div className="space-y-1">
              <Label required>入住人数</Label>
              <div className="flex items-center space-x-4 bg-slate-50 border border-slate-100 p-2 rounded-2xl">
                <button type="button" onClick={() => setFormData({...formData, peopleCount: Math.max(1, formData.peopleCount - 1), bedIds: []})} className="w-10 h-10 bg-white rounded-xl shadow-sm font-black text-slate-600 active:scale-90 transition-all">-</button>
                <div className="flex-1 text-center font-black text-indigo-600">{formData.peopleCount} 人</div>
                <button type="button" onClick={() => setFormData({...formData, peopleCount: Math.min(availableBedsInRoom.length || 10, formData.peopleCount + 1), bedIds: []})} className="w-10 h-10 bg-white rounded-xl shadow-sm font-black text-slate-600 active:scale-90 transition-all">+</button>
              </div>
            </div>

            <div className="space-y-1">
              <Label>手机号码</Label>
              <input type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold transition-all" />
            </div>

            <div className="space-y-1">
              <Label>身份证号</Label>
              <input type="text" value={formData.idNumber} onChange={e => setFormData({...formData, idNumber: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold transition-all" />
            </div>

            <div className="space-y-1">
              <Label required>入住日期</Label>
              <input required type="date" value={formData.checkIn} onChange={e => setFormData({...formData, checkIn: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold" />
            </div>
            <div className="space-y-1">
              <Label required>退房日期</Label>
              <input required type="date" value={formData.checkOut} onChange={e => setFormData({...formData, checkOut: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold" />
            </div>

            {targetRoom && (
              <div className="space-y-3 md:col-span-2 pt-2">
                <Label required>勾选分配床位 ({formData.bedIds.length} / {formData.peopleCount})</Label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {availableBedsInRoom.map(bed => (
                    <button
                      key={bed.id}
                      type="button"
                      onClick={() => toggleBedSelection(bed.id)}
                      className={`p-4 rounded-2xl border-2 flex flex-col items-center justify-center transition-all ${
                        formData.bedIds.includes(bed.id)
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                          : 'border-slate-100 bg-slate-50 text-slate-400 hover:border-slate-200'
                      }`}
                    >
                      <span className="text-xs font-black">{bed.name}</span>
                      <span className="text-[10px] font-bold mt-1 opacity-60">¥{bed.pricePerNight}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <div className="flex space-x-4 pt-4">
            <button type="button" onClick={onClose} className="flex-1 py-5 bg-slate-100 rounded-[2rem] font-black text-slate-500 hover:bg-slate-200 transition-all">取消</button>
            <button 
              type="submit" 
              disabled={formData.bedIds.length !== formData.peopleCount}
              className={`flex-1 py-5 rounded-[2rem] font-black shadow-xl transition-all active:scale-95 ${
                formData.bedIds.length === formData.peopleCount
                ? 'bg-indigo-600 text-white shadow-indigo-200 hover:bg-indigo-700'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
              }`}
            >
              确认登记
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BookingModal;
