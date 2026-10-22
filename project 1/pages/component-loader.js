(function () {
  async function loadComponent(placeholderId, fileName) {
    const placeholder = document.getElementById(placeholderId);
    if (!placeholder) return;

    try {
      const response = await fetch(fileName);
      if (!response.ok) {
        throw new Error(`Could not load ${fileName}: ${response.status}`);
      }

      placeholder.innerHTML = await response.text();

      if (placeholderId === "navbar-placeholder") {
        const menuButton = placeholder.querySelector("#menuButton");
        const mobileMenu = placeholder.querySelector("#mobileMenu");
        const menuButtonLabel = placeholder.querySelector("#menuButtonLabel");
        const menuIcon = placeholder.querySelector("#menuIcon path");

        if (menuButton && mobileMenu && menuButtonLabel && menuIcon) {
          const setMenuOpen = isOpen => {
            menuButton.setAttribute("aria-expanded", String(isOpen));
            menuButton.setAttribute(
              "aria-label",
              isOpen ? "Close navigation menu" : "Open navigation menu"
            );
            menuButtonLabel.textContent = isOpen ? "Close" : "Menu";
            menuIcon.setAttribute(
              "d",
              isOpen
                ? "M6 6l12 12M18 6 6 18"
                : "M4 6h16M4 12h16M4 18h16"
            );
            mobileMenu.classList.toggle("hidden", !isOpen);
          };

          menuButton.addEventListener("click", () => {
            setMenuOpen(menuButton.getAttribute("aria-expanded") !== "true");
          });

          mobileMenu.querySelectorAll("a").forEach(link => {
            link.addEventListener("click", () => setMenuOpen(false));
          });

          document.addEventListener("keydown", event => {
            if (
              event.key === "Escape" &&
              menuButton.getAttribute("aria-expanded") === "true"
            ) {
              setMenuOpen(false);
              menuButton.focus();
            }
          });

          window.matchMedia("(min-width: 1024px)").addEventListener("change", event => {
            if (event.matches) setMenuOpen(false);
          });
        }

        // ── Active nav link indicator ──────────────────────────────
        const currentPage = window.location.pathname.split("/").pop() || "home.html";

        // Desktop navigation links, excluding the logo and collection CTA.
        placeholder.querySelectorAll("nav > div a[href]").forEach(link => {
          const linkPage = link.getAttribute("href").split("/").pop();
          if (linkPage === currentPage) {
            // Active styles: brand color + underline dot-bar
            link.classList.add("text-[#78452B]", "font-semibold", "relative");
            link.style.cssText +=
              "border-bottom: 2.5px solid #78452B; padding-bottom: 2px;";
          }
        });

        // Mobile nav links
        if (mobileMenu) {
          mobileMenu.querySelectorAll("a[href]").forEach(link => {
            const linkPage = link.getAttribute("href").split("/").pop();
            if (linkPage === currentPage) {
              link.classList.add(
                "text-[#78452B]", "font-bold", "bg-[#F3EAD9]", "rounded-lg"
              );
            }
          });
        }
        // ────────────────────────────────────────────────────────────
      }

      if (placeholderId === "footer-placeholder") {
        const footerYear = placeholder.querySelector("#footerYear");
        if (footerYear) {
          footerYear.textContent = new Date().getFullYear();
        }
      }
    } catch (error) {
      console.error(error);
      placeholder.innerHTML = `
        <p class="px-5 py-3 text-sm text-red-700">
          Could not load ${fileName}. Make sure it is in the same folder
          and open the website using VS Code Live Server.
        </p>
      `;
    }
  }

  Promise.all([
    loadComponent("navbar-placeholder", "../layout/navbar.html"),
    loadComponent("footer-placeholder", "../layout/footer.html")
  ]);
})();
