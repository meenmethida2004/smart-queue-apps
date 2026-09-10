import React, { useState } from 'react';

export default function CustomerBooking({ tables = [], queues = [], onBooked }) {
  const [selectedTable, setSelectedTable] = useState(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  const getWaitingQueueCount = (tableId) => {
    return queues.filter(
      (q) => q.tableId === tableId && (q.status === 'WAITING' || q.status === 'CALLED')
    ).length;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedTable) {
      alert('กรุณาเลือกโต๊ะที่ต้องการจองก่อนครับ');
      return;
    }
    if (!name.trim() || !phone.trim()) {
      alert('กรุณากรอกชื่อและเบอร์โทรศัพท์ให้ครบถ้วนครับ');
      return;
    }

    if (onBooked) {
      onBooked({
        tableName: selectedTable.name,
        tableId: selectedTable.id,
        capacity: selectedTable.capacity,
        name: name.trim(),
        phone: phone.trim()
      });
    }
  };

  return (
    <div style={{
      maxWidth: '480px',
      margin: '0 auto',
      padding: '32px 24px',
      backgroundColor: '#ffffff',
      borderRadius: '24px',
      boxShadow: '0 12px 32px rgba(0, 0, 0, 0.08)',
      border: '1px solid #f0f0f0',
      fontFamily: "'Sukhumvit Set', 'Kanit', sans-serif"
    }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '28px' }}>
        <div style={{ fontSize: '40px', marginBottom: '8px' }}>🍽️</div>
        <h2 style={{ margin: '0 0 6px 0', fontSize: '24px', fontWeight: '800', color: '#1a1d20' }}>
          จองคิวรับประทานอาหาร
        </h2>
        <p style={{ margin: 0, color: '#6c757d', fontSize: '14px' }}>
          เลือกโต๊ะที่ต้องการและกรอกข้อมูลเพื่อรับคิว
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        {/* เลือกโต๊ะ */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', fontWeight: '700', marginBottom: '12px', color: '#2b2d42', fontSize: '15px' }}>
            1. เลือกโต๊ะที่ต้องการจอง
          </label>
          
          {tables.length === 0 ? (
            <div style={{ padding: '20px', background: '#fff5f5', color: '#e53e3e', borderRadius: '16px', textAlign: 'center', fontSize: '14px', border: '1px dashed #feb2b2' }}>
              ❌ ยังไม่มีโต๊ะเปิดให้บริการในขณะนี้
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '12px' }}>
              {tables.map((t) => {
                const isSelected = selectedTable?.id === t.id;
                const waitingCount = getWaitingQueueCount(t.id);
                const isOccupied = t.status === 'OCCUPIED';

                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setSelectedTable(t)}
                    style={{
                      padding: '14px 10px',
                      borderRadius: '16px',
                      border: isSelected ? '2px solid #ff4757' : '1px solid #e2e8f0',
                      backgroundColor: isSelected ? '#ff4757' : '#f8fafc',
                      color: isSelected ? '#ffffff' : '#1e293b',
                      cursor: 'pointer',
                      textAlign: 'center',
                      transition: 'all 0.2s ease',
                      boxShadow: isSelected ? '0 8px 16px rgba(255, 71, 87, 0.25)' : 'none',
                      transform: isSelected ? 'translateY(-2px)' : 'none'
                    }}
                  >
                    <div style={{ fontWeight: '800', fontSize: '16px', marginBottom: '2px' }}>{t.name}</div>
                    <div style={{ fontSize: '12px', opacity: isSelected ? 0.9 : 0.6, marginBottom: '8px' }}>{t.capacity} ที่นั่ง</div>
                    
                    {/* Badge */}
                    <div>
                      {waitingCount > 0 ? (
                        <span style={{
                          fontSize: '11px',
                          padding: '3px 8px',
                          borderRadius: '12px',
                          backgroundColor: isSelected ? 'rgba(255,255,255,0.25)' : '#fef3c7',
                          color: isSelected ? '#fff' : '#d97706',
                          fontWeight: '700'
                        }}>
                          ⏳ รอ {waitingCount} คิว
                        </span>
                      ) : isOccupied ? (
                        <span style={{
                          fontSize: '11px',
                          padding: '3px 8px',
                          borderRadius: '12px',
                          backgroundColor: isSelected ? 'rgba(255,255,255,0.25)' : '#fee2e2',
                          color: isSelected ? '#fff' : '#dc2626',
                          fontWeight: '700'
                        }}>
                          🔴 มีลูกค้านั่ง
                        </span>
                      ) : (
                        <span style={{
                          fontSize: '11px',
                          padding: '3px 8px',
                          borderRadius: '12px',
                          backgroundColor: isSelected ? 'rgba(255,255,255,0.25)' : '#dcfce7',
                          color: isSelected ? '#fff' : '#16a34a',
                          fontWeight: '700'
                        }}>
                          🟢 ว่างอยู่
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* กรอกชื่อ */}
        <div style={{ marginBottom: '18px' }}>
          <label style={{ display: 'block', fontWeight: '700', marginBottom: '8px', color: '#2b2d42', fontSize: '14px' }}>
            2. ชื่อ-นามสกุล
          </label>
          <input 
            type="text" 
            placeholder="เช่น คุณสมชาย" 
            value={name} 
            onChange={(e) => setName(e.target.value)} 
            required 
            style={{
              width: '100%',
              padding: '12px 16px',
              borderRadius: '12px',
              border: '1px solid #cbd5e1',
              fontSize: '15px',
              boxSizing: 'border-box',
              outline: 'none',
              backgroundColor: '#f8fafc'
            }}
          />
        </div>

        {/* กรอกเบอร์โทร */}
        <div style={{ marginBottom: '28px' }}>
          <label style={{ display: 'block', fontWeight: '700', marginBottom: '8px', color: '#2b2d42', fontSize: '14px' }}>
            3. เบอร์โทรศัพท์
          </label>
          <input 
            type="tel" 
            placeholder="08X-XXX-XXXX" 
            value={phone} 
            onChange={(e) => setPhone(e.target.value)} 
            required 
            style={{
              width: '100%',
              padding: '12px 16px',
              borderRadius: '12px',
              border: '1px solid #cbd5e1',
              fontSize: '15px',
              boxSizing: 'border-box',
              outline: 'none',
              backgroundColor: '#f8fafc'
            }}
          />
        </div>

        {/* ปุ่มยืนยัน */}
        <button 
          type="submit" 
          disabled={!selectedTable}
          style={{
            width: '100%',
            padding: '14px',
            background: selectedTable ? 'linear-gradient(135deg, #ff4757 0%, #ff6b81 100%)' : '#cbd5e1',
            color: '#ffffff',
            fontSize: '16px',
            fontWeight: '800',
            border: 'none',
            borderRadius: '14px',
            cursor: selectedTable ? 'pointer' : 'not-allowed',
            boxShadow: selectedTable ? '0 8px 20px rgba(255, 71, 87, 0.3)' : 'none',
            transition: 'all 0.2s ease'
          }}
        >
          ✨ ยืนยันการจองคิว
        </button>
      </form>
    </div>
  );
}