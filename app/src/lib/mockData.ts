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
    id: "ses-yasavi",
    name: "СЭС Университета Ахмеда Ясави",
    location: "Туркестан",
    description:
      "Солнечная электростанция мощностью 25 кВт на кампусе университета. Ежегодная выработка — 42.65 МВт·ч. Предотвращение выбросов — 36 тонн CO₂/год. Мониторинг через SOLARMAN API.",
    projectType: "solar",
    totalCredits: 36,
    creditsRetired: 0,
    totalShares: 360,
    sharesSold: 0,
    pricePerShare: 10000,
    verified: true,
    status: "active",
    imageUrl: "/placeholder-solar.jpg",
    documentHash: "QmSESYasavi36tCO2",
  },
  {
    id: "wind-yereymentau",
    name: "Ветропарк Ерейментау",
    location: "Акмолинская область",
    description:
      "Ветроэнергетический парк из 45 турбин. Ежегодное сокращение — 12 000 тонн CO₂. Крупнейший ветропарк в Центральной Азии.",
    projectType: "wind",
    totalCredits: 12000,
    creditsRetired: 0,
    totalShares: 12000,
    sharesSold: 0,
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
    sharesSold: 0,
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
    creditsRetired: 0,
    totalShares: 8000,
    sharesSold: 0,
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
    projectId: "ses-yasavi",
    projectName: "СЭС Университета Ахмеда Ясави",
    location: "Туркестан",
    sharesOwned: 10,
    pricePerShare: 10000,
    totalInvested: 100000,
    dividendsClaimed: 0,
    claimableDividends: 0,
  },
  {
    projectId: "wind-yereymentau",
    projectName: "Ветропарк Ерейментау",
    location: "Акмолинская область",
    sharesOwned: 100,
    pricePerShare: 5000,
    totalInvested: 500000,
    dividendsClaimed: 0,
    claimableDividends: 0,
  },
];
