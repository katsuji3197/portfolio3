"use client";

import React from "react";
import { motion } from "framer-motion";

export type ScrollButtonProps = {
  direction?: "down" | "up";
  multiplier?: number; // 何画面分スクロールするか
  behavior?: ScrollBehavior; // smooth or auto
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void; // 追加フック
  animated?: boolean; // アニメーション有効/無効
};

export default function ScrollButton({
  direction = "down",
  multiplier = 1,
  behavior = "smooth",
  className,
  style,
  children = "Scroll",
  onClick,
  animated = true,
}: ScrollButtonProps) {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    // ユーザー側 onClick を先に呼ぶ
    if (onClick) onClick(e);
    if (e.defaultPrevented) return;

    const viewportHeight = window.innerHeight;
    const delta = viewportHeight * Math.max(0, multiplier);
    const sign = direction === "up" ? -1 : 1;

    window.scrollBy({
      top: sign * delta,
      left: 0,
      behavior,
    });
  };

  const commonProps = {
    type: "button" as const,
    onClick: handleClick,
    className,
    style,
    "aria-label": direction === "up" ? "Scroll up" : "Scroll down",
  };

  if (!animated) {
    return <button {...commonProps}>{children}</button>;
  }

  return (
    <motion.button
      {...commonProps}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: [0, -8, 0] }}
      transition={{
        opacity: { duration: 0.4, ease: "easeOut" },
        y: { duration: 2.0, ease: "easeInOut", repeat: Infinity },
      }}
      whileHover={{ scale: 1.06 }}
      whileTap={{ scale: 0.98 }}
    >
      {children}
    </motion.button>
  );
}
