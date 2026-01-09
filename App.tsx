
import React, { useState, useMemo, useEffect } from 'react';
import { ViewType, Room, Guest, BedStatus, CleaningStatus, RoomType, RoomGenderPolicy, Bed, SystemSettings } from './types';
import { INITIAL_ROOMS, INITIAL_GUESTS } from './constants';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import RoomManager from './components/RoomManager';
import GuestManager from './components/GuestManager';
import Analytics from './components/Analytics';
import BookingModal from './components/BookingModal';
import Notification from './components/Notification';
import Settings from './components/Settings';

const STORAGE_KEYS = {
  ROOMS: 'ZENSTAY_ROOMS_DATA',
  GUESTS: 'ZENSTAY_GUESTS_DATA',
  SETTINGS: 'ZENSTAY_SETTINGS_DATA'
};

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  
  // 核心数据状态：优先从本地存储读取
  const [rooms, setRooms] = useState<Room[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ROOMS);
    return saved ? JSON.parse(saved) : INITIAL_ROOMS;
  });
  const [guests, setGuests] = useState<Guest[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.GUESTS);
    return saved ? JSON.parse(saved) : INITIAL_GUESTS;
  });
  const [settings, setSettings] = useState<SystemSettings>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    return saved ? JSON.parse(saved) : {
      standardPrice: 50,
      superiorPrice: 85,
      checkOutTime: '12:00',
      overtimeAlertMinutes: 30
    };
  });

  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [selectedBedId, setSelectedBedId] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  // 模拟 MySQL 持久化：状态改变立即同步至本地存储
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.ROOMS, JSON.stringify(rooms)); }, [rooms]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.GUESTS, JSON.stringify(guests)); }, [guests]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings)); }, [settings]);

  const viewTitles: Record<ViewType, string> = {
    dashboard: '仪表盘', rooms: '床位与客房', guests: '访客管理', analytics: '数据分析', settings: '系统设置'
  };

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // 办理退房：释放该访客占用的所有床位
  const handleCheckoutGuest = (guestId: string) => {
    const guest = guests.find(g => g.id === guestId);
    if (!guest) return;

    setRooms(prevRooms => prevRooms.map(room => ({
      ...room,
      beds: room.beds.map(bed => 
        guest.bedIds.includes(bed.id) 
          ? { ...bed, status: BedStatus.AVAILABLE, guestId: undefined, cleaningStatus: CleaningStatus.DIRTY }
          : bed
      )
    })));
    showToast(`${guest.name} 及其同行人员已退房，床位待清理`);
  };

  const handleUpdateBed = (bedId: string, updates: Partial<Bed>) => {
    // 如果是退房操作，需要特殊处理（可能涉及多人）
    if (updates.status === BedStatus.AVAILABLE) {
      const bed = rooms.flatMap(r => r.beds).find(b => b.id === bedId);
      if (bed?.guestId) {
        handleCheckoutGuest(bed.guestId);
        return;
      }
    }

    setRooms(prevRooms => prevRooms.map(room => {
      if (!room.beds.some(b => b.id === bedId)) return room;
      return { ...room, beds: room.beds.map(bed => bed.id === bedId ? { ...bed, ...updates } : bed) };
    }));
  };

  const handleExtendStay = (guestId: string, days: number) => {
    setGuests(prev => prev.map(g => {
      if (g.id !== guestId) return g;
      const currentOut = new Date(g.checkOut);
      currentOut.setDate(currentOut.getDate() + days);
      
      // 查找对应床位计算总价（基于占用的所有床位）
      const firstBedId = g.bedIds[0];
      const allBeds = rooms.flatMap(r => r.beds);
      const guestBeds = allBeds.filter(b => g.bedIds.includes(b.id));
      const dailyPrice = guestBeds.reduce((sum, b) => sum + b.pricePerNight, 0);

      return { 
        ...g, 
        checkOut: currentOut.toISOString().split('T')[0], 
        totalPaid: g.totalPaid + (dailyPrice * days) 
      };
    }));
    showToast(`续住成功，离店日期已顺延 ${days} 天`);
  };

  const handleAddBooking = (newGuest: Omit<Guest, 'id'>) => {
    const guestId = `g-${Date.now()}`;
    const newGuestRecord: Guest = { ...newGuest, id: guestId };
    
    setGuests(prev => [...prev, newGuestRecord]);
    
    setRooms(prevRooms => prevRooms.map(room => {
      // 只有包含被选床位的房间才需要更新
      const hasSelectedBeds = room.beds.some(b => newGuest.bedIds.includes(b.id));
      if (!hasSelectedBeds) return room;

      return {
        ...room,
        beds: room.beds.map(bed => 
          newGuest.bedIds.includes(bed.id) 
            ? { ...bed, status: BedStatus.OCCUPIED, guestId } 
            : bed
        ),
        genderPolicy: newGuest.gender === '男' ? RoomGenderPolicy.MALE : RoomGenderPolicy.FEMALE
      };
    }));

    setIsBookingModalOpen(false);
    showToast('入住登记成功，床位已锁定');
  };

  /**
   * Fix: Added handleBatchAddRooms function to handle bulk room creation.
   * Error in file App.tsx on line 163 was "Cannot find name 'handleBatchAddRooms'".
   */
  const handleBatchAddRooms = (startNum: number, count: number, bedsCount: number, type: RoomType) => {
    const newRooms: Room[] = [];
    const baseId = Date.now();
    for (let i = 0; i < count; i++) {
      const roomNum = (startNum + i).toString();
      const roomId = `r-batch-${baseId}-${i}`;
      const price = type === RoomType.STANDARD ? settings.standardPrice : settings.superiorPrice;
      
      const beds: Bed[] = Array.from({ length: bedsCount }, (_, index) => ({
        id: `b-${roomId}-${index}`,
        name: `床位 ${String.fromCharCode(65 + index)}`,
        roomId: roomId,
        status: BedStatus.AVAILABLE,
        cleaningStatus: CleaningStatus.CLEAN,
        pricePerNight: price
      }));

      newRooms.push({
        id: roomId,
        number: roomNum,
        type: type,
        genderPolicy: RoomGenderPolicy.MIXED,
        beds: beds
      });
    }
    setRooms(prev => [...prev, ...newRooms]);
    showToast(`成功批量创建 ${count} 间客房`);
  };

  /**
   * Fix: Added handleSaveSettings function to handle configuration updates.
   * Error in file App.tsx on line 168 was "Cannot find name 'handleSaveSettings'".
   */
  const handleSaveSettings = (newSettings: SystemSettings) => {
    setSettings(newSettings);
    showToast('系统配置已更新');
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden relative">
      <Sidebar activeView={currentView} setView={setCurrentView} isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header viewTitle={viewTitles[currentView]} onAddGuest={() => setIsBookingModalOpen(true)} onMenuClick={() => setIsMobileMenuOpen(true)} />
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-7xl mx-auto space-y-8">
            {currentView === 'dashboard' && (
              <Dashboard 
                rooms={rooms} guests={guests} settings={settings} 
                onBedAction={handleUpdateBed} 
                onQuickBook={(id) => { setSelectedBedId(id); setIsBookingModalOpen(true); }}
                onExtendStay={handleExtendStay}
              />
            )}
            {currentView === 'rooms' && (
              <RoomManager 
                rooms={rooms} 
                guests={guests} 
                onBedAction={handleUpdateBed} 
                onDeleteRoom={(id) => setRooms(r => r.filter(x => x.id !== id))} 
                onOpenBooking={(id) => { setSelectedBedId(id); setIsBookingModalOpen(true); }} 
                onBatchAdd={handleBatchAddRooms} 
              />
            )}
            {currentView === 'guests' && <GuestManager guests={guests} rooms={rooms} />}
            {currentView === 'analytics' && <Analytics guests={guests} />}
            {currentView === 'settings' && <Settings settings={settings} onSave={handleSaveSettings} />}
          </div>
        </div>
        {isBookingModalOpen && (
          <BookingModal 
            isOpen={isBookingModalOpen} 
            onClose={() => { setIsBookingModalOpen(false); setSelectedBedId(null); }} 
            onConfirm={handleAddBooking} 
            rooms={rooms} 
            guests={guests} 
            preselectedBedId={selectedBedId} 
          />
        )}
      </main>
      {notification && <Notification message={notification.message} type={notification.type} />}
    </div>
  );
};

export default App;
