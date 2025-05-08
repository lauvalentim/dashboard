document.getElementById('btn-ver-grafo').addEventListener('click', () => {
  document.getElementById('overlay-grafo').style.display = 'none';
});

window.initInterface = function () {
  let clusterStats = {};
  fetch("painel_info_cluster.json")
    .then(response => response.json())
    .then(data => { clusterStats = data; })
    .catch(error => console.error("Erro ao carregar painel_info_cluster.json:", error));

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
      closeOtherPanels();
      infoPanel.classList.add("open");
    });
  }    

  if (openAnalisesBtn && infoPanel) {
    openAnalisesBtn.addEventListener("click", () => {
      closeOtherPanels();
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

  function closeOtherPanels() {
    const chordPanel = document.getElementById("panel-chord-data");
    const explorarPanel = document.getElementById("explorar-cluster-panel");

    if (chordPanel) chordPanel.classList.remove("show");
    if (explorarPanel) explorarPanel.classList.remove("open");
  }
  // ===== Abrir/fechar painel de informações =====

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
      closeOtherPanels();
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
        explorarPanel.classList.add("open"); // <- adiciona isso!
        updateClusterInfo(selectedClusterName);
        updateClusterPosts(selectedClusterName);
      } else {
        if (clusterInfo) clusterInfo.innerHTML = "";
        if (clusterPosts) clusterPosts.innerHTML = "";
      }
    });
  }

  // Espera até o root ser atribuído
  window.addEventListener("graphReady", () => {
    console.log("🔧 Interface ativada após grafo!");

    const currentCluster = document.getElementById("cluster-select")?.value;
    if (currentCluster) {
      updateClusterInfo(currentCluster);
      updateClusterPosts(currentCluster);
    }
  });
}

// Fecha todos os painéis e popups flutuantes ao trocar de seção
window.closeAllFloatingPanels = function () {
  document.getElementById("post-popup")?.classList.add("hidden");
  document.getElementById("panel-chord-data")?.classList.remove("show");
  document.getElementById("info-panel")?.classList.remove("open");
  document.getElementById("explorar-cluster-panel")?.classList.remove("open");
};


window.addEventListener("DOMContentLoaded", () => {
  initInterface();
});

