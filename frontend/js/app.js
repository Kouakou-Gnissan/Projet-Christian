const sidebar = document.querySelector(".sidebar");
const sidebarToggleBtn = document.querySelectorAll(".sidebar-toggle");
const themeToggleBtn = document.querySelector(".theme-toggle");
const themeIcon = themeToggleBtn.querySelector(".theme-icon");
const searchForm = document.querySelector(".search-form");

const updateThemeIcon = () => {
  const isDark = document.body.classList.contains("dark-theme");
  themeIcon.textContent = sidebar.classList.contains("collapsed")
    ? isDark
      ? "light_mode"
      : "dark_mode"
    : "dark_mode";
};

//  gérer l'état initial de la sidebar
const handleInitialSidebarState = () => {
  const isMobile = window.innerWidth <= 768;
  
  if (isMobile) {
    sidebar.classList.add('collapsed'); // Sidebar rétractée sur mobile
  } else {
    sidebar.classList.remove('collapsed'); // Sidebar ouverte sur desktop
  }
  updateThemeIcon();
};

// Appelez cette fonction au chargement
handleInitialSidebarState();

// Ajoutez un écouteur pour le redimensionnement de la fenêtre
window.addEventListener('resize', () => {
  handleInitialSidebarState();
});



const savedTheme = localStorage.getItem("theme");
const systemPrefersDark = window.matchMedia(
  "(prefers-color-scheme: dark)"
).matches;
const shouldUseDarkTheme =
  savedTheme === "dark" || (!savedTheme && systemPrefersDark);

document.body.classList.toggle("dark-theme", shouldUseDarkTheme);
updateThemeIcon();



//bouton de reduction de la sidebar
sidebarToggleBtn.forEach((btn) => {
  btn.addEventListener("click", () => {
    sidebar.classList.toggle("collapsed");
    updateThemeIcon();
  });
});

// Gestion des menus déroulants
document.addEventListener('DOMContentLoaded', function() {
  // Sélectionner tous les menus déroulants
  const dropdownToggles = document.querySelectorAll('.dropdown-toggle');
  
  // Ajouter un événement click à chaque menu déroulant
  dropdownToggles.forEach(toggle => {
    toggle.addEventListener('click', function(e) {
      e.preventDefault();
      
      // Fermer les autres menus déroulants
      dropdownToggles.forEach(otherToggle => {
        if (otherToggle !== toggle) {
          const otherMenuItem = otherToggle.closest('.menu-item.dropdown');
          if (otherMenuItem.classList.contains('active')) {
            otherMenuItem.classList.remove('active');
          }
        }
      });
      
      // Toggle l'état actif du menu parent
      const menuItem = toggle.closest('.menu-item.dropdown');
      menuItem.classList.toggle('active');
    });
  });
  
  // Fermer les menus déroulants quand on clique ailleurs
  document.addEventListener('click', function(e) {
    if (!e.target.closest('.menu-item.dropdown')) {
      dropdownToggles.forEach(toggle => {
        const menuItem = toggle.closest('.menu-item.dropdown');
        if (menuItem.classList.contains('active')) {
          menuItem.classList.remove('active');
        }
      });
    }
  });
  
  // Gérer les sous-liens des menus déroulants
  const dropdownLinks = document.querySelectorAll('.dropdown-link');
  dropdownLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      // Retirer la classe active de tous les sous-liens
      dropdownLinks.forEach(otherLink => {
        otherLink.classList.remove('active');
      });
      
      // Ajouter la classe active au lien cliqué
      this.classList.add('active');
    });
  });
});



// gection du mode sombre
themeToggleBtn.addEventListener("click", () => {
  const isDark = document.body.classList.toggle("dark-theme");
  localStorage.setItem("theme", isDark ? "dark" : "light");
  updateThemeIcon();
});

// pour la recherche qu sidebar
searchForm.addEventListener("click", () => {
  if (sidebar.classList.contains("collapsed")) {
    sidebar.classList.remove("collapsed");
    searchForm.querySelector("input").focus();
  }
});


if(window.innerHeight >768) sidebar.classList.add("collapsed");