// Add Escape/outside dismissal without replacing existing menu handlers.
(() => {
const menuButton = document.querySelector('.menu-toggle, .c-menu-toggle');
const menu = document.querySelector('.nav-links, .c-nav-links');
function closeMenu() {
  if (!menuButton || !menu) return;
  menu.classList.remove('is-open', 'open');
  menuButton.setAttribute('aria-expanded', 'false');
  menuButton.setAttribute('aria-label', 'Abrir menu');
  menuButton.textContent = '☰';
}
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && menuButton?.getAttribute('aria-expanded') === 'true') {
    closeMenu();
    menuButton.focus();
  }
});
document.addEventListener('click', event => {
  if (menu && menuButton && !menu.contains(event.target) && !menuButton.contains(event.target)) closeMenu();
});
})();
