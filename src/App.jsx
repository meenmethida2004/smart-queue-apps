import React, { useState, useEffect } from 'react';
import { ref, onValue, push, remove, update } from 'firebase/database';
import { QRCodeSVG } from 'qrcode.react';
import { db } from './firebase';
import CustomerBooking from './components/CustomerBooking';

export default function App() {
  const [view, setView] = useState('customer');
  const [tables, setTables] = useState([]);
  const [queues, setQueues] = useState([]);
  const [tableName, setTableName] = useState('');
  const [capacity, setCapacity] = useState(2);
  const [myTicket, setMyTicket] = useState(null);
  const [now, setNow] = useState(Date.now());
  const [showQRModal, setShowQRModal] = useState(false);

  // ดึง URL ปัจจุบันมาใช้ทำ QR Code
  const currentUrl = "https://ngrok.com/docs/errors/err_ngrok_4018";

  // 1. ดึงข้อมูล Realtime จาก Firebase
  useEffect(() => {
    const unsubTables = onValue(ref(db, 'tables'), (snapshot) => {
      const data = snapshot.val();
      setTables(data ? Object.keys(data).map(k => ({ id: k, ...data[k] })) : []);
    });

    const unsubQueues = onValue(ref(db, 'queues'), (snapshot) => {
      const data = snapshot.val();
      setQueues(data ? Object.keys(data).map(k => ({ id: k, ...data[k] })) : []);
    });

    return () => {
      unsubTables();
      unsubQueues();
    };
  }, []);

  // 2. Timer นับเวลาถอยหลัง และระบบยกเลิกคิวออโต้เมื่อถูกเรียกเกิน 5 นาที
  useEffect(() => {
    const timer = setInterval(() => {
      const currentTime = Date.now();
      setNow(currentTime);

      queues.forEach((q) => {
        if (q.status === 'CALLED' && q.calledAt) {
          const diffSec = Math.floor((currentTime - q.calledAt) / 1000);
          if (diffSec >= 300) { // 300 วินาที = 5 นาที
            update(ref(db, `queues/${q.id}`), { status: 'AUTO_CANCELLED' });

            const hasOtherWaiting = queues.some(
              other => other.tableId === q.tableId && other.id !== q.id && other.status === 'WAITING'
            );

            if (!hasOtherWaiting) {
              update(ref(db, `tables/${q.tableId}`), { status: 'AVAILABLE' });
            }
          }
        }
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [queues]);

  // เพิ่มโต๊ะ
  const handleAddTable = (e) => {
    e.preventDefault();
    if (!tableName.trim()) return;

    push(ref(db, 'tables'), {
      name: tableName.trim(),
      capacity: Number(capacity) || 1,
      status: 'AVAILABLE'
    });

    setTableName('');
    setCapacity(2);
  };

  // ลบโต๊ะ
  const handleDeleteTable = (id) => {
    if (window.confirm('ยืนยันลบโต๊ะนี้?')) {
      remove(ref(db, `tables/${id}`));
    }
  };

  // เปลี่ยนสถานะโต๊ะ
  const toggleTableStatus = (tableId, currentStatus) => {
    const nextStatus = currentStatus === 'OCCUPIED' ? 'AVAILABLE' : 'OCCUPIED';
    update(ref(db, `tables/${tableId}`), { status: nextStatus });
  };

  // ลูกค้ากดจองคิว
  const handleCustomerBooked = (bookingData) => {
    const newQueueRef = push(ref(db, 'queues'), {
      ...bookingData,
      status: 'WAITING',
      createdAt: Date.now()
    });

    const table = tables.find(t => t.id === bookingData.tableId);
    if (table && table.status === 'AVAILABLE') {
      update(ref(db, `tables/${bookingData.tableId}`), { status: 'RESERVED' });
    }

    setMyTicket({ id: newQueueRef.key, ...bookingData });
  };

  // อัปเดตสถานะคิว
  const updateQueueStatus = (queueItem, nextStatus) => {
    const updates = { status: nextStatus };

    if (nextStatus === 'CALLED') {
      updates.calledAt = Date.now();
    }

    update(ref(db, `queues/${queueItem.id}`), updates);

    if (nextStatus === 'COMPLETED') {
      update(ref(db, `tables/${queueItem.tableId}`), { status: 'OCCUPIED' });
    } else if (nextStatus === 'SKIPPED') {
      const hasOtherWaiting = queues.some(
        other => other.tableId === queueItem.tableId && other.id !== queueItem.id && other.status === 'WAITING'
      );
      if (!hasOtherWaiting) {
        update(ref(db, `tables/${queueItem.tableId}`), { status: 'AVAILABLE' });
      }
    }
  };

  // เคลียร์คิวที่จบแล้ว
  const handleClearFinishedQueues = () => {
    if (window.confirm('ลบรายการคิวที่เสร็จแล้ว / ยกเลิก ทั้งหมด?')) {
      const finishedQueues = queues.filter(
        q => q.status === 'COMPLETED' || q.status === 'SKIPPED' || q.status === 'AUTO_CANCELLED'
      );
      finishedQueues.forEach(q => remove(ref(db, `queues/${q.id}`)));
    }
  };

  // คำนวณเวลานับถอยหลัง
  const renderCountdown = (calledAt) => {
    if (!calledAt) return null;
    const elapsed = Math.floor((now - calledAt) / 1000);
    const remaining = Math.max(0, 300 - elapsed);
    const mins = Math.floor(remaining / 60);
    const secs = remaining % 60;

    return (
      <span style={{ color: remaining < 60 ? '#ef4444' : '#2563eb', fontWeight: 'bold' }}>
        ⏱️ หมดเวลาใน {mins}:{secs < 10 ? `0${secs}` : secs} นาที
      </span>
    );
  };

  const currentTicketInfo = myTicket ? queues.find(q => q.id === myTicket.id) || myTicket : null;

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      padding: '24px 16px',
      fontFamily: "'Sukhumvit Set', 'Kanit', sans-serif"
    }}>
      {/* Navbar สลับมุมมอง */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '32px' }}>
        <div style={{
          background: '#ffffff',
          padding: '6px',
          borderRadius: '100px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
          border: '1px solid #e2e8f0',
          display: 'flex',
          gap: '4px'
        }}>
          <button 
            onClick={() => setView('customer')}
            style={{
              padding: '10px 24px',
              borderRadius: '100px',
              border: 'none',
              cursor: 'pointer',
              backgroundColor: view === 'customer' ? '#ff4757' : 'transparent',
              color: view === 'customer' ? '#ffffff' : '#64748b',
              fontWeight: '700',
              fontSize: '14px',
              transition: 'all 0.2s'
            }}
          >
            📱 มุมมองลูกค้า
          </button>
          <button 
            onClick={() => setView('admin')}
            style={{
              padding: '10px 24px',
              borderRadius: '100px',
              border: 'none',
              cursor: 'pointer',
              backgroundColor: view === 'admin' ? '#0f172a' : 'transparent',
              color: view === 'admin' ? '#ffffff' : '#64748b',
              fontWeight: '700',
              fontSize: '14px',
              transition: 'all 0.2s'
            }}
          >
            💻 มุมมองร้านค้า (Admin)
          </button>
        </div>
      </div>

      {/* มุมมองลูกค้า */}
      {view === 'customer' && (
        myTicket ? (
          <div style={{
            maxWidth: '420px',
            margin: '0 auto',
            padding: '32px 24px',
            background: '#ffffff',
            borderRadius: '24px',
            boxShadow: '0 12px 32px rgba(0,0,0,0.08)',
            border: '1px solid #f0f0f0',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>🎉</div>
            <h2 style={{ color: '#16a34a', margin: '0 0 8px 0', fontSize: '22px', fontWeight: '800' }}>จองคิวสำเร็จ!</h2>
            <p style={{ color: '#64748b', fontSize: '14px', margin: '0 0 20px 0' }}>โปรดแคปหน้าจอนี้ไว้เพื่อแสดงต่อเจ้าหน้าที่</p>
            
            <div style={{
              padding: '20px',
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: '16px',
              marginBottom: '24px',
              textAlign: 'left'
            }}>
              <p style={{ margin: '4px 0', fontWeight: '800', fontSize: '18px', color: '#0f172a' }}>คุณ {currentTicketInfo?.name}</p>
              <p style={{ margin: '4px 0', color: '#475569', fontSize: '14px' }}>📞 เบอร์โทร: {currentTicketInfo?.phone}</p>
              <p style={{ margin: '4px 0', color: '#475569', fontSize: '14px' }}>🪑 โต๊ะที่เลือก: <b style={{ color: '#ff4757' }}>{currentTicketInfo?.tableName}</b></p>
              
              <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px dashed #bbf7d0' }}>
                <div style={{ fontSize: '14px', color: '#334155' }}>
                  สถานะปัจจุบัน: 
                  <span style={{
                    marginLeft: '8px',
                    fontWeight: '800',
                    color: currentTicketInfo?.status === 'CALLED' ? '#2563eb' : currentTicketInfo?.status === 'AUTO_CANCELLED' ? '#ef4444' : '#d97706'
                  }}>
                    {currentTicketInfo?.status === 'WAITING' && '⏳ กำลังรอคิว'}
                    {currentTicketInfo?.status === 'CALLED' && '📢 ร้านค้ากำลังเรียกคิว!'}
                    {currentTicketInfo?.status === 'COMPLETED' && '✅ เข้าโต๊ะเรียบร้อย'}
                    {currentTicketInfo?.status === 'SKIPPED' && '❌ ข้ามคิว/ยกเลิก'}
                    {currentTicketInfo?.status === 'AUTO_CANCELLED' && '⚠️ หมดเวลา (เกิน 5 นาที)'}
                  </span>
                </div>

                {currentTicketInfo?.status === 'CALLED' && (
                  <div style={{ marginTop: '12px', padding: '12px', background: '#eff6ff', borderRadius: '12px', textAlign: 'center', fontSize: '14px', border: '1px solid #bfdbfe' }}>
                    🚨 <b>กรุณาแสดงตัวที่หน้าร้าน</b><br />
                    {renderCountdown(currentTicketInfo.calledAt)}
                  </div>
                )}
              </div>
            </div>

            <button 
              onClick={() => setMyTicket(null)}
              style={{
                width: '100%',
                padding: '14px',
                background: '#ff4757',
                color: '#fff',
                border: 'none',
                borderRadius: '14px',
                cursor: 'pointer',
                fontWeight: '800',
                fontSize: '15px',
                boxShadow: '0 4px 12px rgba(255, 71, 87, 0.25)'
              }}
            >
              จองคิวเพิ่ม / กลับหน้าเลือกโต๊ะ
            </button>
          </div>
        ) : (
          <CustomerBooking tables={tables} queues={queues} onBooked={handleCustomerBooked} />
        )
      )}

      {/* มุมมองร้านค้า Admin */}
      {view === 'admin' && (
        <div style={{ maxWidth: '960px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* แถบเครื่องมือ QR Code หน้าร้าน */}
          <div style={{
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            padding: '20px 24px',
            borderRadius: '20px',
            color: '#fff',
            display: 'flex',
            justify: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px',
            boxShadow: '0 8px 24px rgba(15, 23, 42, 0.15)'
          }}>
            <div>
              <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: '800' }}>📱 ตั้งค่า QR Code สำหรับหน้าร้าน</h3>
              <p style={{ margin: 0, color: '#94a3b8', fontSize: '13px' }}>เปิด QR Code เพื่อให้ลูกค้าสแกนเข้าหน้าจองคิวได้ทันที</p>
            </div>
            <button 
              onClick={() => setShowQRModal(true)}
              style={{
                padding: '10px 20px',
                background: '#ff4757',
                color: '#fff',
                border: 'none',
                borderRadius: '12px',
                cursor: 'pointer',
                fontWeight: '700',
                fontSize: '14px',
                boxShadow: '0 4px 12px rgba(255, 71, 87, 0.3)'
              }}
            >
              📷 เปิด QR Code หน้าร้าน
            </button>
          </div>

          {/* ส่วนจัดการโต๊ะ */}
          <div style={{ background: '#fff', padding: '24px', borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 16px rgba(0,0,0,0.03)' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>🪑 จัดการโต๊ะอาหาร</h3>
            
            <form onSubmit={handleAddTable} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '20px' }}>
              <input 
                placeholder="ชื่อโต๊ะ เช่น โต๊ะ 1" 
                value={tableName} 
                onChange={e => setTableName(e.target.value)}
                style={{ flex: 1, padding: '10px 14px', border: '1px solid #cbd5e1', borderRadius: '10px', outline: 'none' }}
                required 
              />
              <input 
                type="number" 
                value={capacity} 
                onChange={e => setCapacity(e.target.value)}
                style={{ width: '80px', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '10px', textAlign: 'center', outline: 'none' }}
                min="1"
                required 
              />
              <button type="submit" style={{ padding: '10px 20px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '700' }}>
                + เพิ่มโต๊ะ
              </button>
            </form>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '12px' }}>
              {tables.map(t => {
                const isAvailable = t.status === 'AVAILABLE' || !t.status;
                const waitingCount = queues.filter(q => q.tableId === t.id && (q.status === 'WAITING' || q.status === 'CALLED')).length;

                return (
                  <div key={t.id} style={{ border: '1px solid #e2e8f0', padding: '14px', borderRadius: '14px', textAlign: 'center', background: isAvailable ? '#f0fdf4' : '#fff1f2' }}>
                    <div style={{ fontWeight: '800', fontSize: '16px', color: '#0f172a' }}>{t.name}</div>
                    <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '8px' }}>{t.capacity} ที่นั่ง</div>
                    
                    {waitingCount > 0 && (
                      <div style={{ fontSize: '11px', color: '#d97706', fontWeight: '700', marginBottom: '8px' }}>
                        ⏳ รออยู่ {waitingCount} คิว
                      </div>
                    )}

                    <button 
                      onClick={() => toggleTableStatus(t.id, t.status)}
                      style={{
                        width: '100%', padding: '6px 4px', fontSize: '12px', fontWeight: '700', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer',
                        background: isAvailable ? '#22c55e' : '#ef4444', marginBottom: '8px'
                      }}
                    >
                      {isAvailable ? '🟢 โต๊ะว่าง' : '🔴 มีลูกค้านั่ง'}
                    </button>

                    <button onClick={() => handleDeleteTable(t.id)} style={{ color: '#ef4444', border: 'none', background: 'none', cursor: 'pointer', fontSize: '12px', textDecoration: 'underline' }}>
                      ลบโต๊ะ
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* รายการคิว */}
          <div style={{ background: '#fff', padding: '24px', borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 16px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>📋 รายการคิวจองทั้งหมด</h3>
              <button 
                onClick={handleClearFinishedQueues}
                style={{ padding: '8px 16px', background: '#64748b', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '13px', fontWeight: '700' }}
              >
                🧹 เคลียร์คิวที่เสร็จแล้ว/ยกเลิก
              </button>
            </div>
            
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#475569', fontSize: '14px' }}>
                    <th style={{ padding: '12px' }}>โต๊ะ</th>
                    <th style={{ padding: '12px' }}>ชื่อ - เบอร์โทร</th>
                    <th style={{ padding: '12px' }}>สถานะ / เวลาถอยหลัง</th>
                    <th style={{ padding: '12px' }}>จัดการ</th>
                  </tr>
                </thead>
                <tbody>
                  {queues.length === 0 ? (
                    <tr><td colSpan="4" style={{ textAlign: 'center', padding: '32px', color: '#94a3b8' }}>ยังไม่มีรายการคิวเข้ามา</td></tr>
                  ) : (
                    queues.map(q => (
                      <tr key={q.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '12px', fontWeight: '800', color: '#ff4757', fontSize: '15px' }}>{q.tableName}</td>
                        <td style={{ padding: '12px' }}>
                          <b style={{ color: '#0f172a' }}>คุณ {q.name}</b><br />
                          <small style={{ color: '#64748b' }}>📞 {q.phone}</small>
                        </td>
                        <td style={{ padding: '12px' }}>
                          <span style={{
                            padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '700', display: 'inline-block', marginBottom: '4px',
                            background: q.status === 'WAITING' ? '#fef3c7' : q.status === 'CALLED' ? '#dbeafe' : q.status === 'AUTO_CANCELLED' ? '#fee2e2' : q.status === 'SKIPPED' ? '#fee2e2' : '#dcfce7',
                            color: q.status === 'WAITING' ? '#d97706' : q.status === 'CALLED' ? '#2563eb' : q.status === 'AUTO_CANCELLED' ? '#dc2626' : q.status === 'SKIPPED' ? '#dc2626' : '#16a34a'
                          }}>
                            {q.status === 'WAITING' && '⏳ รอเรียก'}
                            {q.status === 'CALLED' && '📢 ถูกเรียกแล้ว'}
                            {q.status === 'COMPLETED' && '✅ เข้าโต๊ะแล้ว'}
                            {q.status === 'SKIPPED' && '❌ ข้าม/ยกเลิก'}
                            {q.status === 'AUTO_CANCELLED' && '⚠️ หมดเวลา (เกิน 5 นาที)'}
                          </span>
                          
                          {q.status === 'CALLED' && (
                            <div style={{ fontSize: '12px', marginTop: '2px' }}>
                              {renderCountdown(q.calledAt)}
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '12px' }}>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            {q.status === 'WAITING' && (
                              <button onClick={() => updateQueueStatus(q, 'CALLED')} style={{ padding: '6px 12px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: '700' }}>📢 เรียกคิว</button>
                            )}
                            {q.status === 'CALLED' && (
                              <button onClick={() => updateQueueStatus(q, 'COMPLETED')} style={{ padding: '6px 12px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: '700' }}>✅ เข้าโต๊ะ</button>
                            )}
                            {q.status !== 'SKIPPED' && q.status !== 'COMPLETED' && q.status !== 'AUTO_CANCELLED' && (
                              <button onClick={() => updateQueueStatus(q, 'SKIPPED')} style={{ padding: '6px 12px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '12px' }}>❌ ข้าม</button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* Modal หน้าต่าง QR Code สำหรับตั้งหน้าร้าน */}
      {showQRModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.6)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: '#ffffff',
            padding: '32px',
            borderRadius: '24px',
            maxWidth: '360px',
            width: '100%',
            textAlign: 'center',
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
          }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: '800' }}>📲 สแกนเพื่อจองคิว</h3>
            <p style={{ margin: '0 0 20px 0', color: '#64748b', fontSize: '13px' }}>สแกน QR Code นี้ด้วยมือถือเพื่อเข้าสู่ระบบจองคิว</p>
            
            <div style={{ padding: '16px', background: '#ffffff', border: '2px solid #f1f5f9', borderRadius: '16px', display: 'inline-block', marginBottom: '20px' }}>
              <QRCodeSVG value={currentUrl} size={200} />
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                onClick={() => window.print()}
                style={{ flex: 1, padding: '10px', background: '#0f172a', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', fontSize: '14px' }}
              >
                🖨️ พิมพ์ QR Code
              </button>
              <button 
                onClick={() => setShowQRModal(false)}
                style={{ flex: 1, padding: '10px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', fontSize: '14px' }}
              >
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}