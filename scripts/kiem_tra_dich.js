const fs = require('fs');

// ==========================================
// THIẾT LẬP ĐƯỜNG DẪN
// ==========================================
const FILE_CHUAN = './data/hsk_words_chuan.json'; // File 11.000 từ gốc
const FILE_VIET = './data/hsk_words_viet.json';   // File 7.600 từ ngài đã dịch
const FILE_XUAT = './data/tu_can_dich_them.json'; // File mới sẽ chứa các từ bị sót
// ==========================================

function kiemTraVaLocTuSot() {
    console.log("🔍 BẮT ĐẦU KIỂM TRA SÓT BẢN DỊCH...");

    let dataChuan, dataViet;
    try {
        dataChuan = JSON.parse(fs.readFileSync(FILE_CHUAN, 'utf-8'));
        dataViet = JSON.parse(fs.readFileSync(FILE_VIET, 'utf-8'));
    } catch (err) {
        console.error("❌ Lỗi đọc file. Ngài kiểm tra lại đường dẫn nhé:", err.message);
        return;
    }

    // Tạo bộ lọc các chữ đã có tiếng Việt
    const tuDienViet = new Set(dataViet.map(item => item.hanzi));

    // Tìm những kẻ lọt lưới (Có trong file Chuẩn nhưng KHÔNG CÓ trong file Việt)
    const tuBiSot = dataChuan.filter(item => !tuDienViet.has(item.hanzi));

    // Xuất danh sách bị sót ra một file mới tinh
    fs.writeFileSync(FILE_XUAT, JSON.stringify(tuBiSot, null, 2), 'utf-8');

    console.log(`\n✅ ĐÃ QUÉT XONG TÀNG KINH CÁC!`);
    console.log(`📊 Tổng số từ chuẩn: ${dataChuan.length}`);
    console.log(`🇻🇳 Tổng số từ đã dịch: ${dataViet.length}`);
    console.log(`⚠️ Số từ SÓT (chưa có tiếng Việt): ${tuBiSot.length}`);
    console.log(`\n📂 Đã gom toàn bộ ${tuBiSot.length} từ bị sót vào file: ${FILE_XUAT}`);
    console.log(`👉 Đại sư hãy mở file này ra, dịch nghĩa, sau đó copy ghép vào file hsk_words_viet.json nhé!`);
}

kiemTraVaLocTuSot();