/**
 * Inline script that resolves the theme before first paint.
 * The server renders data-theme-pref (system|dark|light); this picks the concrete theme.
 */
export function ThemeScript() {
  const code = `(function(){try{var d=document.documentElement;var p=d.getAttribute('data-theme-pref')||localStorage.getItem('hs-theme')||'system';var m=window.matchMedia('(prefers-color-scheme: dark)');function apply(){var t=p==='system'?(m.matches?'dark':'light'):p;d.setAttribute('data-theme',t);var meta=document.querySelector('meta[name=theme-color]');if(meta)meta.setAttribute('content',t==='dark'?'#070908':'#f4f6f5');}apply();m.addEventListener('change',apply);window.__hsSetTheme=function(np){p=np;try{localStorage.setItem('hs-theme',np)}catch(e){}apply();};}catch(e){}})();`;
  return <script dangerouslySetInnerHTML={{ __html: code }} />;
}
