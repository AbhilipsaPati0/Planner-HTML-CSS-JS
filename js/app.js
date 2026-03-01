/* ==========================================
   PLANIT — Your Life, Organized
   app.js
   ========================================== */

// ===== STATE =====
let tasks  = JSON.parse(localStorage.getItem('planit_tasks')  || '[]');
let habits = JSON.parse(localStorage.getItem('planit_habits') || 'null') || [
  { id: 1, title: 'Morning Run',     icon: '🏃', color: 'coral',  streak: 5,  done: [1,2,3,4,5] },
  { id: 2, title: 'Read 20 Pages',   icon: '📚', color: 'indigo', streak: 12, done: [1,2,3,4,5,6,7,8,9,10,11,12] },
  { id: 3, title: 'Meditate',        icon: '🧘', color: 'mint',   streak: 3,  done: [1,2,3] },
  { id: 4, title: 'Drink 8 Glasses', icon: '💧', color: 'amber',  streak: 7,  done: [1,2,3,4,5,6,7] },
];

const today       = new Date();
let currentDay    = new Date(today);
let calMonth      = new Date(today);
let monthView     = new Date(today);
let weekStart     = getWeekStart(today);
let selectedColor = 'coral';

const quotes = [
  { text: "The secret of getting ahead is getting started.",                               author: "Mark Twain" },
  { text: "Focus on being productive instead of busy.",                                    author: "Tim Ferriss" },
  { text: "You don't have to be great to start, but you have to start to be great.",       author: "Zig Ziglar" },
  { text: "Plan your work and work your plan.",                                             author: "Napoleon Hill" },
  { text: "A goal without a plan is just a wish.",                                          author: "Antoine de Saint-Exupéry" },
];

// ===== INIT =====
function init() {
  if (tasks.length === 0) {
    const td = formatDate(today);
    tasks = [
      { id: Date.now()+1, title: 'Morning standup',          time: '09:00', date: td, color: 'coral',  cat: 'Meeting', done: false },
      { id: Date.now()+2, title: 'Deep work: Design system', time: '10:00', date: td, color: 'indigo', cat: 'Work',    done: false },
      { id: Date.now()+3, title: 'Lunch & walk',             time: '13:00', date: td, color: 'mint',   cat: 'Health',  done: true  },
      { id: Date.now()+4, title: 'Review pull requests',     time: '15:00', date: td, color: 'amber',  cat: 'Work',    done: false },
      { id: Date.now()+5, title: 'Team retrospective',       time: '16:30', date: td, color: 'rose',   cat: 'Meeting', done: false },
    ];
    saveTasks();
  }
  setQuote();
  updateNavDate();
  renderTimeline();
  renderMiniCal();
  renderWeekly();
  renderMonthly();
  renderHabits();
  updateProgress();
}

// ===== HELPERS =====
function formatDate(d) {
  return d.toISOString().split('T')[0];
}

function getWeekStart(d) {
  const day = new Date(d);
  day.setDate(day.getDate() - day.getDay());
  return day;
}

function setQuote() {
  const q = quotes[Math.floor(Math.random() * quotes.length)];
  document.getElementById('quoteText').textContent   = `"${q.text}"`;
  document.getElementById('quoteAuthor').textContent = `— ${q.author}`;
}

function updateNavDate() {
  document.getElementById('navDate').textContent =
    today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

// ===== VIEW SWITCHING =====
function switchView(view, btn) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.nav-tabs button').forEach(b => b.classList.remove('active'));
  document.getElementById('view-' + view).classList.add('active');
  btn.classList.add('active');
}

// ===== TIMELINE =====
function renderTimeline() {
  const tl      = document.getElementById('timeline');
  const dateStr = formatDate(currentDay);
  const label   = currentDay.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  document.getElementById('currentDayLabel').textContent = label;

  let html = '';
  for (let h = 7; h <= 21; h++) {
    const hStr  = h.toString().padStart(2, '0') + ':00';
    const hStr30 = h.toString().padStart(2, '0') + ':30';
    const tLabel = h > 12 ? `${h - 12}PM` : h === 12 ? '12PM' : `${h}AM`;

    const task00 = tasks.find(t => t.date === dateStr && t.time === hStr);
    const task30 = tasks.find(t => t.date === dateStr && t.time === hStr30);

    html += `
      <div class="time-slot">
        <div class="time-label">${tLabel}</div>
        <div class="time-content">
          ${task00
            ? `<div class="task-item ${task00.color}${task00.done ? ' done' : ''}" data-id="${task00.id}">
                 <span>${task00.title}</span>
                 <div class="task-check${task00.done ? ' checked' : ''}" onclick="toggleTask(event,${task00.id})">${task00.done ? '✓' : ''}</div>
               </div>`
            : `<div class="empty-slot" onclick="openModalAt('${hStr}')"></div>`}
        </div>
      </div>`;

    if (task30) {
      html += `
        <div class="time-slot">
          <div class="time-label" style="font-size:0.65rem;color:rgba(255,255,255,0.25)">:30</div>
          <div class="time-content">
            <div class="task-item ${task30.color}${task30.done ? ' done' : ''}" data-id="${task30.id}">
              <span>${task30.title}</span>
              <div class="task-check${task30.done ? ' checked' : ''}" onclick="toggleTask(event,${task30.id})">${task30.done ? '✓' : ''}</div>
            </div>
          </div>
        </div>`;
    }
  }

  tl.innerHTML = html;
  updateProgress();
}

function changeDay(dir) {
  currentDay.setDate(currentDay.getDate() + dir);
  renderTimeline();
}

function toggleTask(e, id) {
  e.stopPropagation();
  const t = tasks.find(t => t.id === id);
  if (t) { t.done = !t.done; saveTasks(); renderTimeline(); }
}

function updateProgress() {
  const dateStr  = formatDate(currentDay);
  const dayTasks = tasks.filter(t => t.date === dateStr);
  const done     = dayTasks.filter(t => t.done).length;
  const total    = dayTasks.length;
  const pct      = total ? Math.round((done / total) * 100) : 0;

  const circumference = 276.5;
  document.getElementById('ringFill').style.strokeDashoffset = circumference - (pct / 100) * circumference;
  document.getElementById('progressPct').textContent   = pct + '%';
  document.getElementById('progressLabel').textContent = `${done} of ${total} tasks done`;
}

// ===== MINI CALENDAR =====
function renderMiniCal() {
  const title = calMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  document.getElementById('miniCalTitle').textContent = title;

  const first    = new Date(calMonth.getFullYear(), calMonth.getMonth(), 1);
  const last     = new Date(calMonth.getFullYear(), calMonth.getMonth() + 1, 0);
  const startDay = first.getDay();

  let html = '';
  for (let i = 0; i < startDay; i++) {
    const d = new Date(first);
    d.setDate(d.getDate() - (startDay - i));
    html += `<div class="cal-day other-month">${d.getDate()}</div>`;
  }
  for (let d = 1; d <= last.getDate(); d++) {
    const isToday  = d === today.getDate() && calMonth.getMonth() === today.getMonth() && calMonth.getFullYear() === today.getFullYear();
    const dateStr  = `${calMonth.getFullYear()}-${String(calMonth.getMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const hasTasks = tasks.some(t => t.date === dateStr);
    html += `<div class="cal-day${isToday ? ' today' : ''}${hasTasks ? ' has-task' : ''}" onclick="goToDay(${d})">${d}</div>`;
  }
  document.getElementById('miniCalGrid').innerHTML = html;
}

function goToDay(d) {
  currentDay = new Date(calMonth.getFullYear(), calMonth.getMonth(), d);
  renderTimeline();
}

function changeMonth(dir) {
  calMonth.setMonth(calMonth.getMonth() + dir);
  renderMiniCal();
}

// ===== WEEKLY VIEW =====
function renderWeekly() {
  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    days.push(d);
  }

  const startStr = days[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const endStr   = days[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  document.getElementById('weekLabel').textContent = `${startStr} – ${endStr}`;

  // Header row
  let headerHtml = '<div></div>';
  days.forEach(d => {
    const isToday = formatDate(d) === formatDate(today);
    const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
    headerHtml += `
      <div class="week-day-header${isToday ? ' today-col' : ''}">
        <div class="day-name">${dayName}</div>
        <div class="day-num">${d.getDate()}</div>
      </div>`;
  });
  document.getElementById('weekHeaderRow').innerHTML = headerHtml;

  const hours = [];
  for (let h = 7; h <= 20; h++) hours.push(h);

  // Time column
  let timeHtml = '';
  hours.forEach(h => {
    const tLabel = h > 12 ? `${h - 12}PM` : h === 12 ? '12PM' : `${h}AM`;
    timeHtml += `<div class="week-hour">${tLabel}</div>`;
  });
  document.getElementById('weekTimeCol').innerHTML = timeHtml;

  // Day columns
  const body = document.getElementById('weeklyBody');
  body.querySelectorAll('.week-col').forEach(c => c.remove());

  days.forEach(d => {
    const dateStr = formatDate(d);
    let colHtml   = '';
    hours.forEach(h => {
      const hStr = h.toString().padStart(2, '0') + ':00';
      const task = tasks.find(t => t.date === dateStr && t.time === hStr);
      colHtml += `<div class="week-cell" onclick="openModalAtDate('${hStr}','${dateStr}')">`;
      if (task) {
        colHtml += `<div class="week-event ${task.color}">${task.title}<span style="font-size:0.65rem;opacity:0.7">${hStr}</span></div>`;
      }
      colHtml += '</div>';
    });
    const col       = document.createElement('div');
    col.className   = 'week-col';
    col.innerHTML   = colHtml;
    body.appendChild(col);
  });
}

function changeWeek(dir) {
  weekStart.setDate(weekStart.getDate() + dir * 7);
  renderWeekly();
}

// ===== MONTHLY VIEW =====
function renderMonthly() {
  const title = monthView.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  document.getElementById('monthTitle').textContent = title;

  const first    = new Date(monthView.getFullYear(), monthView.getMonth(), 1);
  const last     = new Date(monthView.getFullYear(), monthView.getMonth() + 1, 0);
  const startDay = first.getDay();

  let html = '';

  // Previous month padding
  for (let i = 0; i < startDay; i++) {
    const d = new Date(first);
    d.setDate(d.getDate() - (startDay - i));
    html += `<div class="month-cell other"><div class="month-num" style="opacity:0.3">${d.getDate()}</div></div>`;
  }

  for (let d = 1; d <= last.getDate(); d++) {
    const dateStr  = `${monthView.getFullYear()}-${String(monthView.getMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const isToday  = dateStr === formatDate(today);
    const dayTasks = tasks.filter(t => t.date === dateStr);
    const dots     = dayTasks.slice(0, 3).map(t => `<div class="month-dot ${t.color}">${t.title}</div>`).join('');

    html += `
      <div class="month-cell${isToday ? ' today-cell' : ''}" onclick="openModalAtDate('09:00','${dateStr}')">
        <div class="month-num">${d}</div>
        <div class="month-dots">${dots}</div>
      </div>`;
  }

  document.getElementById('monthlyGrid').innerHTML = html;
}

function changeMonthView(dir) {
  monthView.setMonth(monthView.getMonth() + dir);
  renderMonthly();
}

// ===== HABITS =====
function renderHabits() {
  const total     = habits.reduce((a, h) => a + h.streak, 0);
  const maxStreak = Math.max(...habits.map(h => h.streak));
  const monthlyAvg = Math.round(habits.reduce((a, h) => a + (h.done.length / 30), 0) / habits.length * 100);

  document.getElementById('habitStats').innerHTML = `
    <div class="stat-card"><div class="stat-num">${habits.length}</div><div class="stat-label">Active Habits</div></div>
    <div class="stat-card"><div class="stat-num">${maxStreak}</div><div class="stat-label">Best Streak</div></div>
    <div class="stat-card"><div class="stat-num">${total}</div><div class="stat-label">Total Streaks</div></div>
    <div class="stat-card"><div class="stat-num">${monthlyAvg}%</div><div class="stat-label">Monthly Avg</div></div>
  `;

  let html = '';
  habits.forEach(h => {
    const pct = Math.round((h.done.length / 30) * 100);
    let dots  = '';
    for (let i = 1; i <= 21; i++) {
      const isDone = h.done.includes(i);
      dots += `<button class="habit-dot${isDone ? ' done' : ''}" onclick="toggleHabitDay(${h.id},${i})">${i}</button>`;
    }
    html += `
      <div class="habit-card">
        <div class="habit-top">
          <div style="display:flex;align-items:center;gap:12px">
            <div class="habit-icon">${h.icon}</div>
            <div class="habit-title">${h.title}</div>
          </div>
          <div class="habit-streak">🔥 ${h.streak}</div>
        </div>
        <div class="habit-months">Day tracking (this month)</div>
        <div class="habit-dots">${dots}</div>
        <div class="habit-progress"><div class="habit-progress-bar" style="width:${pct}%"></div></div>
        <div style="font-size:0.75rem;color:var(--muted);margin-top:8px">${pct}% completion this month</div>
      </div>`;
  });

  document.getElementById('habitsGrid').innerHTML = html;
  saveHabits();
}

function toggleHabitDay(id, day) {
  const h = habits.find(h => h.id === id);
  if (!h) return;
  const idx = h.done.indexOf(day);
  if (idx === -1) { h.done.push(day); h.done.sort((a, b) => a - b); }
  else             { h.done.splice(idx, 1); }

  // Recalculate streak from today backwards
  h.streak = (function() {
    let s = 0;
    for (let i = today.getDate(); i >= 1; i--) {
      if (h.done.includes(i)) s++; else break;
    }
    return s;
  })();

  renderHabits();
}

function addHabit() {
  const name = prompt('New habit name:');
  if (!name) return;
  const icons  = ['⭐','🎯','💪','🧠','🌱','✍️','🎨','🎵'];
  const colors = ['coral','indigo','mint','amber','rose'];
  const icon   = icons[Math.floor(Math.random() * icons.length)];
  const color  = colors[habits.length % colors.length];
  habits.push({ id: Date.now(), title: name, icon, color, streak: 0, done: [] });
  renderHabits();
  showToast('Habit added! Keep it up 🔥');
}

// ===== MODAL =====
function openModal(time, date) {
  const modal     = document.getElementById('modalOverlay');
  const dateInput = document.getElementById('taskDate');
  dateInput.value = date || formatDate(currentDay);
  if (time) document.getElementById('taskTime').value = time;
  modal.classList.add('open');
}

function openModalAt(time)          { openModal(time, formatDate(currentDay)); }
function openModalAtDate(time, date){ openModal(time, date); }

function closeModal() {
  document.getElementById('modalOverlay').classList.remove('open');
}

function closeModalOutside(e) {
  if (e.target.id === 'modalOverlay') closeModal();
}

function selectColor(el) {
  document.querySelectorAll('.color-dot').forEach(d => d.classList.remove('selected'));
  el.classList.add('selected');
  selectedColor = el.dataset.color;
}

function saveTask() {
  const title = document.getElementById('taskTitle').value.trim();
  if (!title) { showToast('Please enter a task title!'); return; }

  const task = {
    id:    Date.now(),
    title,
    time:  document.getElementById('taskTime').value,
    date:  document.getElementById('taskDate').value,
    color: selectedColor,
    cat:   document.getElementById('taskCat').value,
    notes: document.getElementById('taskNotes').value,
    done:  false,
  };

  tasks.push(task);
  saveTasks();
  renderTimeline();
  renderMiniCal();
  renderWeekly();
  renderMonthly();
  closeModal();
  document.getElementById('taskTitle').value = '';
  document.getElementById('taskNotes').value = '';
  showToast('Task added! ✦');
}

// ===== MOOD =====
function setMood(el) {
  document.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('selected'));
  el.classList.add('selected');
  showToast('Mood logged! Have a great day 😊');
}

// ===== TOAST =====
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3000);
}

// ===== LOCAL STORAGE =====
function saveTasks()  { localStorage.setItem('planit_tasks',  JSON.stringify(tasks));  }
function saveHabits() { localStorage.setItem('planit_habits', JSON.stringify(habits)); }

// ===== BOOTSTRAP =====
init();
