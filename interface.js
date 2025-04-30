
  document.addEventListener("DOMContentLoaded", () => {
    // ===== Variáveis principais =====
    const menuToggle = document.getElementById("menu-toggle");
    const openAnalisesBtn = document.getElementById("open-analises");
    const infoPanel = document.getElementById("info-panel");
    const closeBtn = document.getElementById("close-btn");
    const infoMenu = document.getElementById("info-menu");
    const infoTabs = document.querySelectorAll(".info-tab");
    const infoSections = document.querySelectorAll(".info-section");
    const backButtons = document.querySelectorAll(".back-to-menu");

    // ===== Abrir/fechar painel principal =====
    if (menuToggle && infoPanel) {
      menuToggle.addEventListener("click", () => {
        infoPanel.classList.add("open");
      });
    }

    if (openAnalisesBtn && infoPanel) {
      openAnalisesBtn.addEventListener("click", () => {
        infoPanel.classList.add("open");
      });
    }

    if (closeBtn && infoPanel) {
      closeBtn.addEventListener("click", () => {
        infoPanel.classList.remove("open");
        resetSections();
        if (menuToggle) menuToggle.style.display = "block";
      });
    }

    infoTabs.forEach(tab => {
      tab.addEventListener("click", () => {
        if (infoMenu) infoMenu.style.display = "none";
        infoSections.forEach(section => section.classList.remove("active"));
        document.getElementById(tab.dataset.tab).classList.add("active");
      });
    });

    backButtons.forEach(button => {
      button.addEventListener("click", () => {
        resetSections();
      });
    });

    function resetSections() {
      if (infoMenu) infoMenu.style.display = "block";
      infoSections.forEach(section => section.classList.remove("active"));
    }

 // ===== Controle de rotação =====
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
    

 // ===== Painel "Explorar Cluster" =====
 let root; // precisa ser atribuído externamente no script_grafo.js

 const explorarBtn = document.querySelector(".mini-tab");
 const explorarPanel = document.getElementById("explorar-cluster-panel");
 const clusterSelect = document.getElementById("cluster-select");
 const clusterInfo = document.getElementById("cluster-info");
 const clusterPosts = document.getElementById("cluster-posts");
 const closeExplorarBtn = document.getElementById("close-explorar");

 let selectedClusterName = "";

 if (explorarBtn && explorarPanel) {
   explorarBtn.addEventListener("click", () => {
     explorarPanel.classList.toggle("open");
   });
 }

 if (closeExplorarBtn && explorarPanel) {
   closeExplorarBtn.addEventListener("click", () => {
     explorarPanel.classList.remove("open");
   });
 }

 if (clusterSelect) {
   clusterSelect.addEventListener("change", (e) => {
     selectedClusterName = e.target.value;
     if (selectedClusterName) {
       updateClusterInfo(selectedClusterName);
       updateClusterPosts(selectedClusterName);
     } else {
       if (clusterInfo) clusterInfo.innerHTML = "";
       if (clusterPosts) clusterPosts.innerHTML = "";
     }
   });
 }

 function updateClusterInfo(clusterName) {
   if (!root) return;
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

   clusterInfo.innerHTML = `
     <h4>📊 Informações do Cluster</h4>
     <p><strong>Total de Posts:</strong> ${totalPosts}</p>
     <p><strong>Total de Autores:</strong> ${totalAuthors}</p>
     <p><strong>Likes Médios:</strong> ${avgLikes}</p>
     <p><strong>Comentários Médios:</strong> ${avgComments}</p>
     <p><strong>Engajamento Médio:</strong> ${avgEngajamento}</p>
     <p><strong>Top Autor:</strong> @${topAutor}</p>
   `;
 }

 function updateClusterPosts(clusterName) {
   if (!root) return;
   const clusterNode = root.children.find(d => d.data.id === clusterName);
   if (!clusterNode) return;

   const posts = clusterNode.descendants().filter(d => d.depth === 3);

   clusterPosts.style.opacity = 0;
   setTimeout(() => {
     const postCards = posts.map(post => `
       <div class="post-card">
         <p><strong>@${post.parent ? post.parent.data.id : 'Desconhecido'}</strong></p>
         <p class="post-text">"${post.data.message ? post.data.message.slice(0, 100) + "..." : "Sem mensagem"}"</p>
         <p>❤️ ${post.data.likes || 0} 💬 ${post.data.comments || 0} ➔ Engajamento: ${post.data.engajamento || 0}</p>
         <a href="${post.data.url}" target="_blank">🔗 Ver post</a>
       </div>
     `).join("");

     clusterPosts.innerHTML = `<h4>📌 Posts de "${clusterName}"</h4>${postCards}`;
     clusterPosts.style.opacity = 1;
     clusterPosts.style.transition = "opacity 0.5s ease";
   }, 100);
 }

 window.setRootNode = function (r) {
  root = r;

  const currentCluster = document.getElementById("cluster-select")?.value;
  if (currentCluster) {
    updateClusterInfo(currentCluster);
    updateClusterPosts(currentCluster);
  }
 };
});



