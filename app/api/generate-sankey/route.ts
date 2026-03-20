import { NextRequest, NextResponse } from "next/server"

interface SankeyParams {
  focoPaso1: string | null
  focoPaso2: string | null
  minChats: number
  maxPasos: number
}

interface CsvRow {
  chat_id: string
  tool_topic: string
  posicion_en_el_chat: number
}

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

// Color palette for tools (from the original Python script)
const COLORS: Record<string, string> = {
  get_greetings: "#7C3AED",
  "aftersale-greetings": "#72B7B2",
  get_city_country_information: "#8CD17D",
  get_inspiration_information: "#79AEC8",
  get_inspiration: "#A2C8EC",
  others: "#AAAAAA",
  get_general_info: "#BAB0AC",
  get_location_data: "#72B7B2",
  others_topic: "#C0C0C0",
  get_poi_information: "#54A24B",
  "documentation-required": "#F97316",
  bank_promos: "#F58518",
  get_entity: "#B279A2",
  clarify_destination_intent: "#9ECAE9",
  offers: "#FFD700",
  get_weather_information: "#6aaed6",
  contact_sale_assistant: "#D67195",
  others_topic_website: "#E8E8E8",
  "flight-build-checkout-link": "#1A4E93",
  "flight-search": "#3A6EA5",
  search_packages_on_destination: "#F58518",
  search_hotels_on_destination: "#54A24B",
  "flight-price-trend": "#6aaed6",
  "flight-deals": "#2A5EA5",
  create_trip: "#E8A838",
}

function getColor(nodeLabel: string, alpha: number = 0.9): string {
  const baseTool = nodeLabel.split("  (paso")[0]
  const hex = COLORS[baseTool] || "#666666"
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

function parseCSV(csvString: string): CsvRow[] {
  const lines = csvString.trim().split("\n")
  const headers = lines[0].split(",").map((h) => h.trim().replace(/"/g, ""))
  
  const chatIdIdx = headers.findIndex((h) => h === "chat_id")
  const toolTopicIdx = headers.findIndex((h) => h === "tool_topic")
  const posicionIdx = headers.findIndex((h) => h === "posicion_en_el_chat")
  
  if (chatIdIdx === -1 || toolTopicIdx === -1 || posicionIdx === -1) {
    throw new Error("CSV debe contener columnas: chat_id, tool_topic, posicion_en_el_chat")
  }

  const rows: CsvRow[] = []
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(",").map((v) => v.trim().replace(/"/g, ""))
    if (values.length >= Math.max(chatIdIdx, toolTopicIdx, posicionIdx) + 1) {
      rows.push({
        chat_id: values[chatIdIdx],
        tool_topic: values[toolTopicIdx],
        posicion_en_el_chat: parseInt(values[posicionIdx]) || 0,
      })
    }
  }
  
  return rows
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { csvData, params } = body as { csvData: string; params: SankeyParams }

    // Parse CSV
    const rows = parseCSV(csvData)

    // Group by chat_id and sort by position
    const chatGroups = new Map<string, string[]>()
    
    // Sort rows by position first
    rows.sort((a, b) => a.posicion_en_el_chat - b.posicion_en_el_chat)
    
    for (const row of rows) {
      if (!chatGroups.has(row.chat_id)) {
        chatGroups.set(row.chat_id, [])
      }
      chatGroups.get(row.chat_id)!.push(row.tool_topic)
    }

    // Convert to sequences
    let sequences = Array.from(chatGroups.entries()).map(([chatId, tools]) => ({
      chat_id: chatId,
      tool_topic: tools,
    }))

    const totalAntes = sequences.length

    // Apply FOCO_PASO_1 filter
    if (params.focoPaso1) {
      sequences = sequences.filter(
        (seq) => seq.tool_topic.length >= 1 && seq.tool_topic[0] === params.focoPaso1
      )
    }

    // Apply FOCO_PASO_2 filter
    if (params.focoPaso2) {
      sequences = sequences.filter(
        (seq) => seq.tool_topic.length >= 2 && seq.tool_topic[1] === params.focoPaso2
      )
    }

    const totalFiltrado = sequences.length

    // Extract transitions with position
    const transitionCounts = new Map<string, number>()

    for (const seq of sequences) {
      const tools = seq.tool_topic.slice(0, params.maxPasos)
      for (let i = 0; i < tools.length - 1; i++) {
        const sourceNode = `${tools[i]}  (paso ${i + 1})`
        const targetNode = `${tools[i + 1]}  (paso ${i + 2})`
        const key = `${sourceNode}|||${targetNode}`
        transitionCounts.set(key, (transitionCounts.get(key) || 0) + 1)
      }
    }

    // Filter by MIN_CHATS
    const filteredTransitions = Array.from(transitionCounts.entries()).filter(
      ([, count]) => count >= params.minChats
    )

    // Build nodes and links
    const allNodesSet = new Set<string>()
    for (const [key] of filteredTransitions) {
      const [source, target] = key.split("|||")
      allNodesSet.add(source)
      allNodesSet.add(target)
    }
    const allNodes = Array.from(allNodesSet)
    const nodeIndex = new Map(allNodes.map((node, i) => [node, i]))

    const nodes: SankeyNode[] = allNodes.map((name) => ({
      name,
      color: getColor(name),
    }))

    const links: SankeyLink[] = filteredTransitions.map(([key, value]) => {
      const [source, target] = key.split("|||")
      return {
        source: nodeIndex.get(source)!,
        target: nodeIndex.get(target)!,
        value,
        color: getColor(source, 0.6),
      }
    })

    // Generate title
    const focosActivos = [params.focoPaso1, params.focoPaso2].filter(Boolean)
    let titulo: string
    if (focosActivos.length > 0) {
      const focoStr = focosActivos.join(" -> ")
      titulo = `Flujo de Topics - Foco: ${focoStr} - ${totalFiltrado.toLocaleString()} chats`
    } else {
      titulo = `Flujo de Topics por Conversacion - ${totalFiltrado.toLocaleString()} chats`
    }

    return NextResponse.json({
      nodes,
      links,
      title: titulo,
      stats: {
        totalAntes,
        totalFiltrado,
        porcentaje: totalAntes > 0 ? ((totalFiltrado / totalAntes) * 100).toFixed(1) : "0",
      },
    })
  } catch (error) {
    console.error("Error generating Sankey:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error al procesar los datos" },
      { status: 400 }
    )
  }
}
