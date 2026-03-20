import { Header } from "@/components/header"
import { ParameterForm } from "@/components/parameter-form"

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-2xl">
          {/* Hero Section */}
          <div className="mb-8 text-center">
            <h1 className="mb-3 text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Sankey Flow Analyzer
            </h1>
            <p className="text-pretty text-muted-foreground">
              Configura los parametros y sube tu archivo CSV para generar un diagrama Sankey interactivo de los flujos de conversacion.
            </p>
          </div>

          {/* Configuration Card */}
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm sm:p-8">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <svg
                  className="h-5 w-5 text-primary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                  />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">Configuracion</h2>
                <p className="text-sm text-muted-foreground">Ajusta los parametros del Sankey</p>
              </div>
            </div>
            
            <ParameterForm />
          </div>

          {/* Info Cards */}
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-md bg-secondary/10">
                <svg
                  className="h-4 w-4 text-secondary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="mb-1 text-sm font-medium text-foreground">Formato CSV</h3>
              <p className="text-xs text-muted-foreground">
                Columnas requeridas: chat_id, tool_topic, posicion_en_el_chat
              </p>
            </div>

            <div className="rounded-lg border border-border bg-card p-4">
              <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-md bg-secondary/10">
                <svg
                  className="h-4 w-4 text-secondary"
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
              <h3 className="mb-1 text-sm font-medium text-foreground">Interactivo</h3>
              <p className="text-xs text-muted-foreground">
                Arrastra nodos, haz hover para ver detalles y descarga el resultado
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
