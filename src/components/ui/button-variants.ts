import type * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

export const buttonVariants = cva(
  "btn-anim focus-ring relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-xl font-semibold transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 active:scale-[0.97] disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-60 disabled:shadow-none whitespace-nowrap",
  {
    variants: {
      variant: {
        primary: "bg-navy text-white hover:bg-navy-deep",
        sky: "bg-sky text-navy-deep hover:bg-[#5f98e6] hover:text-white",
        outline: "border border-navy/25 bg-white text-navy hover:bg-sky-soft",
        ghost: "text-navy hover:bg-sky-soft",
        danger: "bg-red-700 text-white hover:bg-red-800",
        gold: "bg-gold text-navy-deep hover:bg-[#c48f3c]",
      },
      size: { sm: "h-9 px-3 text-sm", md: "h-11 px-5 text-sm", lg: "h-12 px-7 text-base", icon: "h-10 w-10" },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {}
