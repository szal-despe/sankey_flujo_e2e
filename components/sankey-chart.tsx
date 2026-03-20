"use client"

import { useEffect, useRef, useCallback } from "react"
import Plotly from "plotly.js-dist-min"

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

interface SankeyChartProps {
  data: SankeyData
  onDownload: () => void
}

export function SankeyChart({ data, onDownload }: SankeyChartProps) {
  const chartRef = useRef<HTMLDivElement>(null)

  const renderChart = useCallback(() => {
    if (!chartRef.current || !data.nodes.length) return

    const trace: Plotly.Data = {
      type: "sankey",
      arrangement: "freeform",
      node: {
        pad: 20,
        thickness: 20,
        line: { color: "white", width: 0.5 },
        label: data.nodes.map((n) => n.name),
        color: data.nodes.map((n) => n.color),
        hovertemplate: "<b>%{label}</b><br>Flujo total: %{value}<extra></extra>",
      },
      link: {
        source: data.links.map((l) => l.source),
        target: data.links.map((l) => l.target),
        value: data.links.map((l) => l.value),
        color: data.links.map((l) => l.color),
        hovertemplate:
          "<b>%{source.label}</b> -> <b>%{target.label}</b><br>Chats: %{value}<extra></extra>",
      },
    }

    const layout: Partial<Plotly.Layout> = {
      title: {
        text: data.title,
        font: { size: 18, color: "#1e293b" },
      },
      font: { size: 12, family: "Inter, sans-serif" },
      height: 700,
      paper_bgcolor: "#fafafa",
      margin: { l: 20, r: 20, t: 60, b: 20 },
    }

    const config: Partial<Plotly.Config> = {
      responsive: true,
      displayModeBar: true,
      modeBarButtonsToRemove: ["lasso2d", "select2d"],
      displaylogo: false,
      toImageButtonOptions: {
        format: "png",
        filename: "sankey_flow",
        height: 800,
        width: 1400,
        scale: 2,
      },
    }

    Plotly.newPlot(chartRef.current, [trace], layout, config)
  }, [data])

  useEffect(() => {
    renderChart()

    const handleResize = () => {
      if (chartRef.current) {
        Plotly.Plots.resize(chartRef.current)
      }
    }

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [renderChart])

  const handleDownloadHTML = useCallback(() => {
    if (!chartRef.current) return

    const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${data.title}</title>
  <script src="https://cdn.plot.ly/plotly-2.27.0.min.js"></script>
  <style>body { margin: 0; font-family: Inter, sans-serif; }</style>
</head>
<body>
  <div id="chart" style="width: 100%; height: 100vh;"></div>
  <script>
    const trace = {
      type: "sankey",
      arrangement: "freeform",
      node: {
        pad: 20,
        thickness: 20,
        line: { color: "white", width: 0.5 },
        label: ${JSON.stringify(data.nodes.map((n) => n.name))},
        color: ${JSON.stringify(data.nodes.map((n) => n.color))},
        hovertemplate: "<b>%{label}</b><br>Flujo total: %{value}<extra></extra>",
      },
      link: {
        source: ${JSON.stringify(data.links.map((l) => l.source))},
        target: ${JSON.stringify(data.links.map((l) => l.target))},
        value: ${JSON.stringify(data.links.map((l) => l.value))},
        color: ${JSON.stringify(data.links.map((l) => l.color))},
        hovertemplate: "<b>%{source.label}</b> -> <b>%{target.label}</b><br>Chats: %{value}<extra></extra>",
      },
    };
    const layout = {
      title: { text: "${data.title}", font: { size: 20 } },
      font: { size: 13 },
      height: 700,
      paper_bgcolor: "#F9F9F9",
    };
    Plotly.newPlot("chart", [trace], layout, { responsive: true, displaylogo: false });
  </script>
</body>
</html>`

    const blob = new Blob([htmlContent], { type: "text/html" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "sankey_flow.html"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    onDownload()
  }, [data, onDownload])

  const handleDownloadPNG = useCallback(() => {
    if (!chartRef.current) return

    Plotly.downloadImage(chartRef.current, {
      format: "png",
      filename: "sankey_flow",
      height: 800,
      width: 1400,
      scale: 2,
    })
    onDownload()
  }, [onDownload])

  if (!data.nodes.length) {
    return (
      <div className="flex h-[500px] items-center justify-center rounded-lg border border-border bg-muted/20">
        <p className="text-muted-foreground">No hay datos para visualizar</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Stats Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-border bg-card p-4">
        <div className="flex flex-wrap gap-6">
          <div>
            <p className="text-xs text-muted-foreground">Chats Totales</p>
            <p className="text-lg font-semibold text-foreground">
              {data.stats.totalAntes.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Chats Filtrados</p>
            <p className="text-lg font-semibold text-primary">
              {data.stats.totalFiltrado.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Porcentaje</p>
            <p className="text-lg font-semibold text-foreground">{data.stats.porcentaje}%</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Nodos</p>
            <p className="text-lg font-semibold text-foreground">{data.nodes.length}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Enlaces</p>
            <p className="text-lg font-semibold text-foreground">{data.links.length}</p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleDownloadPNG}
            className="flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            PNG
          </button>
          <button
            onClick={handleDownloadHTML}
            className="flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            HTML
          </button>
        </div>
      </div>

      {/* Chart Container */}
      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <div ref={chartRef} className="w-full" />
      </div>

      {/* Instructions */}
      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"
            />
          </svg>
          Arrastra los nodos para reorganizar
        </span>
        <span className="flex items-center gap-1">
          <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
            />
          </svg>
          Usa la rueda del mouse para zoom
        </span>
        <span className="flex items-center gap-1">
          <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          Hover sobre nodos y enlaces para ver detalles
        </span>
      </div>
    </div>
  )
}
