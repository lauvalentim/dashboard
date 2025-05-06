
// script_circos_interativo.js — com filtros por cluster e engajamento

let rawDataGlobal = null;
let circos = null;

export async function drawCircosDiagram(containerId, jsonPath = 'chord.json') {
  const response = await fetch(jsonPath);
  const rawData = await response.json();
  rawDataGlobal = rawData;

  // Ordenar ideogramas: usuários primeiro
  const users = rawData.ideograms.filter(d => !d.id.includes('_P'));
  const posts = rawData.ideograms.filter(d => d.id.includes('_P'));
  const ideograms = [...users, ...posts];

  circos = new Circos({
    container: containerId,
    width: 950,
    height: 950
  });

  circos.layout(ideograms, {
    innerRadius: 330,
    outerRadius: 370,
    labels: {
      display: d => !d.id.includes('_P'),
      size: 12,
      radialOffset: 18,
      spacing: 5,
      labelSpacingMultiplier: 1.5,
      color: '#f5f5f5' // cor clara para texto
    },
    ticks: {
      display: false
    },
    gap: 0.005
  });

  circos.chords('links', rawData.links, {
    radius: 320,
    color: d => {
      const val = d.value;
      if (val >= 8) return '#e41a1c';
      if (val >= 5) return '#377eb8';
      return '#4daf4a';
    },
    tooltipContent: d =>
      `${d.source.id} publicou:
${d.target.id}
Engajamento: ${d.value}`,
    opacity: 0.7
  });

  circos.render();
}

export function applyFilters(cluster = 'Todos', minValue = 1) {
  if (!rawDataGlobal || !circos) return;

  let filteredLinks = rawDataGlobal.links.filter(link => link.value >= minValue);

  if (cluster !== 'Todos') {
    filteredLinks = filteredLinks.filter(link => link.source.id.startsWith(cluster));
  }

  circos.chords('links', filteredLinks, {
    radius: 320,
    color: d => {
      const val = d.value;
      if (val >= 8) return '#e41a1c';
      if (val >= 5) return '#377eb8';
      return '#4daf4a';
    },
    tooltipContent: d =>
      `${d.source.id} publicou:
${d.target.id}
Engajamento: ${d.value}`,
    opacity: 0.7
  });

  circos.render();
}

// Vincula os filtros ao escopo global do navegador
window.filtrarDados = () => {
  const cluster = document.getElementById('clusterSelect').value;
  const minValue = parseInt(document.getElementById('minEngajamento').value);
  applyFilters(cluster, minValue);
};

// Atualiza o número exibido ao arrastar o slider
document.getElementById('minEngajamento').addEventListener('input', (e) => {
  document.getElementById('engajamentoValue').textContent = e.target.value;
});
