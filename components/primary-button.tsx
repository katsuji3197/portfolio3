import Link from "next/link";
import { ReactNode } from "react";

interface PrimaryButtonProps {
  href: string;
  children: ReactNode;
  className?: string;
}

export default function PrimaryButton({ 
  href, 
  children, 
  className = "" 
}: PrimaryButtonProps) {
  return (
    <Link
      href={href}
      className={`text-xs text-neutral-300 font-medium rounded-md border hover:bg-neutral-800/10 bg-neutral-800/40 backdrop-blur-xl border-neutral-600 px-4 py-2 hover:border-neutral-800 hover:text-neutral-600 duration-300 animate-glow ${className}`}
    >
      {children}
    </Link>
  );
}
