
window.initInterface = function () {
  const openAnalisesBtn = document.getElementById("open-analises");
  const infoPanel = document.getElementById("info-panel");
  const closeBtn = document.getElementById("close-btn");
  const infoMenu = document.getElementById("info-menu");
  const infoTabs = document.querySelectorAll(".info-tab");
  const infoSections = document.querySelectorAll(".info-section");
  const backButtons = document.querySelectorAll(".back-to-menu");

  // Abrir painel ao clicar em "Ver Análises"
  if (openAnalisesBtn && infoPanel) {
    openAnalisesBtn.addEventListener("click", () => {
      infoPanel.classList.add("open");
    });
  }

  // Fechar painel
  if (closeBtn && infoPanel) {
    closeBtn.addEventListener("click", () => {
      infoPanel.classList.remove("open");
      resetSections();
    });
  }

  // Troca de abas no menu
  infoTabs.forEach(tab => {
    tab.addEventListener("click", () => {
      if (infoMenu) infoMenu.style.display = "none";
      infoSections.forEach(section => section.classList.remove("active"));
      const sectionToShow = document.getElementById(tab.dataset.tab);
      if (sectionToShow) sectionToShow.classList.add("active");
    });
  });

  // Voltar ao menu
  backButtons.forEach(button => {
    button.addEventListener("click", () => {
      resetSections();
    });
  });

  function resetSections() {
    if (infoMenu) infoMenu.style.display = "block";
    infoSections.forEach(section => section.classList.remove("active"));
  }
};

window.addEventListener("DOMContentLoaded", () => {
  initInterface();
});
