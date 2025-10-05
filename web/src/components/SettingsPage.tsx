import { useState, useEffect } from "react"
import { getSettings, saveSettings } from "@/hooks/settings"
import TomlMonaco from "@/components/TomlMonaco"
type SettingsResponse = {
  data: string
}

export default function SettingsPage() {
  const [settingsData, setSettingsData] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getSettings()
      .then((response: SettingsResponse) => setSettingsData(response.data))
      .finally((): void => setLoading(false))
  }, [])

  return (
    <div className="h-full w-full">
      <TomlMonaco
        key={loading ? "loading" : (settingsData ? "ready" : "empty")}
        initialValue={loading ? "Loading..." : settingsData || "# No settings available"}
  onSave={async (c: string) => { await saveSettings(c) }}
      />
    </div>
  )
}
