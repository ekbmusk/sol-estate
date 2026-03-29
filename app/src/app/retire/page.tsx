import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function RetirePage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-8 flex items-center gap-3">
        <h1 className="text-3xl font-bold tracking-tight">Гашение углеродных кредитов</h1>
        <Badge variant="secondary">Скоро</Badge>
      </div>
      <Card>
        <CardContent className="py-16 text-center">
          <div className="mx-auto max-w-md space-y-4">
            <p className="text-4xl">🔥</p>
            <h2 className="text-xl font-semibold">Retire — сжигание кредитов с on-chain proof</h2>
            <p className="text-muted-foreground">
              Компании-загрязнители могут погасить углеродные кредиты. Токены сжигаются навсегда,
              а запись RetireRecord сохраняется on-chain как доказательство для аудиторов.
              Double counting невозможен.
            </p>
            <p className="text-sm text-muted-foreground">
              Полный интерфейс будет доступен в ближайшее время
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
