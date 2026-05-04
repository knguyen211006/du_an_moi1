"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import FreehandCanvas from "@/components/ui/FreehandCanvas";
import { AIFeedback, TestResult, TestStep } from "@/types/hsk-test";
import vocabData from "@/data/hsk_words_viet.json";

const TOTAL_QUESTIONS = 10;
const HANDWRITING_INTERVAL = 3;

function getWordData(w: any) {
  const hanzi = w.hanzi || w.simplified || "";
  let pinyin = w.pinyin || "";
  if (Array.isArray(pinyin)) pinyin = pinyin.join(" ");
  let meaning = w.meaning || "";
  if (Array.isArray(meaning)) meaning = meaning[0];
  meaning = String(meaning).split(";")[0].trim();
  return { hanzi, pinyin, meaning, level: String(w.level || "") };
}

function generateSteps(level: string): TestStep[] {
  const levelWords = (vocabData as any[]).filter((w) =>
    getWordData(w).level.includes(level)
  );
  if (levelWords.length < 4) return [];

  const shuffled = [...levelWords].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, TOTAL_QUESTIONS);

  return selected.map((word, idx) => {
    const data = getWordData(word);
    const isHandwriting = (idx + 1) % HANDWRITING_INTERVAL === 0;

    if (isHandwriting) {
      return {
        id: idx,
        type: "handwriting" as const,
        hanzi: data.hanzi,
        pinyin: data.pinyin,
        meaning: data.meaning,
      };
    } else {
      const distractors = levelWords
        .filter((w) => getWordData(w).hanzi !== data.hanzi)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3)
        .map((w) => getWordData(w).meaning);
      return {
        id: idx,
        type: "multiple_choice" as const,
        hanzi: data.hanzi,
        pinyin: data.pinyin,
        meaning: data.meaning,
        options: [data.meaning, ...distractors].sort(
          () => Math.random() - 0.5
        ),
      };
    }
  });
}

export default function HSKTestPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [steps, setSteps] = useState<TestStep[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [results, setResults] = useState<TestResult[]>([]);
  const [isFinished, setIsFinished] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isGrading, setIsGrading] = useState(false);
  const [aiFeedback, setAiFeedback] = useState<AIFeedback | null>(null);
  const [level, setLevel] = useState("1");

  useEffect(() => {
    const auth = getAuth();
    const unsub = onAuthStateChanged(auth, (user) => {
      setUserId(user?.uid || null);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    setSteps(generateSteps(level));
    setCurrentIndex(0);
    setResults([]);
    setIsFinished(false);
    setSelectedAnswer(null);
    setAiFeedback(null);
  }, [level]);

  const currentStep = steps[currentIndex];

  const advanceStep = useCallback(() => {
    if (currentIndex + 1 < steps.length) {
      setCurrentIndex((i) => i + 1);
      setSelectedAnswer(null);
      setIsProcessing(false);
      setIsGrading(false);
      setAiFeedback(null);
    } else {
      setIsFinished(true);
      setIsGrading(false);
    }
  }, [currentIndex, steps.length]);

  const handleAnswer = useCallback(
    (option: string) => {
      if (isProcessing || !currentStep) return;
      setIsProcessing(true);
      setSelectedAnswer(option);
      const isCorrect = option === currentStep.meaning;

      setResults((prev) => [
        ...prev,
        { stepIndex: currentIndex, isCorrect, selectedAnswer: option },
      ]);

      setTimeout(() => {
        if (currentIndex + 1 < steps.length) {
          setCurrentIndex((i) => i + 1);
          setSelectedAnswer(null);
          setIsProcessing(false);
          setAiFeedback(null);
        } else {
          setIsFinished(true);
        }
      }, 800);
    },
    [isProcessing, currentStep, currentIndex, steps.length]
  );

  const handleHandwritingSubmit = useCallback(
    async (imageBase64: string) => {
      if (!currentStep || !userId) return;
      setIsGrading(true);
      setAiFeedback(null);

      try {
        const res = await fetch("/api/grade-ai", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            imageBase64,
            targetCharacter: currentStep.hanzi,
            userId,
          }),
        });

        const data = await res.json();
        setAiFeedback(data);

        const isCorrect = (data.score || 0) >= 70;
        setResults((prev) => [
          ...prev,
          { stepIndex: currentIndex, isCorrect, aiFeedback: data },
        ]);

        setIsGrading(false);
      } catch (err) {
        console.error("Grading error:", err);
        setAiFeedback({
          score: 0,
          comment: "Hệ thống đánh giá tạm thờI gián đoạn. XIn hãy thử lạI.",
          fix: "K Iểm tra kết nốI mạng và nạp lạI đạo bùa.",
        });
        setIsGrading(false);
      }
    },
    [currentStep, currentIndex, userId]
  );

  const score = results.filter((r) => r.isCorrect).length;
  const accuracy =
    steps.length > 0 ? Math.round((score / steps.length) * 100) : 0;

  const getSlogan = () => {
    if (accuracy === 100)
      return "Tâm ý và bút ý hòa làm một. Thành tựu xuất chúng.";
    if (accuracy >= 85)
      return "Căn cơ vững chắc, chỉ cần thêm chút luyện tâm.";
    if (accuracy >= 60)
      return "Tiến bộ rõ rệt, nhưng vẫn còn khoảng cách cần bồi đắp.";
    if (accuracy >= 40)
      return "Tâm hồI hộp làm nét bút run rẩy. Hãy tĩnh tâm trở lạI.";
    return "Cần kIên trì hơn nữa. Vạn sự khởI đầu nan.";
  };

  if (steps.length === 0) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-[#0a0b10] text-neutral-800 dark:text-[#d1d5db] flex items-center justify-center transition-colors duration-700">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.5 }}
          className="text-sm tracking-[0.3em] text-neutral-400 dark:text-neutral-600 animate-pulse font-light"
        >
          Đang chuẩn bị thư đài...
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-[#0a0b10] text-neutral-800 dark:text-[#d1d5db] flex flex-col items-center relative overflow-hidden transition-colors duration-700 selection:bg-neutral-400/30">
      {/* Soft glass header */}
      {!isFinished && (
        <div className="w-full mt-6 mb-4 px-6 z-10">
          <div className="flex items-center justify-between bg-white/40 dark:bg-white/5 backdrop-blur-xl rounded-3xl border border-neutral-300/50 dark:border-neutral-700/50 p-5 shadow-sm">
            <div className="text-sm tracking-[0.2em] text-neutral-500 dark:text-neutral-400 font-light">
              CẤP ĐỘ {level}
            </div>
            <div className="text-sm tracking-[0.2em] text-neutral-500 dark:text-neutral-400 font-light">
              BÀI {currentIndex + 1} / {steps.length}
            </div>
            <div className="text-sm tracking-[0.2em] text-neutral-500 dark:text-neutral-400 font-light">
              TIẾN ĐỘ {accuracy}%
            </div>
          </div>
        </div>
      )}

      {/* Level selector */}
      {!isFinished && (
        <div className="flex gap-3 mb-10 z-10">
          {["1", "2", "3", "4", "5", "6"].map((l) => (
            <button
              key={l}
              onClick={() => setLevel(l)}
              className={`px-5 py-2 text-sm tracking-[0.15em] rounded-full transition-all duration-500 ${
                level === l
                  ? "bg-neutral-800 dark:bg-neutral-200 text-neutral-50 dark:text-neutral-900 shadow-lg"
                  : "bg-neutral-200/50 dark:bg-neutral-800/50 text-neutral-500 dark:text-neutral-500 hover:bg-neutral-300 dark:hover:bg-neutral-700"
              }`}
            >
              HSK {l}
            </button>
          ))}
        </div>
      )}

      {/* Main 40/60 split content */}
      <div className="flex-1 flex flex-col items-center justify-center w-full px-6 pb-12 z-10">
        {!isFinished ? (
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.6, ease: "easeInOut" }}
              className="w-full max-w-5xl mx-auto flex flex-col lg:flex-row gap-12 lg:gap-16 items-center justify-center min-h-[60vh] py-8"
            >
              {currentStep?.type === "multiple_choice" ? (
                <>
                  {/* Left 40% — Static prompt */}
                  <div className="w-full lg:w-2/5 flex flex-col justify-center items-center lg:items-start text-center lg:text-left space-y-4">
                    <p className="text-xs tracking-[0.3em] text-neutral-400 dark:text-neutral-600 uppercase font-light">
                      Chọn ý nghĩa tương thông
                    </p>
                    <motion.h2
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.8 }}
                      className="text-8xl sm:text-9xl font-serif font-light text-neutral-900 dark:text-neutral-100 leading-none"
                      style={{
                        fontFamily: "'Noto Serif SC', 'Lora', serif",
                        filter: "drop-shadow(0 4px 20px rgba(0,0,0,0.08))",
                      }}
                    >
                      {currentStep.hanzi}
                    </motion.h2>
                    <p className="text-3xl font-serif text-neutral-400 dark:text-neutral-600">
                      {currentStep.pinyin}
                    </p>
                    <p className="text-lg text-neutral-300 dark:text-neutral-700 font-light">
                      {currentStep.meaning}
                    </p>
                  </div>

                  {/* Right 60% — Dynamic options */}
                  <div className="w-full lg:w-3/5 flex flex-col justify-center items-center">
                    <div className="w-full max-w-2xl grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {currentStep.options?.map((opt, i) => {
                        const isCorrect = opt === currentStep.meaning;
                        const isSelected = opt === selectedAnswer;

                        return (
                          <motion.button
                            key={i}
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1, duration: 0.5 }}
                            disabled={isProcessing}
                            onClick={() => handleAnswer(opt)}
                            className={`text-left px-8 py-6 rounded-3xl text-lg md:text-xl tracking-wide transition-all duration-500 ${
                              isProcessing && isCorrect
                                ? "bg-neutral-200/80 dark:bg-neutral-700/40 text-neutral-900 dark:text-neutral-100"
                                : isProcessing && isSelected && !isCorrect
                                ? "text-neutral-400 dark:text-neutral-600 line-through opacity-40"
                                : isProcessing
                                ? "opacity-30 text-neutral-300 dark:text-neutral-700"
                                : "bg-white/60 dark:bg-white/5 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-white/10 hover:shadow-lg"
                            }`}
                          >
                            <span className="text-neutral-300 dark:text-neutral-600 mr-3 text-sm">
                              {String.fromCharCode(65 + i)}.
                            </span>
                            {opt}
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* Left 40% — Prompt + Feedback */}
                  <div className="w-full lg:w-2/5 flex flex-col justify-center items-center lg:items-start text-center lg:text-left space-y-4">
                    <p className="text-xs tracking-[0.3em] text-neutral-400 dark:text-neutral-600 uppercase font-light">
                      Hãy lấy tâm làm bút
                    </p>
                    <motion.h2
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.8 }}
                      className="text-8xl sm:text-9xl font-serif font-light text-neutral-900 dark:text-neutral-100 leading-none"
                      style={{
                        fontFamily: "'Noto Serif SC', 'Lora', serif",
                        filter: "drop-shadow(0 4px 20px rgba(0,0,0,0.08))",
                      }}
                    >
                      {currentStep.hanzi}
                    </motion.h2>
                    <p className="text-3xl font-serif text-neutral-400 dark:text-neutral-600">
                      {currentStep.pinyin}
                    </p>
                    <p className="text-lg text-neutral-300 dark:text-neutral-700 font-light">
                      {currentStep.meaning}
                    </p>

                    {aiFeedback && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="w-full mt-6 bg-white/60 dark:bg-white/5 backdrop-blur-xl rounded-[2.5rem] p-8 space-y-5 border border-neutral-200/50 dark:border-neutral-700/50 shadow-sm"
                      >
                        <div className="flex items-center gap-5">
                          <span className="text-4xl font-serif text-neutral-800 dark:text-neutral-200">
                            {aiFeedback.score}%
                          </span>
                          <span className="text-sm tracking-[0.2em] text-neutral-400 dark:text-neutral-500 uppercase font-light">
                            Độ chính xác
                          </span>
                        </div>
                        <p className="text-lg text-neutral-700 dark:text-neutral-300 leading-relaxed font-light">
                          &ldquo;{aiFeedback.comment}&rdquo;
                        </p>
                        {aiFeedback.fix && (
                          <p className="text-base text-neutral-500 dark:text-neutral-400 font-light">
                            {aiFeedback.fix}
                          </p>
                        )}
                        <button
                          onClick={advanceStep}
                          className="mt-4 px-8 py-3 bg-gradient-to-r from-neutral-700 to-neutral-500 dark:from-neutral-300 dark:to-neutral-100 text-white dark:text-neutral-900 rounded-full text-sm tracking-[0.2em] hover:shadow-xl transition-all duration-300"
                        >
                          Tiếp tục
                        </button>
                      </motion.div>
                    )}
                  </div>

                  {/* Right 60% — Canvas */}
                  <div className="w-full lg:w-3/5 flex flex-col justify-center items-center">
                    <FreehandCanvas
                      targetCharacter={currentStep.hanzi}
                      onSubmit={handleHandwritingSubmit}
                      isGrading={isGrading}
                      onClear={() => {
                        setAiFeedback(null);
                        setIsGrading(false);
                      }}
                    />
                  </div>
                </>
              )}
            </motion.div>
          </AnimatePresence>
        ) : (
          /* Completion Screen — centered, no split */
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            className="flex flex-col items-center text-center space-y-10 w-full px-6"
          >
            <div className="space-y-4">
              <p className="text-sm tracking-[0.4em] text-neutral-400 dark:text-neutral-600 font-light">
                BÀI KIỂM TRA HOÀN THÀNH
              </p>
              <h3 className="text-5xl md:text-6xl font-serif text-neutral-800 dark:text-neutral-100 font-light">
                Thành tựu
              </h3>
            </div>

            <p className="text-xl text-neutral-500 dark:text-neutral-500 font-light leading-relaxed max-w-lg">
              &ldquo;{getSlogan()}&rdquo;
            </p>

            {/* Expansive floating stats — no boxes, just typography */}
            <div className="flex flex-col md:flex-row items-center justify-center gap-12 md:gap-24 w-full py-8">
              <div className="text-center">
                <p className="text-6xl md:text-7xl font-serif text-neutral-800 dark:text-neutral-200">
                  {accuracy}%
                </p>
                <p className="text-xs text-neutral-400 mt-3 tracking-[0.2em] font-light">
                  CHÍNH XÁC
                </p>
              </div>
              <div className="text-center">
                <p className="text-6xl md:text-7xl font-serif text-neutral-800 dark:text-neutral-200">
                  {score}
                </p>
                <p className="text-xs text-neutral-400 mt-3 tracking-[0.2em] font-light">
                  ĐÚNG
                </p>
              </div>
              <div className="text-center">
                <p className="text-6xl md:text-7xl font-serif text-neutral-800 dark:text-neutral-200">
                  {steps.length}
                </p>
                <p className="text-xs text-neutral-400 mt-3 tracking-[0.2em] font-light">
                  TỔNG SỐ
                </p>
              </div>
            </div>

            <div className="flex gap-4 w-full max-w-md">
              <button
                onClick={() => {
                  setSteps(generateSteps(level));
                  setCurrentIndex(0);
                  setResults([]);
                  setIsFinished(false);
                  setSelectedAnswer(null);
                  setAiFeedback(null);
                }}
                className="flex-1 py-4 bg-neutral-800 dark:bg-neutral-200 text-neutral-50 dark:text-neutral-900 rounded-full text-sm tracking-[0.2em] hover:shadow-xl transition-all duration-300"
              >
                Làm lại
              </button>
              <button
                onClick={() => router.push("/progress")}
                className="flex-1 py-4 bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded-full text-sm tracking-[0.2em] hover:shadow-lg transition-all duration-300"
              >
                Xem tiến độ
              </button>
            </div>
          </motion.div>
        )}
      </div>

      {/* Footer */}
      <div className="pb-8 text-xs tracking-[0.3em] text-neutral-300 dark:text-neutral-700 font-light">
        Thư Đài Chân Thực
      </div>
    </div>
  );
}

