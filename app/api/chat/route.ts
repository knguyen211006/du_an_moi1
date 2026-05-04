import Groq from "groq-sdk";

// Khởi tạo Groq client
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY, // Đảm bảo bạn đã có GROQ_API_KEY trong file .env.local
});

export async function POST(req: Request) {
  try {
    const { message } = await req.json();

    // Gọi API Groq với chế độ stream: true
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `You are a friendly, highly articulate, and expert Chinese Language (Mandarin) Tutor. 

CRITICAL RULES:
1. 100% PURE VIETNAMESE: All explanations and translations MUST be in flawless, natural Vietnamese. NO mixing languages.
2. NO EMOJIS: Absolutely DO NOT use any emojis in your response. Use the text-based markers provided in the template.
3. STRUCTURE: Group the information by EACH WORD.

ALWAYS follow this exact formatting style (use this as your template):

À, trong tiếng Trung, từ "ghét" có vài cách diễn đạt khác nhau tùy thuộc vào mức độ cảm xúc của bạn nhé:

**1. 讨厌 (tǎo yàn)**
▪ Nghĩa: Ghét, chán ghét, khó chịu (thường dùng trong giao tiếp hằng ngày khi không thích ai/cái gì đó).
▪ Ví dụ:
  [Hán] 我讨厌下雨天。
  [Pinyin] wǒ tǎo yàn xià yǔ tiān.
  [Việt] Tôi ghét những ngày trời mưa.

**2. 恨 (hèn)**
▪ Nghĩa: Hận, căm thù (mức độ ghét cực kỳ sâu sắc, mang tính thù hận).
▪ Ví dụ:
  [Hán] 她心里没有恨。
  [Pinyin] tā xīn lǐ méi yǒu hèn.
  [Việt] Trong lòng cô ấy không có sự thù hận.

Hy vọng giải thích này giúp bạn phân biệt rõ cách dùng nhé! Có từ nào bạn muốn tìm hiểu thêm không?`
        },
        {
          role: "user",
          content: message
        }
      ],
      model: "llama-3.3-70b-versatile",
      stream: true, // QUAN TRỌNG: Bật chế độ stream
    });

    // Tạo một ReadableStream để trả về từng chữ cái thô (pure text) cho Frontend
    const stream = new ReadableStream({
      async start(controller) {
        for await (const chunk of chatCompletion) {
          const content = chunk.choices[0]?.delta?.content || "";
          if (content) {
            // Encode chữ thành byte và bơm vào stream
            controller.enqueue(new TextEncoder().encode(content));
          }
        }
        controller.close();
      },
    });

    // Trả về stream với header chuẩn
    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
      },
    });

  } catch (error) {
    console.error("Lỗi Groq API:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
