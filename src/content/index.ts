console.log('Content script loaded on', location.href)

// Example: send a ping to background
chrome.runtime.sendMessage({ type: 'PING' }, (resp) => {
  console.log('Background responded:', resp)
})

// Placeholder for future sidebar injection
export {}
