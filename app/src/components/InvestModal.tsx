"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { Property } from "@/lib/mockData";

export default function InvestModal({ property }: { property: Property }) {
  const [shares, setShares] = useState(1);
  const [open, setOpen] = useState(false);

  const totalCost = shares * property.pricePerShare;
  const remainingShares = property.totalShares - property.sharesSold;

  const handleInvest = async () => {
    // TODO: Call program.methods.invest() with the Anchor program
    // const tx = await program.methods
    //   .invest(new BN(shares))
    //   .accounts({ ... })
    //   .rpc();
    alert(`Инвестиция: ${shares} долей за ${totalCost.toLocaleString("ru-RU")} ₸ (TODO: подключить транзакцию)`);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="lg" className="w-full" />}>
        Инвестировать
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Инвестировать в {property.name}</DialogTitle>
          <DialogDescription>
            Укажите количество долей для покупки. Цена за одну долю:{" "}
            {property.pricePerShare.toLocaleString("ru-RU")} ₸
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="shares-input">
              Количество долей
            </label>
            <input
              id="shares-input"
              type="number"
              min={1}
              max={remainingShares}
              value={shares}
              onChange={(e) =>
                setShares(Math.max(1, Math.min(remainingShares, Number(e.target.value))))
              }
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
            <p className="text-xs text-muted-foreground">
              Доступно: {remainingShares.toLocaleString("ru-RU")} долей
            </p>
          </div>
          <div className="rounded-lg border bg-muted/50 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Итого</span>
              <span className="text-lg font-bold">
                {totalCost.toLocaleString("ru-RU")} ₸
              </span>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleInvest} className="w-full sm:w-auto">
            Подтвердить инвестицию
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
