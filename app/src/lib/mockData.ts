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
    location: "Туркестан, Туркестанская область",
    description:
      "Реальная солнечная электростанция команды Zerde мощностью 25 кВт на кампусе Международного казахско-турецкого университета имени Ахмеда Ясави. Ежегодная выработка — 42.65 МВт·ч, предотвращение выбросов — 36 тонн CO₂/год. Данные генерации поступают в реальном времени с инвертора через SOLARMAN API — это не симуляция, а live-мониторинг настоящего оборудования. Коэффициент выбросов — 0.636 кг CO₂/кВт·ч (угольная генерация КЗ). Туркестанская область — регион с наибольшей инсоляцией в Казахстане (1,700+ кВт·ч/м²/год).",
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
    location: "Ерейментау, Акмолинская область",
    description:
      "Ветроэнергетический парк мощностью 45 МВт, 22 турбины Vestas V90. Зарегистрирован в UNFCCC CDM (Ref. 9498). Ежегодное сокращение — 12 000 тонн CO₂. Оператор — Самрук-Қазына / First Wind Power. Работает с 2015 года. Ерейментау — один из лучших ветровых коридоров Казахстана со средней скоростью ветра 8.5 м/с. Рядом строится вторая очередь — Ерейментау-2 на 50 МВт.",
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
    location: "Национальный парк Бурабай, Акмолинская область",
    description:
      "Посадка 500 000 деревьев (сосна, берёза, ель) на территории ГНПП «Бурабай». Ежегодное поглощение — 3 000 тонн CO₂. Часть национальной программы «Жасыл Ел» (цель — 2 млрд деревьев). Партнёрство с АО «Жасыл Даму» (оператор KZ ETS) и Комитетом лесного хозяйства. Бурабайский бор — один из реликтовых лесов Казахстана, пострадавший от пожаров 2019 года.",
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
      "Модернизация доменных печей крупнейшего металлургического завода Центральной Азии. Ежегодное сокращение — 8 000 тонн CO₂. Завод производит ~34% промышленных выбросов Карагандинской области. Участник KZ ETS (compliance market) с пороговыми выбросами ~12 000–15 000 т CO₂/год. Проект зарегистрирован как JI (Joint Implementation) под Киотским протоколом. Включает рекуперацию доменного газа и модернизацию конвертеров.",
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
