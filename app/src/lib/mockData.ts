export interface Project {
  id: string;
  name: string;
  location: string;
  description: string;
  projectType: "solar" | "wind" | "forest" | "industrial" | "other";
  totalCredits: number;
  creditsRetired: number;
  totalShares: number;
  sharesSold: number;
  pricePerShare: number;
  verified: boolean;
  status: "active" | "funded" | "retired";
  imageUrl: string;
  documentHash: string;
}

export const mockProjects: Project[] = [
  {
    id: "solar-kapchagai",
    name: "Солнечная ферма Капшагай",
    location: "Алматинская область",
    description:
      "Солнечная электростанция мощностью 50 МВт. Ежегодное сокращение выбросов — 5 000 тонн CO₂. Верифицировано по стандарту Gold Standard.",
    projectType: "solar",
    totalCredits: 5000,
    creditsRetired: 320,
    totalShares: 5000,
    sharesSold: 3200,
    pricePerShare: 10000,
    verified: true,
    status: "active",
    imageUrl: "/placeholder-solar.jpg",
    documentHash: "QmSolarKapchagai123abc456def",
  },
  {
    id: "wind-yereymentau",
    name: "Ветропарк Ерейментау",
    location: "Акмолинская область",
    description:
      "Ветроэнергетический парк из 45 турбин. Ежегодное сокращение — 12 000 тонн CO₂. Крупнейший ветропарк в Центральной Азии.",
    projectType: "wind",
    totalCredits: 12000,
    creditsRetired: 1500,
    totalShares: 12000,
    sharesSold: 8400,
    pricePerShare: 5000,
    verified: true,
    status: "active",
    imageUrl: "/placeholder-wind.jpg",
    documentHash: "QmWindYereymentau789xyz012",
  },
  {
    id: "forest-burabay",
    name: "Лесовосстановление Бурабай",
    location: "Национальный парк Бурабай",
    description:
      "Посадка 500 000 деревьев на территории национального парка. Ежегодное поглощение — 3 000 тонн CO₂. Партнёрство с Жасыл Даму.",
    projectType: "forest",
    totalCredits: 3000,
    creditsRetired: 0,
    totalShares: 3000,
    sharesSold: 900,
    pricePerShare: 15000,
    verified: true,
    status: "active",
    imageUrl: "/placeholder-forest.jpg",
    documentHash: "QmForestBurabay456mno789pqr",
  },
  {
    id: "arcelor-temirtau",
    name: "ArcelorMittal Теміртау",
    location: "Теміртау, Карагандинская область",
    description:
      "Модернизация доменных печей крупнейшего металлургического завода. Ежегодное сокращение — 8 000 тонн CO₂. Compliance market KZ ETS.",
    projectType: "industrial",
    totalCredits: 8000,
    creditsRetired: 2100,
    totalShares: 8000,
    sharesSold: 5600,
    pricePerShare: 8000,
    verified: true,
    status: "active",
    imageUrl: "/placeholder-industrial.jpg",
    documentHash: "QmArcelorTemirtau012stu345vwx",
  },
];

export interface InvestorPortfolioItem {
  projectId: string;
  projectName: string;
  location: string;
  sharesOwned: number;
  pricePerShare: number;
  totalInvested: number;
  dividendsClaimed: number;
  claimableDividends: number;
}

export const mockPortfolio: InvestorPortfolioItem[] = [
  {
    projectId: "solar-kapchagai",
    projectName: "Солнечная ферма Капшагай",
    location: "Алматинская область",
    sharesOwned: 50,
    pricePerShare: 10000,
    totalInvested: 500000,
    dividendsClaimed: 25000,
    claimableDividends: 7500,
  },
  {
    projectId: "wind-yereymentau",
    projectName: "Ветропарк Ерейментау",
    location: "Акмолинская область",
    sharesOwned: 100,
    pricePerShare: 5000,
    totalInvested: 500000,
    dividendsClaimed: 45000,
    claimableDividends: 12000,
  },
];
