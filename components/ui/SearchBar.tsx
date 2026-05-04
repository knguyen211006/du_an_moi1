"use client";

import { useState, useRef, useEffect } from 'react';
import { Search, X, BookOpen } from 'lucide-react';

import { MOCK_HANZI_DATA } from '@/lib/mockHanziData';
  const MOCK_DICTIONARY = MOCK_HANZI_DATA.slice(0, 10);

const SearchBar = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Logic xử lý tìm kiếm
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    const searchTerm = query.toLowerCase();
    
    // Hàm con: Xóa dấu thanh điệu Pinyin và xóa dấu cách
    // VD: "xǐ huan" -> "xihuan"
    const removeTones = (str: string) => {
      return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '');
    };

    const normalizedSearchTerm = removeTones(searchTerm);

    // Tìm kiếm đa năng
    const filtered = MOCK_DICTIONARY.filter(
      (item) =>
        item.hanzi.includes(searchTerm) ||
        removeTones(item.pinyin.toLowerCase()).includes(normalizedSearchTerm) ||
        item.meaning.toLowerCase().includes(searchTerm)
    );

    setResults(filtered);
    setIsOpen(true);
  }, [query]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  const clearSearch = () => {
    setQuery('');
  };

  const selectItem = (item: any) => {
    console.log('Selected:', item);
    clearSearch();
    // TODO: Navigate to hanzi detail page
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="w-full max-w-md relative" ref={containerRef}>
      <div className="relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          placeholder="Tìm kiếm từ vựng..."
          className="w-full pl-12 pr-12 py-4 border border-gray-300 shadow-sm rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-lg"
        />
        {query && (
          <button
            onClick={clearSearch}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 rounded-full transition-colors"
            aria-label="Clear search"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 max-h-80 overflow-y-auto">
          {results.length > 0 ? (
            <ul className="p-2 space-y-1">
              {results.map((item, index) => (
                <li key={index}>
                  <button
                    onClick={() => selectItem(item)}
                    className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 rounded-xl transition-colors text-left group"
                  >
                    <span className="text-3xl font-bold text-gray-800 flex-shrink-0">
                      {item.hanzi}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-blue-600 font-semibold text-sm leading-tight">
                        {item.pinyin}
                      </p>
                      <p className="text-gray-600 text-sm mt-0.5 truncate">
                        {item.meaning}
                      </p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-8 text-center py-12">
              <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">Không tìm thấy kết quả</p>
              <p className="text-gray-400 text-sm mt-1">Thử từ khóa khác</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBar;

