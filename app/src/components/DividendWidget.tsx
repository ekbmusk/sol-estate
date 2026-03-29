"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface DividendWidgetProps {
  totalDividendsPerShare: number;
  claimableAmount: number;
  lastClaimed: number;
}

export default function DividendWidget({
  totalDividendsPerShare,
  claimableAmount,
  lastClaimed,
}: DividendWidgetProps) {
  const handleClaim = async () => {
    // TODO: Call program.methods.claimDividends() with the Anchor program
    alert("Запрос дивидендов (TODO: подключить транзакцию)");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Дивиденды</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Дивиденд на долю</span>
            <span className="font-medium">
              {totalDividendsPerShare.toLocaleString("ru-RU")} ₸
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">К получению</span>
            <span className="text-lg font-bold text-green-600">
              {claimableAmount.toLocaleString("ru-RU")} ₸
            </span>
          </div>
          {lastClaimed > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Последний вывод</span>
              <span className="text-xs text-muted-foreground">
                {new Date(lastClaimed * 1000).toLocaleDateString("ru-RU")}
              </span>
            </div>
          )}
        </div>
        <Button
          onClick={handleClaim}
          variant="outline"
          className="w-full"
          disabled={claimableAmount <= 0}
        >
          {claimableAmount > 0
            ? `Получить ${claimableAmount.toLocaleString("ru-RU")} ₸`
            : "Нет доступных дивидендов"}
        </Button>
      </CardContent>
    </Card>
  );
}
