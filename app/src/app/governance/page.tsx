import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function GovernancePage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-8 flex items-center gap-3">
        <h1 className="text-3xl font-bold tracking-tight">Голосование</h1>
        <Badge variant="secondary">Скоро</Badge>
      </div>
      <Card>
        <CardContent className="py-16 text-center">
          <div className="mx-auto max-w-md space-y-4">
            <p className="text-4xl">🗳️</p>
            <h2 className="text-xl font-semibold">Управление объектами</h2>
            <p className="text-muted-foreground">
              Голосуйте по вопросам управления недвижимостью: ремонт, смена
              управляющей компании, распределение доходов и другие решения.
            </p>
            <p className="text-sm text-muted-foreground">
              Функция будет доступна в Wave 3
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
