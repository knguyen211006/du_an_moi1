import { GoogleGenerativeAI } from "@google/generative-ai";

export async function generateEmbedding(text: string) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("Missing GEMINI_API_KEY");

  const genAI = new GoogleGenerativeAI(apiKey);
  
  // ĐÂY LÀ CHÌA KHÓA: Phải dùng đúng model dành riêng cho Embedding
  const model = genAI.getGenerativeModel({ model: "text-embedding-004" }); 

  const result = await model.embedContent(text);
  const embedding = result.embedding.values;
  
  return embedding;
}
