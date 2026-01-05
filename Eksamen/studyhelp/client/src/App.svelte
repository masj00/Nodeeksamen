<script>
  import { Router, Link, Route } from 'svelte-routing'
  import 'toastr/build/toastr.min.css'
  import Login from './pages/Login.svelte'
  import Profile from './pages/Profile.svelte'
  import StudyRoom from './pages/StudyRoom.svelte'
</script>

<Router>
  <header class="nav">
    <div class="logo">
      <Link to='/'>Study Helper</Link>
    </div>
    <nav class="nav-links">
      <Link to='/'>Home</Link>
      <Link to='/login'>Login</Link>
      <Link to='/profile'>Profile</Link>
      <Link to='/study-room'>Study Room</Link>
    </nav>
  </header>
  <main class="page-content">
    <Route path='/'>
      <section class="hero">
        <p class="eyebrow">Focus. Share. Succeed.</p>
        <h1>Study Helper</h1>
        <p>Organize your revision, share tips in real time, and keep your focus sharp.</p>
        <div class="hero-actions">
          <Link to='/login' class="primary">Login or Signup</Link>
          <Link to='/study-room' class="secondary">Visit Study Room</Link>
        </div>
      </section>
    </Route>
    <Route path='/login'><Login /></Route>
    <Route path='/profile'><Profile /></Route>
    <Route path='/study-room'><StudyRoom /></Route>
  </main>
</Router>
