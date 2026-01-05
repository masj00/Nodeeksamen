<script>
  import { onMount, onDestroy } from 'svelte'
  import { get } from 'svelte/store'
  import { navigate } from 'svelte-routing'
  import { io } from 'socket.io-client'
  import { user } from '../store/userStore'
  import { fetchGet } from '../../util/fetchUtil'
  import toastrDisplayHTTPCode from '../../util/ToastrUtil.js'

  let socket
  let roomLoading = true
  let studyMessages = []
  let newStudyMessage = ''

  const BASE_URL = import.meta.env.VITE_BASE_URL || window.location.origin

  async function ensureSession () {
    const response = await fetchGet('/users/id')
    if (response.status !== 200) {
      toastrDisplayHTTPCode(response.status, response.data.message)
      navigate('/login')
      return false
    }
    user.set(response.data)
    return true
  }

  function initSocket () {
    socket = io(BASE_URL, {
      withCredentials: true
    })

    const handleHistory = history => {
      studyMessages = history
    }

    const handleIncoming = message => {
      studyMessages = [...studyMessages, message]
    }

    socket.on('study:history', handleHistory)
    socket.on('study:message', handleIncoming)

    return () => {
      socket.off('study:history', handleHistory)
      socket.off('study:message', handleIncoming)
    }
  }

  let cleanupListeners = null

  onMount(async () => {
    const ready = await ensureSession()
    if (!ready) {
      return
    }
    cleanupListeners = initSocket()
    roomLoading = false
  })

  onDestroy(() => {
    if (cleanupListeners) {
      cleanupListeners()
    }
    if (socket) {
      socket.disconnect()
    }
  })

  function sendStudyMessage (event) {
    event.preventDefault()
    if (!socket || !newStudyMessage.trim()) {
      return
    }

    const activeUser = get(user)
    socket.emit('study:message', {
      user: activeUser.username || 'Student',
      text: newStudyMessage.trim()
    })
    newStudyMessage = ''
  }

  function formatTime (value) {
    if (!value) return ''
    return new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }
</script>

{#if roomLoading}
  <p>Joining study room…</p>
{:else}
  <section class="study-room">
    <header>
      <h1>Study Room</h1>
      <button on:click={() => navigate('/profile')}>Back to Profile</button>
    </header>

    <ul class="study-messages">
      {#if studyMessages.length === 0}
        <li class="empty">No messages yet. Be the first to share a study tip!</li>
      {:else}
        {#each studyMessages as message (message.id)}
          <li>
            <div class="meta">
              <strong>{message.user}</strong>
              <span>{formatTime(message.createdAt)}</span>
            </div>
            <p>{message.text}</p>
          </li>
        {/each}
      {/if}
    </ul>

    <form class="study-form" on:submit={sendStudyMessage}>
      <input
        type="text"
        placeholder="Share a study tip or encourage others..."
        bind:value={newStudyMessage}
        required
        maxlength="400"
      />
      <button type="submit">Send</button>
    </form>
  </section>
{/if}
