/* MIKOSHIYA NEXT — 全 7 ページ共通: ヘッダー追従とモバイルメニュー
   Phase 3-① で index.html / 下層 6 ページの重複実装を 1 本に統合した。 */
(() => {
  'use strict';
  const header = document.querySelector('#site-header');
  const menu = document.querySelector('#menu-button');
  const mob = document.querySelector('#mobile-nav');
  if (!header || !menu || !mob) return;

  const scrollUpdate = () => header.classList.toggle('is-scrolled', window.scrollY > 30);
  scrollUpdate();
  addEventListener('scroll', scrollUpdate, { passive: true });

  const setMenu = (open) => {
    menu.setAttribute('aria-expanded', String(open));
    menu.setAttribute('aria-label', open ? 'メニューを閉じる' : 'メニューを開く');
    menu.textContent = open ? '×' : '☰';
    mob.classList.toggle('open', open);
  };

  menu.addEventListener('click', () => setMenu(menu.getAttribute('aria-expanded') !== 'true'));
  mob.querySelectorAll('a').forEach(link => link.addEventListener('click', () => setMenu(false)));
})();
