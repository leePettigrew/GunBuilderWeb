import type { ComponentType, SVGProps } from "react";
import { IconArmory, IconRules, IconWrench } from "@/components/ui/icons";

export interface NavItem {
  href: string;
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  blurb: string;
}

export const NAV_ITEMS: NavItem[] = [
  {
    href: "/builder",
    label: "Fabricator",
    icon: IconWrench,
    blurb: "Spec a pattern part by part while the schematic redraws live.",
  },
  {
    href: "/armory",
    label: "Armory",
    icon: IconArmory,
    blurb: "Your saved patterns, re-statted on sight under the active ruleset.",
  },
  {
    href: "/rules",
    label: "Rules Lab",
    icon: IconRules,
    blurb: "Crack open the damage model and retune every constant of the system.",
  },
];
