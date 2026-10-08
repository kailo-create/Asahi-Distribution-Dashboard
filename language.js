(() => {
  const button = document.getElementById('language-toggle');
  const key = 'asahi-dashboard-language';
  let ready = false, pending = localStorage.getItem(key) || 'zh-TW';
  window.googleTranslateElementInit = () => {
    new google.translate.TranslateElement({ pageLanguage:'zh-TW', includedLanguages:'en,zh-TW', autoDisplay:false }, 'google_translate_element');
    ready = true; setLanguage(pending);
  };
  function choose(language) {
    const combo = document.querySelector('.goog-te-combo');
    if (!combo) return setTimeout(() => choose(language), 100);
    combo.value = language; combo.dispatchEvent(new Event('change'));
  }
  function setLanguage(language) {
    pending = language; localStorage.setItem(key, language);
    button.textContent = language === 'en' ? '中文' : 'EN';
    button.setAttribute('aria-label', language === 'en' ? 'Switch to Traditional Chinese' : 'Switch to English');
    if (ready) choose(language);
  }
  button.addEventListener('click', () => setLanguage(pending === 'en' ? 'zh-TW' : 'en'));
  const script=document.createElement('script');
  script.src='https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
  script.async=true; document.head.appendChild(script);
})();
