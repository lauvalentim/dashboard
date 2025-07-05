function drawGraph() {

  // === Botão Explorar Cluster ===
document.addEventListener("DOMContentLoaded", () => {
  const exploreBtn = document.querySelector('[data-action="explore"]');
  const panel = document.getElementById("explorar-cluster-panel");
  const closeBtn = document.getElementById("close-explorar");

  if (exploreBtn && panel) {
    exploreBtn.addEventListener("click", () => {
      panel.classList.add("open");
    });
  }

  if (closeBtn && panel) {
    closeBtn.addEventListener("click", () => {
      panel.classList.remove("open");
    });
  }
});


  if (window.initInterface) {
    window.initInterface();
  }

  // Define os rótulos legíveis ANTES de usá-los
  const clusterLabels = {
    "Racismo ambiental e Enchente do Rio Grande do Sul": "Racismo Ambiental + Enchentes",
    "Enchente - Rio Grande do Sul": "Enchente - RS",
    "Ajuda durante a enchente, ou desvio de ajuda": "Ajuda"
  };


  // Define dimensões do SVG
  const width = window.innerWidth;
  const height = window.innerHeight;
  const radius = Math.min(width, height) / 2;

  let root;

  const svg = d3.select("#grafo-container")
    .append("svg")
    .attr("width", "100%")
    .attr("height", "100%")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("preserveAspectRatio", "xMidYMid meet");

  const graphGroup = svg.append("g")
    .attr("transform", `translate(${width / 2}, ${height / 2})`);

  // Escala de cores para níveis
  const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

  // Função para identificar os clusters do segundo nível abaixo de "Narrativas"
  function getClusterNames(root) {
    let clusters = new Set();
    root.children.forEach(child => {
      if (child.parent && child.parent.data.id === "Narrativas") {
        clusters.add(child.data.id); // Adiciona apenas o segundo nível
      }
    });
    return [...clusters];
  }

  window.root = root;

  // Carrega o JSON e gera o Radial Tree
  d3.json("radial.json").then(data => {
    if (!data || !data.data || !data.data[0] || !data.data[0].values) {
      console.error("JSON inválido ou vazio.");
      return;
    }

    const values = data.data[0].values;
    root = d3.stratify()
      .id(d => d.id)
      .parentId(d => d.parent)
      (values);

    window.root = root;
    const tree = d3.tree().size([2* Math.PI, 250]);
    tree(root);

    if (window.setRootNode) {
      window.setRootNode(root);
    }


    // === Preenche o select de clusters dinamicamente ===
    const clusterSelect = document.getElementById("cluster-select");
    if (clusterSelect) {
      clusterSelect.innerHTML = '<option value="">Selecione um cluster...</option>';

      const clusters = getClusterNames(root);
      clusters.forEach(clusterId => {
        const option = document.createElement("option");
        option.value = clusterId;
        option.textContent = clusterLabels[clusterId] || clusterId;
        clusterSelect.appendChild(option);
      });
    }

    // (Opcional) Mapeia cores com base nos clusters
    const clusters = getClusterNames(root);
    const color = d3.scaleOrdinal(d3.schemeCategory10).domain(clusters);

    console.log("Descendants:", root.descendants());
    console.log("Links gerados:", root.links());

    // Desenha os links
    graphGroup.append("g")
      .selectAll("path")
      .data(root.links())
      .enter().append("path")
      .attr("fill", "none")
      .attr("stroke", "#C0C0C0")
      .attr("stroke-width", 1)
      .attr("stroke-opacity", 0.9)
      .attr("d", d3.linkRadial()
        .angle(d => d.x)
        .radius(d => d.y))
      .transition()
      .duration(1000)
      .style("stroke-opacity", 1);

    // Desenha os e colorindo os nós
    const node = graphGroup.append("g")
      .selectAll("g")
      .data(root.descendants())
      .enter().append("g")
      .attr("transform", d => `rotate(${d.x * 180 / Math.PI - 90}) translate(${d.y},0)`);

    const parentColors = {
      "Narrativas": "#ccc",
      "Racismo": " #EB0101",
      "Racismo + Enchentes": " #148718",
      "Enchente RS":" #8800C3",
      "Imprensa": " #006EFF",
      "RJ": " #F95B00",
      "Ajuda": " #FFBC00",
    };

    function adjustColor(color, depth) {
      const c = d3.color(color);
      return c ? c.brighter(depth * 0.4).formatRgb() : "#ccc";
    }

    node.append("circle")
      .attr("r", d => d.children ? 4 : 3.4) // Diferencia tamanho de pais e filhos
      .attr("fill", d => {
        if (d.data.id === "Narrativas") return parentColors["Narrativas"] || "#ccc";

        const cluster = d.ancestors().find(a => a.parent && a.parent.data.id === "Narrativas");
        const baseColor = cluster ? parentColors[cluster.data.id] : "#999";

        return (d.parent && d.parent.data.id === "Narrativas")
          ? baseColor
          : adjustColor(baseColor, d.depth);
      });


    node.append("text")
      .attr("dy", "0.31em")
      .attr("x", d => d.x < Math.PI ? 6 : -6)
      .attr("text-anchor", d => d.x < Math.PI ? "start" : "end")
      .attr("transform", d => `rotate(${d.x >= Math.PI ? 180 : 0})`)
      .text(d => {
        const fullText = clusterLabels[d.data.id] || d.data.id;

        // Se for um nó de nível 3 (posts), corta para as primeiras 4 palavras
        if (d.depth === 3) {
          const words = fullText.split(" ");
          return words.slice(0, 4).join(" ") + (words.length > 4 ? "..." : "");
        }

        return fullText;
      })
      .style("font-size", "9px")

    // Adiciona Tooltip
    const tooltip = d3.select("body")
      .append("div")
      .style("position", "absolute")
      .style("background", "rgba(0, 0, 0, 0.7)")
      .style("color", "white")
      .style("padding", "5px 10px")
      .style("border-radius", "5px")
      .style("font-size", "12px")
      .style("visibility", "hidden");

    // Evento de clique para destacar um grupo de nós
    node.on("click", function (event, d) {
      event.stopPropagation();

      // Se for um nó de nível 3 (post), exibe o popup
      if (d.depth === 3) {
        document.getElementById("popup-author").textContent = `@${d.parent?.data?.id || "Desconhecido"}`;
        document.getElementById("popup-message").textContent = d.data.message || "Sem mensagem";
        document.getElementById("popup-meta").innerHTML = `
            ❤️ ${d.data.likes || 0} 💬 ${d.data.comments || 0} 🔁 ${d.data.engajamento || 0}
          `;
        const link = document.getElementById("popup-link");
        if (d.data.url) {
          link.href = d.data.url;
          link.style.display = "inline-block";
        } else {
          link.style.display = "none";
        }

        document.getElementById("post-popup").classList.remove("hidden");
        return;
      }

      // Comportamento normal para outros nós (destaque de grupo)
      const relatedNodes = new Set(d.ancestors().concat(d.descendants()));
      node.attr("opacity", n => relatedNodes.has(n) ? 1 : 0.2);
      svg.selectAll("path")
        .attr("stroke-opacity", link =>
          (relatedNodes.has(link.source) && relatedNodes.has(link.target)) ? 1 : 0.2);
    });

    document.getElementById("popup-close").addEventListener("click", () => {
      document.getElementById("post-popup").classList.add("hidden");
    });

    // Adiciona zoom  
    const zoom = d3.zoom() // ← os parênteses estavam faltando aqui
      .scaleExtent([0.5, 5])
      .on("zoom", (event) => {
        graphGroup.attr("transform", event.transform);
      });

    let currentTransform = d3.zoomIdentity.translate(width / 2, height / 2).scale(1);
    svg.call(zoom).call(zoom.transform, currentTransform);

    const zoomInBtn = document.getElementById("zoom-in");
    if (zoomInBtn) {
      zoomInBtn.addEventListener("click", () => {
        currentTransform = currentTransform.scale(1.2);
        svg.transition().duration(300).call(zoom.transform, currentTransform);
      });
    }

    const zoomOutBtn = document.getElementById("zoom-out");
    if (zoomOutBtn) {
      zoomOutBtn.addEventListener("click", () => {
        currentTransform = currentTransform.scale(0.8);
        svg.transition().duration(300).call(zoom.transform, currentTransform);
      });
    }

    const zoomResetBtn = document.getElementById("zoom-reset");
    if (zoomResetBtn) {
      zoomResetBtn.addEventListener("click", () => {
        currentTransform = d3.zoomIdentity.translate(width / 2, height / 2).scale(1);
        svg.transition().duration(300).call(zoom.transform, currentTransform);
      });
    }

    // Evento para restaurar tudo ao estado original ao clicar fora do grafo
    d3.select("body").on("click", function () {
      svg.selectAll("circle").attr("opacity", 1);
      svg.selectAll("path").attr("stroke-opacity", 0.6);
    });

    // Evento de hover para exibir tooltip, sem mudar opacidade
    node.on("mouseover", function (event, d) {
      tooltip.html(`Nó: <strong>${d.data.id}</strong><br>Nível: ${d.depth}`)
        .style("visibility", "visible");
    })
      .on("mousemove", function (event) {
        tooltip.style("top", `${event.pageY + 10}px`).style("left", `${event.pageX + 10}px`);
      })
      .on("mouseout", function () {
        tooltip.style("visibility", "hidden");
      });

    // Ajusta o comportamento do zoom para centralizar no cursor
    d3.select("svg").on("dblclick.zoom", function (event) {
      const [mouseX, mouseY] = d3.pointer(event);
      const transform = d3.zoomTransform(svg.node());
      const newTransform = d3.zoomIdentity
        .translate(transform.x, transform.y)
        .scale(transform.k)
        .translate(mouseX - width / 2, mouseY - height / 2)
        .scale(1 / transform.k);

      d3.select("svg")
        .transition()
        .duration(750)
        .call(zoom.transform, newTransform);
    });

    // Adiciona Legenda
    const levels = d3.range(d3.max(root.descendants(), d => d.depth) + 1);

    const legendContainer = document.querySelector(".legend-items");

    // Limpa a legenda antes de adicionar novos elementos
    legendContainer.innerHTML = "";

    // Adiciona cada categoria como um item na legenda
    Object.entries(parentColors).forEach(([category, color]) => {
      const legendItem = document.createElement("div");
      legendItem.classList.add("legend-item");

      const colorBox = document.createElement("span");
      colorBox.classList.add("legend-color");
      colorBox.style.backgroundColor = color;

      const textLabel = document.createElement("span");
      textLabel.textContent = category;

      legendItem.appendChild(colorBox);
      legendItem.appendChild(textLabel);
      legendContainer.appendChild(legendItem);
    });

    // Adiciona cada cluster identificado na legenda
    legendContainer.innerHTML = "";
    clusters.forEach(cluster => {
      const legendItem = document.createElement("div");
      legendItem.classList.add("legend-item");

      const colorBox = document.createElement("span");
      colorBox.classList.add("legend-color");
      colorBox.style.backgroundColor = parentColors[cluster] || "#ccc"; // Cor padrão se não houver

      const textLabel = document.createElement("span");
      textLabel.textContent = clusterLabels[cluster] || cluster;

      legendItem.appendChild(colorBox);
      legendItem.appendChild(textLabel);
      legendContainer.appendChild(legendItem);
    });
  });

}

window.dispatchEvent(new Event("graphReady"));

// === FUNÇÕES MOVIDAS DA INTERFACE PARA O GRAFO ===
function updateClusterInfo(clusterName) {
  if (!root) return;

  const clusterPosts = document.getElementById("cluster-posts");
  if (!clusterPosts) {
    console.error("Elemento 'cluster-posts' não encontrado no DOM.");
    return;
  }

  const clusterNode = root.children.find(d => d.data.id === clusterName);
  if (!clusterNode) return;

  const posts = clusterNode.descendants().filter(d => d.depth === 3);
  const totalPosts = posts.length;
  const totalAuthors = new Set(posts.map(d => d.parent.data.id)).size;
  const avgLikes = Math.round(d3.mean(posts, d => +d.data.likes) || 0);
  const avgComments = Math.round(d3.mean(posts, d => +d.data.comments) || 0);
  const avgEngajamento = Math.round(d3.mean(posts, d => +d.data.engajamento) || 0);

  let topAutor = "-";
  let maxEngajamento = 0;
  posts.forEach(post => {
    if (post.data.engajamento > maxEngajamento) {
      maxEngajamento = post.data.engajamento;
      topAutor = post.parent?.data?.id || "-";
    }
  });

  const infoBox = document.getElementById("cluster-info");
  if (!infoBox) return;

  infoBox.innerHTML = `
    <h4>📈 Dados Gerais do Cluster</h4>
    <p><strong>Total Coletado:</strong> ${totalPosts}</p>
    <p><strong>Total Autores:</strong> ${totalAuthors}</p>
    <p><strong>Likes Médios:</strong> ${avgLikes}</p>
    <p><strong>Comentários Médios:</strong> ${avgComments}</p>
    <p><strong>Engajamento Médio:</strong> ${avgEngajamento}</p>
    <p><strong>Top Autor:</strong> @${topAutor}</p>
  `;
}

function updateClusterPosts(clusterName) {
  const clusterPosts = document.getElementById("cluster-posts");
  if (!clusterPosts) {
    console.error("Elemento 'cluster-posts' não encontrado no DOM.");
    return;
  }

  if (!root || !root.children) {
    clusterPosts.innerHTML = "<p>⚠️ O grafo ainda não foi carregado ou está vazio. Por favor, aguarde...</p>";
    return;
  }

  const clusterNode = root.children.find(d => d.data.id === clusterName);
  if (!clusterNode) {
    clusterPosts.innerHTML = `<p>⚠️ Nenhum cluster encontrado com o nome "${clusterName}".</p>`;
    return;
  }

  if (typeof clusterNode.descendants !== "function") {
    clusterPosts.innerHTML = "<p>⚠️ Estrutura do cluster inválida. Não foi possível obter os posts.</p>";
    return;
  }

  const posts = clusterNode.descendants().filter(d => d.depth === 3 && d.data);

  clusterPosts.style.transition = "opacity 0.5s ease";
  clusterPosts.style.opacity = 0;

  setTimeout(() => {
    const postCards = posts.map(post => `
      <div class="post-card">
        <p class="author">@${post.parent?.data?.id || "Desconhecido"}</p>
        <p class="post-text">"${post.data.message ? post.data.message.slice(0, 200) + "..." : "Sem mensagem"}"</p>
        <div class="post-meta">
          ❤️ ${post.data.likes || 0}
          💬 ${post.data.comments || 0}
          🔁 ${post.data.engajamento || 0}
        </div>
        ${post.data.url ? `<a class="post-link" href="${post.data.url}" target="_blank">🔗 Ver no Instagram</a>` : ""}
      </div>
    `).join("");

    clusterPosts.innerHTML = `
      <h4>📌 Posts de "${clusterName}"</h4>
      <div class="post-cards-wrapper">
        ${postCards}
      </div>
    `;

    clusterPosts.style.opacity = 1;
  }, 200);
}


window.setRootNode = function (r) {
  root = r;

  const currentCluster = document.getElementById("cluster-select")?.value;
  if (currentCluster) {
    updateClusterInfo(currentCluster);
    updateClusterPosts(currentCluster);
  }
}

// === CONTROLE DE ROTAÇÃO MOVIDO ===
const rotationSlider = document.getElementById("rotation-slider");
const rotationValue = document.getElementById("rotation-value");
const getGraphGroup = () => d3.select("svg").select("g");
const width = window.innerWidth;
const height = window.innerHeight;
let currentAngle = 0;

if (rotationSlider) {
  rotationSlider.addEventListener("input", function () {
    let newAngle = parseInt(this.value);
    currentAngle = newAngle;
    if (rotationValue) rotationValue.textContent = `${currentAngle}°`;
    const graphGroup = getGraphGroup();
    if (!graphGroup.empty()) {
      graphGroup.attr("transform", `translate(${width / 2}, ${height / 2}) rotate(${currentAngle})`);
    }
  });
}

document.addEventListener("keydown", function (event) {
  if (event.key === "ArrowLeft" && document.activeElement !== rotationSlider) {
    currentAngle -= 10;
  } else if (event.key === "ArrowRight" && document.activeElement !== rotationSlider) {
    currentAngle += 10;
  }

  const graphGroup = getGraphGroup();
  if (!graphGroup.empty()) {
    rotationSlider.value = currentAngle;
    rotationValue.textContent = `${currentAngle}°`;
    graphGroup.attr("transform", `translate(${width / 2}, ${height / 2}) rotate(${currentAngle})`);
  }
});


// === Inicializador completo da Section2 ===
function initSection2() {
  drawGraph();
  setTimeout(() => {
    const currentCluster = document.getElementById("cluster-select")?.value;
    if (currentCluster) {
      updateClusterInfo(currentCluster);
      updateClusterPosts(currentCluster);
    }

    const rotationSlider = document.getElementById("rotation-slider");
    const rotationValue = document.getElementById("rotation-value");
    const getGraphGroup = () => d3.select("svg").select("g");
    const width = window.innerWidth;
    const height = window.innerHeight;
    let currentAngle = 0;

    if (rotationSlider) {
      rotationSlider.addEventListener("input", function () {
        let newAngle = parseInt(this.value);
        currentAngle = newAngle;
        if (rotationValue) rotationValue.textContent = `${currentAngle}°`;
        const graphGroup = getGraphGroup();
        if (!graphGroup.empty()) {
          graphGroup.attr("transform", `translate(${width / 2}, ${height / 2}) rotate(${currentAngle})`);
        }
      });
    }

    document.addEventListener("keydown", function (event) {
      if (event.key === "ArrowLeft" && document.activeElement !== rotationSlider) {
        currentAngle -= 10;
      } else if (event.key === "ArrowRight" && document.activeElement !== rotationSlider) {
        currentAngle += 10;
      }

      const graphGroup = getGraphGroup();
      if (!graphGroup.empty()) {
        rotationSlider.value = currentAngle;
        rotationValue.textContent = `${currentAngle}°`;
        graphGroup.attr("transform", `translate(${width / 2}, ${height / 2}) rotate(${currentAngle})`);
      }
    });

  }, 500); // Delay para aguardar drawGraph
}

// === Lazy Load do Grafo ao entrar na tela ===
const observer2 = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      if (document.readyState === "complete") {
        initSection2();
      } else {
        window.addEventListener("load", initSection2);
      }
      observer2.disconnect();
    }
  });
}, { threshold: 0.3 });

const section2 = document.querySelector('#grafo-section');
if (section2) {
  observer2.observe(section2);
} else {
  window.addEventListener("DOMContentLoaded", () => {
    const section2Late = document.querySelector('#grafo-section');
    if (section2Late) observer2.observe(section2Late);
  });
}

// Fecha o popup de post se sair da section2
function isSection2Visible() {
  const section2 = document.getElementById('grafo-section');
  if (!section2) return false;
  const rect = section2.getBoundingClientRect();
  return rect.top < window.innerHeight && rect.bottom >= 0;
}

window.addEventListener('scroll', () => {
  if (!isSection2Visible()) {
    const popup = document.getElementById("post-popup");
    if (popup && !popup.classList.contains("hidden")) {
      popup.classList.add("hidden");
    }
  }
});

// === Botão Explorar Cluster (deve ser definido fora do drawGraph para garantir execução imediata) ===
document.addEventListener("DOMContentLoaded", () => {
  const exploreBtn = document.querySelector('[data-action="explore"]');
  const panel = document.getElementById("explorar-cluster-panel");
  const closeBtn = document.getElementById("close-explorar");

  if (exploreBtn && panel) {
    exploreBtn.addEventListener("click", () => {
      panel.classList.add("open");
    });
  }

  if (closeBtn && panel) {
    closeBtn.addEventListener("click", () => {
      panel.classList.remove("open");
    });
  }
});

document.addEventListener("DOMContentLoaded", () => {
  const clusterSelect = document.getElementById("cluster-select");

  if (clusterSelect) {
    clusterSelect.addEventListener("change", () => {
      const clusterName = clusterSelect.value;
      if (clusterName) {
        updateClusterInfo(clusterName);
        updateClusterPosts(clusterName);
      }
    });
  }
});
