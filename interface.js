document.addEventListener("DOMContentLoaded", function () {
    const menuToggle = document.getElementById("menu-toggle");
    const openAnalisesBtn = document.getElementById("open-analises");
    const infoPanel = document.getElementById("info-panel");
    const closeBtn = document.getElementById("close-btn");
    const infoMenu = document.getElementById("info-menu");
    const infoTabs = document.querySelectorAll(".info-tab");
    const infoSections = document.querySelectorAll(".info-section");
    const backButtons = document.querySelectorAll(".back-to-menu");
    const rotationSlider = document.getElementById("rotation-slider");
    const rotationValue = document.getElementById("rotation-value");
    const legendContainer = document.querySelector(".legend-items");
    const graphGroup = d3.select("svg g");
  
    const width = window.innerWidth;
    const height = window.innerHeight;
  
    // ✅ CORRIGIDO: evento do botão Ver Análises direto
    if (openAnalisesBtn && infoPanel) {
      openAnalisesBtn.addEventListener("click", () => {
        infoPanel.classList.add("open");
      });
    }
  
    if (closeBtn) {
      closeBtn.addEventListener("click", () => {
        infoPanel.classList.remove("open");
        resetSections();
        menuToggle.style.display = "block";
      });
    }
  
    infoTabs.forEach(tab => {
      tab.addEventListener("click", () => {
        infoMenu.style.display = "none";
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
      infoMenu.style.display = "block";
      infoSections.forEach(section => section.classList.remove("active"));
    }
  
    document.addEventListener("keydown", function (event) {
      if (event.key === "ArrowLeft" && document.activeElement !== rotationSlider) {
        resetSections();
      }
    });
  
    let currentAngle = 0;
  
    if (rotationSlider) {
      rotationSlider.addEventListener("input", function () {
        let newAngle = parseInt(this.value);
        currentAngle = newAngle;
        rotationValue.textContent = `${currentAngle}°`;
        graphGroup.attr("transform", `translate(${width / 2}, ${height / 2}) rotate(${currentAngle})`);
      });
    }
  
    document.addEventListener("keydown", function (event) {
      if (event.key === "ArrowLeft" && document.activeElement !== rotationSlider) {
        currentAngle -= 10;
      } else if (event.key === "ArrowRight" && document.activeElement !== rotationSlider) {
        currentAngle += 10;
      }
  
      if (rotationSlider) {
        rotationSlider.value = currentAngle;
        rotationValue.textContent = `${currentAngle}°`;
        graphGroup.attr("transform", `translate(${width / 2}, ${height / 2}) rotate(${currentAngle})`);
      }
    });
  });
  