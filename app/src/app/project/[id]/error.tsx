"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function ProjectError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Project page error:", error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <h2 className="text-[20px] font-bold tracking-[-0.01em] mb-2">
          Ошибка загрузки проекта
        </h2>
        <p className="text-[14px] text-[#8A9B94] mb-6">
          {error.message || "Не удалось загрузить данные проекта"}
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="inline-flex items-center rounded-lg bg-[#10B981] px-5 py-2.5 text-[14px] font-semibold text-[#060A08] hover:bg-[#059669] active:scale-[0.98] transition-all cursor-pointer"
          >
            Попробовать снова
          </button>
          <Link
            href="/"
            className="inline-flex items-center rounded-lg border border-[#2A3832] px-5 py-2.5 text-[14px] font-medium text-[#8A9B94] hover:text-[#F0F5F3] hover:bg-[#1A2320] transition-all"
          >
            К проектам
          </Link>
        </div>
      </div>
    </div>
  );
}
