import React, { useState, useEffect } from 'react';
import { ref, onValue, push, remove, update } from 'firebase/database';
import { db } from '../firebase';

export default function AdminTables() {
  const [tables, setTables] = useState([]);
  const [tableName, setTableName] = useState('');
  const [capacity, setCapacity] = useState(2);

  // ดึงข้อมูลโต๊ะทั้งหมดแบบ Real-time
  useEffect(() => {
    const tablesRef = ref(db, 'tables');
    const unsubscribe = onValue(tablesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.keys(data).map(key => ({ id: key, ...data[key] }));
        setTables(list);
      } else {
        setTables([]);
      }
    });
    return () => unsubscribe();
  }, []);

  // เพิ่มโต๊ะใหม่
  const handleAddTable = (e) => {
    e.preventDefault();
    if (!tableName) return;
    push(ref(db, 'tables'), {
      name: tableName,
      capacity: parseInt(capacity),
      status: 'AVAILABLE' // AVAILABLE = โต๊ะว่าง, OCCUPIED = มีลูกค้านั่ง
    });
    setTableName('');
    setCapacity(2);
  };

  // ลบโต๊ะ
  const handleDeleteTable = (id) => {
    if (window.confirm('คุณต้องการลบโต๊ะนี้ใช่หรือไม่?')) {
      remove(ref(db, `tables/${id}`));
    }
  };

  // เปลี่ยนสถานะโต๊ะ (ว่าง <-> มีลูกค้านั่ง)
  const toggleTableStatus = (id, currentStatus) => {
    const newStatus = currentStatus === 'AVAILABLE' ? 'OCCUPIED' : 'AVAILABLE';
    update(ref(db, `tables/${id}`), { status: newStatus });
  };

  return (
    <div style={{ padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '12px', marginBottom: '20px' }}>
      <h2>🍽️ จัดการโต๊ะในร้าน (Table Management)</h2>
      
      {/* ฟอร์มเพิ่มโต๊ะ */}
      <form onSubmit={handleAddTable} style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <input 
          type="text" 
          placeholder="ชื่อโต๊ะ (เช่น A1, T-01)" 
          value={tableName} 
          onChange={(e) => setTableName(e.target.value)}
          style={{ padding: '8px', borderRadius: '6px', border: '1px solid #ccc' }}
          required 
        />
        <select 
          value={capacity} 
          onChange={(e) => setCapacity(e.target.value)}
          style={{ padding: '8px', borderRadius: '6px', border: '1px solid #ccc' }}
        >
          <option value={2}>2 ที่นั่ง (Group S)</option>
          <option value={4}>4 ที่นั่ง (Group M)</option>
          <option value={6}>6 ที่นั่ง (Group L)</option>
          <option value={8}>8 ที่นั่ง (Group XL)</option>
        </select>
        <button type="submit" style={{ padding: '8px 16px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
          + เพิ่มโต๊ะ
        </button>
      </form>

      {/* รายการโต๊ะ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '15px' }}>
        {tables.map((t) => (
          <div key={t.id} style={{ 
            border: '1px solid #ddd', 
            borderRadius: '8px', 
            padding: '15px', 
            backgroundColor: t.status === 'AVAILABLE' ? '#e8f5e9' : '#ffebee',
            textAlign: 'center'
          }}>
            <h3 style={{ margin: '0 0 5px 0' }}>{t.name}</h3>
            <p style={{ margin: '0 0 10px 0', color: '#666' }}>รองรับ: {t.capacity} ที่นั่ง</p>
            <p style={{ fontWeight: 'bold', color: t.status === 'AVAILABLE' ? '#2e7d32' : '#c62828' }}>
              {t.status === 'AVAILABLE' ? '🟢 โต๊ะว่าง' : '🔴 มีลูกค้านั่ง'}
            </p>
            <div style={{ display: 'flex', gap: '5px', justifyContent: 'center' }}>
              <button 
                onClick={() => toggleTableStatus(t.id, t.status)}
                style={{ padding: '5px 10px', fontSize: '12px', cursor: 'pointer' }}
              >
                สลับสถานะ
              </button>
              <button 
                onClick={() => handleDeleteTable(t.id)}
                style={{ padding: '5px 10px', fontSize: '12px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
              >
                ลบ
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}