import { getProfiles, saveProfiles, clearProfiles } from '../lib/storage'
import { Profile } from '../lib/profiles'
import { parseJSON } from '../lib/utils'

function $(id: string) {
  return document.getElementById(id) as HTMLElement
}

function input(id: string) {
  return document.getElementById(id) as HTMLInputElement
}

function textarea(id: string) {
  return document.getElementById(id) as HTMLTextAreaElement
}

function genId() {
  return 'p_' + Math.random().toString(36).slice(2) + Date.now().toString(36)
}

let editingId: string | null = null

async function refreshList() {
  const list = $('#profilesList')
  list.innerHTML = ''
  const profiles = await getProfiles()
  if (!profiles.length) {
    const empty = document.createElement('div')
    empty.className = 'muted'
    empty.textContent = 'No profiles saved yet.'
    list.appendChild(empty)
    return
  }

  for (const p of profiles) {
    const item = document.createElement('div')
    item.className = 'item'

    const title = document.createElement('div')
    title.className = 'item-title'
    title.textContent = `${p.model || 'model?'} @ ${p.base_url || 'url?'}`

    const btns = document.createElement('div')
    btns.className = 'btns'

    const editBtn = document.createElement('button')
    editBtn.textContent = 'Edit'
    editBtn.addEventListener('click', () => startEdit(p))

    const delBtn = document.createElement('button')
    delBtn.textContent = 'Delete'
    delBtn.addEventListener('click', async () => {
      const all = await getProfiles()
      const next = all.filter(x => x.id !== p.id)
      await saveProfiles(next)
      if (editingId === p.id) resetForm()
      await refreshList()
      setStatus('Deleted')
    })

    btns.appendChild(editBtn)
    btns.appendChild(delBtn)

    item.appendChild(title)
    item.appendChild(btns)
    list.appendChild(item)
  }
}

function setStatus(msg: string, isError = false) {
  const el = $('#status')
  el.textContent = msg
  el.style.color = isError ? '#f87171' : '#f59e0b'
  if (msg) {
    setTimeout(() => { el.textContent = '' }, 2000)
  }
}

function resetForm() {
  editingId = null
  ;(document.getElementById('formTitle') as HTMLElement).textContent = 'Create Profile'
  input('base_url').value = ''
  input('api_key').value = ''
  input('model').value = ''
  input('timeout').value = ''
  input('temperature').value = ''
  input('max_tokens').value = ''
  textarea('headers').value = ''
}

function startEdit(p: Profile) {
  editingId = p.id
  ;(document.getElementById('formTitle') as HTMLElement).textContent = 'Edit Profile'
  input('base_url').value = p.base_url || ''
  input('api_key').value = p.api_key || ''
  input('model').value = p.model || ''
  input('timeout').value = p.timeout?.toString() || ''
  input('temperature').value = p.temperature?.toString() || ''
  input('max_tokens').value = p.max_tokens?.toString() || ''
  textarea('headers').value = p.headers ? JSON.stringify(p.headers, null, 2) : ''
}

function readForm(): Omit<Profile, 'id'> {
  const headersStr = textarea('headers').value.trim()
  let headers: Record<string, string> | undefined
  if (headersStr) {
    const parsed = parseJSON(headersStr)
    if (!parsed.ok || typeof parsed.value !== 'object' || Array.isArray(parsed.value)) {
      throw new Error('Headers must be a JSON object')
    }
    headers = parsed.value as Record<string, string>
  }

  const timeout = input('timeout').value ? Number(input('timeout').value) : undefined
  const temperature = input('temperature').value ? Number(input('temperature').value) : undefined
  const max_tokens = input('max_tokens').value ? Number(input('max_tokens').value) : undefined

  return {
    base_url: input('base_url').value.trim(),
    api_key: input('api_key').value.trim(),
    model: input('model').value.trim(),
    headers,
    timeout,
    temperature,
    max_tokens
  }
}

async function handleSave() {
  try {
    const data = readForm()
    if (!data.base_url) throw new Error('Base URL is required')
    if (!data.model) throw new Error('Model is required')

    const all = await getProfiles()
    if (editingId) {
      const idx = all.findIndex(x => x.id === editingId)
      if (idx >= 0) all[idx] = { ...all[idx], ...data }
    } else {
      all.push({ id: genId(), ...data })
    }
    await saveProfiles(all)
    await refreshList()
    resetForm()
    setStatus('Saved')
  } catch (err: any) {
    setStatus(err?.message || 'Error', true)
  }
}

async function handleExport() {
  const profiles = await getProfiles()
  const blob = new Blob([JSON.stringify(profiles, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'profiles.json'
  a.click()
  URL.revokeObjectURL(url)
}

async function handleImport(file: File) {
  const text = await file.text()
  const parsed = parseJSON(text)
  if (!parsed.ok || !Array.isArray(parsed.value)) {
    setStatus('Invalid import format: expected an array', true)
    return
  }
  const incoming = parsed.value as Profile[]
  // Normalize: assign ids if missing
  for (const p of incoming) {
    if (!(p as any).id) (p as any).id = genId()
  }
  const existing = await getProfiles()
  const map = new Map<string, Profile>()
  for (const p of existing) map.set(p.id, p)
  for (const p of incoming) map.set(p.id, p)
  await saveProfiles(Array.from(map.values()))
  await refreshList()
  setStatus('Imported')
}

async function handleClearAll() {
  if (!confirm('Delete all saved profiles?')) return
  await clearProfiles()
  await refreshList()
  resetForm()
  setStatus('Cleared')
}

function setupEvents() {
  $('#saveBtn').addEventListener('click', () => { void handleSave() })
  $('#resetBtn').addEventListener('click', resetForm)
  $('#exportBtn').addEventListener('click', () => { void handleExport() })
  $('#clearAllBtn').addEventListener('click', () => { void handleClearAll() })

  const importInput = document.getElementById('importFile') as HTMLInputElement
  const importBtn = document.getElementById('importBtn') as HTMLButtonElement
  importBtn.addEventListener('click', () => importInput.click())
  importInput.addEventListener('change', () => {
    const file = importInput.files?.[0]
    if (file) void handleImport(file)
    importInput.value = ''
  })
}

async function init() {
  setupEvents()
  await refreshList()
}

init()
