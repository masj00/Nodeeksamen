<script>
  import { onMount } from 'svelte'
  import { navigate } from 'svelte-routing'
  import { fetchGet, fetchPost, fetchDelete } from '../../util/fetchUtil'
  import toastrDisplayHTTPCode from '../../util/ToastrUtil.js'
  import { user } from '../store/userStore'
  import './pagesCss/calendar.css';

  let isReady = false
  let isLoading = false

  let reminders = []

  let formTitle = ''
  let formDate = ''
  let formTime = ''
  
  let currentMonth = new Date()
  const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  const pad = value => value.toString().padStart(2, '0')

  function buildMonthCells (date) {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const startIndex = (firstDay.getDay() + 6) % 7
    const cells = []

    for (let i = 0; i < startIndex; i += 1) {
      cells.push(null)
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
      const dateKey = `${year}-${pad(month + 1)}-${pad(day)}`
      cells.push({ day, dateKey })
    }

    const remainder = cells.length % 7
    if (remainder !== 0) {
      const fill = 7 - remainder
      for (let i = 0; i < fill; i += 1) {
        cells.push(null)
      }
    }

    return cells
  }

  const formatDateLabel = value =>
    new Date(`${value}T00:00:00`).toLocaleDateString([], { month: 'short', day: 'numeric' })

  const formatReminderLine = reminder =>
    reminder.reminder_time
      ? `${formatDateLabel(reminder.reminder_date)} · ${reminder.reminder_time}`
      : formatDateLabel(reminder.reminder_date)

  const getMonthKey = date => `${date.getFullYear()}-${pad(date.getMonth() + 1)}`

  $: monthKey = getMonthKey(currentMonth)
  $: monthLabel = currentMonth.toLocaleDateString([], { month: 'long', year: 'numeric' })
  $: monthCells = buildMonthCells(currentMonth)
  $: remindersByDate = reminders.reduce((acc, reminder) => {
    const key = reminder.reminder_date
    if (!acc[key]) acc[key] = []
    acc[key].push(reminder)
    return acc
  }, {})

  async function loadReminders (monthOverride = monthKey) {
    isLoading = true
    const response = await fetchGet(`/api/reminders?month=${encodeURIComponent(monthOverride)}`)
    if (response.status !== 200) {
      toastrDisplayHTTPCode(response.status, response.data.message)
      reminders = []
      isLoading = false
      return
    }
    reminders = response.data.reminders || []
    isLoading = false
  }

  async function createReminder (event) {
    event.preventDefault()
    if (!formTitle.trim() || !formDate) {
      return
    }
    const payload = {
      title: formTitle.trim(),
      date: formDate,
      time: formTime || null
    }
    const response = await fetchPost('/api/reminders', payload)
    toastrDisplayHTTPCode(response.status, response.message)
    if (response.status === 201) {
      formTitle = ''
      formTime = ''
      if (formDate.startsWith(monthKey)) {
        reminders = [...reminders, response.reminder].sort((a, b) =>
          `${a.reminder_date} ${a.reminder_time || ''}`.localeCompare(
            `${b.reminder_date} ${b.reminder_time || ''}`
          )
        )
      } else {
        await loadReminders()
      }
    }
  }

  async function deleteReminder (reminderId) {
    const response = await fetchDelete(`/api/reminders/${reminderId}`)
    toastrDisplayHTTPCode(response.status, response.message)
    if (response.status === 200) {
      reminders = reminders.filter(reminder => reminder.id !== reminderId)
    }
  }

  function changeMonth (offset) {
    const next = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + offset, 1)
    currentMonth = next
    formDate = `${next.getFullYear()}-${pad(next.getMonth() + 1)}-01`
    loadReminders(getMonthKey(next))
  }

  onMount(async () => {
    const response = await fetchGet('/users/id')
    if (response.status !== 200) {
      toastrDisplayHTTPCode(response.status, response.data.message)
      navigate('/login')
      return
    }
    user.set(response.data)
    formDate = new Date().toISOString().slice(0, 10)
    await loadReminders()
    isReady = true
  })
</script>

{#if !isReady}
  <p>Loading calendar...</p>
{:else}
  <section class="calendar">
    <header class="calendar-header">
      <div>
        <p class="eyebrow">Reminders</p>
        <h1>Study Calendar</h1>
        <p class="subtext">Add reminders and see them in your personal calendar.</p>
      </div>
    </header>

    <div class="calendar-layout">
      <section class="panel reminders-panel">
        <div class="panel-header">
          <h3>Your reminders</h3>
          <span class="count">{reminders.length}</span>
        </div>
        <form class="reminder-form" on:submit={createReminder}>
          <label for="reminderTitle">Reminder title</label>
          <input
            id="reminderTitle"
            type="text"
            placeholder="e.g. Review chapter 4"
            bind:value={formTitle}
            maxlength="120"
            required
          />
          <label for="reminderDate">Date</label>
          <input id="reminderDate" type="date" bind:value={formDate} required />
          <label for="reminderTime">Time (optional)</label>
          <input id="reminderTime" type="time" bind:value={formTime} />
          <button type="submit" disabled={isLoading}>Add reminder</button>
        </form>
        {#if reminders.length === 0}
          <p class="empty">No reminders for this month.</p>
        {:else}
          <ul class="reminder-list">
            {#each reminders as reminder (reminder.id)}
              <li>
                <div>
                  <h4>{reminder.title}</h4>
                  <p>{formatReminderLine(reminder)}</p>
                </div>
                <button
                  type="button"
                  class="icon-button"
                  on:click={() => deleteReminder(reminder.id)}
                  aria-label="Delete reminder">
                  ×
                </button>
              </li>
            {/each}
          </ul>
        {/if}
      </section>

      <section class="panel calendar-panel">
        <div class="panel-header">
          <h3>Calendar</h3>
          <div class="month-nav">
            <button type="button" class="ghost" on:click={() => changeMonth(-1)}>Prev</button>
            <span>{monthLabel}</span>
            <button type="button" class="ghost" on:click={() => changeMonth(1)}>Next</button>
          </div>
        </div>
        <div class="weekday-row">
          {#each weekdays as day}
            <span>{day}</span>
          {/each}
        </div>
        <div class="month-grid">
          {#each monthCells as cell, index (index)}
            <div class:empty={!cell} class="day-cell">
              {#if cell}
                <span class="day-number">{cell.day}</span>
                {#if remindersByDate[cell.dateKey]}
                  <ul class="day-reminders">
                    {#each remindersByDate[cell.dateKey] as reminder (reminder.id)}
                      <li>{reminder.title}</li>
                    {/each}
                  </ul>
                {/if}
              {/if}
            </div>
          {/each}
        </div>
      </section>
    </div>
  </section>
{/if}
