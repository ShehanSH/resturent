import Link from "next/link";
import {
  CupSoda,
  IceCream,
  Pizza,
  Sandwich,
  Soup,
  UtensilsCrossed,
  Wheat,
  type LucideIcon,
} from "lucide-react";

import { FoodImage } from "@/components/public/food-image";
import { categoryTagline } from "@/lib/brand";
import type { CategoryRow } from "@/types/database";

const ICONS: Record<string, LucideIcon> = {
  burgers: Sandwich,
  burger: Sandwich,
  pizza: Pizza,
  beverages: CupSoda,
  drinks: CupSoda,
  desserts: IceCream,
  dessert: IceCream,
  kottu: Wheat,
  "rice-and-curry": Soup,
  rice: Soup,
  biryani: Soup,
  submarines: Sandwich,
};

function iconFor(slug: string): LucideIcon {
  const key = slug.toLowerCase();
  if (ICONS[key]) return ICONS[key];
  const match = Object.entries(ICONS).find(([name]) => key.includes(name));
  return match?.[1] ?? UtensilsCrossed;
}

export function CategoryCard({ category }: { category: CategoryRow }) {
  const Icon = iconFor(category.slug);

  return (
    <Link href={`/menu/${category.slug}`} className="brand-card brand-card-hover group block overflow-hidden">
      <div className="relative aspect-4/3 overflow-hidden">
        <FoodImage
          src={category.image_url}
          alt={category.name}
          className="group-hover:scale-[1.05]"
        />
      </div>
      <div className="relative px-4 pt-8 pb-5 text-center">
        <span className="bg-primary text-primary-foreground absolute -top-6 left-1/2 inline-flex size-12 -translate-x-1/2 items-center justify-center rounded-full shadow-md">
          <Icon className="size-5" aria-hidden />
        </span>
        <p className="font-heading text-lg tracking-wide text-primary uppercase">{category.name}</p>
        <p className="text-muted-foreground mt-1 text-sm">{categoryTagline(category.description)}</p>
      </div>
    </Link>
  );
}
