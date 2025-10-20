import { Profile } from './profiles'

const KEY = 'profiles'

export async function getProfiles(): Promise<Profile[]> {
  return new Promise((resolve) => {
    chrome.storage.local.get([KEY], (res) => {
      resolve((res?.[KEY] as Profile[]) || [])
    })
  })
}

export async function saveProfiles(profiles: Profile[]): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.set({ [KEY]: profiles }, () => resolve())
  })
}

export async function clearProfiles(): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.remove([KEY], () => resolve())
  })
}
