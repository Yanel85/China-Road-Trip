"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { useState, useEffect } from "react";

export default function SearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") || "");

  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (query.trim()) {
        params.set("q", query.trim());
      } else {
        params.delete("q");
      }
      router.replace(`/?${params.toString()}`, { scroll: false });
    }, 300); // 300ms debounce

    return () => clearTimeout(timer);
  }, [query, router, searchParams]);

  return (
    <div className="px-5 mt-2 mb-4">
      <div className="relative flex items-center w-full h-12 rounded-full bg-white shadow-sm border border-gray-100 overflow-hidden focus-within:ring-2 focus-within:ring-brand focus-within:border-transparent transition-all">
        <div className="grid place-items-center h-full w-12 text-gray-400">
          <Search className="h-5 w-5" />
        </div>
        <input
          className="peer h-full w-full outline-none text-sm text-gray-700 pr-4 bg-transparent placeholder-gray-400"
          type="text"
          id="search"
          placeholder="搜索你想去的景点 (POIs) 或路线..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
    </div>
  );
}
