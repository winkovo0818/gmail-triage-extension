// Sidebar scaffold - no UI yet
export function createSidebarRoot() {
  const el = document.createElement('div')
  el.id = 'gmail-triage-sidebar'
  el.style.position = 'fixed'
  el.style.top = '0'
  el.style.right = '0'
  el.style.width = '360px'
  el.style.height = '100vh'
  el.style.background = '#fff'
  el.style.borderLeft = '1px solid #ddd'
  el.style.boxShadow = '-2px 0 8px rgba(0,0,0,0.08)'
  el.style.zIndex = '2147483647'
  el.textContent = 'Gmail Triage Sidebar (scaffold)'
  return el
}
