import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

// ⚠️ อย่าลืมเปลี่ยนเป็นค่าจริงจาก Firebase Console ของคุณ
const firebaseConfig = {
  apiKey: "AIzaSyDyPcq_8DsS3_SMq6p7slSzkMZqEmafRnU",
  authDomain: "smart-queue-app-9b876.firebaseapp.com",
  databaseURL: "https://smart-queue-app-9b876-default-rtdb.firebaseio.com",
  projectId: "smart-queue-app-9b876",
  storageBucket: "smart-queue-app-9b876.firebasestorage.app",
  messagingSenderId: "984036906758",
  appId: "1:984036906758:web:92b5bfd9dd480ccde93087"
};

const app = initializeApp(firebaseConfig);

// 🔴 บรรทัดนี้สำคัญมาก! ต้องมีคำว่า export const db
export const db = getDatabase(app);