(() => {
  const messages = {
    idle: "Bonjour ! Je suis Taki.",
    thinking: "Je réfléchis à la meilleure mise en page…",
    working: "Je m’occupe de ton document.",
    celebrating: "Et voilà ! Ton document est prêt.",
    error: "Un petit souci est survenu. On va regarder ça."
  };

  function setState(root, state, message) {
    if (!root) return;
    const safeState = Object.hasOwn(messages, state) ? state : "idle";
    root.dataset.takiState = safeState;
    const caption = root.querySelector(".taki__caption");
    if (caption) caption.textContent = message || messages[safeState];
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