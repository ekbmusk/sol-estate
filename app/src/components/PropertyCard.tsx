"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { Property } from "@/lib/mockData";

const statusLabels: Record<Property["status"], string> = {
  active: "Активный",
  funded: "Собран",
  upcoming: "Скоро",
};

const statusVariants: Record<Property["status"], "default" | "secondary" | "outline"> = {
  active: "default",
  funded: "secondary",
  upcoming: "outline",
};

export default function PropertyCard({ property }: { property: Property }) {
  const progress = Math.round((property.sharesSold / property.totalShares) * 100);

  return (
    <Link href={`/asset/${property.id}`}>
      <Card className="cursor-pointer transition-shadow hover:shadow-lg">
        <div className="h-48 w-full bg-gradient-to-br from-muted to-muted/60 flex items-center justify-center rounded-t-xl">
          <span className="text-4xl text-muted-foreground/40">🏢</span>
        </div>
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-lg">{property.name}</CardTitle>
            <Badge variant={statusVariants[property.status]}>
              {statusLabels[property.status]}
            </Badge>
          </div>
          <CardDescription>{property.location}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground line-clamp-2">
            {property.description}
          </p>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Цена за долю</span>
            <span className="font-semibold">
              {property.pricePerShare.toLocaleString("ru-RU")} ₸
            </span>
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                {property.sharesSold.toLocaleString("ru-RU")} /{" "}
                {property.totalShares.toLocaleString("ru-RU")} долей
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
