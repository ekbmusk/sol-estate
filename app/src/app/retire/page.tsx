"use client";

import { useState } from "react";
import { Check, Flame, FileCheck, ExternalLink } from "lucide-react";

const steps = [
  { num: 1, label: "Выбор кредитов", icon: Check },
  { num: 2, label: "Подтверждение", icon: Flame },
  { num: 3, label: "Сертификат", icon: FileCheck },
];

export default function RetirePage() {
  const [currentStep] = useState(1);

  return (
    <div className="mx-auto max-w-[800px] px-6 py-16 relative overflow-hidden">
      <div className="dot-grid dot-grid-fade absolute inset-0 opacity-50 pointer-events-none" />
      <div className="mb-12">
        <h1 className="font-heading text-[32px] font-bold tracking-[-0.02em] mb-3">
          Гашение кредитов
        </h1>
        <p className="text-[15px] text-[#8A9B94] max-w-[480px]">
          Гасите углеродные кредиты навсегда. Каждое гашение создаёт immutable proof on-chain.
        </p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-0 mb-12">
        {steps.map((step, i) => (
          <div key={step.num} className="flex items-center flex-1">
            <div className="flex items-center gap-3">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-medium transition-colors
                  ${step.num <= currentStep
                    ? "bg-[#34D399] text-[#060A08]"
                    : "border border-[#2A3832] text-[#5A6D65]"
                  }`}
              >
                {step.num < currentStep ? <Check size={14} strokeWidth={2.5} /> : step.num}
              </div>
              <span className={`text-[13px] font-medium hidden sm:block ${step.num <= currentStep ? "text-[#F0F5F3]" : "text-[#5A6D65]"}`}>
                {step.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={`flex-1 h-px mx-4 ${step.num < currentStep ? "bg-[#34D399]" : "bg-[#1E2B26]"}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Select credits */}
      <div className="rounded-xl border border-[#1E2B26] bg-[#0C1210] p-8">
        <p className="label-upper mb-6">Выберите кредиты для гашения</p>

        <div className="space-y-4 mb-6">
          <div>
            <label className="text-[13px] text-[#8A9B94] mb-2 block">Проект</label>
            <div className="rounded-lg bg-[#060A08] border border-[#2A3832] px-4 py-3 text-[14px] text-[#5A6D65]">
              Выберите проект...
            </div>
          </div>
          <div>
            <label className="text-[13px] text-[#8A9B94] mb-2 block">Количество (tCO&#x2082;)</label>
            <div className="rounded-lg bg-[#060A08] border border-[#2A3832] px-4 py-3 text-[14px] text-[#5A6D65]">
              0
            </div>
          </div>
          <div>
            <label className="text-[13px] text-[#8A9B94] mb-2 block">Цель гашения</label>
            <div className="rounded-lg bg-[#060A08] border border-[#2A3832] px-4 py-3 text-[14px] text-[#5A6D65] h-20">
              Опишите цель гашения кредитов...
            </div>
          </div>
        </div>

        <button
          disabled
          className="w-full rounded-lg bg-[#10B981] px-5 py-2.5 text-[14px] font-semibold text-[#060A08] opacity-50 cursor-not-allowed"
        >
          Подключите кошелёк
        </button>
      </div>

      {/* Info card */}
      <div className="mt-8 rounded-xl border border-[#1E2B26] bg-[#0C1210] p-6 space-y-3">
        <h3 className="font-heading text-[14px] font-semibold tracking-[-0.01em]">Как работает гашение</h3>
        <ul className="space-y-2.5">
          {[
            "Углеродные токены навсегда сжигаются через SPL Token burn",
            "RetireRecord PDA создаётся on-chain: кто, сколько, когда, зачем",
            "Сожжённые токены невозможно использовать повторно — double counting исключён",
            "Аудиторы проверяют запись через Solana Explorer в любое время",
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-2.5 text-[13px] text-[#8A9B94] leading-[1.5]">
              <Check size={14} strokeWidth={2} className="text-[#34D399] mt-0.5 shrink-0" />
              {item}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
