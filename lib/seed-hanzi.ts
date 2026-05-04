import { writeBatch, collection, doc } from 'firebase/firestore';
import { db } from './firebase/config';

// 🛑 ĐẠI SƯ CHÚ Ý: CHỈ MỞ KHOÁ 1 TRONG 2 DÒNG DƯỚI ĐÂY CÙNG LÚC!
// Nếu muốn bơm TỪ VỰNG, hãy để code như thế này:
import hanziData from '../data/hsk_words_viet.json';
const COLLECTION_NAME = 'words'; // Lưu vào kho 'words'

// Nếu muốn bơm CHỮ HÁN, hãy thêm dấu // vào 2 dòng trên, và xóa dấu // ở 2 dòng dưới:
// import hanziData from '../data/hsk_characters_chuan.json';
// const COLLECTION_NAME = 'characters'; // Lưu vào kho 'characters'

// Hàm bổ trợ để tạo khoảng nghỉ giữa các đợt đẩy data
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export async function seedHanziData() {
  try {
    const dataArray = hanziData as any[];
    const hanziCollection = collection(db, COLLECTION_NAME);
    
    // GIẢM XUỐNG 100 để tránh làm nghẽn luồng ghi của trình duyệt
    const BATCH_SIZE = 100; 
    let operationCount = 0;

    console.log(`🚀 Bắt đầu Seed ${dataArray.length} bản ghi vào kho '${COLLECTION_NAME}'...`);

    for (let i = 0; i < dataArray.length; i += BATCH_SIZE) {
      const batch = writeBatch(db);
      const batchData = dataArray.slice(i, i + BATCH_SIZE);

      for (const item of batchData) {
        // Lấy chữ Hán làm thông tin
        const hanzi = item.hanzi || item.simplified || item.character;
        if (!hanzi) continue;

        // Ưu tiên dùng 'id' có sẵn trong file json (ví dụ "char_的") làm ID document Firebase
        const documentId = item.id || hanzi; 

        const docData = {
          hanzi,
          pinyin: item.pinyin || '',
          meaning: item.meaning || '',
          ...item, // Bê nguyên toàn bộ các trường khác (như usage, level, example...) vào
          updatedAt: new Date().toISOString(),
        };

        const docRef = doc(hanziCollection, documentId);
        batch.set(docRef, docData);
        operationCount++;
      }

      // Gửi batch
      await batch.commit();
      console.log(`✅ Đã xong đợt: ${Math.min(i + BATCH_SIZE, dataArray.length)}/${dataArray.length}`);

      // QUAN TRỌNG: Nghỉ 1 giây giữa mỗi đợt để trình duyệt "thở"
      await delay(1000); 
    }

    console.log(`🎉 Thành công! Đã lưu ${operationCount} bản ghi vào Firebase.`);
    return operationCount;
  } catch (error) {
    console.error('💥 Lỗi Resource Exhausted:', error);
    throw error;
  }
}