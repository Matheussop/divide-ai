"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const current = theme === "system" ? resolvedTheme : theme;

  return (
    <Button
      type="button"
      variant="outline"
      size="icon-sm"
      onClick={() => setTheme(current === "dark" ? "light" : "dark")}
      aria-label="Alternar tema"
      title="Alternar tema"
    >
      {current === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </Button>
  );
}

