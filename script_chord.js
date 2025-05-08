
function closePanelChord() {
  d3.select("#panel-chord-data").classed("show", false);
}

function drawChord(data) {
  const width = 900;
  const height = 900;
  const innerRadius = Math.min(width, height) * 0.32;
  const outerRadius = innerRadius * 1.1;

  const svg = d3.select("#chart")
    .append("svg")
    .attr("viewBox", [-width / 2, -height / 2, width, height])
    .style("font", "10px sans-serif");

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

  const group = svg.append("g")
    .selectAll("g")
    .data(chord.groups)
    .join("g");

  group.append("path")
    .attr("fill", d => fullNodes[d.index].color)
    .attr("d", arc)
    .on("mouseover", function(event, d) {
      const meta = data.meta[fullNodes[d.index].id];
      if (meta) {
        d3.select(this)
          .attr("stroke", "#fff")
          .attr("stroke-width", 2);

        d3.select("#tooltip")
          .style("display", "block")
          .html(`<strong>@${meta.username}</strong><br>${meta.full_message}`)
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 28) + "px");
      }
    })
    .on("mouseout", function() {
      d3.select(this).attr("stroke", null);
      d3.select("#tooltip").style("display", "none");
    });

  svg.append("g")
    .attr("fill-opacity", 0.75)
    .selectAll("path")
    .data(chord)
    .join("path")
    .attr("d", ribbon)
    .attr("fill", d => fullNodes[d.target.index].color)
    .append("title")
    .text(d => `${fullNodes[d.source.index].id} → ${fullNodes[d.target.index].id}`);

  group.on("click", (event, d) => {
    const node = fullNodes[d.index];
    const meta = data.meta[node.id];
    if (!meta) return;

    let panelHtml = "";

    if (node.type === "post") {
      panelHtml = `
        <div class="post-box">
          <strong>@${meta.username}</strong>
          <p>"${meta.full_message}"</p>
          <div class="post-meta">
            ❤️ ${meta.likes} 💬 ${meta.comments} 🔁 ${meta.engajamento}
          </div>
          <p><span class="badge">Cluster ${meta.cluster}</span></p>
          <a class="post-link" href="${meta.url}" target="_blank">🔗 Ver no Instagram</a>
        </div>
      `;    
    } else if (node.type === "user") {
      panelHtml = `
        <div class="post-box">
          <strong>Usuário:</strong> @${node.label}<br>
          <p class="post-meta">Cluster: ${node.cluster || 'n/d'}<br>
          Tipo: Usuário</p>
        </div>
      `;
    }    

    showChordPanelContent(panelHtml);
  });

  svg.append("text")
    .attr("x", 0)
    .attr("y", -outerRadius - 40)
    .attr("text-anchor", "middle")
    .attr("fill", "#ccc")
    .style("font-size", "14px")
    .text("Usuários");

  svg.append("text")
    .attr("x", 0)
    .attr("y", outerRadius + 50)
    .attr("text-anchor", "middle")
    .attr("fill", "#ccc")
    .style("font-size", "14px")
    .text("Postagens");
}

fetch("chord.json")
  .then(response => response.json())
  .then(data => drawChord(data))
  .catch(error => console.error("Erro ao carregar o JSON:", error));

// Controle de visibilidade
function isSection3Visible() {
  const section3 = document.getElementById('section3');
  const rect = section3.getBoundingClientRect();
  return rect.top < window.innerHeight && rect.bottom >= 0;
}

function showChordPanelContent(htmlContent) {
  if (isSection3Visible()) {
    // fecha painéis concorrentes
    document.getElementById("info-panel")?.classList.remove("open");
    document.getElementById("explorar-cluster-panel")?.classList.remove("open");

    if (typeof closeAllFloatingPanels === "function") {
      closeAllFloatingPanels();
    }
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
