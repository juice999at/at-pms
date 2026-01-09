
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

  const handleUpdateBed = (bedId: string, updates: Partial<Bed>) => {
    setRooms(prevRooms => prevRooms.map(room => {
      if (!room.beds.some(b => b.id === bedId)) return room;
      const updatedBeds = room.beds.map(bed => bed.id === bedId ? { ...bed, ...updates } : bed);
      const occupiedBeds = updatedBeds.filter(b => b.status === BedStatus.OCCUPIED);
      let newPolicy = RoomGenderPolicy.MIXED;
      if (occupiedBeds.length > 0) {
        const firstGuest = guests.find(g => g.id === occupiedBeds[0].guestId);
        if (firstGuest) newPolicy = firstGuest.gender === '男' ? RoomGenderPolicy.MALE : RoomGenderPolicy.FEMALE;
      }
      return { ...room, beds: updatedBeds, genderPolicy: newPolicy };
    }));
    if (updates.status === BedStatus.AVAILABLE) showToast('退房手续已办理');
  };

  const handleExtendStay = (guestId: string) => {
    setGuests(prev => prev.map(g => {
      if (g.id !== guestId) return g;
      const currentOut = new Date(g.checkOut);
      currentOut.setDate(currentOut.getDate() + 1);
      return { ...g, checkOut: currentOut.toISOString().split('T')[0], totalPaid: g.totalPaid + 50 };
    }));
    showToast('续住成功，离店日期已顺延一天');
  };

  const handleAddBooking = (newGuest: Omit<Guest, 'id'>) => {
    const guestId = `g-${Date.now()}`;
    setGuests(prev => [...prev, { ...newGuest, id: guestId }]);
    setRooms(prevRooms => prevRooms.map(room => {
      if (!room.beds.some(b => b.id === newGuest.bedId)) return room;
      return {
        ...room,
        beds: room.beds.map(bed => bed.id === newGuest.bedId ? { ...bed, status: BedStatus.OCCUPIED, guestId } : bed),
        genderPolicy: newGuest.gender === '男' ? RoomGenderPolicy.MALE : RoomGenderPolicy.FEMALE
      };
    }));
    setIsBookingModalOpen(false);
    showToast('入住登记成功！');
  };

  // Fix: Added handleBatchAddRooms to handle bulk creation of rooms and beds
  const handleBatchAddRooms = (startNum: number, count: number, bedsCount: number, type: RoomType) => {
    const newRooms: Room[] = [];
    for (let i = 0; i < count; i++) {
      const roomNum = (startNum + i).toString();
      const roomId = `r-${Date.now()}-${i}`;
      const beds: Bed[] = [];
      for (let j = 0; j < bedsCount; j++) {
        beds.push({
          id: `b-${roomId}-${j}`,
          name: `床位 ${String.fromCharCode(65 + j)}`,
          roomId: roomId,
          status: BedStatus.AVAILABLE,
          cleaningStatus: CleaningStatus.CLEAN,
          pricePerNight: type === RoomType.STANDARD ? settings.standardPrice : settings.superiorPrice
        });
      }
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

  const handleSaveSettings = (newSettings: SystemSettings) => {
    setSettings(newSettings);
    showToast('配置已保存');
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
            {currentView === 'rooms' && <RoomManager rooms={rooms} guests={guests} onBedAction={handleUpdateBed} onDeleteRoom={(id) => setRooms(r => r.filter(x => x.id !== id))} onOpenBooking={(id) => { setSelectedBedId(id); setIsBookingModalOpen(true); }} onBatchAdd={handleBatchAddRooms} />}
            {currentView === 'guests' && <GuestManager guests={guests} rooms={rooms} />}
            {currentView === 'analytics' && <Analytics guests={guests} />}
            {currentView === 'settings' && <Settings settings={settings} onSave={handleSaveSettings} />}
          </div>
        </div>
        {isBookingModalOpen && <BookingModal isOpen={isBookingModalOpen} onClose={() => setIsBookingModalOpen(false)} onConfirm={handleAddBooking} rooms={rooms} guests={guests} preselectedBedId={selectedBedId} />}
      </main>
      {notification && <Notification message={notification.message} type={notification.type} />}
    </div>
  );
};

export default App;
