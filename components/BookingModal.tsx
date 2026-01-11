
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

const getLocalDateString = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const BookingModal: React.FC<BookingModalProps> = ({ isOpen, onClose, onConfirm, rooms, guests, preselectedBedId }) => {
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    idNumber: '',
    gender: '男' as '男' | '女',
    ethnicity: '汉族',
    checkIn: getLocalDateString(today),
    checkOut: getLocalDateString(tomorrow),
    bedIds: [] as string[],
    totalPaid: 0,
    peopleCount: 1
  });

  const targetRoom = useMemo(() => {
    if (!preselectedBedId) return null;
    return rooms.find(r => r.beds.some(b => b.id === preselectedBedId)) || null;
  }, [preselectedBedId, rooms]);

  const availableBedsInRoom = useMemo(() => {
    if (!targetRoom) return [];
    return targetRoom.beds.filter(b => b.status === BedStatus.AVAILABLE || b.id === preselectedBedId);
  }, [targetRoom, preselectedBedId]);

  // 核心功能：自动计算应缴金额
  useEffect(() => {
    if (!formData.checkIn || !formData.checkOut || formData.bedIds.length === 0) {
      setFormData(prev => ({ ...prev, totalPaid: 0 }));
      return;
    }

    const start = new Date(formData.checkIn);
    const end = new Date(formData.checkOut);
    
    // 确保入住和退房日期逻辑正确
    if (end <= start) {
      setFormData(prev => ({ ...prev, totalPaid: 0 }));
      return;
    }

    const nights = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
    
    // 汇总所选床位单价
    const allBeds = rooms.flatMap(r => r.beds);
    const selectedBeds = allBeds.filter(b => formData.bedIds.includes(b.id));
    const totalPrice = selectedBeds.reduce((sum, b) => sum + b.pricePerNight, 0) * nights;

    setFormData(prev => ({ ...prev, totalPaid: totalPrice }));
  }, [formData.checkIn, formData.checkOut, formData.bedIds, rooms]);

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
      alert(`您选择了 ${formData.peopleCount} 人入住，请勾选相应数量的床位。`);
      return;
    }
    if (!formData.checkOut) {
      alert('请选择退房日期');
      return;
    }
    if (formData.totalPaid <= 0) {
      alert('退房日期必须晚于入住日期');
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
        // 如果已经达到人数上限，替换掉第一个（或者根据业务逻辑处理）
        return { ...prev, bedIds: [...prev.bedIds.slice(1), bedId] };
      }
    });
  };

  const isFormValid = formData.name && 
                      formData.bedIds.length === formData.peopleCount && 
                      formData.checkOut && 
                      formData.totalPaid > 0;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose} />
      <div className="relative bg-white w-full max-w-xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-100">
        <div className="bg-slate-900 p-8 flex justify-between items-center text-white">
          <div className="flex flex-col">
            <h2 className="text-2xl font-black tracking-tighter">入住登记 {targetRoom ? ` - ${targetRoom.number} 房` : ''}</h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
              {formData.peopleCount > 1 ? `需要分配 ${formData.peopleCount} 个床位` : '标准单人入住'}
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
              <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold" placeholder="姓名" />
            </div>

            <div className="space-y-1">
              <Label required>性别</Label>
              <div className="flex bg-slate-100 p-1 rounded-2xl">
                {['男', '女'].map((g) => (
                  <button key={g} type="button" onClick={() => setFormData({ ...formData, gender: g as '男' | '女' })} className={`flex-1 py-3 rounded-xl text-sm font-black transition-all ${formData.gender === g ? (g === '男' ? 'bg-blue-500 text-white shadow-md' : 'bg-pink-500 text-white shadow-md') : 'text-slate-400'}`}>
                    {g}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <Label required>民族</Label>
              <select value={formData.ethnicity} onChange={e => setFormData({...formData, ethnicity: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold">
                {ETHNIC_GROUPS.map(e => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>

            <div className="space-y-1">
              <Label required>入住人数</Label>
              <div className="flex items-center space-x-4 bg-slate-50 border border-slate-100 p-2 rounded-2xl">
                <button type="button" onClick={() => setFormData({...formData, peopleCount: Math.max(1, formData.peopleCount - 1), bedIds: []})} className="w-10 h-10 bg-white rounded-xl shadow-sm font-black">-</button>
                <div className="flex-1 text-center font-black text-indigo-600">{formData.peopleCount} 人</div>
                <button type="button" onClick={() => setFormData({...formData, peopleCount: Math.min(availableBedsInRoom.length || 10, formData.peopleCount + 1), bedIds: []})} className="w-10 h-10 bg-white rounded-xl shadow-sm font-black">+</button>
              </div>
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
                <Label required>勾选床位 ({formData.bedIds.length} / {formData.peopleCount})</Label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {availableBedsInRoom.map(bed => (
                    <button key={bed.id} type="button" onClick={() => toggleBedSelection(bed.id)} className={`p-4 rounded-2xl border-2 transition-all ${formData.bedIds.includes(bed.id) ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-100 bg-slate-50 text-slate-400'}`}>
                      <span className="text-xs font-black">{bed.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <div className={`p-6 rounded-3xl flex justify-between items-center transition-colors ${formData.totalPaid > 0 ? 'bg-indigo-50' : 'bg-rose-50'}`}>
             <div>
               <span className={`text-[10px] font-black uppercase tracking-widest block ${formData.totalPaid > 0 ? 'text-indigo-400' : 'text-rose-400'}`}>应收总额</span>
               <span className={`text-2xl font-black ${formData.totalPaid > 0 ? 'text-indigo-700' : 'text-rose-700'}`}>¥{formData.totalPaid}</span>
             </div>
             <div className={`text-right text-[10px] font-bold ${formData.totalPaid > 0 ? 'text-indigo-400' : 'text-rose-400'}`}>
               {formData.totalPaid > 0 ? (
                 <>包含全部床位费用<br/>自动结算至当日营收</>
               ) : (
                 <>日期选择有误<br/>无法计算费用</>
               )}
             </div>
          </div>

          <div className="flex space-x-4">
            <button type="button" onClick={onClose} className="flex-1 py-5 bg-slate-100 rounded-[2rem] font-black text-slate-500">取消</button>
            <button type="submit" disabled={!isFormValid} className={`flex-1 py-5 rounded-[2rem] font-black shadow-xl transition-all ${isFormValid ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}>
              确认登记并收费
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BookingModal;
