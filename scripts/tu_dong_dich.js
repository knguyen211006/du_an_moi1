require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const FILE_CHUAN = './data/hsk_words_chuan.json';
const FILE_VIET = './data/hsk_words_viet.json';

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
    console.error("❌ Lỗi: Không tìm thấy GEMINI_API_KEY");
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: { responseMimeType: "application/json" }
});

const delay = (ms) => new Promise(res => setTimeout(res, ms));

async function tuDongDichVaLuuGemini() {
    console.log("🚀 BẮT ĐẦU TRẬN PHÁP BẤT TỬ - KHÔNG XONG KHÔNG VỀ...");

    let dataChuan = JSON.parse(fs.readFileSync(FILE_CHUAN, 'utf-8'));
    let dataViet = [];
    if (fs.existsSync(FILE_VIET)) {
        dataViet = JSON.parse(fs.readFileSync(FILE_VIET, 'utf-8'));
    }

    const tuDienViet = new Set(dataViet.map(item => item.hanzi));
    const tuBiSot = dataChuan.filter(item => !tuDienViet.has(item.hanzi));

    console.log(`⚠️ Phát hiện ${tuBiSot.length} từ chưa có tiếng Việt.`);
    if (tuBiSot.length === 0) {
        console.log("🎉 Toàn bộ Tàng Kinh Các đã được Việt hóa 100%!");
        return;
    }

    const BATCH_SIZE = 30; 

    for (let i = 0; i < tuBiSot.length; i += BATCH_SIZE) {
        const batch = tuBiSot.slice(i, i + BATCH_SIZE);
        const prompt = `Dịch trường "meaning" và "exampleTranslation" từ tiếng Anh sang tiếng Việt. \nTuyệt đối giữ nguyên cấu trúc JSON. CHỈ TRẢ VỀ ĐÚNG MỘT MẢNG JSON HỢP LỆ, KHÔNG BÌNH LUẬN HAY GIẢI THÍCH GÌ THÊM.\n\nDữ liệu:\n${JSON.stringify(batch, null, 2)}`;
        
        let success = false;
        let attempts = 0;

        // Vòng lặp vô cực: Đánh đến khi nào qua ải thì thôi!
        while (!success) {
            try {
                console.log(`⏳ Gemini đang dịch mẻ từ ${i} đến ${i + batch.length} (Thử lần ${attempts + 1})...`);
                
                const result = await model.generateContent(prompt);
                const responseText = result.response.text();
                
                const cleanJson = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
                const translatedBatch = JSON.parse(cleanJson);

                dataViet = [...dataViet, ...translatedBatch];
                fs.writeFileSync(FILE_VIET, JSON.stringify(dataViet, null, 2), 'utf-8');
                console.log(`   ✅ Đã lưu mẻ này thành công!`);
                
                success = true; // Thoát vòng lặp while, đi tiếp mẻ sau
                attempts = 0;   // Reset bộ đếm lỗi
                
                // Trạng thái bình thường: đánh xong nghỉ 8 giây
                await delay(8000); 

            } catch (error) {
                attempts++;
                console.error(`   ⚠️ Lỗi (Lần ${attempts}): ${error.message.substring(0, 100)}...`);
                
                if (attempts >= 3) {
                    // Nếu lỗi từ 3 lần trở lên -> Google đang khóa gắt -> Bế quan 5 phút
                    console.log(`   🏔️ Đã lỗi ${attempts} lần. Đóng cửa bế quan 5 PHÚT để xả hết nghiệp chướng...`);
                    await delay(5 * 60 * 1000); // Nghỉ 300,000 mili-giây
                } else {
                    // Lỗi 1, 2 lần -> Nghỉ 30 giây rồi thử lại
                    console.log(`   🧘‍♂️ Đang chờ 30 giây để hồi phục chân khí rồi đánh tiếp...`);
                    await delay(30000); 
                }
            }
        }
    }

    console.log("\n🎊 QUÁ TRÌNH DỊCH BẰNG GEMINI ĐÃ HOÀN TẤT VIÊN MÃN!");
}

tuDongDichVaLuuGemini();