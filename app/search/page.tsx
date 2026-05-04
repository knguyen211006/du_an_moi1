import { Suspense } from 'react';
import SearchContent from './SearchContent';

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center">Đang tải tìm kiếm...</div>}>
      <SearchContent />
    </Suspense>
  );
}

