
import pandas as pd
import math
import json

# 1. Carregar o CSV original
csv_path = "data.csv"  # <-- Altere se necessário
df = pd.read_csv(csv_path)

# 2. Remover linhas sem cluster definido
df = df.dropna(subset=["clusters"])

# 3. Garantir que likes e comments sejam numéricos
df["likes"] = pd.to_numeric(df["likes"], errors="coerce").fillna(0).astype(int)
df["comments"] = pd.to_numeric(df["comments"], errors="coerce").fillna(0).astype(int)
df["engajamento"] = df["likes"] + df["comments"]

# 4. Mapeamento de nomes simplificados
simplified_names = {
    "Ajuda durante a enchente, ou desvio de ajuda": "Ajuda",
    "Racismo ambiental e Enchente do Rio Grande do Sul": "Racismo + Enchentes",
    "Enchente - Rio Grande do Sul": "Enchente RS",
    "Imprensa e redes sociais": "Imprensa e Redes",
    "Rio de Janeiro": "RJ",
    "Racismo ambiental": "Racismo Ambiental"
}

# 5. Agrupar posts por cluster e selecionar top engajados proporcionalmente
fracao_por_cluster = 0.15   # 15%
piso_minimo_cluster = 2     # no mínimo 2 nós por cluster

selected_rows = []
clusters_info = []

for cluster, group in df.groupby("clusters"):
    simplified_cluster = simplified_names.get(cluster, cluster)
    total_posts = len(group)
    n_select = max(piso_minimo_cluster, math.ceil(total_posts * fracao_por_cluster))

    top_posts = group.sort_values(by="engajamento", ascending=False).head(n_select).copy()
    top_posts["simplified_cluster"] = simplified_cluster
    selected_rows.append(top_posts)

    clusters_info.append({
        "id": simplified_cluster,
        "parent": "Narrativas"
    })

# 6. Concatenar os dados filtrados
filtered_df = pd.concat(selected_rows).copy()

# 7. Criar nós dos usuários e posts
user_nodes = []
post_nodes = []
added_users = set()

for _, row in filtered_df.iterrows():
    user_id = row["username"]
    cluster_id = row["simplified_cluster"]
    
    if user_id not in added_users:
        user_nodes.append({
            "id": user_id,
            "parent": cluster_id
        })
        added_users.add(user_id)

    post_nodes.append({
        "id": f"{user_id}_post_{row.name}",
        "parent": user_id,
        "likes": row["likes"],
        "comments": row["comments"],
        "engajamento": row["engajamento"],
        "message": row["message"],
        "url": row["url"]
    })

# 8. Adicionar nó raiz "Narrativas"
root_node = {
    "id": "Narrativas",
    "parent": ""
}

# 9. Montar a estrutura final
final_nodes = [root_node] + clusters_info + user_nodes + post_nodes

final_json = {
    "data": [
        {
            "type": "tree",
            "values": final_nodes
        }
    ]
}

# 10. Salvar o novo JSON
output_path = "radial_reformulado.json"
with open(output_path, "w", encoding="utf-8") as f:
    json.dump(final_json, f, ensure_ascii=False, indent=2)

print("Arquivo radial_reformulado.json criado com sucesso!")
