"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { APP_VERSION, DEPLOY_BASE_URL, VERSION_CHECK_INTERVAL } from "@/lib/version"

export interface VersionInfo {
  currentVersion: string
  latestVersion: string | null
  updateAvailable: boolean
  checking: boolean
  lastChecked: Date | null
  error: string | null
  changelog: string | null
}

export function useVersionCheck() {
  const [versionInfo, setVersionInfo] = useState<VersionInfo>({
    currentVersion: APP_VERSION,
    latestVersion: null,
    updateAvailable: false,
    checking: false,
    lastChecked: null,
    error: null,
    changelog: null,
  })

  const [dismissed, setDismissed] = useState(false)

  const checkIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const checkForUpdates = useCallback(async () => {
    setVersionInfo((prev) => ({ ...prev, checking: true, error: null }))

    try {
      // Fetch version.json from GitHub Pages with cache-busting
      const timestamp = Date.now()
      const response = await fetch(`${DEPLOY_BASE_URL}/version.json?t=${timestamp}`, {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache",
          "Pragma": "no-cache",
        },
      })

      if (!response.ok) {
        throw new Error(`Error al verificar: ${response.status}`)
      }

      const data = await response.json()

      const latestVersion = data.version || null
      const changelog = data.changelog || null

      if (latestVersion) {
        const updateAvailable = compareVersions(latestVersion, APP_VERSION) > 0

        setVersionInfo((prev) => ({
          ...prev,
          latestVersion,
          updateAvailable,
          checking: false,
          lastChecked: new Date(),
          changelog,
        }))

        // Persist last known version to localStorage
        try {
          localStorage.setItem(
            "dataflow-ota",
            JSON.stringify({
              lastChecked: new Date().toISOString(),
              latestVersion,
              updateAvailable,
            })
          )
        } catch {}
      }
    } catch (err) {
      setVersionInfo((prev) => ({
        ...prev,
        checking: false,
        error: err instanceof Error ? err.message : "Error desconocido",
        lastChecked: new Date(),
      }))
    }
  }, [])

  // Check on mount + load cached state
  useEffect(() => {
    // Load cached OTA state
    try {
      const cached = localStorage.getItem("dataflow-ota")
      if (cached) {
        const parsed = JSON.parse(cached)
        if (parsed.latestVersion) {
          const updateAvailable = compareVersions(parsed.latestVersion, APP_VERSION) > 0
          setVersionInfo((prev) => ({
            ...prev,
            latestVersion: parsed.latestVersion,
            updateAvailable,
            lastChecked: parsed.lastChecked ? new Date(parsed.lastChecked) : null,
          }))
        }
      }
    } catch {}

    // Initial check after 3 seconds (don't block loading)
    const initialTimeout = setTimeout(() => {
      checkForUpdates()
    }, 3000)

    // Periodic check
    checkIntervalRef.current = setInterval(() => {
      checkForUpdates()
    }, VERSION_CHECK_INTERVAL)

    return () => {
      clearTimeout(initialTimeout)
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current)
      }
    }
  }, [checkForUpdates])

  const applyUpdate = useCallback(() => {
    // Clear all caches and reload
    if ("caches" in window) {
      caches.keys().then((names) => {
        names.forEach((name) => caches.delete(name))
      })
    }
    // Force reload from server
    window.location.reload()
  }, [])

  const dismissUpdate = useCallback(() => {
    setDismissed(true)
  }, [])

  return {
    ...versionInfo,
    checkForUpdates,
    applyUpdate,
    dismissUpdate,
    dismissed,
  }
}

/**
 * Compare semver versions. Returns:
 *  1 if a > b
 * -1 if a < b
 *  0 if a === b
 */
function compareVersions(a: string, b: string): number {
  const parseVersion = (v: string) => {
    const parts = v.replace(/^v/, "").split(".").map(Number)
    return {
      major: parts[0] || 0,
      minor: parts[1] || 0,
      patch: parts[2] || 0,
    }
  }

  const va = parseVersion(a)
  const vb = parseVersion(b)

  if (va.major !== vb.major) return va.major - vb.major
  if (va.minor !== vb.minor) return va.minor - vb.minor
  return va.patch - vb.patch
}
