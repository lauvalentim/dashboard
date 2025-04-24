document.addEventListener("DOMContentLoaded", function () {

// Define dimensões do SVG
const width = window.innerWidth;
const height = window.innerHeight;
const radius = Math.min(width, height) / 2;

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

// Carrega o JSON e gera o Radial Tree
d3.json("radial.json").then(data => {
    if (!data || !data.data || !data.data[0] || !data.data[0].values) {
        console.error("JSON inválido ou vazio.");
        return;
    }
    
    const values = data.data[0].values;
    let root = d3.stratify()
        .id(d => d.id)
        .parentId(d => d.parent)
        (values);

    const tree = d3.tree().size([2 * Math.PI, 420]);
    tree(root);

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
        .attr("stroke", "#ccc")
        .attr("stroke-width", 2)
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
        "Narrativas": "#ccc", // Cinza neutro
        "Esportes & Games": "#1b5e20", // Verde escuro
        "Educação & Tecnologia": "#0d47a1", // Azul escuro
        "Notícias & Sociedade": "#b71c1c", // Vermelho escuro
        "Música": "#e65100", // Laranja escuro  
        "Entretenimento": "#ffd321", // Amarelo escuro
        "Outros": " #b81469" // Rosa escuro
    };

    function adjustColor(color, depth) {
        if (!color) return "#ccc"; // Se a cor for inválida, usa um cinza neutro
        return d3.color(color).brighter(depth * 0.4).formatRgb(); // Clareia a cor dos filhos
    }

    node.append("circle")
        .attr("r", d => d.children ? 6 : 4) // Diferencia tamanho de pais e filhos
        .attr("fill", d => {
            if (d.data.id === "Narrativas") {
                return "#ccc"; // O nó "Narrativas" terá um cinza neutro
            } else if (!d.parent || d.parent.data.id === "Narrativas") {   
                return parentColors[d.data.id] || "#ccc"; // Define cor para os filhos diretos de "Narrativas"
            } else {
                let rootAncestor = d.ancestors().find(a => a.parent && a.parent.data.id === "Narrativas"); // Pega o primeiro nível abaixo de "Narrativas"
                let rootColor = rootAncestor ? parentColors[rootAncestor.data.id] : null;
                return adjustColor(rootColor, d.depth); // Aplica a tonalidade ajustada
            }
        });

    node.append("text")
        .attr("dy", "0.31em")
        .attr("x", d => d.x < Math.PI ? 6 : -6)
        .attr("text-anchor", d => d.x < Math.PI ? "start" : "end")
        .attr("transform", d => `rotate(${d.x >= Math.PI ? 180 : 0})`)
        .text(d => d.data.id)
        .style("font-size", "7.5px")
        .style("fill", "#333");

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
        const relatedNodes = new Set(d.ancestors().concat(d.descendants()));

        // Reduz a opacidade apenas dos nós que NÃO estão no grupo selecionado
        node.attr("opacity", n => relatedNodes.has(n) ? 1 : 0.2);

        // Reduz a opacidade dos links que NÃO pertencem ao cluster selecionado
        svg.selectAll("path")
            .attr("stroke-opacity", link => 
                (relatedNodes.has(link.source) && relatedNodes.has(link.target)) ? 1 : 0.2);
    });

    let currentTransform = d3.zoomIdentity.translate(width / 2, height / 2).scale(1);
    svg.call(zoom).call(zoom.transform, currentTransform);


    document.getElementById("zoom-in").addEventListener("click", () => {
        currentTransform = currentTransform.scale(1.2);
        svg.transition().duration(300).call(zoom.transform, currentTransform);
    });

    document.getElementById("zoom-out").addEventListener("click", () => {
        currentTransform = currentTransform.scale(0.8);
        svg.transition().duration(300).call(zoom.transform, currentTransform);
    });

    document.getElementById("zoom-reset").addEventListener("click", () => {
        currentTransform = d3.zoomIdentity.translate(width / 2, height / 2).scale(1);
        svg.transition().duration(300).call(zoom.transform, currentTransform);
    });

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
    
    // Adiciona zoom e pan
    const zoom = d3.zoom()
    .scaleExtent([0.5, 5])
    .on("zoom", (event) => {
      graphGroup.attr("transform", event.transform);
    });  
  
    svg.call(zoom);

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
        textLabel.textContent = cluster;

        legendItem.appendChild(colorBox);
        legendItem.appendChild(textLabel);
        legendContainer.appendChild(legendItem);
    });
});
 
});