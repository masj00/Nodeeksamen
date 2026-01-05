<script>
  import { Router, Link, Route } from "svelte-routing";
  import 'toastr/build/toastr.min.css';
  import Login from "./pages/Login.svelte";
  import Profile from "./pages/Profile.svelte";
  import StudyRoom from "./pages/StudyRoom.svelte";
  
</script>


<Router>
  <nav class="nav">
    <Link to='/'>Home</Link>
    <Link to='/login'>login</Link>
    <Link to='/profile'>profile</Link>
    <Link to='/study-room'>study room</Link>
  </nav>
  <div>
    <Route path='/'>
      <h1>
        Study Helper
      </h1>
      <h2><span>Coming Soon™</span></h2>
    </Route>
    <Route path='/login'><Login /></Route>
    <Route path='/profile'><Profile /></Route>
    <Route path='/study-room'><StudyRoom /></Route>
  </div>
</Router>
