import pandas as pd
import plotly.graph_objects as go
from collections import defaultdict

# ─── 1. CARGA DE DATOS ────────────────────────────────────────────────────────
df = pd.read_csv("C:/Users/santiago.zalazar/Downloads/flujo_de_usuarios_x_topics_x_segmento_2026-03-19T20_11_27.404266061Z.csv")

# ─── PARÁMETROS ────────────────────────────────────────────────────────
# None para no filtrar por tools especificas
FOCO_PASO_1 = None           
FOCO_PASO_2 = None
MIN_CHATS = 10
MAX_PASOS = 6

# ─── 2. CONSTRUIR SECUENCIAS POR CHAT ─────────────────────────────────────────
sequences = (
    df.sort_values("posicion_en_el_chat")
    .groupby("chat_id")["tool_topic"]
    .apply(list)
    .reset_index()
)

# ─── 3. APLICAR FILTRO DE FOCO ─────────────────────────────────────────────────
total_antes = len(sequences)

if FOCO_PASO_1 is not None:
    sequences = sequences[sequences["tool_topic"].apply(
        lambda tools: len(tools) >= 1 and tools[0] == FOCO_PASO_1
    )]

if FOCO_PASO_2 is not None:
    sequences = sequences[sequences["tool_topic"].apply(
        lambda tools: len(tools) >= 2 and tools[1] == FOCO_PASO_2
    )]

total_filtrado = len(sequences)
print(f"Chats antes del filtro:   {total_antes:,}")
print(f"Chats después del filtro: {total_filtrado:,}  ({100 * total_filtrado / total_antes:.1f}%)")

# ─── 4. EXTRAER TRANSICIONES CON POSICIÓN ─────────────────────────────────────

transition_counts = defaultdict(int)  

for _, row in sequences.iterrows():
    tools = row["tool_topic"][:MAX_PASOS]
    for i in range(len(tools) - 1):
        source_node = f"{tools[i]}  (paso {i+1})"
        target_node = f"{tools[i+1]}  (paso {i+2})"
        transition_counts[(source_node, target_node)] += 1

# ─── 5. FILTRO DE DENSIDAD ─────────────────────────────────────────────────────

transition_counts = {k: v for k, v in transition_counts.items() if v >= MIN_CHATS}

# ─── 6. ARMAR NODOS Y LINKS ────────────────────────────────────────────────────

all_nodes = list({node for pair in transition_counts for node in pair})
node_index = {node: i for i, node in enumerate(all_nodes)}

sources, targets, values = [], [], []
for (src, tgt), count in transition_counts.items():
    sources.append(node_index[src])
    targets.append(node_index[tgt])
    values.append(count)

# ─── 7. PALETA DE COLORES ──────────────────────────────────────────────────────
COLORS = {
    "get_greetings": "#4C78A8",
    "aftersale-greetings": "#72B7B2",
    "get_city_country_information": "#8CD17D",
    "get_inspiration_information": "#79AEC8",
    "get_inspiration": "#A2C8EC",
    "others": "#AAAAAA",
    "get_general_info": "#BAB0AC",
    "get_location_data": "#72B7B2",
    "others_topic": "#C0C0C0",
    "get_poi_information": "#54A24B",
    "documentation-required": "#F0A500",
    "bank_promos": "#F58518",
    "get_entity": "#B279A2",
    "clarify_destination_intent": "#9ECAE9",
    "offers": "#FFD700",
    "get_weather_information": "#6aaed6",
    "contact_sale_assistant": "#D67195",
    "others_topic_website": "#E8E8E8",
    "flight-build-checkout-link": "#1A4E93",
    "flight-search": "#3A6EA5",
    "search_packages_on_destination": "#F58518",
    "search_hotels_on_destination": "#54A24B",
    "flight-price-trend": "#6aaed6",
    "flight-deals": "#2A5EA5",
    "create_trip": "#E8A838",
}

def get_color(node_label: str, alpha: float = 0.9) -> str:
    base_tool = node_label.split("  (paso")[0]
    c = COLORS.get(base_tool, "#666666")
    r, g, b = int(c[1:3], 16), int(c[3:5], 16), int(c[5:7], 16)
    return f"rgba({r},{g},{b},{alpha})"

node_colors = [get_color(n) for n in all_nodes]
link_colors = [get_color(all_nodes[s], 0.6) for s in sources]

# ─── 8. TÍTULO Y NOMBRE DE ARCHIVO ───────────────────────────────────

focos_activos = [p for p in [FOCO_PASO_1, FOCO_PASO_2] if p is not None]

if focos_activos:
    foco_str = " → ".join(focos_activos)
    titulo = f"Flujo de Topics · Foco: {foco_str}  ·  {total_filtrado:,} chats"
    foco_filename = "_".join(focos_activos).replace("-", "_")
    output_filename = f"sankey_topics_{foco_filename}_segmento.html"
else:
    titulo = f"Flujo de Topics por Conversación  ·  {total_filtrado:,} chats"
    output_filename = "sankey_topics_claudio_segmento.html"

# ─── 9. CONSTRUIR SANKEY ───────────────────────────────────────────────────────

fig = go.Figure(go.Sankey(
    arrangement="freeform",
    node=dict(
        pad=20,
        thickness=20,
        line=dict(color="white", width=0.5),
        label=all_nodes,
        color=node_colors,
        hovertemplate="<b>%{label}</b><br>Flujo total: %{value}<extra></extra>",
    ),
    link=dict(
        source=sources,
        target=targets,
        value=values,
        color=link_colors,
        hovertemplate="<b>%{source.label}</b> → <b>%{target.label}</b><br>"
                      "Chats: %{value}<extra></extra>",
    ),
))

fig.update_layout(
    title=dict(text=titulo, font=dict(size=20)),
    font_size=13,
    height=700,
    paper_bgcolor="#F9F9F9",
)

# ─── 10. EXPORTAR A HTML ───────────────────────────────────────────────────────

fig.write_html(output_filename, include_plotlyjs="cdn")
print(f"✅ Guardado: {output_filename}")