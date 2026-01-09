
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

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [rooms, setRooms] = useState<Room[]>(INITIAL_ROOMS);
  const [guests, setGuests] = useState<Guest[]>(INITIAL_GUESTS);
  const [settings, setSettings] = useState<SystemSettings>({
    standardPrice: 50,
    superiorPrice: 85,
    checkOutTime: '12:00',
    overtimeAlertMinutes: 30
  });
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [selectedBedId, setSelectedBedId] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  const viewTitles: Record<ViewType, string> = {
    dashboard: '仪表盘',
    rooms: '床位与客房',
    guests: '访客管理',
    analytics: '数据分析',
    settings: '系统设置'
  };

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // 动态更新房间性别政策的辅助函数
  const updateRoomPolicy = (room: Room, updatedBeds: Bed[], currentGuests: Guest[]): RoomGenderPolicy => {
    const occupiedBeds = updatedBeds.filter(b => b.status === BedStatus.OCCUPIED);
    if (occupiedBeds.length === 0) return RoomGenderPolicy.MIXED;
    
    const firstGuestId = occupiedBeds[0].guestId;
    const firstGuest = currentGuests.find(g => g.id === firstGuestId);
    if (firstGuest) {
      return firstGuest.gender === '男' ? RoomGenderPolicy.MALE : RoomGenderPolicy.FEMALE;
    }
    return RoomGenderPolicy.MIXED;
  };

  const handleUpdateBed = (bedId: string, updates: Partial<Bed>) => {
    setRooms(prevRooms => {
      return prevRooms.map(room => {
        if (!room.beds.some(b => b.id === bedId)) return room;
        const updatedBeds = room.beds.map(bed => bed.id === bedId ? { ...bed, ...updates } : bed);
        const newPolicy = updateRoomPolicy(room, updatedBeds, guests);
        return { ...room, beds: updatedBeds, genderPolicy: newPolicy };
      });
    });

    if (updates.cleaningStatus === CleaningStatus.CLEAN) showToast('房间打扫状态已更新');
    if (updates.status === BedStatus.AVAILABLE) showToast('退房手续已办理');
  };

  const handleAddBooking = (newGuest: Omit<Guest, 'id'>) => {
    const guestId = `g-${Date.now()}`;
    const guest: Guest = { ...newGuest, id: guestId };
    
    setGuests(prev => {
      const updatedGuests = [...prev, guest];
      setRooms(prevRooms => prevRooms.map(room => {
        if (!room.beds.some(b => b.id === newGuest.bedId)) return room;
        const updatedBeds = room.beds.map(bed => 
          bed.id === newGuest.bedId ? { ...bed, status: BedStatus.OCCUPIED, guestId: guestId } : bed
        );
        const newPolicy = guest.gender === '男' ? RoomGenderPolicy.MALE : RoomGenderPolicy.FEMALE;
        return { ...room, beds: updatedBeds, genderPolicy: newPolicy };
      }));
      return updatedGuests;
    });

    setIsBookingModalOpen(false);
    setSelectedBedId(null);
    showToast('入住登记成功！');
  };

  const handleDeleteRoom = (roomId: string) => {
    const room = rooms.find(r => r.id === roomId);
    if (room?.beds.some(b => b.status === BedStatus.OCCUPIED)) {
      showToast('无法删除：房间内仍有住客', 'error');
      return;
    }
    setRooms(prev => prev.filter(r => r.id !== roomId));
    showToast('房间已彻底移除');
  };

  const handleBatchAddRooms = (startNum: number, count: number, bedsPerRoom: number, type: RoomType) => {
    const newRooms: Room[] = [];
    const price = type === RoomType.STANDARD ? settings.standardPrice : settings.superiorPrice;
    for (let i = 0; i < count; i++) {
      const roomNum = (startNum + i).toString();
      const roomId = `r-${Date.now()}-${i}`;
      const beds: Bed[] = [];
      for (let j = 0; j < bedsPerRoom; j++) {
        beds.push({
          id: `b-${roomId}-${j}`,
          name: `床位 ${String.fromCharCode(65 + j)}`,
          roomId: roomId,
          status: BedStatus.AVAILABLE,
          cleaningStatus: CleaningStatus.CLEAN,
          pricePerNight: price
        });
      }
      newRooms.push({ id: roomId, number: roomNum, type, beds, genderPolicy: RoomGenderPolicy.MIXED });
    }
    setRooms(prev => [...prev, ...newRooms]);
    showToast(`成功批量添加 ${count} 间客房`);
  };

  const handleSaveSettings = (newSettings: SystemSettings) => {
    setSettings(newSettings);
    // 同时更新所有空闲床位的价格
    setRooms(prev => prev.map(room => ({
      ...room,
      beds: room.beds.map(bed => {
        if (bed.status !== BedStatus.AVAILABLE) return bed;
        const newPrice = room.type === RoomType.STANDARD ? newSettings.standardPrice : newSettings.superiorPrice;
        return { ...bed, pricePerNight: newPrice };
      })
    })));
    showToast('配置已保存并生效');
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden relative">
      <Sidebar 
        activeView={currentView} 
        setView={(v) => { setCurrentView(v); setIsMobileMenuOpen(false); }} 
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />
      
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <Header 
          viewTitle={viewTitles[currentView]} 
          onAddGuest={() => setIsBookingModalOpen(true)}
          onMenuClick={() => setIsMobileMenuOpen(true)}
        />
        
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-7xl mx-auto space-y-6 md:space-y-8">
            {currentView === 'dashboard' && (
              <Dashboard 
                rooms={rooms}
                guests={guests}
                settings={settings}
                onBedAction={handleUpdateBed}
                onQuickBook={(id) => { setSelectedBedId(id); setIsBookingModalOpen(true); }}
              />
            )}
            {currentView === 'rooms' && (
              <RoomManager 
                rooms={rooms} 
                guests={guests}
                onBedAction={handleUpdateBed}
                onDeleteRoom={handleDeleteRoom}
                onOpenBooking={(id) => { setSelectedBedId(id); setIsBookingModalOpen(true); }}
                onBatchAdd={handleBatchAddRooms}
              />
            )}
            {currentView === 'guests' && (
              <GuestManager guests={guests} rooms={rooms} />
            )}
            {currentView === 'analytics' && (
              <Analytics guests={guests} />
            )}
            {currentView === 'settings' && (
              <Settings 
                settings={settings} 
                onSave={handleSaveSettings} 
              />
            )}
          </div>
        </div>

        {isBookingModalOpen && (
          <BookingModal 
            isOpen={isBookingModalOpen} 
            onClose={() => setIsBookingModalOpen(false)}
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
