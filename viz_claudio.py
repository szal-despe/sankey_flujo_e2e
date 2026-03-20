import pandas as pd
import plotly.graph_objects as go
from collections import defaultdict

# ─── 1. CARGA DE DATOS ────────────────────────────────────────────────────────
# Reemplazá esto con tu forma de leer (CSV, SQL, etc.)
df = pd.read_csv("C:/Users/santiago.zalazar/Downloads/query_result_2026-03-18T20_05_18.841158315Z.csv")
# Columnas esperadas: user_id | chat_id | tool | posicion_en_el_chat

# ─── 2. CONSTRUIR SECUENCIAS POR CHAT ─────────────────────────────────────────
# Agrupamos por chat y ordenamos por posición para obtener la secuencia de tools
sequences = (
    df.sort_values("posicion_en_el_chat")
    .groupby("chat_id")["tool_topic"]
    .apply(list)
    .reset_index()
)

# ─── 3. EXTRAER TRANSICIONES CON POSICIÓN ─────────────────────────────────────
# Nodo = "tool @ paso N" para distinguir la misma tool en distintos momentos
# Así evitamos ciclos que rompan el Sankey

transition_counts = defaultdict(int)  # (nodo_origen, nodo_destino) -> cantidad de chats

for _, row in sequences.iterrows():
    tools = row["tool_topic"]
    for i in range(len(tools) - 1):
        source_node = f"{tools[i]}  (paso {i+1})"
        target_node = f"{tools[i+1]}  (paso {i+2})"
        transition_counts[(source_node, target_node)] += 1

# ─── 4. FILTRO OPCIONAL: quedarse con las transiciones más frecuentes ──────────
# Útil si tenés muchas tools y el grafico queda muy denso
MIN_CHATS = 1000  # mostrá solo transiciones que ocurren en al menos N chats
transition_counts = {k: v for k, v in transition_counts.items() if v >= MIN_CHATS}

# ─── 5. ARMAR NODOS Y LINKS PARA PLOTLY ───────────────────────────────────────
all_nodes = list({node for pair in transition_counts for node in pair})
node_index = {node: i for i, node in enumerate(all_nodes)}

sources, targets, values = [], [], []
for (src, tgt), count in transition_counts.items():
    sources.append(node_index[src])
    targets.append(node_index[tgt])
    values.append(count)

# ─── 6. PALETA DE COLORES OSCURA POR TOOL ─────────────────────────────────────
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

# ─── 7. CONSTRUIR FIGURA ───────────────────────────────────────────────────────
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
    title=dict(
        text="Flujo de Tools por Conversación - Agrupado por Chat_id",
        font=dict(size=20),
    ),
    font_size=13,
    height=700,
    paper_bgcolor="#F9F9F9",
)

# ─── 8. EXPORTAR A HTML ───────────────────────────────────────────────────────
fig.write_html("sankey_tools_claudio.html", include_plotlyjs="cdn")
print("Guardado: sankey_tools_claudio.html")