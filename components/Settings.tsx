
import React, { useState } from 'react';
import { SystemSettings } from '../types';

interface SettingsProps {
  settings: SystemSettings;
  onSave: (settings: SystemSettings) => void;
}

const Settings: React.FC<SettingsProps> = ({ settings, onSave }) => {
  const [tempSettings, setTempSettings] = useState<SystemSettings>(settings);

  const handleExportData = () => {
    const data = {
      rooms: localStorage.getItem('ZENSTAY_ROOMS_DATA'),
      guests: localStorage.getItem('ZENSTAY_GUESTS_DATA'),
      settings: localStorage.getItem('ZENSTAY_SETTINGS_DATA'),
      exportDate: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ZenStay_Backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.rooms) localStorage.setItem('ZENSTAY_ROOMS_DATA', data.rooms);
        if (data.guests) localStorage.setItem('ZENSTAY_GUESTS_DATA', data.guests);
        if (data.settings) localStorage.setItem('ZENSTAY_SETTINGS_DATA', data.settings);
        alert('数据恢复成功，页面即将刷新以加载新数据。');
        window.location.reload();
      } catch (err) {
        alert('无效的备份文件');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 md:space-y-8 animate-in slide-in-from-right-4 duration-500">
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm max-w-2xl">
        <h3 className="text-2xl font-black text-slate-800 tracking-tighter mb-8">系统基础配置</h3>
        
        <div className="space-y-8">
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
              </div>
            </div>
          </section>

          <section className="space-y-4 pt-8 border-t border-slate-100">
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center">
              <span className="w-1.5 h-1.5 bg-rose-500 rounded-full mr-2"></span>
              数据持久化与数据库备份
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button 
                onClick={handleExportData}
                className="flex items-center justify-center space-x-2 px-6 py-4 bg-slate-900 text-white rounded-2xl font-black hover:bg-slate-800 transition-all active:scale-95"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                <span>下载全量备份</span>
              </button>
              <label className="flex items-center justify-center space-x-2 px-6 py-4 bg-white border-2 border-slate-200 text-slate-600 rounded-2xl font-black hover:border-indigo-500 hover:text-indigo-600 transition-all active:scale-95 cursor-pointer">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                <span>导入历史备份</span>
                <input type="file" accept=".json" onChange={handleImportData} className="hidden" />
              </label>
            </div>
            <p className="text-[10px] text-slate-400 font-bold leading-relaxed mt-2">
              提示：由于本系统运行在安全沙箱环境中，暂不支持外部 MySQL 连接。您的数据将自动存储在浏览器 LocalStorage 中。为了防止浏览器清理缓存导致数据丢失，建议您定期使用“下载全量备份”功能将数据保存到本地。
            </p>
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
    </div>
  );
};

export default Settings;
