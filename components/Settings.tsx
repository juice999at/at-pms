
import React, { useState } from 'react';
import { SystemSettings } from '../types';

interface SettingsProps {
  settings: SystemSettings;
  onSave: (settings: SystemSettings) => void;
}

const Settings: React.FC<SettingsProps> = ({ settings, onSave }) => {
  const [tempSettings, setTempSettings] = useState<SystemSettings>(settings);

  return (
    <div className="space-y-6 md:space-y-8 animate-in slide-in-from-right-4 duration-500">
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm max-w-2xl">
        <h3 className="text-2xl font-black text-slate-800 tracking-tighter mb-8">系统基础配置</h3>
        
        <div className="space-y-8">
          {/* 房价设置 */}
          <section className="space-y-4">
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center">
              <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full mr-2"></span>
              默认房价设置 (新房间)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">标准间单床价 (¥)</label>
                <input 
                  type="number" 
                  value={tempSettings.standardPrice}
                  onChange={e => setTempSettings({...tempSettings, standardPrice: +e.target.value})}
                  className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-black text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">豪华间单床价 (¥)</label>
                <input 
                  type="number" 
                  value={tempSettings.superiorPrice}
                  onChange={e => setTempSettings({...tempSettings, superiorPrice: +e.target.value})}
                  className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-black text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                />
              </div>
            </div>
          </section>

          {/* 时间设置 */}
          <section className="space-y-4">
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center">
              <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full mr-2"></span>
              离店时间与超时提醒
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">统一退房时间</label>
                <input 
                  type="time" 
                  value={tempSettings.checkOutTime}
                  onChange={e => setTempSettings({...tempSettings, checkOutTime: e.target.value})}
                  className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-black text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">超时警报阈值 (分钟)</label>
                <input 
                  type="number" 
                  value={tempSettings.overtimeAlertMinutes}
                  onChange={e => setTempSettings({...tempSettings, overtimeAlertMinutes: +e.target.value})}
                  className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-black text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                />
                <p className="text-[10px] text-slate-400 font-bold">超出退房时间此分钟数后，看板将标红显示。</p>
              </div>
            </div>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-100 flex justify-end">
          <button 
            onClick={() => onSave(tempSettings)}
            className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black shadow-xl shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all"
          >
            保存配置中心
          </button>
        </div>
      </div>

      <div className="bg-slate-100/50 p-6 rounded-[2rem] border border-slate-200 border-dashed max-w-2xl">
        <div className="flex items-start space-x-4">
          <div className="bg-white p-3 rounded-xl shadow-sm">
            <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <div>
            <h5 className="text-sm font-black text-slate-800">关于价格生效规则</h5>
            <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">
              修改默认房价后，**已预订或已入住**的订单价格不会改变（保护历史财务数据）。<br/>
              新配置仅对当前**空闲状态**的床位以及**未来新创建**的客房生效。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
