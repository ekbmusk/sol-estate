"use client";

import { use } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import InvestModal from "@/components/InvestModal";
import DividendWidget from "@/components/DividendWidget";
import { mockProjects } from "@/lib/mockData";

const statusLabels: Record<string, string> = {
  active: "Активный",
  funded: "Собран",
  retired: "Погашен",
};

const typeLabels: Record<string, string> = {
  solar: "Солнечная энергия",
  wind: "Ветроэнергетика",
  forest: "Лесовосстановление",
  industrial: "Промышленность",
  other: "Другое",
};

export default function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const project = mockProjects.find((p) => p.id === id);

  if (!project) {
    notFound();
  }

  const progress = Math.round(
    (project.sharesSold / project.totalShares) * 100
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <Link
        href="/"
        className="mb-6 inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
      >
        &larr; Назад к проектам
      </Link>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="h-64 w-full rounded-xl bg-gradient-to-br from-muted to-muted/60 flex items-center justify-center">
            <span className="text-6xl text-muted-foreground/40">
              {project.projectType === "solar" ? "☀️" :
               project.projectType === "wind" ? "💨" :
               project.projectType === "forest" ? "🌲" :
               project.projectType === "industrial" ? "🏭" : "🌍"}
            </span>
          </div>

          <div>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold">{project.name}</h1>
                <p className="text-muted-foreground">{project.location}</p>
              </div>
              <div className="flex gap-2">
                <Badge variant="outline">{typeLabels[project.projectType]}</Badge>
                <Badge>{statusLabels[project.status]}</Badge>
                {project.verified && <Badge variant="secondary">Верифицирован</Badge>}
              </div>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              {project.description}
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Информация о проекте</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">CO₂ кредитов/год</span>
                <span className="font-medium">
                  {project.totalCredits.toLocaleString("ru-RU")} тонн
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Погашено кредитов</span>
                <span className="font-medium">
                  {project.creditsRetired.toLocaleString("ru-RU")} тонн
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Всего долей</span>
                <span className="font-medium">
                  {project.totalShares.toLocaleString("ru-RU")}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Продано долей</span>
                <span className="font-medium">
                  {project.sharesSold.toLocaleString("ru-RU")}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Цена за долю</span>
                <span className="font-medium">
                  {project.pricePerShare.toLocaleString("ru-RU")} ₸
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Хеш документа</span>
                <span className="font-mono text-xs truncate max-w-[200px]">
                  {project.documentHash}
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

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Инвестирование</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <p className="text-3xl font-bold">
                  {project.pricePerShare.toLocaleString("ru-RU")} ₸
                </p>
                <p className="text-sm text-muted-foreground">за одну долю</p>
              </div>
              <div className="text-sm text-muted-foreground text-center">
                Доступно:{" "}
                {(project.totalShares - project.sharesSold).toLocaleString(
                  "ru-RU"
                )}{" "}
                долей
              </div>
              <InvestModal property={project} />
            </CardContent>
          </Card>

          <DividendWidget
            projectId={project.id}
            totalDividendsPerShare={250}
            claimableAmount={3750}
            lastClaimed={1700000000}
          />
        </div>
      </div>
    </div>
  );
}
