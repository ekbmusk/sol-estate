"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { Project } from "@/lib/mockData";

const statusLabels: Record<Project["status"], string> = {
  active: "Активный",
  funded: "Собран",
  retired: "Погашен",
};

const statusVariants: Record<Project["status"], "default" | "secondary" | "outline"> = {
  active: "default",
  funded: "secondary",
  retired: "outline",
};

const typeEmojis: Record<Project["projectType"], string> = {
  solar: "☀️",
  wind: "💨",
  forest: "🌲",
  industrial: "🏭",
  other: "🌍",
};

export default function ProjectCard({ project }: { project: Project }) {
  const progress = Math.round((project.sharesSold / project.totalShares) * 100);

  return (
    <Link href={`/project/${project.id}`}>
      <Card className="cursor-pointer transition-shadow hover:shadow-lg">
        <div className="h-48 w-full bg-gradient-to-br from-muted to-muted/60 flex items-center justify-center rounded-t-xl">
          <span className="text-4xl text-muted-foreground/40">
            {typeEmojis[project.projectType]}
          </span>
        </div>
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-lg">{project.name}</CardTitle>
            <Badge variant={statusVariants[project.status]}>
              {statusLabels[project.status]}
            </Badge>
          </div>
          <CardDescription>{project.location}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground line-clamp-2">
            {project.description}
          </p>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">CO₂ кредитов</span>
            <span className="font-semibold">
              {project.totalCredits.toLocaleString("ru-RU")} т/год
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Цена за долю</span>
            <span className="font-semibold">
              {project.pricePerShare.toLocaleString("ru-RU")} ₸
            </span>
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                {project.sharesSold.toLocaleString("ru-RU")} /{" "}
                {project.totalShares.toLocaleString("ru-RU")} долей
              </span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
