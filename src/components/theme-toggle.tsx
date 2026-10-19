"use client";

const STORAGE_KEY = "wpa-theme";

export function ThemeToggle() {
  function toggle() {
    const root = document.documentElement;
    const dark = root.dataset.theme === "dark";
    if (dark) {
      delete root.dataset.theme;
      localStorage.setItem(STORAGE_KEY, "light");
    } else {
      root.dataset.theme = "dark";
      localStorage.setItem(STORAGE_KEY, "dark");
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className="rounded-full border border-line bg-card px-3 py-1.5 text-sm font-semibold text-ink hover:bg-raised"
    >
      <span className="dark:hidden">Ciemny</span>
      <span className="hidden dark:inline">Jasny</span>
    </button>
  );
}
