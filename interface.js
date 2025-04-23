// Menu de Informações
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

    // Define largura e altura da tela para posicionamento correto
    const width = window.innerWidth;
    const height = window.innerHeight;

    // Função para esconder o botão do menu
    function hideMenuButton() {
        if (menuToggle) menuToggle.style.display = "none";
    }

    // Função para mostrar o botão do menu
    function showMenuButton() {
        if (menuToggle) menuToggle.style.display = "block";
    }

    // Abrir o menu lateral e esconder o botão
    if (menuToggle) {
        menuToggle.addEventListener("click", () => {
            if (openAnalisesBtn && infoPanel) {
                openAnalisesBtn.addEventListener("click", () => {
                  infoPanel.classList.add("open");
                });
              }
            });
            

    // Fechar o menu lateral e voltar para o menu principal
    if (closeBtn) {
        closeBtn.addEventListener("click", () => {
            infoPanel.classList.remove("open");
            resetSections(); // Retorna ao menu principal
            showMenuButton();
        });
    }

    // Alternar entre as seções e esconder o menu principal
    infoTabs.forEach(tab => {
        tab.addEventListener("click", () => {
            infoMenu.style.display = "none"; // Esconde o menu principal
            infoSections.forEach(section => section.classList.remove("active"));
            document.getElementById(tab.dataset.tab).classList.add("active"); // Exibe a seção escolhida
        });
    });

    // Botão de voltar para o menu principal
    backButtons.forEach(button => {
        button.addEventListener("click", () => {
            resetSections();
        });
    });

    // Reseta as seções ao menu principal e faz o botão do menu reaparecer
    function resetSections() {
        infoMenu.style.display = "block"; // Mostra o menu principal
        infoSections.forEach(section => section.classList.remove("active"));
    }

    // Permite voltar ao menu com a tecla "ArrowLeft" (se não estiver alterando rotação)
    document.addEventListener("keydown", function (event) {
        if (event.key === "ArrowLeft" && document.activeElement !== rotationSlider) {
            resetSections();
        }
    });

    // Rotation Slider
    let currentAngle = 0;

    // Atualiza a rotação do grafo conforme o usuário move o slider
    if (rotationSlider) {
        rotationSlider.addEventListener("input", function () {
            let newAngle = parseInt(this.value);
            currentAngle = newAngle; // Atualiza ângulo globalmente
            rotationValue.textContent = `${currentAngle}°`;
            graphGroup.attr("transform", `translate(${width / 2}, ${height / 2}) rotate(${currentAngle})`);
        });
    }

    // Permite continuar girando sem limite ao segurar as setas do teclado
    document.addEventListener("keydown", function (event) {
        if (event.key === "ArrowLeft" && document.activeElement !== rotationSlider) {
            currentAngle -= 10;
        } else if (event.key === "ArrowRight" && document.activeElement !== rotationSlider) {
            currentAngle += 10;
        }

        // Atualiza o slider para refletir a mudança
        if (rotationSlider) {
            rotationSlider.value = currentAngle;
            rotationValue.textContent = `${currentAngle}°`;
            graphGroup.attr("transform", `translate(${width / 2}, ${height / 2}) rotate(${currentAngle})`);
        }
    });
});