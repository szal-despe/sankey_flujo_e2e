import argparse
import pandas as pd
import plotly.graph_objects as go
from collections import defaultdict

# ─── 1. CARGA DE DATOS ────────────────────────────────────────────────────────
df = pd.read_csv("C:/Users/santiago.zalazar/Downloads/query_result_2026-03-20T15_11_48.357618003Z.csv")

SEGMENTS = df["segmento"].dropna().unique().tolist()
MIN_CHATS = 1000

# ─── 1.5 PARÁMETROS (FILTRO POR SEGMENTO) ──────────────────────────────────────
#python .\viz_claudio_topics_por_segmento.py --segmentos "Segment A,Segment B,Segment C"
parser = argparse.ArgumentParser(
    description="Genera Sankey de tópicos por conversación filtrando por segmento."
)
parser.add_argument(
    "--segmentos",
    type=str,
    default="",
    help='Lista separada por comas con nombres EXACTOS de "segmento". Ej: "Segment A,Segment B". Si no se indica, genera para todos.',
)
args = parser.parse_args()

if args.segmentos.strip():
    wanted_segments = [s.strip() for s in args.segmentos.split(",") if s.strip()]
    missing = [s for s in wanted_segments if s not in SEGMENTS]
    if missing:
        print(f"[AVISO] segment(s) no encontrado(s) en el CSV: {missing}")
    SEGMENTS_FILTERED = [s for s in wanted_segments if s in SEGMENTS]
else:
    SEGMENTS_FILTERED = SEGMENTS

if not SEGMENTS_FILTERED:
    raise SystemExit(
        "[ERROR] No quedaron segmentos para generar. Verificá los nombres pasados en --segmentos."
    )

# ─── 2. PALETA DE COLORES ─────────────────────────────────────────────────────
COLORS = {
    "get_greetings": "#1f77b4",
    "aftersale-greetings": "#17becf",
    "get_city_country_information": "#2ca02c",
    "get_city_country_information_points_of_interest": "#2ca02c",
    "get_inspiration_information": "#9467bd",
    "get_inspiration": "#8c564b",
    "others": "#7f7f7f",
    "get_general_info": "#bcbd22",
    "get_location_data": "#1f9965",
    "others_topic": "#636363",
    "get_poi_information": "#2ca02c",
    "get_poi_information_photos": "#3aab3a",
    "documentation-required": "#e377c2",
    "bank_promos": "#ff7f0e",
    "get_entity": "#d62728",
    "clarify_destination_intent": "#7f7f7f",
    "offers": "#bcbd22",
    "get_weather_information": "#1f77b4",
    "contact_sale_assistant": "#e377c2",
    "others_topic_website": "#444444",
    "flight-build-checkout-link": "#393b79",
    "flight-search": "#3182bd",
    "search_packages_on_destination": "#ff7f0e",
    "search_hotels_on_destination": "#2ca02c",
    "flight-price-trend": "#1f77b4",
    "flight-deals": "#6b6ecf",
    "create_trip": "#b15928",
}

def get_color(node_label: str, alpha: float = 0.9) -> str:
    base_tool = node_label.split("  (paso")[0]
    c = COLORS.get(base_tool, "#666666")
    r, g, b = int(c[1:3], 16), int(c[3:5], 16), int(c[5:7], 16)
    return f"rgba({r},{g},{b},{alpha})"

# ─── 3. FUNCIÓN PARA CONSTRUIR UN SANKEY POR SEGMENTO ─────────────────────────
def build_sankey(df_seg: pd.DataFrame, segment_name: str, min_chats: int = 5) -> go.Figure:

    sequences = (
        df_seg.sort_values("posicion_en_el_chat")
        .groupby("chat_id")["tool_topic"]
        .apply(list)
        .reset_index()
    )

    transition_counts = defaultdict(int)
    for _, row in sequences.iterrows():
        topics = row["tool_topic"]
        for i in range(len(topics) - 1):
            source_node = f"{topics[i]}  (paso {i+1})"
            target_node = f"{topics[i+1]}  (paso {i+2})"
            transition_counts[(source_node, target_node)] += 1

    transition_counts = {k: v for k, v in transition_counts.items() if v >= min_chats}

    if not transition_counts:
        print(f"[AVISO] Segmento '{segment_name}' no tiene transiciones con min_chats={min_chats}")
        return None

    all_nodes = list({node for pair in transition_counts for node in pair})
    node_index = {node: i for i, node in enumerate(all_nodes)}

    sources, targets, values = [], [], []
    for (src, tgt), count in transition_counts.items():
        sources.append(node_index[src])
        targets.append(node_index[tgt])
        values.append(count)

    node_colors = [get_color(n, 0.9) for n in all_nodes]
    link_colors = [get_color(all_nodes[s], 0.6) for s in sources]

    n_chats = df_seg["chat_id"].nunique()

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
            text=f"Flujo de Tópicos por Conversación — Segmento: <b>{segment_name}</b>  ({n_chats:,} chats)",
            font=dict(size=20, color="#FFFFFF"),
        ),
        font=dict(color="#E0E0E0"),
        font_size=13,
        height=750,
        paper_bgcolor="#111111",
        plot_bgcolor="#111111",
    )

    return fig

# ─── 4. GENERAR UN HTML POR SEGMENTO ──────────────────────────────────────────

for seg in SEGMENTS_FILTERED:
    df_seg = df[df["segmento"] == seg].copy()
    fig = build_sankey(df_seg, seg, MIN_CHATS)
    if fig is not None:
        filename = f"sankey_{seg.lower().replace(' ', '_')}.html"
        fig.write_html(filename, include_plotlyjs="cdn")
        print(f"Guardado: {filename}  ({df_seg['chat_id'].nunique():,} chats | {len(df_seg):,} filas)")
