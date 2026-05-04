import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { generateEmbedding } from "@/lib/embeddings";
import { AIFeedback } from "@/types/hsk-test";

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey || apiKey === "điền_api_key_của_ngài_vào_đây") {
      return NextResponse.json({
        score: 0,
        comment: "【LỖI HỆ THỐNG】GEMINI_API_KEY chưa được cấu hình.",
        fix: "Vui lòng thêm GEMINI_API_KEY vào file .env.local và Vercel Environment Variables.",
      } satisfies AIFeedback);
    }

    const { imageBase64, targetCharacter, userId } = await req.json();

    if (!imageBase64 || !targetCharacter) {
      return NextResponse.json({
        score: 0,
        comment: "【LỖI】Không nhận được dữ liệu ảnh.",
        fix: "Vui lòng viết lại và nạp lại chữ Hán.",
      } satisfies AIFeedback);
    }

    let pastMistakesContext = "";
    let pastMistakesList: { mistake_summary: string; similarity: number }[] = [];

    // === RAG: Tìm lỗi sai trong quá khứ ===
    try {
      const supabase = await createServiceClient();
      const queryEmbedding = await generateEmbedding(
        `Người dùng viết sai chữ Hán ${targetCharacter}`
      );

      const { data: similarMistakes, error } = await supabase.rpc(
        "match_user_mistakes",
        {
          query_embedding: queryEmbedding,
          match_user_id: userId || "anonymous",
          match_character: targetCharacter,
          match_threshold: 0.7,
          match_count: 3,
        }
      );

      if (error) {
        console.error("Supabase vector search error:", error);
      } else if (similarMistakes && similarMistakes.length > 0) {
        pastMistakesList = similarMistakes;
        pastMistakesContext = similarMistakes
          .map(
            (m: any, idx: number) =>
              `${idx + 1}. ${m.mistake_summary} (Độ tương đồng: ${(m.similarity * 100).toFixed(1)}%)`
          )
          .join("\n");
      }
    } catch (ragErr) {
      console.error("RAG retrieval error:", ragErr);
    }

    // === Gọi Gemini AI ===
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: { responseMimeType: "application/json" },
      safetySettings: [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
      ],
    });

    const base64Data = imageBase64.replace(/^data:image\/(png|jpeg|jpg);base64,/, "");

    const ragContextBlock = pastMistakesContext
      ? `Lỗi sai trong quá khứ của học trò với chữ "${targetCharacter}":\n${pastMistakesContext}\n\nHãy kiểm tra xem học trò có lặp lại những lỗi này không.`
      : "Học trò chưa có lỗi sai nào được ghi nhận với chữ Hán này.";

    const prompt = `Người là một "Giáo viên Thư pháp Hán tự" vô cùng nghiêm khắc, tỉ mỉ và thực tế. Học trò vừa viết tay chữ: "${targetCharacter}".

Quy tắc chấm điểm:
1. Soi xét kỹ: cấu trúc, tỷ lệ bộ thủ, cân bằng, thừa/thiếu nét.
2. Chấm điểm gắt: 90-100 là hoàn hảo, dưới 70 là sai nghiêm trọng.
3. Trả lời bằng TIẾNG VIỆT, giọng nghiêm khắc nhưng có tính xây dựng.

${ragContextBlock}

Trả về JSON chuẩn với format sau:
{
  "score": number (0-100),
  "comment": "Nhận xét chi tiết về cấu trúc chữ",
  "fix": "Cách sửa cụ thể",
  "new_mistake_summary": "Tóm tắt lỗi bằng 1 câu ngắn (nếu có)"
}
`;

    const result = await model.generateContent([
      prompt,
      { inlineData: { data: base64Data, mimeType: "image/png" } },
    ]);

    const responseText = result.response.text();
    const cleanJson = responseText.replace(/```json/g, "").replace(/```/g, "").trim();

    let feedback;
    try {
      feedback = JSON.parse(cleanJson);
    } catch (parseErr) {
      console.error("JSON parse error:", parseErr);
      feedback = {
        score: 60,
        comment: "AI trả về định dạng không chuẩn, đang phân tích lại...",
        fix: "Vui lòng thử viết lại chữ một lần nữa.",
        new_mistake_summary: "",
      };
    }

    // Đảm bảo kiểu dữ liệu
    feedback.score = typeof feedback.score === "number" ? feedback.score : 60;
    feedback.comment = typeof feedback.comment === "string" ? feedback.comment : "Không có nhận xét.";
    feedback.fix = typeof feedback.fix === "string" ? feedback.fix : "Hãy luyện thêm.";
    feedback.new_mistake_summary = typeof feedback.new_mistake_summary === "string" ? feedback.new_mistake_summary : "";

    // Lưu lỗi mới vào database
    if (feedback.new_mistake_summary?.trim() && userId) {
      try {
        const embedding = await generateEmbedding(feedback.new_mistake_summary.trim());
        const supabase = await createServiceClient();

        await supabase.from("user_mistakes").insert({
          user_id: userId,
          character: targetCharacter,
          mistake_summary: feedback.new_mistake_summary.trim(),
          embedding,
        });
      } catch (saveErr) {
        console.error("Failed to save mistake:", saveErr);
      }
    }

    return NextResponse.json(feedback);
  } catch (error: any) {
    console.error("=== AI GRADING ERROR ===", error);
    return NextResponse.json({
      score: 0,
      comment: "【LỖI HỆ THỐNG】" + (error.message || "Không xác định"),
      fix: "Vui lòng thử lại sau hoặc kiểm tra API Key.",
    } satisfies AIFeedback);
  }
}