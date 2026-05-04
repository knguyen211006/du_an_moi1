import fs from 'fs';

// 1. DÁN MÃ GSK_... VÀO ĐÂY
const API_KEY = process.env.GROQ_API_KEY;; 

const inputFile = './data/hsk_words_chuan.json';
const outputFile = './data/hsk_words_viet.json';

// Lò V3: Có khả năng tự phục hồi khi bị sút văng (Auto-Retry)
async function translateBatch(wordsBatch, retries = 5) {
  const prompt = `Bạn là từ điển HSK Trung-Việt chuyên nghiệp. 
  Tuân thủ NGHIÊM NGẶT:
  1. "meaning": Dịch và tổng hợp ngắn gọn nhất có thể (VD: "tôi, của tôi"). Bỏ các giải thích lằng nhằng.
  2. "exampleTranslation": Dịch câu ví dụ sang Tiếng Việt. NẾU trường "example" rỗng (""), PHẢI để rỗng. TUYỆT ĐỐI KHÔNG tự bịa.
  3. GIỮ NGUYÊN TẤT CẢ CÁC KEY.
  4. Chỉ trả về JSON.
  Dữ liệu: ${JSON.stringify(wordsBatch)}`;

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY.trim()}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1
      })
    });

    if (!response.ok) {
        const errorData = await response.json();
        const errorMsg = errorData.error?.message || "";
        
        // NẾU BỊ CHẶN VÌ QUÁ TẢI (LỖI 429)
        if (response.status === 429) {
            // Tự động đọc xem nó bắt chờ bao nhiêu giây
            const match = errorMsg.match(/try again in ([\d.]+)s/);
            // Cộng thêm 2 giây bù trừ cho an toàn
            const waitSecs = match ? Math.ceil(parseFloat(match[1])) + 2 : 15;
            
            console.log(`   ⏳ Trạm thu phí kẹt! Đang tự động ẩn thân chờ ${waitSecs} giây rồi thử lại... (Còn ${retries} mạng)`);
            await new Promise(res => setTimeout(res, waitSecs * 1000));
            
            // Dùng mạng (retry) để thử lại đúng mẻ đó
            if (retries > 0) return translateBatch(wordsBatch, retries - 1);
        } else {
            console.log(`\n❌ Lỗi lạ: ${response.status}`, errorMsg);
        }
        return null;
    }

    const data = await response.json();
    let cleanContent = data.choices[0]?.message?.content.replace(/```json/g, '').replace(/```/g, '').trim();
    const jsonMatch = cleanContent.match(/\[[\s\S]*\]/);
    
    return jsonMatch ? JSON.parse(jsonMatch[0]) : null;

  } catch (error) {
    console.error('💥 Lỗi mạng lưới:', error.message);
    if (retries > 0) {
        await new Promise(res => setTimeout(res, 5000));
        return translateBatch(wordsBatch, retries - 1);
    }
    return null;
  }
}

async function startLuyenDan() {
  console.log("🔥 Lò Bát Quái V3 (Auto-Retry) bắt đầu cày 11.000 từ...");
  const data = JSON.parse(fs.readFileSync(inputFile, 'utf-8'));
  const batchSize = 10; 
  let finalResult = [];

  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize);
    console.log(`⏳ Đang luyện từ ${i + 1} đến ${i + batch.length}...`);
    
    const translated = await translateBatch(batch);
    if (translated) {
      finalResult.push(...translated);
      console.log(`   ✅ Xong đợt ${i/batchSize + 1}`);
    } else {
      console.log("   ❌ Cạn kiệt sinh lực, bỏ qua mẻ này.");
      finalResult.push(...batch);
    }
    
    // Nghỉ ngơi 15 giây giữa các mẻ để không bao giờ bị khóa
    await new Promise(res => setTimeout(res, 15000));
    
    // Cứ sau 100 từ thì tự động lưu file một lần (đề phòng cúp điện)
    if ((i + batchSize) % 100 === 0) {
        fs.writeFileSync(outputFile, JSON.stringify(finalResult, null, 2), 'utf-8');
        console.log(`   💾 Đã auto-save tạm thời đến từ ${i + batch.length}...`);
    }
  }

  // Lưu file cuối cùng
  fs.writeFileSync(outputFile, JSON.stringify(finalResult, null, 2), 'utf-8');
  console.log("\n✨ ĐẠI CÔNG CÁO THÀNH 100%! Bí kíp đã được lưu tại data/hsk_words_viet.json");
}

startLuyenDan();