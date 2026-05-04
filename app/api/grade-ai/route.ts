import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { generateEmbedding } from "@/lib/embeddings";
import { AIFeedback } from "@/types/hsk-test";

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey || apiKey === "\u0111i\u1ec1n_api_key_c\u1ee7a_ng\u00e0i_v\u00e0o_\u0111\u00e2y") {
      return NextResponse.json({
        score: 0,
        comment: "\u3010L\u1ed6I H\u1ec6 TH\u1ed0NG\u3011GEMINI_API_KEY ch\u01b0a \u0111\u01b0\u1ee3c c\u1ea5u h\u00ecnh.",
        fix: "Vui l\u00f2ng th\u00eam GEMINI_API_KEY v\u00e0o file .env.local v\u00e0 kh\u1edfi \u0111\u1ed9ng l\u1ea1i m\u00e1y ch\u1ee7.",
      } satisfies AIFeedback);
    }

    const { imageBase64, targetCharacter, userId } = await req.json();

    if (!imageBase64 || !targetCharacter) {
      return NextResponse.json({
        score: 0,
        comment: "\u3010L\u1ed6I\u3011Kh\u00f4ng nh\u1eadn \u0111\u01b0\u1ee3c d\u1eef li\u1ec7u \u1ea3nh.",
        fix: "Vui l\u00f2ng vi\u1ebft l\u1ea1i v\u00e0 n\u1ea1p l\u1ea1i \u0111\u1ea1o b\u00f9a.",
      } satisfies AIFeedback);
    }

    let pastMistakesContext = "";
    let pastMistakesList: { mistake_summary: string; similarity: number }[] = [];

    try {
      const supabase = await createServiceClient();
      const queryEmbedding = await generateEmbedding(
        `Ng\u01b0\u1eddi d\u00f9ng vi\u1ebft sai ch\u1eef H\u00e1n ${targetCharacter}`
      );

      const supabaseClient = await supabase;
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
              `${idx + 1}. ${m.mistake_summary} (\u0110\u1ed9 t\u01b0\u01a1ng \u0111\u1ed3ng: ${(
                m.similarity * 100
              ).toFixed(1)}%)`
          )
          .join("\n");
      }
    } catch (ragErr) {
      console.error("RAG retrieval error:", ragErr);
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
  //     const model = genAI.getGenerativeModel({ model: "text-embedding-004" }); 

  // const result = await model.embedContent(text);
  // const embedding = result.embedding.values;
  
  // return embedding;

      model: "gemini-2.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
      },
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
      ],
    });

    const base64Data = imageBase64.replace(
      /^data:image\/(png|jpeg);base64,/,
      ""
    );

    const ragContextBlock = pastMistakesContext
      ? `L\u1ed7i sai trong qu\u00e1 kh\u1ee9 c\u1ee7a h\u1ecdc tr\u00f2 v\u1edbi ch\u1eef "${targetCharacter}":\n${pastMistakesContext}\n\nH\u00e3y ki\u1ec3m tra xem h\u1ecdc tr\u00f2 c\u00f3 l\u1eb7p l\u1ea1i nh\u1eefng l\u1ed7i n\u00e0y kh\u00f4ng.`
      : "H\u1ecdc tr\u00f2 ch\u01b0a c\u00f3 l\u1ed7i sai n\u00e0o \u0111\u01b0\u1ee3c ghi nh\u1eadn v\u1edbi ch\u1eef H\u00e1n n\u00e0y.";

    const prompt = `
Ng\u01b0\u01a1i l\u00e0 m\u1ed9t "Gi\u00e1o vi\u00ean Th\u01b0 ph\u00e1p H\u00e1n t\u1ef1" v\u00f4 c\u00f9ng nghi\u00eam kh\u1eafc, t\u1ec9 m\u1ec9 v\u00e0 th\u1ef1c t\u1ebf. H\u1ecdc tr\u00f2 c\u1ee7a ng\u01b0\u01a1i v\u1eeba vi\u1ebft tay ch\u1eef: "${targetCharacter}".

Quy t\u1eafc ch\u1ea5m \u0111i\u1ec3m:
1. Soi x\u00e9t k\u1ef9 l\u01b0\u1ee3ng: K\u1ebft c\u1ea5u ch\u1eef (ch\u1eb7t ch\u1ebd hay l\u1ecfng l\u1ebbo), t\u1ef7 l\u1ec7 c\u00e1c b\u1ed9 th\u1ee7, s\u1ef1 c\u00e2n b\u1eb1ng tr\u00e1i-ph\u1ea3i/tr\u00ean-d\u01b0\u1edbi, v\u00e0 \u0111\u1eb7c bi\u1ec7t l\u00e0 xem c\u00f3 b\u1ecb TH\u1eea ho\u1eb6c THI\u1ebeU n\u00e9t n\u00e0o kh\u00f4ng.
2. Ch\u1ea5m \u0111i\u1ec3m g\u1eaft gao: 
   - 90-100: Ho\u00e0n h\u1ea3o, n\u00e9t c\u1ee9ng c\u00e1p, chu\u1ea9n t\u1ef7 l\u1ec7.
   - 70-89: \u0110\u1ecdc \u0111\u01b0\u1ee3c, nh\u01b0ng t\u1ef7 l\u1ec7 c\u00f2n l\u1ec7ch ho\u1eb7c n\u00e9t h\u01a1i run.
   - D\u01b0\u1edbi 70: Sai c\u1ea5u tr\u00fac nghi\u00eam tr\u1ecdng, thi\u1ebfu n\u00e9t, ho\u1eb7c vi\u1ebft qu\u00e1 \u1ea9u.
3. Gi\u1ecdng \u0111i\u1ec7u: Chuy\u00ean nghi\u1ec7p, \u0111i th\u1eb3ng v\u00e0o v\u1ea5n \u0111\u1ec1, nghi\u00eam kh\u1eafc nh\u01b0ng \u0111\u01b0a ra l\u1eddi khuy\u00ean th\u1ef1c t\u1ebf \u0111\u1ec3 s\u1eeda \u0111\u1ed5i. Tuy\u1ec7t \u0111\u1ed1i KH\u00d4NG d\u00f9ng t\u1eeb ng\u1eef bay b\u1ed5ng s\u00e1o r\u1ed7ng. PH\u1ea2I D\u00d9NG TI\u1ebeNG VI\u1ec6T 100%.

${ragContextBlock}

H\u00e3y tr\u1ea3 v\u1ec1 m\u1ed9t \u0111\u1ed1i t\u01b0\u1ee3ng JSON chu\u1ea9n (kh\u00f4ng d\u00f9ng markdown code block), v\u1edbi \u0111\u1ecbnh d\u1ea1ng sau:
{
  "score": s\u1ed1 t\u1eeb 0-100 (ch\u1ea5m th\u1eadt g\u1eaft v\u00e0o),
  "comment": "Nh\u1eadn x\u00e9t chi ti\u1ebft v\u1ec1 c\u1ea5u tr\u00fac. V\u00ed d\u1ee5: 'Ch\u1eef c\u1ee7a em b\u1ecb l\u1ecfng l\u1ebbo. B\u1ed9 N\u1eef b\u00ean tr\u00e1i vi\u1ebft qu\u00e1 to l\u1ea5n \u00e1t n\u1eeda b\u00ean ph\u1ea3i, n\u00e9t ngang cu\u1ed1i c\u00f9ng thi\u1ebfu l\u1ef1c.'",
  "fix": "Ch\u1ec9 d\u1eabn c\u00e1ch s\u1eeda. V\u00ed d\u1ee5: 'Thu g\u1ecdn b\u1ed9 N\u1eef l\u1ea1i, nh\u01b0\u1eddng kh\u00f4ng gian cho ph\u1ea7n b\u00ean ph\u1ea3i. Vi\u1ebft n\u00e9t ngang d\u1ee9t kho\u00e1t h\u01a1n.'",
  "new_mistake_summary": "T\u00f3m t\u1eaft l\u1ed7i sai b\u1eb1ng 1 c\u00e2u ng\u1eafn g\u1ecdn (v\u00ed d\u1ee5: 'Vi\u1ebft sai t\u1ef7 l\u1ec7 b\u1ed9 th\u1ee7, ch\u1eef b\u1ecb b\u00e8 ngang'), n\u1ebfu ch\u1eef ho\u00e0n h\u1ea3o th\u00ec \u0111\u1ec3 tr\u1ed1ng."
}
`;

    const result = await model.generateContent([
      prompt,
      { inlineData: { data: base64Data, mimeType: "image/png" } },
    ]);

    const responseText = result.response.text();
    const cleanJson = responseText
      .replace(/\`\`\`json/g, "")
      .replace(/\`\`\`/g, "")
      .trim();

    let feedback;
    try {
      feedback = JSON.parse(cleanJson);
    } catch (parseErr) {
      console.error("JSON parse error:", parseErr, "Raw text:", responseText);
      const scoreMatch = cleanJson.match(/"score"\s*:\s*(\d+)/);
      const commentMatch = cleanJson.match(/"comment"\s*:\s*"([^"]*)"/);
      const fixMatch = cleanJson.match(/"fix"\s*:\s*"([^"]*)"/);
      feedback = {
        score: scoreMatch ? parseInt(scoreMatch[1], 10) : 60,
        comment: commentMatch
          ? commentMatch[1]
          : "\u3010L\u1ed6I PH\u00c2N T\u00cdCH\u3011AI tr\u1ea3 v\u1ec1 \u0111\u1ecbnh d\u1ea1ng kh\u00f4ng chu\u1ea9n.",
        fix: fixMatch
          ? fixMatch[1]
          : "Vui l\u00f2ng th\u1eed l\u1ea1i ho\u1eb7c li\u00ean h\u1ec7 qu\u1ea3n tr\u1ecb vi\u00ean.",
      };
    }

    if (typeof feedback.score !== "number") feedback.score = 0;
    if (typeof feedback.comment !== "string")
      feedback.comment = "Ch\u01b0a c\u00f3 nh\u1eadn x\u00e9t.";
    if (typeof feedback.fix !== "string")
      feedback.fix = "H\u00e3y luy\u1ec7n t\u1eadp th\u00eam.";
    if (typeof feedback.new_mistake_summary !== "string")
      feedback.new_mistake_summary = "";

    if (
      feedback.new_mistake_summary &&
      feedback.new_mistake_summary.trim().length > 0 &&
      userId
    ) {
      try {
        const embedding = await generateEmbedding(
          feedback.new_mistake_summary
        );
        const supabase = await createServiceClient();

        const { error: insertError } = await supabase
          .from("user_mistakes")
          .insert({
            user_id: userId,
            character: targetCharacter,
            mistake_summary: feedback.new_mistake_summary.trim(),
            embedding,
          });

        if (insertError) {
          console.error("Failed to save mistake:", insertError);
        } else {
          console.log("New mistake saved to RAG ledger:", feedback.new_mistake_summary);
        }
      } catch (saveErr) {
        console.error("Error saving mistake embedding:", saveErr);
      }
    }

    return NextResponse.json(feedback);
  } catch (error: any) {
    console.error("=== AI GRADING ERROR ===", error);
    return NextResponse.json({
      score: 0,
      comment: "\u3010T\u00ca LI\u1ec6T H\u1ec6 TH\u1ed0NG\u3011" + (error.message || "L\u1ed7i kh\u00f4ng x\u00e1c \u0111\u1ecbnh"),
      fix: "Vui l\u00f2ng ki\u1ec3m tra API Key ho\u1eb7c th\u1eed l\u1ea1i sau.",
    } satisfies AIFeedback);
  }
}
