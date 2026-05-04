"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";

interface FreehandCanvasProps {
  targetCharacter: string;
  onSubmit: (imageBase64: string) => void;
  isGrading: boolean;
  onClear?: () => void;
}

export default function FreehandCanvas({
  targetCharacter,
  onSubmit,
  isGrading,
  onClear,
}: FreehandCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const MAX_SIZE = 600;

  // Resize canvas to match container
  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const rect = container.getBoundingClientRect();
    const size = Math.min(rect.width, rect.height, MAX_SIZE);

    // Only resize if dimensions changed
    if (canvas.width !== size || canvas.height !== size) {
      canvas.width = size;
      canvas.height = size;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.lineWidth = 8;

      const isDark =
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-color-scheme: dark)").matches;

      ctx.shadowColor = isDark ? "#e2e8f0" : "#374151";
      ctx.strokeStyle = isDark ? "#e2e8f0" : "#374151";
    }
  }, []);

  useEffect(() => {
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    return () => window.removeEventListener("resize", resizeCanvas);
  }, [resizeCanvas]);

  // Re-init on character change
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }, [targetCharacter]);

  const getPointerPos = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;

      let clientX: number, clientY: number;
      if ("touches" in e) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else {
        clientX = e.clientX;
        clientY = e.clientY;
      }

      return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY,
      };
    },
    []
  );

  const startDrawing = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault();
      if (isGrading) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const { x, y } = getPointerPos(e);
      ctx.beginPath();
      ctx.moveTo(x, y);
      setIsDrawing(true);
    },
    [isGrading, getPointerPos]
  );

  const draw = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault();
      if (!isDrawing || isGrading) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const { x, y } = getPointerPos(e);
      ctx.lineTo(x, y);
      ctx.stroke();
    },
    [isDrawing, isGrading, getPointerPos]
  );

  const stopDrawing = useCallback(() => {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.closePath();
  }, []);

  const handleClear = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    onClear?.();
  }, [onClear]);

  const handleSubmit = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = Math.max(canvas.width, 400);
    tempCanvas.height = Math.max(canvas.height, 400);
    const tempCtx = tempCanvas.getContext("2d");
    if (!tempCtx) return;

    // Medical-friendly grayscale background for AI contrast
    const isDark =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches;

    tempCtx.fillStyle = isDark ? "#1a1c23" : "#f8f7f2";
    tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
    tempCtx.drawImage(canvas, 0, 0);

    const base64 = tempCanvas.toDataURL("image/png");
    onSubmit(base64);
  }, [onSubmit]);

  return (
    <div className="w-full max-w-[600px] flex flex-col items-center gap-6 mx-auto">
      {/* Soft expansive writing tablet */}
      <div
        ref={containerRef}
        className="relative w-full aspect-square rounded-[2rem] overflow-hidden bg-[#fdfcfa] dark:bg-[#1a1c23] border border-neutral-300/50 dark:border-neutral-700/50"
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            boxShadow: "inset 0 0 30px rgba(0,0,0,0.03)",
          }}
        />

        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className={`w-full h-full block touch-none cursor-crosshair ${
            isGrading ? "opacity-20" : "opacity-100"
          }`}
        />

        {isGrading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
            <span className="text-xs tracking-[0.3em] text-neutral-500 dark:text-neutral-400 font-light animate-pulse">
              ĐANG PHÂN TÍCH NÉT BÚT...
            </span>
          </div>
        )}
      </div>

      {/* Soft rounded buttons */}
      
      <div className="flex gap-4 w-full justify-center">
        <button
          onClick={handleClear}
          disabled={isGrading}
          className="flex-1 py-4 bg-gradient-to-r from-neutral-200 to-neutral-300 dark:from-neutral-700 dark:to-neutral-600 text-neutral-700 dark:text-neutral-200 rounded-full text-sm tracking-[0.15em] hover:shadow-lg transition-all disabled:opacity-30"
        >
          Viết lại
        </button>
        <button
          onClick={handleSubmit}
          disabled={isGrading}
          className="flex-1 py-4 bg-gradient-to-r from-neutral-700 to-neutral-500 dark:from-neutral-300 dark:to-neutral-100 text-white dark:text-neutral-900 rounded-full text-sm tracking-[0.15em] hover:shadow-xl transition-all disabled:opacity-30"
        >
          Gửi đánh giá
        </button>
      </div>
    </div>
  );
}
