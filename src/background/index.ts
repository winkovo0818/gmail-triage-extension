chrome.runtime.onInstalled.addListener(() => {
  console.log('Gmail Triage Helper installed')
})

chrome.runtime.onStartup.addListener(() => {
  console.log('Gmail Triage Helper started')
})

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === 'PING') {
    sendResponse({ ok: true, time: Date.now() })
    return true
  }
})
