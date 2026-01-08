import { writable, derived } from 'svelte/store'

export const user = writable({ username: '', email: '', role: '' })
export const loading = writable(true)
export const isAuthenticated = derived(user, $user => Boolean($user?.username))
