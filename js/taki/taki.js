(() => {
  /* Messages par défaut de Taki. Les états :
     idle · thinking · working · polishing · writing · checking · finalizing · waiting (serveur chargé) · celebrating · error */
  const messages = {
    idle: "Bonjour ! Je suis Taki.",
    thinking: "Je réfléchis à la meilleure mise en page…",
    working: "Je m’occupe de ton document.",
    polishing: "Je peaufine ton document…",
    writing: "Je personnalise tes informations…",
    checking: "Je vérifie la mise en page…",
    finalizing: "Je crée le rendu final…",
    waiting: "Encore un petit instant, j’arrive…",
    celebrating: "Et voilà ! Ton document est prêt.",
    error: "Un petit souci est survenu. On va regarder ça."
  };

  function setState(root, state, message) {
    if (!root) return;
    const safeState = Object.hasOwn(messages, state) ? state : "idle";
    root.dataset.takiState = safeState;
    const caption = root.querySelector(".taki__caption");
    if (!caption) return;
    const text = message || messages[safeState];
    if (caption.textContent === text) return;
    caption.textContent = text;
    // Relance la petite animation d'apparition du texte
    caption.classList.remove("is-in");
    void caption.offsetWidth;
    caption.classList.add("is-in");
  }

  async function mount(target, options = {}) {
    const host = typeof target === "string" ? document.querySelector(target) : target;
    if (!host) throw new Error("Taki : conteneur introuvable.");
    const url = options.templateUrl || "/components/taki/taki.html";
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Taki : chargement impossible (${response.status}).`);
    host.innerHTML = await response.text();
    const root = host.querySelector(".taki");
    setState(root, options.initialState || "idle", options.message);
    return {
      setState: (state, message) => setState(root, state, message),
      destroy: () => { host.innerHTML = ""; }
    };
  }

  window.TakiMascot = { mount, messages };
})();
