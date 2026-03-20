"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { FileUploader } from "./file-uploader"

interface SankeyParams {
  focoPaso1: string
  focoPaso2: string
  minChats: number
  maxPasos: number
}

const TOOL_OPTIONS = [
  { value: "", label: "Sin filtro" },
  { value: "get_greetings", label: "get_greetings" },
  { value: "get_city_country_information", label: "get_city_country_information" },
  { value: "get_inspiration_information", label: "get_inspiration_information" },
  { value: "get_inspiration", label: "get_inspiration" },
  { value: "others", label: "others" },
  { value: "get_general_info", label: "get_general_info" },
  { value: "get_location_data", label: "get_location_data" },
  { value: "get_poi_information", label: "get_poi_information" },
  { value: "documentation-required", label: "documentation-required" },
  { value: "bank_promos", label: "bank_promos" },
  { value: "get_entity", label: "get_entity" },
  { value: "clarify_destination_intent", label: "clarify_destination_intent" },
  { value: "offers", label: "offers" },
  { value: "get_weather_information", label: "get_weather_information" },
  { value: "contact_sale_assistant", label: "contact_sale_assistant" },
  { value: "flight-build-checkout-link", label: "flight-build-checkout-link" },
  { value: "flight-search", label: "flight-search" },
  { value: "search_packages_on_destination", label: "search_packages_on_destination" },
  { value: "search_hotels_on_destination", label: "search_hotels_on_destination" },
  { value: "flight-price-trend", label: "flight-price-trend" },
  { value: "flight-deals", label: "flight-deals" },
  { value: "create_trip", label: "create_trip" },
]

export function ParameterForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [csvData, setCsvData] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [params, setParams] = useState<SankeyParams>({
    focoPaso1: "",
    focoPaso2: "",
    minChats: 10,
    maxPasos: 6,
  })

  const handleFileUpload = (data: string, name: string) => {
    setCsvData(data)
    setFileName(name)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!csvData) {
      alert("Por favor, sube un archivo CSV primero")
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/generate-sankey", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          csvData,
          params: {
            focoPaso1: params.focoPaso1 || null,
            focoPaso2: params.focoPaso2 || null,
            minChats: params.minChats,
            maxPasos: params.maxPasos,
          },
        }),
      })

      if (!response.ok) {
        throw new Error("Error al generar el Sankey")
      }

      const result = await response.json()
      
      // Store result in sessionStorage for the visualization page
      sessionStorage.setItem("sankeyData", JSON.stringify(result))
      sessionStorage.setItem("sankeyParams", JSON.stringify(params))
      
      router.push("/visualizar")
    } catch (error) {
      console.error("Error:", error)
      alert("Error al procesar los datos. Verifica el formato del CSV.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* File Upload Section */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-foreground">
          Archivo CSV
        </label>
        <FileUploader onFileUpload={handleFileUpload} fileName={fileName} />
        <p className="text-xs text-muted-foreground">
          El CSV debe contener las columnas: chat_id, tool_topic, posicion_en_el_chat
        </p>
      </div>

      {/* Parameters Grid */}
      <div className="grid gap-6 sm:grid-cols-2">
        {/* FOCO_PASO_1 */}
        <div className="space-y-2">
          <label htmlFor="focoPaso1" className="block text-sm font-medium text-foreground">
            FOCO_PASO_1
          </label>
          <select
            id="focoPaso1"
            value={params.focoPaso1}
            onChange={(e) => setParams({ ...params, focoPaso1: e.target.value })}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            {TOOL_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <p className="text-xs text-muted-foreground">
            Filtrar chats que comienzan con esta tool
          </p>
        </div>

        {/* FOCO_PASO_2 */}
        <div className="space-y-2">
          <label htmlFor="focoPaso2" className="block text-sm font-medium text-foreground">
            FOCO_PASO_2
          </label>
          <select
            id="focoPaso2"
            value={params.focoPaso2}
            onChange={(e) => setParams({ ...params, focoPaso2: e.target.value })}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            {TOOL_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <p className="text-xs text-muted-foreground">
            Filtrar chats donde el segundo paso es esta tool
          </p>
        </div>

        {/* MIN_CHATS */}
        <div className="space-y-2">
          <label htmlFor="minChats" className="block text-sm font-medium text-foreground">
            MIN_CHATS
          </label>
          <input
            type="number"
            id="minChats"
            min={1}
            value={params.minChats}
            onChange={(e) => setParams({ ...params, minChats: parseInt(e.target.value) || 1 })}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          />
          <p className="text-xs text-muted-foreground">
            Mostrar solo transiciones con al menos N chats
          </p>
        </div>

        {/* MAX_PASOS */}
        <div className="space-y-2">
          <label htmlFor="maxPasos" className="block text-sm font-medium text-foreground">
            MAX_PASOS
          </label>
          <input
            type="number"
            id="maxPasos"
            min={2}
            max={20}
            value={params.maxPasos}
            onChange={(e) => setParams({ ...params, maxPasos: parseInt(e.target.value) || 6 })}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          />
          <p className="text-xs text-muted-foreground">
            Limitar el flujo a los primeros N pasos
          </p>
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading || !csvData}
        className="w-full rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Generando Sankey...
          </span>
        ) : (
          "Generar Sankey"
        )}
      </button>
    </form>
  )
}
