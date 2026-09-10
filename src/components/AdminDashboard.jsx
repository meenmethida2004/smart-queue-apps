import React, { useState, useEffect } from 'react';
import { ref, onValue, update } from 'firebase/database';
import { db } from '../firebase';

export default function AdminDashboard() {
  const [queues, setQueues] = useState([]);

  useEffect(() => {
    const queueRef = ref(db, 'queues');
    const unsubscribe = onValue(queueRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.keys(data).map(key => ({ id: key, ...data[key] }));
        setQueues(list);
      } else {
        setQueues([]);
      }
    });
    return () => unsubscribe();
  }, []);

  // กดเรียกคิว
  const handleCall = (id) => {
    update(ref(db, `queues/${id}`), {
      status: 'CALLED',
      calledAt: Date.now()
    });
  };

  // กดเสร็จสิ้น
  const handleComplete = (id) => {
    update(ref(db, `queues/${id}`), { status: 'COMPLETED' });
  };

  // กดข้ามคิว
  const handleSkip = (id) => {
    update(ref(db, `queues/${id}`), { status: 'SKIPPED' });
  };

  return (
    <div style={{ padding: '20px', backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #ddd' }}>
      <h2>📋 แดชบอร์ดจัดการคิว (Admin Dashboard)</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
        <thead>
          <tr style={{ backgroundColor: '#f1f1f1', textAlign: 'left' }}>
            <th style={{ padding: '10px' }}>ชื่อลูกค้า</th>
            <th style={{ padding: '10px' }}>จำนวน</th>
            <th style={{ padding: '10px' }}>กลุ่ม</th>
            <th style={{ padding: '10px' }}>สถานะ</th>
            <th style={{ padding: '10px' }}>จัดการ</th>
          </tr>
        </thead>
        <tbody>
          {queues.map((q) => (
            <tr key={q.id} style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: '10px' }}>{q.name} ({q.phone})</td>
              <td style={{ padding: '10px' }}>{q.guests} ท่าน</td>
              <td style={{ padding: '10px' }}><span style={{ padding: '2px 8px', backgroundColor: '#e1f5fe', borderRadius: '4px' }}>{q.category}</span></td>
              <td style={{ padding: '10px' }}>
                <strong style={{
                  color: q.status === 'WAITING' ? '#f39c12' :
                         q.status === 'CALLED' ? '#27ae60' :
                         q.status === 'SKIPPED' ? '#c0392b' : '#2980b9'
                }}>
                  {q.status}
                </strong>
              </td>
              <td style={{ padding: '10px', display: 'flex', gap: '5px' }}>
                {q.status === 'WAITING' && (
                  <button onClick={() => handleCall(q.id)} style={{ backgroundColor: '#ff7675', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}>
                    📢 เรียก
                  </button>
                )}
                {q.status === 'CALLED' && (
                  <button onClick={() => handleComplete(q.id)} style={{ backgroundColor: '#55efc4', color: '#000', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}>
                    ✅ เข้าโต๊ะแล้ว
                  </button>
                )}
                <button onClick={() => handleSkip(q.id)} style={{ backgroundColor: '#dfe6e9', color: '#000', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}>
                  ❌ ข้าม
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}