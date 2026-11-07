/* MIKOSHIYA NEXT — 任意のページで使う部品（該当要素が無ければ何もしない）
   - WORKS のカテゴリフィルター
   - 問い合わせデモ（送信を抑止し、ページごとの文面を data-notice から表示する）
   Phase 3-① の裁定 Q-4 により、フォームの ID を inquiry-form / form-notice に統一した。 */
(() => {
  'use strict';

  /* WORKS のカテゴリフィルター */
  const filters = [...document.querySelectorAll('[data-filter]')];
  if (filters.length) {
    filters.forEach(btn => btn.addEventListener('click', () => {
      const key = btn.dataset.filter;
      filters.forEach(x => x.setAttribute('aria-pressed', String(x === btn)));
      document.querySelectorAll('.work-card').forEach(card => {
        card.hidden = key !== 'all' && card.dataset.category !== key;
      });
    }));
  }

  /* 問い合わせ: 公開先の URL でだけ送信する（確認用の環境では送らない）。JS が動かない場合はフォームの POST で送る */
  const form = document.querySelector('#inquiry-form');
  const notice = document.querySelector('#form-notice');
  if (form && notice) {
    const shownAt = Date.now();
    form.addEventListener('submit', event => {
      event.preventDefault();
      if (!form.dataset.liveHost.split(' ').includes(location.hostname)) {
        notice.textContent = form.dataset.notice || '';
        return;
      }
      const button = form.querySelector('[type="submit"]');
      button.disabled = true;
      notice.textContent = '送信しています…';
      const body = new FormData(form);
      body.append('elapsed', String(Date.now() - shownAt));
      fetch(form.dataset.endpoint, { method: 'POST', headers: { Accept: 'application/json' }, body })
        .then(res => { if (!res.ok) throw new Error('send failed'); return res.json(); })
        .then(data => {
          if (String(data.success) === 'false') throw new Error('send failed');
          notice.textContent = '送信しました。内容を確認のうえ、メールでご連絡します。';
          form.reset();
        })
        .catch(() => { notice.textContent = `送信できませんでした。お手数ですが ${form.dataset.mail} へ直接ご連絡ください。`; })
        .finally(() => { button.disabled = false; });
    });
  }
})();
