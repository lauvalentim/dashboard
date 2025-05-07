
async function drawChord() {
  const width = 1000;
  const height = 1000;
  const outerRadius = Math.min(width, height) * 0.5 - 80;
  const innerRadius = outerRadius - 20;

  const data = await d3.json("chord.json");
  const nodes = data.ideograms;
  const links = data.links;

  const nameIndex = new Map(nodes.map((d, i) => [d.id, i]));
  const matrixSize = nodes.length;
  const matrix = Array.from({ length: matrixSize }, () => new Array(matrixSize).fill(0));

  for (const link of links) {
    const source = nameIndex.get(link.source.id);
    const target = nameIndex.get(link.target.id);
    if (source !== undefined && target !== undefined) {
      matrix[source][target] = link.value;
    }
  }

  const userNodes = nodes.filter(d => !d.id.includes('_P'));
  const postNodes = nodes.filter(d => d.id.includes('_P'));
  const fullNodes = [...userNodes, ...postNodes];
  const fullMatrix = Array.from({ length: fullNodes.length }, () => new Array(fullNodes.length).fill(0));
  const fullIndex = new Map(fullNodes.map((d, i) => [d.id, i]));

  for (const link of links) {
    const source = fullIndex.get(link.source.id);
    const target = fullIndex.get(link.target.id);
    if (source !== undefined && target !== undefined) {
      fullMatrix[source][target] = link.value;
    }
  }

  const chord = d3.chord()
    .padAngle(0.04)
    .sortSubgroups(d3.descending)
    (fullMatrix);

  const arc = d3.arc()
    .innerRadius(innerRadius)
    .outerRadius(outerRadius);

  const ribbon = d3.ribbon()
    .radius(innerRadius);

  const svg = d3.select("#chart")
    .append("svg")
    .attr("viewBox", [-width / 2, -height / 2, width, height])
    .style("font", "12px sans-serif");

  const colorScale = d3.scaleOrdinal()
    .domain(fullNodes.map(d => d.id))
    .range(fullNodes.map(d => d.id.includes('_P') ? '#66c2a5' : '#fc8d62'));

  const clusterColorMap = {
    'governo': '#a6cee3',
    'mídia_alternativa': '#1f78b4',
    'movimentos': '#b2df8a',
    'ambientalistas': '#33a02c',
    'indígena': '#fb9a99',
    'outros': '#cab2d6'
  };

  // arco externo para clusters dos posts
  svg.append("g")
    .selectAll("path")
    .data(chord.groups.filter(d => fullNodes[d.index].id.includes("_P")))
    .join("path")
    .attr("d", d3.arc().innerRadius(outerRadius + 6).outerRadius(outerRadius + 12))
    .attr("fill", d => {
      const cluster = fullNodes[d.index].cluster || 'outros';
      return clusterColorMap[cluster] || '#999';
    });

  const group = svg.append("g")
    .selectAll("g")
    .data(chord.groups)
    .join("g");

  group.append("path")
    .attr("fill", d => colorScale(fullNodes[d.index].id))
    .attr("stroke", d => d3.rgb(colorScale(fullNodes[d.index].id)).darker(1))
    .attr("d", arc);

  group.append("text")
    .each(d => { d.angle = (d.startAngle + d.endAngle) / 2; })
    .attr("dy", ".35em")
    .attr("transform", d => `
      rotate(${(d.angle * 180 / Math.PI - 90)})
      translate(${outerRadius + 14})
      ${d.angle > Math.PI ? "rotate(180)" : ""}
    `)
    .attr("text-anchor", d => d.angle > Math.PI ? "end" : "start")
    .text(d => fullNodes[d.index].label)
    .style("fill", "#f0f0f0");

  svg.append("g")
    .attr("fill-opacity", 0.7)
    .selectAll("path")
    .data(chord)
    .join("path")
    .attr("d", ribbon)
    .attr("fill", d => colorScale(fullNodes[d.source.index].id))
    .attr("stroke", d => d3.rgb(colorScale(fullNodes[d.source.index].id)).darker());

  svg.selectAll("g path")
    .append("title")
    .text(d => {
      if (!d.source || !d.target) return "";
      const source = fullNodes[d.source.index]?.label || "desconhecido";
      const target = fullNodes[d.target.index]?.label || "desconhecido";
      return `${source} → ${target}\n${fullMatrix[d.source.index][d.target.index]} interações`;
    });

  svg.append("text")
    .attr("x", -width / 2 + 30)
    .attr("y", -height / 2 + 40)
    .attr("fill", "#ffffff")
    .attr("font-size", "18px")
    .text("Usuários");

  svg.append("text")
    .attr("x", width / 2 - 100)
    .attr("y", -height / 2 + 40)
    .attr("fill", "#ffffff")
    .attr("font-size", "18px")
    .text("Posts");
}

drawChord();
