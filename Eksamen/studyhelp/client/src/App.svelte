<script>
  import { onMount } from 'svelte'
  import { Router, Link, Route } from 'svelte-routing'
  import 'toastr/build/toastr.min.css'
  import Login from './pages/Login.svelte'
  import Profile from './pages/Profile.svelte'
  import StudyRoom from './pages/StudyRoom.svelte'
  import Calendar from './pages/Calendar.svelte'
  import { user, isAuthenticated } from './store/userStore'
  import { fetchGet } from '../util/fetchUtil.js'

  onMount(async () => {
    const response = await fetchGet('/users/id')
    if (response?.status === 200) {
      user.set(response.data)
    } else {
      user.set({ username: '', email: '', role: '' })
    }
  })
</script>

<Router>
  <header class="nav">
    <div class="logo">
      <Link to='/'>Study Helper</Link>
    </div>
    <nav class="nav-links">
      <Link to='/'>Home</Link>
      {#if !$isAuthenticated}
        <Link to='/login'>Login</Link>
      {/if}
      {#if $isAuthenticated}
        <Link to='/profile'>Profile</Link>
        <Link to='/study-room'>Study Room</Link>
        <Link to='/calendar'>Calendar</Link>
      {/if}
    </nav>
  </header>
  <main class="page-content">
    <Route path='/'>
      <section class="hero">
        <p class="eyebrow">Focus. Share. Succeed.</p>
        <h1>Study Helper</h1>
        <p>Organize your revision, share tips in real time, and keep your focus sharp.</p>
        <div class="hero-actions">
          {#if $isAuthenticated}
            <Link to='/study-room' class="primary">Enter Study Room</Link>
            <Link to='/profile' class="secondary">View Profile</Link>
          {:else}
            <Link to='/login' class="primary">Login or Signup</Link>
            <Link to='/login' class="secondary">Need an account?</Link>
          {/if}
        </div>
      </section>
    </Route>
    <Route path='/login'><Login /></Route>
    <Route path='/profile'><Profile /></Route>
    <Route path='/study-room'><StudyRoom /></Route>
    <Route path='/calendar'><Calendar /></Route>
  </main>
</Router>
