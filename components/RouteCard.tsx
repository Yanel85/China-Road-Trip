"use client";

import Link from "next/link";
import Image from "next/image";
import { RouteData } from "@/types";
import { CheckCircle, AlertTriangle, XCircle, Info, Heart } from "lucide-react";
import { MouseEvent } from "react";
import { useFavorites } from "@/hooks/useFavorites";

export default function RouteCard({ data }: { data: RouteData }) {
  const statusText = data.status || '未知';
  const { favorites, toggleFavorite } = useFavorites();
  const isFavorited = favorites.includes(data.id);
  
  // Keyword matching for status
  let statusColor = 'bg-gray-500 text-white';
  let cardBgColor = 'bg-card border-transparent';
  let StatusIcon = Info;

  if (statusText.includes('开放') || statusText.includes('clear')) {
    statusColor = 'bg-success text-white';
    cardBgColor = 'bg-[#F4FAF6] border-[#E2F2E9]'; // Subtle green tint
    StatusIcon = CheckCircle;
  } else if (statusText.includes('封路') || statusText.includes('congested')) {
    statusColor = 'bg-warning text-white';
    cardBgColor = 'bg-[#FFFDF4] border-[#FDF6E3]'; // Subtle yellow tint
    StatusIcon = AlertTriangle;
  } else if (statusText.includes('封闭') || statusText.includes('closed')) {
    statusColor = 'bg-danger text-white';
    cardBgColor = 'bg-[#FFF5F5] border-[#FFEAEA]'; // Subtle red tint
    StatusIcon = XCircle;
  }

  const isClosed = statusText.includes('封闭') || statusText.includes('closed');

  const handleFavorite = async (e: MouseEvent) => {
    e.preventDefault(); // Prevent Link navigation
    e.stopPropagation();
    toggleFavorite(data.id);
  };

  return (
    <Link href={`/route/${data.id}`}>
      <div className={`flex border ${cardBgColor} p-2.5 rounded-[16px] shadow-sm transition-all duration-300 ease-in-out hover:scale-[0.98] active:scale-[0.98] ${isClosed ? 'opacity-75' : ''}`}>
        <div className="w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100 relative" style={{ aspectRatio: '1/1' }}>
          <Image src={data.cover} alt={data.title} fill className="object-cover" referrerPolicy="no-referrer" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-80" />
        </div>
        
        <div className="ml-3 flex flex-col flex-1">
          <div className="flex justify-between items-start gap-2">
            <h3 className="font-bold text-gray-900 text-base line-clamp-2 leading-tight">{data.title}</h3>
            <button 
              onClick={handleFavorite}
              className={`p-1.5 flex-shrink-0 rounded-full transition-colors focus:outline-none ${isFavorited ? 'text-red-500 bg-red-50 hover:bg-red-100' : 'text-gray-400 hover:text-red-400 hover:bg-gray-100'}`}
              aria-label={isFavorited ? "取消收藏" : "收藏"}
            >
              <Heart size={14} strokeWidth={2.5} fill={isFavorited ? "currentColor" : "none"} />
            </button>
          </div>
          
          {data.season && data.season.length > 0 && (
            <div className="text-[11px] text-gray-500 mt-1 line-clamp-1">
              适合季节: {data.season.join("/")}
            </div>
          )}

          <div className="mt-auto flex items-center justify-end gap-2 pt-1.5">
            <span className="text-xs text-gray-500 font-medium">
              {data.distance} km
            </span>
            <span className={`flex items-center gap-1 inline-flex text-[10px] px-2 py-0.5 rounded-full font-medium ${statusColor}`}>
              <StatusIcon size={10} strokeWidth={2.5} />
              {statusText}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
