export interface Property {
  id: string;
  name: string;
  location: string;
  description: string;
  totalShares: number;
  sharesSold: number;
  pricePerShare: number;
  status: "active" | "funded" | "upcoming";
  imageUrl: string;
  documentHash: string;
}

export const mockProperties: Property[] = [
  {
    id: "expo-city",
    name: 'ЖК "Expo City"',
    location: "Астана",
    description:
      "Современный жилой комплекс премиум-класса в районе EXPO. 24 этажа, подземный паркинг, фитнес-центр и детская площадка. Рядом станция метро и торговый центр.",
    totalShares: 10000,
    sharesSold: 6500,
    pricePerShare: 5000,
    status: "active",
    imageUrl: "/placeholder-expo.jpg",
    documentHash: "QmExpoCity123abc456def789ghi",
  },
  {
    id: "al-farabi",
    name: 'БЦ "Аль-Фараби"',
    location: "Алматы",
    description:
      "Бизнес-центр класса А на проспекте Аль-Фараби. 18 этажей офисных помещений, конференц-залы, ресторан на крыше. Арендаторы — крупные международные компании.",
    totalShares: 5000,
    sharesSold: 3200,
    pricePerShare: 10000,
    status: "active",
    imageUrl: "/placeholder-alfarabi.jpg",
    documentHash: "QmAlFarabi789xyz012abc345def",
  },
  {
    id: "burabay-residence",
    name: 'Курорт "Бурабай Резиденс"',
    location: "Бурабай",
    description:
      "Курортный комплекс на берегу озера Боровое. 50 коттеджей, SPA-центр, ресторан и конференц-зал. Круглогодичная эксплуатация с высокой заполняемостью.",
    totalShares: 2000,
    sharesSold: 800,
    pricePerShare: 25000,
    status: "active",
    imageUrl: "/placeholder-burabay.jpg",
    documentHash: "QmBurabay456mno789pqr012stu",
  },
];

export interface InvestorPortfolioItem {
  propertyId: string;
  propertyName: string;
  location: string;
  sharesOwned: number;
  pricePerShare: number;
  totalInvested: number;
  dividendsClaimed: number;
  claimableDividends: number;
}

export const mockPortfolio: InvestorPortfolioItem[] = [
  {
    propertyId: "expo-city",
    propertyName: 'ЖК "Expo City"',
    location: "Астана",
    sharesOwned: 50,
    pricePerShare: 5000,
    totalInvested: 250000,
    dividendsClaimed: 12500,
    claimableDividends: 3750,
  },
  {
    propertyId: "al-farabi",
    propertyName: 'БЦ "Аль-Фараби"',
    location: "Алматы",
    sharesOwned: 20,
    pricePerShare: 10000,
    totalInvested: 200000,
    dividendsClaimed: 18000,
    claimableDividends: 5000,
  },
];
