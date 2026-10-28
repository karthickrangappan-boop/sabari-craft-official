(() => {
  const loader = document.getElementById("site-loader");

  if (!loader) {
    console.error("Could not find the site loading screen.");
    return;
  }

  const showLoader = () => {
    loader.classList.remove("is-hidden");
    loader.setAttribute("aria-hidden", "false");
  };

  const hideLoader = () => {
    window.setTimeout(() => {
      loader.classList.add("is-hidden");
      loader.setAttribute("aria-hidden", "true");
    }, 450);
  };

  document.addEventListener("click", event => {
    if (!(event.target instanceof Element)) return;

    const link = event.target.closest("a[href]");
    if (
      !link ||
      (link.target && link.target.toLowerCase() !== "_self") ||
      link.hasAttribute("download") ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    const destination = new URL(link.href, window.location.href);
    if (destination.origin !== window.location.origin) return;

    const isSameDocumentHash =
      destination.pathname === window.location.pathname &&
      destination.search === window.location.search &&
      destination.hash !== "";

    if (!isSameDocumentHash) showLoader();
  });

  window.addEventListener("pagehide", showLoader);
  window.addEventListener("pageshow", event => {
    if (event.persisted) hideLoader();
  });

  if (document.readyState === "complete") {
    hideLoader();
  } else {
    window.addEventListener("load", hideLoader, { once: true });
  }
})();
