import fs from 'fs';

// Đọc file Characters.txt từ thư mục data
const rawData = fs.readFileSync('./data/Characters .txt', 'utf-8'); // Chú ý: ngài lưu có dấu cách trước .txt
const lines = rawData.split('\n');

const result = [];

for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (!line || line.startsWith('#')) continue;

    const cols = line.split('\t');

    if (cols.length >= 3) {
        const hanzi = cols[0] || '';
        const pinyin = cols[1] || '';
        const meaning = cols[2] || '';
        const usage = cols[5] || ''; // Cột 6 (index 5) là cách dùng từ
        const tags = cols[8] || cols[6] || ''; // Cột 9 (index 8) là tag HSK

        const levelMatch = tags.match(/\d/);
        const levelStr = levelMatch ? levelMatch[0] : '1';

        result.push({
            id: `char_${hanzi}`, // Thêm tiền tố char_ để không bị trùng ID với từ vựng ghép
            hanzi: hanzi,
            pinyin: pinyin,
            meaning: meaning,
            usage: usage, // Giữ lại phần usage rất hay này
            level: levelStr
        });
    }
}

// Xuất ra thành file JSON 
fs.writeFileSync('./data/hsk_characters_chuan.json', JSON.stringify(result, null, 2), 'utf-8');
console.log(`🎉 Đã thu thập thành công ${result.length} Chữ Hán gốc.`);
console.log(`📁 Bí kíp được lưu tại: data/hsk_characters_chuan.json`);