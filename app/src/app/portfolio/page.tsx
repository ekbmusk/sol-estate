"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { mockPortfolio } from "@/lib/mockData";
import Link from "next/link";
import { useWallet } from "@solana/wallet-adapter-react";

export default function PortfolioPage() {
  const { publicKey } = useWallet();

  const totalValue = mockPortfolio.reduce(
    (sum, item) => sum + item.sharesOwned * item.pricePerShare,
    0
  );
  const totalDividends = mockPortfolio.reduce(
    (sum, item) => sum + item.dividendsClaimed,
    0
  );
  const totalClaimable = mockPortfolio.reduce(
    (sum, item) => sum + item.claimableDividends,
    0
  );

  if (!publicKey) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <h1 className="text-3xl font-bold tracking-tight mb-4">Портфолио</h1>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground text-lg">
              Подключите кошелек для просмотра портфолио
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <h1 className="text-3xl font-bold tracking-tight mb-8">Портфолио</h1>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Общая стоимость
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {totalValue.toLocaleString("ru-RU")} ₸
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Получено дивидендов
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {totalDividends.toLocaleString("ru-RU")} ₸
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              К получению
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">
              {totalClaimable.toLocaleString("ru-RU")} ₸
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Investments */}
      <div className="space-y-4">
        {mockPortfolio.map((item) => (
          <Card key={item.propertyId}>
            <CardContent className="py-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <Link
                    href={`/asset/${item.propertyId}`}
                    className="font-semibold hover:underline"
                  >
                    {item.propertyName}
                  </Link>
                  <p className="text-sm text-muted-foreground">
                    {item.location}
                  </p>
                </div>
                <div className="flex flex-wrap gap-6 text-sm">
                  <div>
                    <p className="text-muted-foreground">Доли</p>
                    <p className="font-medium">{item.sharesOwned}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Стоимость</p>
                    <p className="font-medium">
                      {(item.sharesOwned * item.pricePerShare).toLocaleString(
                        "ru-RU"
                      )}{" "}
                      ₸
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Дивиденды</p>
                    <p className="font-medium">
                      {item.dividendsClaimed.toLocaleString("ru-RU")} ₸
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">К получению</p>
                    <p className="font-medium text-green-600">
                      {item.claimableDividends.toLocaleString("ru-RU")} ₸
                    </p>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  Получить
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
