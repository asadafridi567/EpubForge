import { createContext, useContext } from "react";

type AppContextType = {
  theme: "dark" | "light";
  isDark: boolean;
  locale: string;
  setLocale: (v: string) => void;
  setTheme: (v: "dark" | "light") => void;
};

export const AppContext = createContext<AppContextType>({
  theme: "dark",
  isDark: true,
  locale: "en",
  setLocale: () => {},
  setTheme: () => {},
});

export function useApp() {
  return useContext(AppContext);
}
