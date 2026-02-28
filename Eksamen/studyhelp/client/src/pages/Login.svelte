<script>
    import {fetchPost} from '../../util/fetchUtil.js'
    import { navigate } from "svelte-routing";
    import toastrDisplayHTTPCode from "../../util/ToastrUtil.js"
    import './pagesCss/login.css';

  let email;
  let password;
  let username
  let needsVerification = false
  let verificationCode = "";
  let isSignup = false;
  let forgotMode = false;
  let awaitingReset = false;
  let forgotEmail = "";
  let resetToken = "";
  let newPassword = "";

  async function handleLogin(event) {
    event.preventDefault(); 

    const body = {email,password}

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
    const data = await fetchPost("/api/verify",request);
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

  async function handleForgotRequest (event) {
    event.preventDefault()
    const request = { email: forgotEmail }
    const data = await fetchPost('/api/password/forgot', request)
    toastrDisplayHTTPCode(data.status, data.message)
    if (data.status === 200) {
      awaitingReset = true
    }
  }

  async function handlePasswordReset (event) {
    event.preventDefault()
    const request = { email: forgotEmail, token: resetToken, password: newPassword }
    const data = await fetchPost('/api/password/reset', request)
    toastrDisplayHTTPCode(data.status, data.message)
    if (data.status === 200) {
      awaitingReset = false
      forgotMode = false
      newPassword = ''
      resetToken = ''
      forgotEmail = ''
    }
  }
</script>

{#if !isSignup}

<form class="auth-form" on:submit={handleLogin}>
<h1>Login</h1>
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
        Register New Account
    </button>
    <button type="button" on:click={() => {
        forgotMode = !forgotMode;
        awaitingReset = false;
        resetToken = "";
        newPassword = "";
        if (forgotMode && email) {
            forgotEmail = email;
        }
    }}>
        {forgotMode ? "Back to Login" : "Forgot password?"}
    </button>
</form>
{/if}


{#if isSignup}

<form class="auth-form" on:submit={handleSignup}>
<h1>Register New Account</h1>
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

{#if forgotMode}
<section style="margin-top: 2rem;">
    <h2>Password recovery</h2>
    <form on:submit={handleForgotRequest}>
        <label for="forgotEmail">Your email</label>
        <input id="forgotEmail" type="email" bind:value={forgotEmail} required />
        <button type="submit">Send recovery code</button>
    </form>

    {#if awaitingReset}
        <form on:submit={handlePasswordReset} style="margin-top:1rem;">
            <label for="resetToken">Recovery code</label>
            <input id="resetToken" type="text" bind:value={resetToken} required />

            <label for="newPassword">New password</label>
            <input id="newPassword" type="password" bind:value={newPassword} required />

            <button type="submit">Update password</button>
        </form>
    {/if}
</section>
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
