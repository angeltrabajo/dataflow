"use client"
import { useAppStore } from "@/lib/store"
import { useEffect } from "react"

export function ThemeSync() {
  const theme = useAppStore(state => state.theme)
  
  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }, [theme])
  
  return null
}
