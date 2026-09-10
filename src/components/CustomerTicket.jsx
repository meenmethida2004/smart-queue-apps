import React, { useEffect, useState } from 'react';
import { ref, onValue, update } from 'firebase/database';
import { db } from '../firebase';

export default function CustomerTicket({ queueId, onReset }) {
  const [queue, setQueue] = useState(null);
  const [timeLeft, setTimeLeft] = useState(300);

  useEffect(() => {
    if (!queueId) return;
    const queueRef = ref(db, `queues/${queueId}`);
    const unsubscribe = onValue(queueRef, (snapshot) => {
      setQueue(snapshot.val());
    });
    return () => unsubscribe();
  }, [queueId]);

  useEffect(() => {
    let timer;
    if (queue && queue.status === 'CALLED' && queue.calledAt) {
      timer = setInterval(() => {
        const elapsed = Math.floor((Date.now() - queue.calledAt) / 1000);
        const remaining = 300 - elapsed;

        if (remaining <= 0) {
          clearInterval(timer);
          update(ref(db, `queues/${queueId}`), { status: 'SKIPPED' });
        } else {
          setTimeLeft(remaining);
        }
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [queue, queueId]);

  if (!queue) return <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>กำลังโหลดข้อมูลบัตรคิว...</div>;

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div style={{
      maxWidth: '440px',
      margin: '20px auto',
      padding: '30px 24px',
      backgroundColor: '#ffffff',
      borderRadius: '20px',
      boxShadow: '0 10px 25px rgba(0,0,0,0.08)',
      textAlign: 'center',
      border: '1px solid #eaeaea'
    }}>
      {queue.status === 'WAITING' && (
        <div style={{ padding: '8px 16px', backgroundColor: '#fff7e6', color: '#d48806', borderRadius: '30px', display: 'inline-block', fontWeight: '600', marginBottom: '16px' }}>
          ⏳ กำลังรอคิว...
        </div>
      )}
      {queue.status === 'CALLED' && (
        <div style={{ padding: '8px 16px', backgroundColor: '#e6f7ff', color: '#0958d9', borderRadius: '30px', display: 'inline-block', fontWeight: '600', marginBottom: '16px' }}>
          📢 ถึงคิวของคุณแล้ว!
        </div>
      )}
      {queue.status === 'SKIPPED' && (
        <div style={{ padding: '8px 16px', backgroundColor: '#fff1f0', color: '#cf1322', borderRadius: '30px', display: 'inline-block', fontWeight: '600', marginBottom: '16px' }}>
          ❌ ข้ามคิวเนื่องจากเกิน 5 นาที
        </div>
      )}
      {queue.status === 'COMPLETED' && (
        <div style={{ padding: '8px 16px', backgroundColor: '#f6ffed', color: '#389e0d', borderRadius: '30px', display: 'inline-block', fontWeight: '600', marginBottom: '16px' }}>
          🎉 เข้ารับบริการเรียบร้อย
        </div>
      )}

      <h1 style={{ fontSize: '48px', fontWeight: '800', color: '#1a1a1a', margin: '10px 0 4px 0' }}>
        {queue.category}-{queueId.slice(-3).toUpperCase()}
      </h1>
      <p style={{ fontSize: '18px', fontWeight: '600', color: '#333' }}>คุณ {queue.name}</p>
      <p style={{ fontSize: '14px', color: '#666', marginTop: '4px' }}>จำนวนที่นั่ง: <strong>{queue.guests} ท่าน</strong> (โซน {queue.category})</p>

      {queue.status === 'CALLED' && (
        <div style={{ margin: '24px 0', padding: '20px', backgroundColor: '#fffbe6', borderRadius: '16px', border: '1px solid #ffe58f' }}>
          <p style={{ margin: 0, color: '#d48806', fontWeight: '600', fontSize: '15px' }}>🚨 กรุณารายงานตัวหน้าร้านภายใน</p>
          <div style={{ fontSize: '42px', fontWeight: '800', color: '#ff4757', margin: '6px 0' }}>{formatTime(timeLeft)}</div>
          <p style={{ color: '#8c8c8c', fontSize: '12px', margin: 0 }}>หากเกิน 5 นาที ระบบจะตัดเป็นข้ามคิวอัตโนมัติ</p>
        </div>
      )}

      <button 
        onClick={onReset}
        style={{
          marginTop: '20px',
          padding: '12px 24px',
          backgroundColor: '#f0f2f5',
          color: '#1a1a1a',
          fontWeight: '600',
          width: '100%'
        }}
      >
        จองคิวใหม่ / กลับหน้าหลัก
      </button>
    </div>
  );
}