"use client";

import { use } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import InvestModal from "@/components/InvestModal";
import DividendWidget from "@/components/DividendWidget";
import { mockProperties } from "@/lib/mockData";

const statusLabels: Record<string, string> = {
  active: "Активный",
  funded: "Собран",
  upcoming: "Скоро",
};

export default function AssetPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const property = mockProperties.find((p) => p.id === id);

  if (!property) {
    notFound();
  }

  const progress = Math.round(
    (property.sharesSold / property.totalShares) * 100
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <Link
        href="/"
        className="mb-6 inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
      >
        &larr; Назад к каталогу
      </Link>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="h-64 w-full rounded-xl bg-gradient-to-br from-muted to-muted/60 flex items-center justify-center">
            <span className="text-6xl text-muted-foreground/40">🏢</span>
          </div>

          <div>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold">{property.name}</h1>
                <p className="text-muted-foreground">{property.location}</p>
              </div>
              <Badge>{statusLabels[property.status]}</Badge>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              {property.description}
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Информация об объекте</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Всего долей</span>
                <span className="font-medium">
                  {property.totalShares.toLocaleString("ru-RU")}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Продано долей</span>
                <span className="font-medium">
                  {property.sharesSold.toLocaleString("ru-RU")}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Цена за долю</span>
                <span className="font-medium">
                  {property.pricePerShare.toLocaleString("ru-RU")} ₸
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Общая стоимость</span>
                <span className="font-medium">
                  {(property.totalShares * property.pricePerShare).toLocaleString(
                    "ru-RU"
                  )}{" "}
                  ₸
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Хеш документа</span>
                <span className="font-mono text-xs truncate max-w-[200px]">
                  {property.documentHash}
                </span>
              </div>
              <div className="pt-2 space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Прогресс сбора</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Инвестирование</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <p className="text-3xl font-bold">
                  {property.pricePerShare.toLocaleString("ru-RU")} ₸
                </p>
                <p className="text-sm text-muted-foreground">за одну долю</p>
              </div>
              <div className="text-sm text-muted-foreground text-center">
                Доступно:{" "}
                {(property.totalShares - property.sharesSold).toLocaleString(
                  "ru-RU"
                )}{" "}
                долей
              </div>
              <InvestModal property={property} />
            </CardContent>
          </Card>

          <DividendWidget
            totalDividendsPerShare={250}
            claimableAmount={3750}
            lastClaimed={1700000000}
          />
        </div>
      </div>
    </div>
  );
}
