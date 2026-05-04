import Link from "next/link";
import { MOCK_HANZI_DATA } from '@/lib/mockHanziData';

export default function RadicalsPage() {
  
  const allHanzi = MOCK_HANZI_DATA.map((w) => ({
    hanzi: w.hanzi,
    pinyin: w.pinyin,
    radical: w.hanzi.charAt(0) || "Khác" // Simple radical approximation
  }));

  // Gom nhóm theo Bộ thủ
  const groupedByRadical: { [key: string]: any[] } = {};
  
  allHanzi.forEach(item => {
    if (!groupedByRadical[item.radical]) {
      groupedByRadical[item.radical] = [];
    }
    if (!groupedByRadical[item.radical].find(x => x.hanzi === item.hanzi)) {
      groupedByRadical[item.radical].push(item);
    }
  });

  const sortedRadicals = Object.entries(groupedByRadical).sort((a, b) => {
    if (a[0] === "Khác") return 1;
    if (b[0] === "Khác") return -1;
    return b[1].length - a[1].length;
  });

  return (
    <main className="container mx-auto px-4 pt-10 pb-20 max-w-7xl font-sans min-h-screen bg-background transition-colors duration-500">
      <h1 className="text-4xl md:text-5xl font-black text-center mb-16 text-foreground tracking-tighter drop-shadow-sm">
        Tàng Kinh Các Bộ Thủ
      </h1>
      
      <div className="space-y-16">
        {sortedRadicals.map(([radical, hanziList]) => (
          <section key={radical} className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="text-4xl font-black text-primary p-4 rounded-2xl bg-primary/10 min-w-[80px] flex items-center justify-center shadow-inner border border-primary/20">
                {radical === "Khác" ? "📦" : radical}
              </div>
              <div>
                <h2 className="text-3xl font-bold text-foreground tracking-tight">
                  {radical === "Khác" ? "Chưa phân loại" : `Bộ ${radical}`}
                </h2>
                <p className="text-muted-foreground text-sm font-bold uppercase tracking-widest mt-1">
                  {hanziList.length} Hán tự
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
              {hanziList.map((item: any) => (
                <Link
                  key={item.hanzi}
                  href={`/hanzi/${encodeURIComponent(item.hanzi)}`}
                  className="group p-5 bg-card border-2 border-border rounded-[1.5rem] hover:shadow-xl hover:shadow-primary/5 hover:border-primary transition-all duration-300 text-center hover:-translate-y-1.5 flex flex-col items-center justify-center"
                >
                  <div className="text-4xl font-black mb-4 text-foreground group-hover:text-primary transition-colors duration-300">
                    {item.hanzi}
                  </div>
                  <div className="text-[10px] font-black text-muted-foreground group-hover:text-primary tracking-[0.2em] uppercase bg-muted group-hover:bg-primary/10 px-3 py-1.5 rounded-full transition-colors duration-300">
                    {item.pinyin}
                  </div>
                </Link>
              ))}
            </div>
            
            <div className="h-px w-full bg-border/50 mt-10" />
          </section>
        ))}
      </div>

      {allHanzi.length === 0 && (
        <div className="text-center py-32">
          <p className="text-3xl text-muted-foreground font-black tracking-tighter opacity-50">
            Tàng Kinh Các đang trống không...
          </p>
        </div>
      )}
    </main>
  );
}
