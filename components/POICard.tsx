import Image from "next/image";
import { POIData } from "@/types";

export default function POICard({ data }: { data: POIData }) {
  return (
    <div className="relative min-h-screen bg-white pb-24">
      {/* Immersive top header */}
      <div className="relative h-[35vh] w-full">
        {data.images && data.images.length > 0 ? (
          <Image src={data.images[0]} alt={data.title} fill className="object-cover" referrerPolicy="no-referrer" />
        ) : (
          <div className="w-full h-full bg-gray-200" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-white via-white/20 to-transparent"></div>
        <h1 className="absolute bottom-6 left-6 text-3xl font-bold text-gray-900 drop-shadow-sm">
          {data.title}
        </h1>
      </div>

      {/* Quick stats section */}
      <div className="px-5 -mt-2 relative z-10">
        <div className="grid grid-cols-3 gap-2 bg-gray-50/80 backdrop-blur-md p-4 rounded-20 shadow-sm border border-gray-100">
          <div className="flex flex-col items-center justify-center border-r border-gray-200/60 last:border-0">
            <span className="text-[10px] text-gray-400">海拔</span>
            <span className="font-semibold text-gray-800 text-sm mt-1">{data.altitude ? `${data.altitude}m` : '-'}</span>
          </div>
          <div className="flex flex-col items-center justify-center border-r border-gray-200/60 last:border-0">
            <span className="text-[10px] text-gray-400">分类</span>
            <span className="font-semibold text-gray-800 text-sm mt-1">{data.type}</span>
          </div>
          <div className="flex flex-col items-center justify-center border-r border-gray-200/60 last:border-0">
            <span className="text-[10px] text-gray-400">实时路况</span>
            <span className={`font-semibold text-sm mt-1 ${data.roadStatus === '畅通' ? 'text-success' : data.roadStatus === '拥堵' ? 'text-warning' : 'text-danger'}`}>{data.roadStatus}</span>
          </div>
        </div>
      </div>

      {/* Description */}
      <article className="px-6 py-8 text-gray-700 leading-loose prose prose-sm max-w-none">
        <p>{data.description || "暂无描述"}</p>
        {data.liveUpdate && (
          <p className="text-xs text-gray-400 mt-4">最后更新: {new Date(data.liveUpdate).toLocaleString()}</p>
        )}
      </article>

      {/* Sticky Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 max-w-[480px] mx-auto bg-white/90 backdrop-blur-xl border-t border-gray-100 px-6 py-4 flex items-center justify-between z-50 pb-safe">
        <div className="flex gap-4">
          <button className="p-2 text-gray-400 hover:text-brand transition-colors">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
          </button>
          <button className="p-2 text-gray-400 hover:text-brand transition-colors">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
          </button>
        </div>
        <button className="bg-gradient-to-r from-brand to-gray-700 text-white font-bold py-3 px-8 rounded-full shadow-lg transition-transform active:scale-95">
          立即导航
        </button>
      </div>
    </div>
  );
}
