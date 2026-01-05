<script>
  import { onMount } from 'svelte'
  import { navigate } from 'svelte-routing'
  import { fetchGet, fetchPost } from '../../util/fetchUtil'
  import { user, loading } from '../store/userStore'
  import toastrDisplayHTTPCode from '../../util/ToastrUtil.js'

  onMount(async () => {
    const response = await fetchGet('/users/id')
    if (response.status !== 200) {
      toastrDisplayHTTPCode(response.status, response.data.message)
      navigate('/login')
    } else {
      user.set(response.data)
      loading.set(false)
    }
  })

  async function logout () {
    const response = await fetchPost('/api/logout', {})
    toastrDisplayHTTPCode(response.status, response.message)
    if (response.status === 200) {
      user.set({ username: '', email: '', role: '' })
      loading.set(true)
      navigate('/login')
    }
  }
</script>

{#if $loading}
  <p>Loading profile</p>
{:else}
  <div class="profile">
    <h1>Profile</h1>
    <p><strong>Username:</strong> {$user.username}</p>
    <p><strong>Email:</strong> {$user.email}</p>
    <p><strong>Role:</strong> {$user.role}</p>
    <button on:click={logout}>Logout</button>
    <button on:click={() => navigate('/study-room')}>Enter Study Room</button>
  </div>
{/if}
