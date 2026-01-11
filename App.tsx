
import React, { useState, useEffect } from 'react';
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

// 导入 Firebase 实例
import { db } from './firebase';
import { 
  collection, 
  onSnapshot, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
} from "firebase/firestore";

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  
  // 状态管理
  const [rooms, setRooms] = useState<Room[]>([]);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [settings, setSettings] = useState<SystemSettings>({
    standardPrice: 50,
    superiorPrice: 85,
    checkOutTime: '12:00',
    overtimeAlertMinutes: 30
  });
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState<string | null>(null);

  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [selectedBedId, setSelectedBedId] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  // 1. 监听 Firebase 数据实时同步
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (loading) {
        setLoading(false);
        setDbError("连接较慢，正在尝试离线访问...");
      }
    }, 5000);

    const unsubRooms = onSnapshot(collection(db, "rooms"), 
      (snapshot) => {
        const roomData = snapshot.docs.map(doc => doc.data() as Room);
        if (roomData.length > 0) {
          setRooms(roomData);
        } else {
          INITIAL_ROOMS.forEach(r => setDoc(doc(db, "rooms", r.id), r));
        }
      },
      (error) => {
        console.error("Rooms listener error:", error);
        setDbError("无法访问数据库，请检查网络或 Firebase 权限规则。");
      }
    );

    const unsubGuests = onSnapshot(collection(db, "guests"), 
      (snapshot) => {
        const guestData = snapshot.docs.map(doc => doc.data() as Guest);
        setGuests(guestData);
      },
      (error) => console.error("Guests listener error:", error)
    );

    const unsubSettings = onSnapshot(doc(db, "config", "system"), 
      (snapshot) => {
        if (snapshot.exists()) {
          setSettings(snapshot.data() as SystemSettings);
        } else {
          setDoc(doc(db, "config", "system"), settings);
        }
        setLoading(false);
        clearTimeout(timeout);
      },
      (error) => {
        setLoading(false);
      }
    );

    return () => {
      unsubRooms();
      unsubGuests();
      unsubSettings();
      clearTimeout(timeout);
    };
  }, []);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleCheckoutGuest = async (guestId: string) => {
    try {
      const guest = guests.find(g => g.id === guestId);
      if (!guest) return;
      const affectedRooms = rooms.filter(room => room.beds.some(bed => guest.bedIds.includes(bed.id)));
      for (const room of affectedRooms) {
        const updatedBeds = room.beds.map(bed => 
          guest.bedIds.includes(bed.id) 
            ? { ...bed, status: BedStatus.AVAILABLE, guestId: undefined, cleaningStatus: CleaningStatus.DIRTY }
            : bed
        );
        await updateDoc(doc(db, "rooms", room.id), { beds: updatedBeds });
      }
      showToast(`${guest.name} 已退房`);
    } catch (e) {
      showToast('退房失败，请检查连接', 'error');
    }
  };

  const handleUpdateBed = async (bedId: string, updates: Partial<Bed>) => {
    try {
      const room = rooms.find(r => r.beds.some(b => b.id === bedId));
      if (!room) return;
      if (updates.status === BedStatus.AVAILABLE) {
        const bed = room.beds.find(b => b.id === bedId);
        if (bed?.guestId) { handleCheckoutGuest(bed.guestId); return; }
      }
      const updatedBeds = room.beds.map(bed => bed.id === bedId ? { ...bed, ...updates } : bed);
      await updateDoc(doc(db, "rooms", room.id), { beds: updatedBeds });
    } catch (e) {
      showToast('更新失败', 'error');
    }
  };

  const handleExtendStay = async (guestId: string, days: number) => {
    try {
      const guest = guests.find(g => g.id === guestId);
      if (!guest) return;
      const currentOut = new Date(guest.checkOut);
      currentOut.setDate(currentOut.getDate() + days);
      const allBeds = rooms.flatMap(r => r.beds);
      const guestBeds = allBeds.filter(b => guest.bedIds.includes(b.id));
      const dailyPrice = guestBeds.reduce((sum, b) => sum + b.pricePerNight, 0);
      await updateDoc(doc(db, "guests", guestId), {
        checkOut: currentOut.toISOString().split('T')[0],
        totalPaid: guest.totalPaid + (dailyPrice * days)
      });
      showToast(`续住成功`);
    } catch (e) {
      showToast('续住失败', 'error');
    }
  };

  const handleAddBooking = async (newGuest: Omit<Guest, 'id'>) => {
    try {
      const guestId = `g-${Date.now()}`;
      const newGuestRecord: Guest = { ...newGuest, id: guestId };
      await setDoc(doc(db, "guests", guestId), newGuestRecord);
      
      const affectedRooms = rooms.filter(room => room.beds.some(b => newGuest.bedIds.includes(b.id)));
      for (const room of affectedRooms) {
        const updatedBeds = room.beds.map(bed => 
          newGuest.bedIds.includes(bed.id) ? { ...bed, status: BedStatus.OCCUPIED, guestId } : bed
        );
        await updateDoc(doc(db, "rooms", room.id), { 
          beds: updatedBeds,
          genderPolicy: newGuest.gender === '男' ? RoomGenderPolicy.MALE : RoomGenderPolicy.FEMALE 
        });
      }
      setIsBookingModalOpen(false);
      showToast('登记成功');
    } catch (error) {
      console.error(error);
      showToast('登记失败，请检查数据库权限', 'error');
    }
  };

  const handleBatchAddRooms = async (startNum: number, count: number, bedsCount: number, type: RoomType) => {
    try {
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
        const newRoom: Room = { id: roomId, number: roomNum, type: type, genderPolicy: RoomGenderPolicy.MIXED, beds: beds };
        await setDoc(doc(db, "rooms", roomId), newRoom);
      }
      showToast(`批量创建成功`);
    } catch (e) {
      showToast('创建失败', 'error');
    }
  };

  const handleSaveSettings = async (newSettings: SystemSettings) => {
    try {
      await setDoc(doc(db, "config", "system"), newSettings);
      showToast('设置已更新');
    } catch (e) {
      showToast('更新失败', 'error');
    }
  };

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
          <p className="mt-4 font-black text-slate-400 animate-pulse uppercase tracking-widest text-xs">正在连接数据库...</p>
        </div>
      </div>
    );
  }

  const viewTitles: Record<ViewType, string> = {
    dashboard: '管理仪表盘', rooms: '房态管理', guests: '访客记录', analytics: '统计报表', settings: '系统设置'
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden relative">
      <Sidebar activeView={currentView} setView={setCurrentView} isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header viewTitle={viewTitles[currentView]} onAddGuest={() => setIsBookingModalOpen(true)} onMenuClick={() => setIsMobileMenuOpen(true)} />
        {dbError && (
          <div className="bg-amber-50 border-b border-amber-100 px-8 py-2 text-[10px] font-black text-amber-600 flex justify-between items-center">
            <span>警告: {dbError}</span>
            <button onClick={() => setDbError(null)}>关闭</button>
          </div>
        )}
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
                rooms={rooms} guests={guests} onBedAction={handleUpdateBed} 
                onDeleteRoom={async (id) => { await deleteDoc(doc(db, "rooms", id)); showToast('房间已移除'); }} 
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
            rooms={rooms} guests={guests} preselectedBedId={selectedBedId} 
          />
        )}
      </main>
      {notification && <Notification message={notification.message} type={notification.type} />}
    </div>
  );
};

export default App;
