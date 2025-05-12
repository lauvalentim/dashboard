// script_chord.js melhorado com estética refinada

function closePanelChord() {
  d3.select("#panel-chord-data").classed("show", false);
}

function drawChord(data) {
  const width = Math.min(700, window.innerWidth * 0.8);
  const height = width;
  const innerRadius = Math.min(width, height) * 0.32;
  const outerRadius = innerRadius * 1.1;

  const svg = d3.select("#chart")
    .append("svg")
    .attr("viewBox", [-width / 2 - 100, -height / 2, width, height]) // deslocamento para esquerda
    .style("font", "10px sans-serif");

  svg.append("defs").append("filter")
    .attr("id", "glow")
    .html(`
      <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    `);

  const fullNodes = data.ideograms;
  const idIndex = new Map(fullNodes.map((d, i) => [d.id, i]));

  const matrix = Array.from({ length: fullNodes.length }, () => new Array(fullNodes.length).fill(0));
  for (const link of data.links) {
    const source = idIndex.get(link.source.id);
    const target = idIndex.get(link.target.id);
    if (source != null && target != null) {
      matrix[source][target] = link.value;
    }
  }

  const chord = d3.chordDirected().padAngle(0.01).sortSubgroups(d3.descending)(matrix);
  const arc = d3.arc().innerRadius(innerRadius).outerRadius(outerRadius);
  const ribbon = d3.ribbonArrow().radius(innerRadius - 1).padAngle(1 / innerRadius);
  const group = svg.append("g").selectAll("g").data(chord.groups).join("g");

  const clusterArc = d3.arc().innerRadius(outerRadius + 6).outerRadius(outerRadius + 16);
  const clusterColors = d3.scaleOrdinal()
    .domain(["Cluster A", "Cluster B", "Cluster C", "Cluster D", "Cluster E", "Cluster F"])
    .range(["#ff6b6b", "#4ecdc4", "#ffe66d", "#a29bfe", "#ffb86b", "#6c5ce7"]);

  const clusterMap = new Map();
  const postNodes = fullNodes.map((node, i) => ({ ...node, index: i })).filter(n => n.type === "post");
  postNodes.forEach(node => {
    const cluster = node.cluster || "Sem Cluster";
    if (!clusterMap.has(cluster)) clusterMap.set(cluster, []);
    clusterMap.get(cluster).push(node.index);
  });

  clusterMap.forEach((indices, clusterName) => {
    const startAngle = d3.min(indices.map(i => chord.groups[i]?.startAngle));
    const endAngle = d3.max(indices.map(i => chord.groups[i]?.endAngle));

    if (startAngle != null && endAngle != null) {
      svg.append("path")
        .attr("viewBox", [-width / 2, -height / 2, width, height])
        .attr("d", clusterArc({ startAngle, endAngle }))
        .attr("fill", clusterColors(clusterName))
        .attr("stroke", "#000")
        .attr("stroke-width", 0.5)
        .attr("fill-opacity", 0.6)
        .attr("filter", "url(#glow)")
        .style("cursor", "pointer")
        .on("click", () => {
          const posts = postNodes.filter(n => n.cluster === clusterName);
          const html = posts.map(p => {
            const meta = data.meta[p.id];
            return meta ? `
              <div class='post-list-item'>
                <strong>@${meta.username}</strong><br>
                <p>"${meta.full_message}"</p>
                <div class='post-meta'>❤️ ${meta.likes} 💬 ${meta.comments}</div>
                <a class='post-link' href='${meta.url}' target='_blank'>🔗 Ver no Instagram</a><hr>
              </div>` : '';
          }).join('');
          showChordPanelContent(`
            <div class='post-box'>
              <h3>Cluster ${clusterName}</h3>
              <p class='cluster-description'>${data.clusterDescriptions?.[clusterName] || 'Sem descrição disponível para este cluster.'}</p>
              ${html}
            </div>`);
        });

      const midAngle = (startAngle + endAngle) / 2;
      const x = Math.sin(midAngle) * (outerRadius + 25);
      const y = -Math.cos(midAngle) * (outerRadius + 25);

      // Removido: texto dos arcos de cluster
    }
  });

  group.append("path")
    .attr("fill", d => fullNodes[d.index].color)
    .attr("d", arc)
    .style("cursor", "pointer")
    .on("mouseover", function (event, d) {
      const meta = data.meta[fullNodes[d.index].id];
      if (meta) {
        d3.select(this).attr("stroke", "#fff").attr("stroke-width", 2);
        d3.select("#tooltip")
          .style("display", "block")
          .html(`<strong>@${meta.username}</strong><br>${meta.full_message}`)
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 28) + "px");
      }
    })
    .on("mouseout", function () {
      d3.select(this).attr("stroke", null);
      d3.select("#tooltip").style("display", "none");
    })
    .on("click", function (event, d) {
      const node = fullNodes[d.index];
      const meta = data.meta[node.id];
      if (node.type === "post" && meta) {
        const html = `
          <div class='post-box'>
            <strong>@${meta.username}</strong>
            <p>"${meta.full_message}"</p>
            <div class='post-meta'>❤️ ${meta.likes} 💬 ${meta.comments} 🔁 ${meta.engajamento}</div>
            <p><span class='badge'>Cluster ${meta.cluster}</span></p>
            <a class='post-link' href='${meta.url}' target='_blank'>🔗 Ver no Instagram</a>
          </div>`;
        showChordPanelContent(html);
      }
    });

  group.append("text")
    .each(d => d.angle = (d.startAngle + d.endAngle) / 2)
    .filter(d => fullNodes[d.index].type === "user")
    .attr("dy", ".35em")
    .attr("transform", d => {
      const rotate = d.angle * 180 / Math.PI - 90;
      const radius = outerRadius + 14;
      return `rotate(${rotate}) translate(${radius}) ${d.angle > Math.PI ? "rotate(180)" : ""}`;
    })
    .attr("text-anchor", d => d.angle > Math.PI ? "end" : "start")
    .text(d => {
      const label = fullNodes[d.index].label;
      return label.length > 20 ? label.slice(0, 20) + "…" : label;
    })
    .style("font-size", "9px")
    .style("fill", "#ccc");

  svg.append("g")
    .attr("fill-opacity", 0.75)
    .selectAll("path")
    .data(chord)
    .join("path")
    .attr("d", ribbon)
    .attr("fill", d => fullNodes[d.target.index].color)
    .attr("stroke", "#222")
    .attr("stroke-width", 0.3)
    .attr("stroke-opacity", 0.2)
    .attr("fill-opacity", d => Math.min(0.8, d.source.value / 80000))
    .on("mouseover", function () {
      d3.select(this).transition().duration(150).style("fill-opacity", 1).style("stroke-opacity", 0.5);
    })
    .on("mouseout", function () {
      d3.select(this).transition().duration(150).style("fill-opacity", d => Math.min(0.8, d.source.value / 80000)).style("stroke-opacity", 0.2);
    })
    .append("title")
    .text(d => `${fullNodes[d.source.index].id} → ${fullNodes[d.target.index].id}`);

  // Removido: legenda superior "Usuários"

  // Removido: legenda inferior "Postagens"
}

fetch("chord.json")
  .then(response => response.json())
  .then(data => drawChord(data))
  .catch(error => console.error("Erro ao carregar o JSON:", error));

function isSection3Visible() {
  const section3 = document.getElementById('section3');
  const rect = section3.getBoundingClientRect();
  return rect.top < window.innerHeight && rect.bottom >= 0;
}

function showChordPanelContent(htmlContent) {
  if (isSection3Visible()) {
    document.getElementById("info-panel")?.classList.remove("open");
    document.getElementById("explorar-cluster-panel")?.classList.remove("open");
    if (typeof closeAllFloatingPanels === "function") closeAllFloatingPanels();
    d3.select("#panel-chord-content").html(htmlContent);
    d3.select("#panel-chord-data").classed("show", true);
  } else {
    console.warn("🔒 Painel da Section3 bloqueado: section3 não está visível.");
  }
}

window.addEventListener('scroll', () => {
  if (!isSection3Visible()) {
    d3.select("#panel-chord-data").classed("show", false);
  }
});
