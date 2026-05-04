"use client";

import Link from 'next/link';
import { BookOpen, Target } from 'lucide-react';

const lessons = [
  { id: '1', title: 'Bữa sáng ở Bắc Kinh', level: 'HSK 2', words: 180 },
  // Add more lessons...
];

export default function LessonsPage() {
  return (
    <div className="min-h-screen bg-[#09060f] text-slate-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-black bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent mb-6">
            Các Bài Học
          </h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            Luyện tập từ vựng và ngữ pháp qua các bài học thực tế
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {lessons.map((lesson) => (
            <Link
              key={lesson.id}
              href={`/lessons/${lesson.id}`}
              className="group bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 hover:bg-white/10 hover:border-cyan-500/30 transition-all shadow-xl hover:shadow-2xl hover:-translate-y-2"
            >
              <div className="flex items-start gap-4 mb-6">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-purple-600 rounded-2xl flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-2xl font-bold text-white group-hover:text-cyan-400 mb-2 truncate">
                    {lesson.title}
                  </h3>
                  <div className="flex items-center gap-4 text-sm text-slate-400 mb-4">
                    <span className="flex items-center gap-1">
                      <Target className="w-4 h-4" />
                      {lesson.level}
                    </span>
                    <span>{lesson.words} từ</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between pt-6 border-t border-white/10">
                <span className="text-slate-500 group-hover:text-slate-400 transition-colors">
                  Bắt đầu học
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
