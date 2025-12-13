<script>
    import {fetchPost} from '../../util/fetchUtil.js'
    import { navigate } from "svelte-routing";
    import toastrDisplayHTTPCode from "../../util/ToastrUtil.js"

  let email;
  let password;
  let username
  let needsVerification = false
  let verificationCode = "";
  let isSignup = false;

  async function handleLogin(event) {
    event.preventDefault(); 

    const body = {email,password}
    console.log(email,password)

    const data = await fetchPost("/api/login",body)
    toastrDisplayHTTPCode(data.status,data.message)

    if(data.status === 200){
      navigate("/profile")

    } else if(data.status === 403) {
      needsVerification = true;     
    }
  }


  async function handleVerification(event) {
    event.preventDefault();

    const request = {email,verificationCode}
    const data = await fetchPost("/api/vaify",request);
    toastrDisplayHTTPCode(data.status,data.message)

    if (data.status === 200) {
      needsVerification = false;
    }
  }


  async function handleSignup(event) {
    event.preventDefault();
    const request = {email, password, username}
    const data = await fetchPost("/api/users",request);
    toastrDisplayHTTPCode(data.status,data.message)

    if (data.status === 201) {
      isSignup = false;
      needsVerification = true
    } 
  }
</script>

{#if !isSignup}
<h1>Login Page</h1>

<form on:submit={handleLogin}>
    <div>
        <label for="email">email:</label>
        <input id="email" type="email" bind:value={email} required />
    </div>

    <div>
        <label for="password">password:</label>
        <input id="password" type="password" bind:value={password} required />
    </div>

    <button type="submit">Login</button>

    <button type="button" on:click={() => isSignup = true}>
        Go to Signup
    </button>
</form>
{/if}


{#if isSignup}
<h1>Signup Page</h1>

<form on:submit={handleSignup}>
    <div>
        <label for="email">email:</label>
        <input id="email" type="email" bind:value={email} required />
    </div>

    <div>
        <label for="password">password:</label>
        <input id="password" type="password" bind:value={password} required />
    </div>

    <div>
        <label for="username">username:</label>
        <input id="username" type="username" bind:value={username} required />
    </div>

    <button type="submit">Create Account</button>

    <button type="button" on:click={() => isSignup = false}>
        Go to Login
    </button>
</form>
{/if}



{#if needsVerification}
<div style="margin-top:20px; padding:15px; border:1px solid #ccc;">
    <h3>Enter Verification Code</h3>

    <form on:submit={handleVerification}>
        <input 
            type="text" 
            placeholder="Verification code"
            bind:value={verificationCode}
            required
        />
        <button type="submit">Verify Account</button>
    </form>
</div>
{/if}