"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Header } from "@/components/header"
import { SankeyChart } from "@/components/sankey-chart"

interface SankeyNode {
  name: string
  color: string
}

interface SankeyLink {
  source: number
  target: number
  value: number
  color: string
}

interface SankeyData {
  nodes: SankeyNode[]
  links: SankeyLink[]
  title: string
  stats: {
    totalAntes: number
    totalFiltrado: number
    porcentaje: string
  }
}

interface SankeyParams {
  focoPaso1: string
  focoPaso2: string
  minChats: number
  maxPasos: number
}

export default function VisualizarPage() {
  const [data, setData] = useState<SankeyData | null>(null)
  const [params, setParams] = useState<SankeyParams | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const storedData = sessionStorage.getItem("sankeyData")
    const storedParams = sessionStorage.getItem("sankeyParams")

    if (storedData) {
      setData(JSON.parse(storedData))
    }
    if (storedParams) {
      setParams(JSON.parse(storedParams))
    }
    setIsLoading(false)
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto flex items-center justify-center px-4 py-20">
          <div className="flex flex-col items-center gap-4">
            <svg className="h-8 w-8 animate-spin text-primary" viewBox="0 0 24 24">
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
            <p className="text-muted-foreground">Cargando visualizacion...</p>
          </div>
        </main>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-20">
          <div className="mx-auto max-w-md text-center">
            <div className="mb-6 flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <svg
                  className="h-8 w-8 text-muted-foreground"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
            </div>
            <h1 className="mb-2 text-2xl font-bold text-foreground">No hay datos</h1>
            <p className="mb-6 text-muted-foreground">
              Primero debes configurar los parametros y subir un archivo CSV para generar el Sankey.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              Ir a Configurar
            </Link>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Visualizacion Sankey</h1>
            <p className="text-sm text-muted-foreground">
              Interactua con el diagrama: arrastra nodos, haz zoom y descarga el resultado
            </p>
          </div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
              />
            </svg>
            Nueva Configuracion
          </Link>
        </div>

        {/* Parameters Summary */}
        {params && (
          <div className="mb-6 flex flex-wrap gap-2">
            {params.focoPaso1 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                Paso 1: {params.focoPaso1}
              </span>
            )}
            {params.focoPaso2 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                Paso 2: {params.focoPaso2}
              </span>
            )}
            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
              Min. Chats: {params.minChats}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
              Max. Pasos: {params.maxPasos}
            </span>
          </div>
        )}

        {/* Sankey Chart */}
        <SankeyChart data={data} onDownload={() => {}} />
      </main>
    </div>
  )
}
