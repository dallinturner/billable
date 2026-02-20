// Background service worker — keeps timer state across popup open/close

import { TimerState } from './types'

// Wake up on alarm to keep timer state fresh
chrome.alarms.create('timer-tick', { periodInMinutes: 1 })

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'timer-tick') {
    chrome.storage.local.get(['timerState'], (_result) => {
      // Timer state is managed by popup; alarm just keeps service worker alive
    })
  }
})

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'GET_TIMER') {
    chrome.storage.local.get(['timerState'], (result) => {
      sendResponse({ timerState: result.timerState ?? null })
    })
    return true // async response
  }

  if (message.type === 'SET_TIMER') {
    const state: TimerState = message.payload
    chrome.storage.local.set({ timerState: state }, () => {
      sendResponse({ ok: true })
    })
    return true
  }

  if (message.type === 'CLEAR_TIMER') {
    chrome.storage.local.remove('timerState', () => {
      sendResponse({ ok: true })
    })
    return true
  }
})

export {}
