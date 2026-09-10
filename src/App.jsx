import React, { useState } from 'react';

function QueueApp() {
  // 1. State เก็บรายการคิวทั้งหมด
  const [queues, setQueues] = useState([]);
  
  // State สำหรับรับค่าจากฟอร์ม
  const [selectedTableType, setSelectedTableType] = useState('A'); // เช่น 'A', 'B', 'C'
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');

  // 2. ฟังก์ชันกดจองคิว
  const handleBooking = (e) => {
    e.preventDefault();

    if (!customerName || !phone) {
      alert('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    // 🔍 หาจำนวนคิวที่มีอยู่แล้วของประเภทโต๊ะนี้ (เช่น นับเฉพาะโต๊ะประเภท 'A')
    const countSameTableType = queues.filter(
      (q) => q.tableType === selectedTableType
    ).length;

    // 🔢 คำนวณเลขคิวถัดไป (นับจำนวนที่มี + 1)
    const nextQueueNumber = countSameTableType + 1;

    // 🏷️ สร้างรหัสคิว เช่น "A" + 1 = "A1"
    const queueCode = `${selectedTableType}${nextQueueNumber}`;

    // ➕ สร้างวัตถุข้อมูลคิวใหม่
    const newQueue = {
      id: Date.now(),
      queueCode: queueCode,            // เช่น 'A1', 'A2'
      tableType: selectedTableType,    // เช่น 'A'
      queueNumber: nextQueueNumber,    // เช่น 1, 2
      name: customerName,
      phone: phone,
      status: 'waiting',              // สถานะ: waiting, completed, cancelled
      time: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
    };

    // บันทึกลง State คิวทั้งหมด
    setQueues([...queues, newQueue]);

    // แจ้งเตือนลูกค้า
    alert(`จองคิวสำเร็จ! หมายเลขคิวของคุณคือ: ${queueCode}`);

    // ล้างค่าในฟอร์ม
    setCustomerName('');
    setPhone('');
  };

  return (
    <div style={{ padding: '20px', maxWidth: '500px', margin: '0 auto' }}>
      <h2>ระบบจองคิวร้านอาหาร</h2>

      {/* ฟอร์มจองคิว */}
      <form onSubmit={handleBooking}>
        <div>
          <label>เลือกประเภทโต๊ะ: </label>
          <select 
            value={selectedTableType} 
            onChange={(e) => setSelectedTableType(e.target.value)}
          >
            <option value="A">โต๊ะ A (1-2 ท่าน)</option>
            <option value="B">โต๊ะ B (3-4 ท่าน)</option>
            <option value="C">โต๊ะ C (5 ท่านขึ้นไป)</option>
          </select>
        </div>

        <br />

        <div>
          <label>ชื่อลูกค้า: </label>
          <input 
            type="text" 
            value={customerName} 
            onChange={(e) => setCustomerName(e.target.value)} 
            placeholder="ระบุชื่อ"
          />
        </div>

        <br />

        <div>
          <label>เบอร์โทรศัพท์: </label>
          <input 
            type="tel" 
            value={phone} 
            onChange={(e) => setPhone(e.target.value)} 
            placeholder="08x-xxx-xxxx"
          />
        </div>

        <br />

        <button type="submit">ยืนยันการจองคิว</button>
      </form>

      <hr />

      {/* แสดงรายการคิวที่จองแล้ว */}
      <h3>รายการคิวปัจจุบัน</h3>
      {queues.length === 0 ? (
        <p>ยังไม่มีคิวในขณะนี้</p>
      ) : (
        <ul>
          {queues.map((q) => (
            <li key={q.id}>
              <strong>[{q.queueCode}]</strong> - คุณ {q.name} ({q.phone}) | เวลา {q.time}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default QueueApp;