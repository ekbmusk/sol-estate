import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function MarketplacePage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-8 flex items-center gap-3">
        <h1 className="text-3xl font-bold tracking-tight">Маркетплейс</h1>
        <Badge variant="secondary">Скоро</Badge>
      </div>
      <Card>
        <CardContent className="py-16 text-center">
          <div className="mx-auto max-w-md space-y-4">
            <p className="text-4xl">🔄</p>
            <h2 className="text-xl font-semibold">P2P торговля долями</h2>
            <p className="text-muted-foreground">
              Вторичный рынок токенизированных долей углеродных кредитов. Покупайте и
              продавайте доли напрямую между инвесторами.
            </p>
            <p className="text-sm text-muted-foreground">
              Функция будет доступна в Wave 2
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
