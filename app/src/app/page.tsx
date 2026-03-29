import ProjectCard from "@/components/ProjectCard";
import { mockProjects } from "@/lib/mockData";

export default function CatalogPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Каталог зелёных проектов</h1>
        <p className="mt-2 text-muted-foreground">
          Инвестируйте в зелёные проекты Казахстана через токенизированные углеродные кредиты
        </p>
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {mockProjects.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>
    </div>
  );
}
