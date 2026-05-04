require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

// 1. Kết nối Tàng Kinh Các (Supabase)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("❌ Lỗi: Không tìm thấy chìa khóa Supabase trong file .env.local!");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// ==========================================
// THIẾT LẬP THÔNG SỐ
// ==========================================
const TABLE_NAME = 'words'; 
const FILE_CHUAN = './data/hsk_words_chuan.json'; 
const FILE_VIET = './data/hsk_words_viet.json';   
// ==========================================

async function scanMergeAndFix() {
    console.log("🚀 BẮT ĐẦU QUÁ TRÌNH LỌC TRÙNG, HỢP NHẤT VÀ VÁ KHO...");

    // BƯỚC 1: ĐỌC 2 CUỐN BÍ KÍP
    let dataChuan, dataViet;
    try {
        dataChuan = JSON.parse(fs.readFileSync(FILE_CHUAN, 'utf-8'));
        dataViet = JSON.parse(fs.readFileSync(FILE_VIET, 'utf-8'));
        console.log(`📦 Đã nạp: ${dataChuan.length} từ (Bản chuẩn) và ${dataViet.length} từ (Bản Việt).`);
    } catch (err) {
        console.error(`❌ Lỗi đọc file JSON:`, err.message);
        return;
    }

    // BƯỚC 2: HỢP NHẤT VÀ LỌC TRÙNG LẶP (CỰC KỲ QUAN TRỌNG)
    console.log("🔄 Đang dung hợp tiếng Việt và LỌC BỎ CÁC TỪ TRÙNG LẶP...");
    const tuDienViet = {};
    dataViet.forEach(item => {
        if (item.hanzi) tuDienViet[item.hanzi] = item;
    });

    // Dùng Map để đảm bảo ID là duy nhất, không bao giờ bị trùng
    const mergedMap = new Map();
    dataChuan.forEach(itemChuan => {
        const id = itemChuan.id || itemChuan.hanzi; 
        if (tuDienViet[itemChuan.hanzi]) {
            mergedMap.set(id, { ...itemChuan, ...tuDienViet[itemChuan.hanzi] });
        } else {
            mergedMap.set(id, itemChuan);
        }
    });
    
    const mergedData = Array.from(mergedMap.values());
    console.log(`✨ Sau khi lọc trùng, danh sách chuẩn có tổng cộng: ${mergedData.length} từ ĐỘC NHẤT.`);

    // BƯỚC 3: KIỂM KÊ KHO SUPABASE
    console.log("🔍 Đang đếm số lượng chữ thực tế đang nằm trong kho...");
    let allDbChars = new Set();
    let hasMore = true;
    let start = 0;
    const step = 1000;

    while (hasMore) {
        const { data, error } = await supabase
            .from(TABLE_NAME)
            .select('id') 
            .range(start, start + step - 1);

        if (error) {
            console.error("❌ Lỗi truy vấn Supabase:", error);
            return;
        }

        if (data.length === 0) {
            hasMore = false;
        } else {
            data.forEach(item => allDbChars.add(item.id));
            start += step;
        }
    }
    console.log(`✅ Kho hiện đang có: ${allDbChars.size} từ.`);

    // BƯỚC 4: TÌM NHỮNG TỪ CHƯA CÓ TRONG KHO
    const missingRecords = mergedData.filter(item => {
        const id = item.id || item.hanzi;
        return !allDbChars.has(id);
    });

    console.log(`⚠️ Có ${missingRecords.length} từ cần được bơm thêm vào kho!`);

    if (missingRecords.length === 0) {
        console.log("🎉 Hoàn hảo! Toàn bộ từ vựng đã yên vị trong kho.");
        return;
    }

    // BƯỚC 5: BƠM ĐÈ (UPSERT) DỮ LIỆU
    console.log("💉 Bắt đầu bơm số chữ còn thiếu vào kho bằng chiêu thức UPSERT...");
    const BATCH_SIZE = 5;
    let successCount = 0;

    for (let i = 0; i < missingRecords.length; i += BATCH_SIZE) {
        const batch = missingRecords.slice(i, i + BATCH_SIZE);
        
        // DÙNG UPSERT ĐỂ TRÁNH LỖI DUPLICATE KEY
        const { error } = await supabase
            .from(TABLE_NAME)
            .upsert(batch, { onConflict: 'id' });

        if (error) {
            console.error(`❌ Lỗi khi bơm từ dòng ${i}:`, error.message);
        } else {
            successCount += batch.length;
            console.log(`   -> Đã bơm thành công ${successCount}/${missingRecords.length} từ...`);
        }
    }

    console.log("🎊 ĐẠI CÔNG CÁO THÀNH! Tàng Kinh Các đã đạt chuẩn vô khuyết!");
}

scanMergeAndFix();