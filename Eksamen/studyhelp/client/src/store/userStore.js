import { writable } from 'svelte/store'

export const user = writable({ username: '', email: '', role: '' })
export const loading = writable(true)
