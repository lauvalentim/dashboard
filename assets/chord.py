import pandas as pd
import numpy as np
import json
import os
import seaborn as sns
from matplotlib.colors import rgb2hex

# Mostrar arquivos CSV disponíveis
all_files = os.listdir()
csv_files = [f for f in all_files if f.endswith('.csv')]
print("Arquivos CSV disponíveis:")
for i, file in enumerate(csv_files):
    print(f"{i + 1}. {file}")

choice = int(input("Digite o número do arquivo CSV que deseja usar: ")) - 1
csv_filename = csv_files[choice]

# Carregar o CSV
df = pd.read_csv(csv_filename)

# Verificar colunas necessárias
required_columns = ['username', 'message', 'url', 'engajamento', 'clusters', 'likes', 'comments', 'name']
df = df.dropna(subset=required_columns).copy()

# Critério de ordenação
print("\nEscolha o critério para selecionar os 50 principais posts:")
print("1. Engajamento (padrão)")
print("2. Likes")
print("3. Comentários")
sort_choice = input("Digite o número do critério desejado (pressione Enter para engajamento): ")

if sort_choice == "2":
    sort_column = "likes"
elif sort_choice == "3":
    sort_column = "comments"
else:
    sort_column = "engajamento"

# Selecionar os 50 posts com base no critério
top_df = df.sort_values(by=sort_column, ascending=False).head(50).reset_index(drop=True)
top_df['post_id'] = top_df['name']

# Paleta de cores por cluster
unique_clusters = top_df['clusters'].unique()
palette = sns.color_palette("husl", len(unique_clusters))
cluster_colors = {cluster: rgb2hex(color) for cluster, color in zip(unique_clusters, palette)}

# Função para cortar label
def short_text(text, word_count=4):
    return " ".join(text.split()[:word_count]) + ("..." if len(text.split()) > word_count else "")

# Criar nós
ideograms = []
user_nodes = top_df['username'].unique()

for user in user_nodes:
    user_posts = top_df[top_df['username'] == user]
    post_count = user_posts.shape[0]
    total_engajamento = user_posts['engajamento'].sum()
    engajamento_medio = total_engajamento / post_count if post_count else 0
    peso_len = int((engajamento_medio * post_count) * 1.5)
    
    ideograms.append({
        "id": user,
        "label": user,
        "len": peso_len,
        "color": "#fc8d62",
        "type": "user"
    })

for _, row in top_df.iterrows():
    ideograms.append({
        "id": row['post_id'],
        "label": short_text(row['message']),
        "len": int(row['engajamento']),
        "color": cluster_colors.get(row['clusters'], "#999999"),
        "cluster": row['clusters'],
        "likes": int(row['likes']),
        "comments": int(row['comments']),
        "type": "post"
    })

# Criar links no formato completo
links = []
for _, row in top_df.iterrows():
    links.append({
        "source": {"id": row['username'], "start": 0, "end": 1},
        "target": {"id": row['post_id'], "start": 0, "end": 1},
        "value": int(row['engajamento'])
    })

# Criar metadados
meta = {}
for _, row in top_df.iterrows():
    meta[row['post_id']] = {
        "full_message": row['message'],
        "url": row['url'],
        "username": row['username'],
        "cluster": row['clusters'],
        "engajamento": int(row['engajamento']),
        "likes": int(row['likes']),
        "comments": int(row['comments'])
    }

# Salvar JSON
output_json = {
    "ideograms": ideograms,
    "links": links,
    "meta": meta
}

output_path = "chord.json"
with open(output_path, "w", encoding="utf-8") as f:
    json.dump(output_json, f, ensure_ascii=False, indent=2)

print(f"\n✅ Arquivo JSON salvo como: {output_path}")
