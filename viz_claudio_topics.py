import pandas as pd
import plotly.graph_objects as go
from collections import defaultdict

# ─── 1. CARGA DE DATOS ────────────────────────────────────────────────────────
# Reemplazá esto con tu forma de leer (CSV, SQL, etc.)
df = pd.read_csv("C:/Users/santiago.zalazar/Downloads/flujo_de_usuarios_x_topico_2026-03-16T19_06_07.968414432Z.csv")
# Columnas esperadas: user_id | chat_id | tool | posicion_en_el_chat

# ─── 2. CONSTRUIR SECUENCIAS POR CHAT ─────────────────────────────────────────
# Agrupamos por chat y ordenamos por posición para obtener la secuencia de tools
sequences = (
    df.sort_values("posicion_en_el_chat")
    .groupby("chat_id")["topic"]
    .apply(list)
    .reset_index()
)

# ─── 3. EXTRAER TRANSICIONES CON POSICIÓN ─────────────────────────────────────
# Nodo = "tool @ paso N" para distinguir la misma tool en distintos momentos
# Así evitamos ciclos que rompan el Sankey

transition_counts = defaultdict(int)  # (nodo_origen, nodo_destino) -> cantidad de chats

for _, row in sequences.iterrows():
    topics = row["topic"]
    for i in range(len(topics) - 1):
        source_node = f"{topics[i]}  (paso {i+1})"
        target_node = f"{topics[i+1]}  (paso {i+2})"
        transition_counts[(source_node, target_node)] += 1

# ─── 4. FILTRO OPCIONAL: quedarse con las transiciones más frecuentes ──────────
# Útil si tenés muchas tools y el grafico queda muy denso
MIN_CHATS = 100  # mostrá solo transiciones que ocurren en al menos N chats
transition_counts = {k: v for k, v in transition_counts.items() if v >= MIN_CHATS}

# ─── 5. ARMAR NODOS Y LINKS PARA PLOTLY ───────────────────────────────────────
all_nodes = list({node for pair in transition_counts for node in pair})
node_index = {node: i for i, node in enumerate(all_nodes)}

sources, targets, values = [], [], []
for (src, tgt), count in transition_counts.items():
    sources.append(node_index[src])
    targets.append(node_index[tgt])
    values.append(count)

# ─── 6. PALETA DE COLORES OSCURA Y CONTRASTANTE POR TOOL ──────────────────────
COLORS = {
    "get_greetings": "#1f77b4",                # azul profundo
    "aftersale-greetings": "#17becf",          # cian intenso
    "get_city_country_information": "#2ca02c", # verde intenso
    "get_inspiration_information": "#9467bd",  # violeta oscuro
    "get_inspiration": "#8c564b",              # marrón rojizo
    "others": "#7f7f7f",                       # gris medio
    "get_general_info": "#bcbd22",             # amarillo verdoso oscuro
    "get_location_data": "#1f9965",            # verde azulado oscuro
    "others_topic": "#636363",                 # gris oscuro
    "get_poi_information": "#2ca02c",          # verde intenso
    "documentation-required": "#e377c2",       # magenta oscuro
    "bank_promos": "#ff7f0e",                  # naranja intenso
    "get_entity": "#d62728",                   # rojo intenso
    "clarify_destination_intent": "#7f7f7f",   # gris medio
    "offers": "#bcbd22",                       # amarillo verdoso oscuro
    "get_weather_information": "#1f77b4",      # azul profundo
    "contact_sale_assistant": "#e377c2",       # magenta oscuro
    "others_topic_website": "#444444",         # gris muy oscuro
    "flight-build-checkout-link": "#393b79",   # azul violáceo muy oscuro
    "flight-search": "#3182bd",                # azul medio
    "search_packages_on_destination": "#ff7f0e",  # naranja intenso
    "search_hotels_on_destination": "#2ca02c",    # verde intenso
    "flight-price-trend": "#1f77b4",           # azul profundo
    "flight-deals": "#6b6ecf",                 # violeta azulado
    "create_trip": "#b15928",                  # marrón oscuro
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
        text="Flujo de topicos por Conversación - Agrupado por Chat_id",
        font=dict(size=20, color="#FFFFFF"),
    ),
    font=dict(color="#E0E0E0"),
    font_size=13,
    height=700,
    paper_bgcolor="#111111",
    plot_bgcolor="#111111",
)

# ─── 8. EXPORTAR A HTML ───────────────────────────────────────────────────────
fig.write_html("sankey_topicos_claudio.html", include_plotlyjs="cdn")
print("Guardado: sankey_topicos_claudio.html")