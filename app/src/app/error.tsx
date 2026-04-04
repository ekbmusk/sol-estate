"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Unhandled error:", error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <div className="w-12 h-12 rounded-xl border border-red-500/20 bg-red-500/10 flex items-center justify-center mx-auto mb-5">
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" className="text-red-400">
            <path d="M12 9v4m0 4h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <h2 className="text-[20px] font-bold tracking-[-0.01em] mb-2">
          Что-то пошло не так
        </h2>
        <p className="text-[14px] text-[#8A9B94] mb-6">
          {error.message || "Произошла непредвиденная ошибка"}
        </p>
        <button
          onClick={reset}
          className="inline-flex items-center rounded-lg bg-[#10B981] px-5 py-2.5 text-[14px] font-semibold text-[#060A08] hover:bg-[#059669] active:scale-[0.98] transition-all duration-200 cursor-pointer"
        >
          Попробовать снова
        </button>
      </div>
    </div>
  );
}
