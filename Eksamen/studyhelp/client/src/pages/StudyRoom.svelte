<script>
  import { onMount, onDestroy } from 'svelte'
  import { get } from 'svelte/store'
  import { navigate } from 'svelte-routing'
  import { io } from 'socket.io-client'
  import { user } from '../store/userStore'
  import { fetchGet, fetchPost, fetchDelete } from '../../util/fetchUtil'
  import toastrDisplayHTTPCode from '../../util/ToastrUtil.js'

  let socket
  let cleanupListeners = null

  let rooms = []
  let roomsLoading = true
  let selectedRoom = null
  let currentUser = null

  let roomLoading = false
  let studyMessages = []
  let onlineUsers = []
  let newStudyMessage = ''
  let newRoomName = ''

  const BASE_URL = import.meta.env.VITE_BASE_URL || window.location.origin

  async function ensureSession () {
    // Frontend route guard: redirect to login when backend session is missing.
    const response = await fetchGet('/users/id')
    if (response.status !== 200) {
      toastrDisplayHTTPCode(response.status, response.data.message)
      navigate('/login')
      return false
    }
    user.set(response.data)
    currentUser = response.data
    return true
  }

  async function loadRooms () {
    roomsLoading = true
    const response = await fetchGet('/api/rooms')
    if (response.status !== 200) {
      toastrDisplayHTTPCode(response.status, response.data.message)
      rooms = []
      roomsLoading = false
      return
    }
    rooms = response.data.rooms
    roomsLoading = false

    if (rooms.length === 0) {
      if (cleanupListeners) {
        cleanupListeners()
        cleanupListeners = null
      }
      if (socket) {
        socket.disconnect()
        socket = null
      }
      selectedRoom = null
      studyMessages = []
      onlineUsers = []
      roomLoading = false
      return
    }

    const currentId = selectedRoom?.id
    if (!currentId) {
      handleRoomSelect(rooms[0])
      return
    }

    const match = rooms.find(room => room.id === currentId)
    if (match) {
      selectedRoom = match
      return
    }

    handleRoomSelect(rooms[0])
  }

  function handleRoomSelect (room) {
    if (!room) return
    if (selectedRoom && selectedRoom.id === room.id) return
    selectedRoom = room
    connectToSelectedRoom()
  }

  function connectToSelectedRoom () {
    if (!selectedRoom) {
      return
    }

    if (cleanupListeners) {
      cleanupListeners()
      cleanupListeners = null
    }
    if (socket) {
      socket.disconnect()
      socket = null
    }

    studyMessages = []
    onlineUsers = []
    roomLoading = true

    socket = io(BASE_URL, {
      withCredentials: true
    })

    const handleHistory = payload => {
      if (payload.roomId !== selectedRoom?.id) return
      studyMessages = payload.messages
      roomLoading = false
    }

    const handleIncoming = payload => {
      if (payload.roomId !== selectedRoom?.id) return
      studyMessages = [...studyMessages, payload.message]
    }

    const handlePresence = payload => {
      if (payload.roomId !== selectedRoom?.id) return
      onlineUsers = payload.participants
    }

    const handleError = payload => {
      toastrDisplayHTTPCode(400, payload?.message || 'Socket error')
    }

    socket.on('study:history', handleHistory)
    socket.on('study:message', handleIncoming)
    socket.on('study:presence', handlePresence)
    socket.on('study:error', handleError)

    const activeUser = get(user)
    socket.emit('study:join', {
      roomId: selectedRoom.id,
      user: activeUser.username || 'Student'
    })

    cleanupListeners = () => {
      socket.off('study:history', handleHistory)
      socket.off('study:message', handleIncoming)
      socket.off('study:presence', handlePresence)
      socket.off('study:error', handleError)
    }
  }

  onMount(async () => {
    const ready = await ensureSession()
    if (!ready) {
      return
    }
    await loadRooms()
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
    if (!socket || !selectedRoom || !newStudyMessage.trim()) {
      return
    }

    socket.emit('study:message', {
      text: newStudyMessage.trim()
    })
    newStudyMessage = ''
  }

  async function createRoom (event) {
    event.preventDefault()
    if (!newRoomName.trim()) {
      return
    }
    const response = await fetchPost('/api/rooms', { name: newRoomName })
    toastrDisplayHTTPCode(response.status, response.message)
    if (response.status === 201) {
      rooms = [...rooms, response.room]
      newRoomName = ''
      handleRoomSelect(response.room)
    }
  }

  function formatTime (value) {
    if (!value) return ''
    return new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  async function deleteRoom (roomId) {
    if (!roomId || !currentUser || currentUser.role !== 'ADMIN') {
      return
    }
    const response = await fetchDelete(`/api/rooms/${roomId}`)
    toastrDisplayHTTPCode(response.status, response.message)
    if (response.status === 200) {
      rooms = rooms.filter(room => room.id !== roomId)
      if (selectedRoom && selectedRoom.id === roomId) {
        selectedRoom = null
        studyMessages = []
        onlineUsers = []
      }
    }
  }

    async function deleteStudyMessage (messageId) {
    if (!messageId || !currentUser || currentUser.role !== 'ADMIN') {
      return
    }

    const response = await fetchDelete(`/api/messages/${messageId}`)
    toastrDisplayHTTPCode(response.status, response.message)
    if (response.status === 200) {
      studyMessages = studyMessages.filter(message => message.id !== messageId)
    }
  }
</script>

{#if roomsLoading}
  <p>Loading rooms...</p>
{:else}
  <div class="room-layout">
    <aside class="room-sidebar">
      <div class="sidebar-header">
        <h2>Study Rooms</h2>
        <button class="link-button" type="button" on:click={() => loadRooms()}>Refresh</button>
      </div>
      <ul class="room-list">
        {#if rooms.length === 0}
          <li class="empty">No rooms yet. Be the first to create one!</li>
        {:else}
          {#each rooms as room (room.id)}
            <li class:selected={selectedRoom && selectedRoom.id === room.id}>
              <div class="room-item">
                <button type="button" on:click={() => handleRoomSelect(room)}>
                  {room.name}
                </button>
                {#if currentUser?.role === 'ADMIN' && room.id !== 1}
                  <button
                    type="button"
                    class="icon-button"
                    on:click={() => deleteRoom(room.id)}
                    aria-label={`Delete ${room.name}`}>
                    x
                  </button>
                {/if}
              </div>
            </li>
          {/each}
        {/if}
      </ul>
      <form class="room-form" on:submit={createRoom}>
        <label for="roomName">Create a new room</label>
        <input
          id="roomName"
          type="text"
          placeholder="e.g. Programming"
          bind:value={newRoomName}
          maxlength="40"
          required
        />
        <button type="submit">Create room</button>
      </form>
    </aside>

    {#if !selectedRoom}
      <section class="study-room">
        <p>Select a room to join the conversation.</p>
      </section>
    {:else}
      <section class="study-room">
        <header>
          <div class="room-header">
            <h1>{selectedRoom.name}</h1>
            <small>#{selectedRoom.id}</small>
          </div>
          <button on:click={() => navigate('/profile')}>Back to Profile</button>
        </header>

        {#if roomLoading}
          <p>Loading room...</p>
        {:else}
          <div class="presence">
            <span>{onlineUsers.length} online</span>
            {#if onlineUsers.length > 0}
              <ul class="presence-list">
                {#each onlineUsers as participant (participant.id)}
                  <li>{participant.username}</li>
                {/each}
              </ul>
            {/if}
          </div>

           <ul class="study-messages">
            {#if studyMessages.length === 0}
              <li class="empty">No messages yet. Be the first to share a study tip!</li>
            {:else}
              {#each studyMessages as message (message.id)}
                <li>
                  <div class="meta">
                    <strong>{message.user}</strong>
                    <div class="meta-actions">
                      <span>{formatTime(message.createdAt)}</span>
                      {#if currentUser?.role === 'ADMIN'}
                        <button
                          type="button"
                          class="icon-button"
                          on:click={() => deleteStudyMessage(message.id)}
                          aria-label={`Delete message ${message.id}`}>
                          x
                        </button>
                      {/if}
                    </div>
                  </div>
                  <p>{message.text}</p>
                </li>
              {/each}
            {/if}
          </ul>

          <form class="study-form" on:submit={sendStudyMessage}>
            <input
              type="text"
              placeholder={`Share something with ${selectedRoom.name}...`}
              bind:value={newStudyMessage}
              required
              maxlength="400"
              disabled={roomLoading}
            />
            <button type="submit" disabled={roomLoading}>Send</button>
          </form>
        {/if}
      </section>
    {/if}
  </div>
{/if}
