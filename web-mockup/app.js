/* ----------------------------------------------------
   mySun - Core Application Logic (Vanilla ES6 JS)
------------------------------------------------------- */

// 1. STATE & DATA STRUCTURES
let state = {
  username: "Kullanıcı",
  waterTarget: 2000,
  sleepTarget: 8,
  habits: [
    "10.000 Adım At",
    "Kitap Oku (20 sayfa)",
    "Ekran Süresini Sınırla",
    "Günde 5 Dakika Esneme"
  ],
  theme: "light",
  notificationsEnabled: true,
  history: {} // Format: "YYYY-MM-DD": { water: 0, sleep: 7.5, sleepQuality: 2, mood: 4, moodNote: "", habits: ["Kitap Oku"] }
};

// Turkish Month Names
const MONTH_NAMES = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
];

// Turkish Day Abbreviations
const DAY_ABBR = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"];

// Motivational Messages
const MOTIVATION_QUOTES = {
  morning: [
    "Günaydın! Bugün taze bir başlangıç yapmak için harika bir gün. ☀️",
    "Güne bir bardak su içerek başlamak bedenine en güzel hediyedir! 💧",
    "Yeni bir gün, yeni hedefler! Kendine nazik davranarak başla. 🌱"
  ],
  afternoon: [
    "Günün yarısı geride kaldı. Harika gidiyorsun! Küçük bir mola verip su içmeye ne dersin? 🥤",
    "Kendini yorgun hissediyorsan derin bir nefes al ve esne. Devam edecek gücün var. 💪",
    "Bugünkü alışkanlıklarını tamamlamak için hâlâ zamanın var. Adım adım ilerle! ✨"
  ],
  evening: [
    "Günün yorgunluğunu atmak için güzel bir akşam seni bekliyor. Dinlenmeyi unutma. 🌙",
    "Bugün gösterdiğin çaba için kendine teşekkür et. Harika bir iş çıkardın! 🌟",
    "Uykudan önce ekranları kapatmak, kaliteli bir uykunun anahtarıdır. 😴"
  ],
  progress: [
    "Harika! Bugünkü hedeflerinin yarısından fazlasını tamamladın bile! 🎉",
    "Muhteşem bir gün! Kendine iyi bakmak sana çok yakışıyor. ✨",
    "Bugünü tam başarıyla kapatmaya çok yakınsın, devam et! 🚀"
  ]
};

// Get current date string in local time format YYYY-MM-DD
function getTodayDateString() {
  const localDate = new Date();
  const year = localDate.getFullYear();
  const month = String(localDate.getMonth() + 1).padStart(2, '0');
  const day = String(localDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Get display date format for headers (e.g., "16 Temmuz")
function getFormattedDisplayDate(dateStr) {
  const d = dateStr ? new Date(dateStr) : new Date();
  return `${d.getDate()} ${MONTH_NAMES[d.getMonth()]}`;
}

// 2. LOCALSTORAGE INITIALIZATION
function loadState() {
  const savedState = localStorage.getItem("mySun_state");
  if (savedState) {
    try {
      state = JSON.parse(savedState);
      // Migrate old data if necessary (ensure habits array exists, etc)
      if (!state.habits) state.habits = ["10.000 Adım At", "Kitap Oku", "Ekran Süresini Sınırla"];
      if (!state.history) state.history = {};
      if (state.theme === undefined) state.theme = "light";
      if (state.notificationsEnabled === undefined) state.notificationsEnabled = true;
    } catch (e) {
      console.error("Error parsing saved state, initializing default state", e);
    }
  } else {
    // Populate dummy data for the last 6 days to make stats look beautiful immediately!
    const today = new Date();
    for (let i = 6; i > 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dateKey = `${year}-${month}-${day}`;
      
      // Random dummy healthy day
      state.history[dateKey] = {
        water: Math.round((1200 + Math.random() * 1200) / 250) * 250,
        sleep: Math.round((6 + Math.random() * 3.5) * 2) / 2,
        sleepQuality: Math.floor(Math.random() * 3) + 1,
        mood: Math.floor(Math.random() * 4) + 2, // Moods 2 to 5
        moodNote: "Bugün güzel bir gündü.",
        habits: state.habits.slice(0, Math.floor(Math.random() * (state.habits.length + 1)))
      };
    }
    saveState();
  }
}

function saveState() {
  localStorage.setItem("mySun_state", JSON.stringify(state));
}

// Ensure today's entry exists in state
function initTodayEntry() {
  const todayKey = getTodayDateString();
  if (!state.history[todayKey]) {
    state.history[todayKey] = {
      water: 0,
      sleep: 7.0,
      sleepQuality: 2, // Orta
      mood: 0, // Not selected yet
      moodNote: "",
      habits: []
    };
    saveState();
  }
}

// 3. UI RENDERING & COMPONENT MANAGERS

// Date and Greeting Setup
function renderHeaderAndGreeting() {
  const todayKey = getTodayDateString();
  document.getElementById("header-date").textContent = getFormattedDisplayDate(todayKey);
  
  const hour = new Date().getHours();
  let greeting = "Merhaba!";
  let quotePool = MOTIVATION_QUOTES.morning;
  
  if (hour >= 5 && hour < 12) {
    greeting = `Günaydın, ${state.username}!`;
    quotePool = MOTIVATION_QUOTES.morning;
  } else if (hour >= 12 && hour < 18) {
    greeting = `Tünaydın, ${state.username}!`;
    quotePool = MOTIVATION_QUOTES.afternoon;
  } else {
    greeting = `İyi Akşamlar, ${state.username}!`;
    quotePool = MOTIVATION_QUOTES.evening;
  }

  // If completion is high, choose progress motivation instead
  const progress = calculateDailyProgress(todayKey);
  if (progress >= 0.6) {
    quotePool = MOTIVATION_QUOTES.progress;
  }

  document.getElementById("greeting-text").textContent = greeting;
  
  // Pick random quote if not already set this session, or keep it fresh
  if (!window.currentQuote) {
    const randomIndex = Math.floor(Math.random() * quotePool.length);
    window.currentQuote = quotePool[randomIndex];
  }
  document.getElementById("motivational-message").textContent = window.currentQuote;
}

// Calculate total daily wellness score (0 to 1)
function calculateDailyProgress(dateKey) {
  const dayData = state.history[dateKey];
  if (!dayData) return 0;

  const waterScore = Math.min(1, dayData.water / state.waterTarget);
  const sleepScore = Math.min(1, dayData.sleep / state.sleepTarget);
  const moodScore = dayData.mood > 0 ? 1 : 0;
  
  let habitScore = 1;
  if (state.habits.length > 0) {
    const validCheckedHabits = dayData.habits.filter(h => state.habits.includes(h));
    habitScore = validCheckedHabits.length / state.habits.length;
  }

  // Weight formula: Water 25%, Sleep 25%, Habits 30%, Mood 20%
  return (waterScore * 0.25) + (sleepScore * 0.25) + (habitScore * 0.3) + (moodScore * 0.2);
}

// Update Dashboard Overview (Summary circular ring)
function renderDailySummaryRing() {
  const todayKey = getTodayDateString();
  const dayData = state.history[todayKey];
  if (!dayData) return;

  const totalProgress = calculateDailyProgress(todayKey);
  const percentage = Math.round(totalProgress * 100);

  // SVG ring stroke dash logic
  const circle = document.getElementById("summary-progress-bar");
  const radius = circle.r.baseVal.value;
  const circumference = radius * 2 * Math.PI;
  circle.style.strokeDasharray = `${circumference} ${circumference}`;
  
  // Animate stroke
  const offset = circumference - (totalProgress * circumference);
  circle.style.strokeDashoffset = offset;

  // Text percentages
  document.getElementById("summary-percentage").textContent = `${percentage}%`;

  // Details text updates
  document.getElementById("sum-water-text").textContent = `Su: ${dayData.water} / ${state.waterTarget} ml`;
  
  const validCheckedHabits = dayData.habits.filter(h => state.habits.includes(h));
  document.getElementById("sum-habits-text").textContent = `Alışkanlıklar: ${validCheckedHabits.length}/${state.habits.length}`;
  document.getElementById("sum-sleep-text").textContent = `Uyku: ${dayData.sleep} / ${state.sleepTarget} saat`;
  
  const moodNames = { 0: "Seçilmedi", 1: "Kötü 😢", 2: "Halsiz 😔", 3: "Nötr 😐", 4: "İyi 🙂", 5: "Harika 😁" };
  document.getElementById("sum-mood-text").textContent = `Ruh Hali: ${moodNames[dayData.mood]}`;
}

// 4. WATER INTENSE ACTIONS
window.addWater = function(amount) {
  const todayKey = getTodayDateString();
  initTodayEntry();
  
  const currentWater = state.history[todayKey].water;
  const newWater = Math.max(0, currentWater + amount);
  state.history[todayKey].water = newWater;
  
  saveState();
  renderWaterSection();
  renderDailySummaryRing();

  // Show Toast
  if (amount > 0) {
    showToast(`Bardak Eklendi: +${amount} ml 💧`, "water");
    
    // Check if target achieved just now
    if (newWater >= state.waterTarget && currentWater < state.waterTarget) {
      showToast("Tebrikler! Günlük su hedefine ulaştın! 🎉💧", "motivate");
    }
  }
};

function renderWaterSection() {
  const todayKey = getTodayDateString();
  const dayData = state.history[todayKey];
  
  document.getElementById("water-current").textContent = dayData.water;
  document.getElementById("water-target-display").textContent = state.waterTarget;

  // Animate the wave height in water cup
  const pct = Math.min(100, (dayData.water / state.waterTarget) * 100);
  document.getElementById("water-wave").style.height = `${pct}%`;
}

// 5. SLEEP TRACKER ACTIONS
function initSleepSection() {
  const sleepSlider = document.getElementById("sleep-range");
  const sleepHoursVal = document.getElementById("sleep-hours-val");
  
  const todayKey = getTodayDateString();
  const dayData = state.history[todayKey];

  sleepSlider.value = dayData.sleep;
  sleepHoursVal.textContent = parseFloat(dayData.sleep).toFixed(1);

  // Set Sleep Quality Buttons
  const qualityButtons = document.querySelectorAll(".quality-btn");
  qualityButtons.forEach(btn => {
    btn.classList.remove("active");
    if (parseInt(btn.getAttribute("data-quality")) === dayData.sleepQuality) {
      btn.classList.add("active");
    }
  });

  // Slider change event
  sleepSlider.addEventListener("input", function(e) {
    const val = parseFloat(e.target.value);
    sleepHoursVal.textContent = val.toFixed(1);
    
    state.history[todayKey].sleep = val;
    saveState();
    renderDailySummaryRing();
  });

  sleepSlider.addEventListener("change", function(e) {
    // Notify on target
    if (parseFloat(e.target.value) >= state.sleepTarget) {
      showToast("Harika! Hedeflenen uyku süresine ulaşıldı. 💤", "sleep");
    }
  });

  // Quality Buttons event
  qualityButtons.forEach(btn => {
    btn.onclick = function() {
      qualityButtons.forEach(b => b.classList.remove("active"));
      this.classList.add("active");
      
      const q = parseInt(this.getAttribute("data-quality"));
      state.history[todayKey].sleepQuality = q;
      saveState();
      showToast("Uyku kalitesi kaydedildi.", "sleep");
    };
  });
}

// 6. MOOD TRACKER ACTIONS
function initMoodSection() {
  const todayKey = getTodayDateString();
  const dayData = state.history[todayKey];

  const moodButtons = document.querySelectorAll(".mood-btn");
  const moodNoteInput = document.getElementById("mood-note-input");

  // Select active mood state
  moodButtons.forEach(btn => {
    btn.classList.remove("active");
    if (parseInt(btn.getAttribute("data-mood")) === dayData.mood) {
      btn.classList.add("active");
    }

    btn.onclick = function() {
      const selectedMood = parseInt(this.getAttribute("data-mood"));
      
      moodButtons.forEach(b => b.classList.remove("active"));
      this.classList.add("active");

      state.history[todayKey].mood = selectedMood;
      saveState();
      renderDailySummaryRing();
      
      const moodLabel = this.querySelector(".mood-label").textContent;
      showToast(`Ruh Hali: ${moodLabel} olarak kaydedildi!`, "mood");
    };
  });

  // Note change
  moodNoteInput.value = dayData.moodNote || "";
  moodNoteInput.onchange = function(e) {
    state.history[todayKey].moodNote = e.target.value;
    saveState();
  };
}

// 7. HABITS CHECKLIST ACTIONS
function renderHabitsSection() {
  const todayKey = getTodayDateString();
  const dayData = state.history[todayKey];
  const listContainer = document.getElementById("daily-habits-list");
  
  listContainer.innerHTML = "";

  if (state.habits.length === 0) {
    listContainer.innerHTML = `<div class="empty-state-text" style="text-align:center; padding: 12px; font-size:13px; color: var(--text-secondary);">Henüz alışkanlık eklemediniz. Profil sekmesinden ekleyebilirsiniz!</div>`;
    return;
  }

  state.habits.forEach(habit => {
    const isChecked = dayData.habits.includes(habit);
    
    const item = document.createElement("div");
    item.className = `habit-item ${isChecked ? 'checked' : ''}`;
    
    item.innerHTML = `
      <span class="habit-info-label">${habit}</span>
      <div class="checkbox-round-wrapper">
        <div class="checkbox-round">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </div>
      </div>
    `;

    // Click triggers toggle
    item.onclick = function() {
      toggleHabit(habit);
    };

    listContainer.appendChild(item);
  });
}

function toggleHabit(habit) {
  const todayKey = getTodayDateString();
  const dayData = state.history[todayKey];
  const index = dayData.habits.indexOf(habit);

  if (index > -1) {
    dayData.habits.splice(index, 1);
    showToast(`Geri alındı: ${habit}`, "habit");
  } else {
    dayData.habits.push(habit);
    showToast(`Tamamlandı: ${habit}! 🎉`, "habit");
  }

  saveState();
  renderHabitsSection();
  renderDailySummaryRing();
}

// 8. CALENDAR COMPONENT
let calendarCurrentDate = new Date();

function renderCalendar() {
  const daysContainer = document.getElementById("calendar-days");
  const monthYearLabel = document.getElementById("calendar-month-year");
  
  daysContainer.innerHTML = "";

  const year = calendarCurrentDate.getFullYear();
  const month = calendarCurrentDate.getMonth();
  
  monthYearLabel.textContent = `${MONTH_NAMES[month]} ${year}`;

  // First day of month (convert Sunday 0 to index 6 for Mon-Sun style grid)
  const firstDayObj = new Date(year, month, 1);
  let firstDayIndex = firstDayObj.getDay() - 1; 
  if (firstDayIndex < 0) firstDayIndex = 6; // Sunday is index 6

  const totalDays = new Date(year, month + 1, 0).getDate();

  // Render empty cells for leading weekday padding
  for (let i = 0; i < firstDayIndex; i++) {
    const emptyCell = document.createElement("div");
    emptyCell.className = "calendar-day empty";
    daysContainer.appendChild(emptyCell);
  }

  // Render month days
  const todayStr = getTodayDateString();

  for (let day = 1; day <= totalDays; day++) {
    const cellDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayData = state.history[cellDateStr];
    
    const dayCell = document.createElement("div");
    dayCell.className = "calendar-day";
    dayCell.textContent = day;

    // Today class
    if (cellDateStr === todayStr) {
      dayCell.classList.add("today");
    }

    // Completion heat mapping
    if (dayData) {
      const progress = calculateDailyProgress(cellDateStr);
      let level = 0;
      if (progress > 0 && progress <= 0.4) level = 1;
      else if (progress > 0.4 && progress <= 0.8) level = 2;
      else if (progress > 0.8) level = 3;

      if (level > 0) {
        dayCell.classList.add(`level-${level}`);
      }

      // Add mood emoji inside cell if tracked
      if (dayData.mood > 0) {
        const emojis = { 1: "😢", 2: "😔", 3: "😐", 4: "🙂", 5: "😁" };
        const moodSpan = document.createElement("span");
        moodSpan.className = "calendar-day-mood";
        moodSpan.textContent = emojis[dayData.mood];
        dayCell.appendChild(moodSpan);
      }
    }

    // Modal click trigger
    dayCell.onclick = function() {
      openDayDetailModal(cellDateStr, day);
    };

    daysContainer.appendChild(dayCell);
  }
}

// 9. DETAIL MODAL WINDOW
function openDayDetailModal(dateKey, dayNumber) {
  const modal = document.getElementById("day-modal");
  const title = document.getElementById("modal-date-title");
  const body = document.getElementById("modal-day-details");

  const formattedDate = getFormattedDisplayDate(dateKey);
  title.textContent = `${dayNumber} ${formattedDate} Detayları`;

  const dayData = state.history[dateKey];

  if (!dayData) {
    body.innerHTML = `
      <div style="text-align:center; padding: 20px 0; color: var(--text-secondary);">
        <p style="font-size: 28px; margin-bottom: 8px;">🌱</p>
        <p style="font-size: 14px; font-weight: 500;">Bu tarihte kayıtlı herhangi bir sağlıklı yaşam verisi bulunmuyor.</p>
      </div>
    `;
  } else {
    const moodEmojis = { 0: "Girilmedi", 1: "Kötü 😢", 2: "Halsiz 😔", 3: "Nötr 😐", 4: "İyi 🙂", 5: "Harika 😁" };
    const sleepQualities = { 1: "Kötü 😴", 2: "Orta 😐", 3: "İyi 😊" };
    
    // Render list
    const validCheckedHabits = dayData.habits.filter(h => state.habits.includes(h));
    const habitPercent = state.habits.length > 0 ? Math.round((validCheckedHabits.length / state.habits.length) * 100) : 100;
    
    let habitsListHtml = "";
    if (state.habits.length > 0) {
      habitsListHtml = state.habits.map(h => {
        const checked = dayData.habits.includes(h);
        return `<li style="font-size:12px; margin-bottom:4px; display:flex; align-items:center; gap:6px;">
          <span style="color:${checked ? 'var(--accent-mint)' : 'var(--text-secondary)'}; font-weight:bold;">${checked ? '✓' : '○'}</span>
          <span style="text-decoration:${checked ? 'line-through' : 'none'}; opacity:${checked ? '0.7' : '1'};">${h}</span>
        </li>`;
      }).join("");
    } else {
      habitsListHtml = "<li>Alışkanlık eklenmemiş.</li>";
    }

    body.innerHTML = `
      <div class="modal-detail-item">
        <svg class="tint-blue" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"></path></svg>
        <span class="label">Su Tüketimi:</span>
        <span class="value">${dayData.water} / ${state.waterTarget} ml</span>
      </div>
      <div class="modal-detail-item">
        <svg class="tint-lavender" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
        <span class="label">Uykuda Geçen:</span>
        <span class="value">${dayData.sleep} sa (${sleepQualities[dayData.sleepQuality] || 'Bilinmiyor'})</span>
      </div>
      <div class="modal-detail-item">
        <svg class="tint-peach" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><path d="M8 14s1.5 2 4 2 4-2 4-2"></path></svg>
        <span class="label">Ruh Hali:</span>
        <span class="value">${moodEmojis[dayData.mood]}</span>
      </div>
      
      ${dayData.moodNote ? `
        <div style="background-color: var(--bg-secondary); padding:10px 14px; border-radius: var(--border-radius-sm); font-size:12px; font-style:italic; line-height:1.4;">
          <strong>Not:</strong> "${dayData.moodNote}"
        </div>
      ` : ''}

      <div style="background-color: var(--bg-secondary); padding:12px 14px; border-radius: var(--border-radius-sm);">
        <div style="display:flex; justify-content:space-between; margin-bottom:8px; font-size:12px; font-weight:600; color:var(--text-secondary);">
          <span>Alışkanlıklar</span>
          <span>%${habitPercent}</span>
        </div>
        <ul style="list-style:none; padding:0; margin:0;">
          ${habitsListHtml}
        </ul>
      </div>
    `;
  }

  modal.classList.add("open");
}

window.closeModal = function() {
  document.getElementById("day-modal").classList.remove("open");
};

// 10. STATISTICS GRAPHICS GENERATION (SVG)
function renderStatisticsCharts() {
  const today = new Date();
  const last7Days = [];
  
  // Build lists for past 7 days
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    last7Days.push(`${year}-${month}-${day}`);
  }

  // 1. Calculations for Average Header Panel
  let totalWater = 0;
  let totalSleep = 0;
  let daysRecorded = 0;

  last7Days.forEach(dateKey => {
    const dayData = state.history[dateKey];
    if (dayData) {
      totalWater += dayData.water || 0;
      totalSleep += dayData.sleep || 0;
      daysRecorded++;
    }
  });

  const avgWater = daysRecorded > 0 ? Math.round(totalWater / daysRecorded) : 0;
  const avgSleep = daysRecorded > 0 ? (totalSleep / daysRecorded).toFixed(1) : "0.0";

  document.getElementById("stats-avg-water").textContent = `${avgWater} ml`;
  document.getElementById("stats-avg-sleep").textContent = `${avgSleep} saat`;

  // 2. Render Water Bar Chart (SVG)
  renderWaterBarChart(last7Days);

  // 3. Render Sleep Line Chart (SVG)
  renderSleepLineChart(last7Days);

  // 4. Render Mood Distribution Donut (SVG)
  renderMoodPieChart();
}

function renderWaterBarChart(last7Days) {
  const svg = document.getElementById("water-bar-chart");
  svg.innerHTML = "";

  const width = 350;
  const height = 180;
  const paddingLeft = 40;
  const paddingRight = 10;
  const paddingTop = 20;
  const paddingBottom = 25;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  // Max value calculation (max target or double it to look balanced)
  let maxVal = state.waterTarget * 1.2;
  last7Days.forEach(k => {
    const data = state.history[k];
    if (data && data.water > maxVal) maxVal = data.water;
  });

  // Draw Grid Lines & Axes
  const gridTicks = [0, state.waterTarget / 2, state.waterTarget, maxVal];
  const uniqueTicks = [...new Set(gridTicks)].sort((a,b) => a-b);
  
  uniqueTicks.forEach(tick => {
    const y = height - paddingBottom - (tick / maxVal) * chartHeight;
    
    // Line
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", paddingLeft);
    line.setAttribute("y1", y);
    line.setAttribute("x2", width - paddingRight);
    line.setAttribute("y2", y);
    line.setAttribute("class", tick === state.waterTarget ? "chart-axis-line" : "chart-grid-line");
    if (tick === state.waterTarget) {
      line.setAttribute("stroke", "var(--accent-blue)");
    }
    svg.appendChild(line);

    // Text Label
    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text.setAttribute("x", paddingLeft - 8);
    text.setAttribute("y", y + 4);
    text.setAttribute("class", "chart-label");
    text.setAttribute("style", "text-anchor: end;");
    text.textContent = tick >= 1000 ? `${(tick/1000).toFixed(1)}k` : `${tick}`;
    svg.appendChild(text);
  });

  // Render Bars
  const barSpacing = chartWidth / last7Days.length;
  const barWidth = 16;

  last7Days.forEach((dateKey, index) => {
    const data = state.history[dateKey] || { water: 0 };
    const barHeight = (data.water / maxVal) * chartHeight;
    const x = paddingLeft + (index * barSpacing) + (barSpacing / 2) - (barWidth / 2);
    const y = height - paddingBottom - barHeight;

    // SVG Bar
    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute("x", x);
    rect.setAttribute("y", y);
    rect.setAttribute("width", barWidth);
    rect.setAttribute("height", Math.max(2, barHeight)); // show at least 2px line for visibility
    rect.setAttribute("class", "chart-bar");
    
    // If water target is hit, color it gold/peach, else blue
    if (data.water >= state.waterTarget) {
      rect.setAttribute("style", "fill: var(--accent-mint);");
    }
    
    svg.appendChild(rect);

    // X axis day labels (e.g. 12 Tem)
    const labelDate = new Date(dateKey);
    const labelText = `${labelDate.getDate()}`;
    const xLabel = document.createElementNS("http://www.w3.org/2000/svg", "text");
    xLabel.setAttribute("x", paddingLeft + (index * barSpacing) + (barSpacing / 2));
    xLabel.setAttribute("y", height - 8);
    xLabel.setAttribute("class", "chart-label");
    xLabel.textContent = labelText;
    svg.appendChild(xLabel);
  });
}

function renderSleepLineChart(last7Days) {
  const svg = document.getElementById("sleep-line-chart");
  svg.innerHTML = "";

  const width = 350;
  const height = 180;
  const paddingLeft = 30;
  const paddingRight = 15;
  const paddingTop = 20;
  const paddingBottom = 25;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  // Values range definition (0 to 12 hours)
  const maxHours = 12;

  // Grid Lines & Labels
  const hoursGrid = [0, 4, 8, 12];
  hoursGrid.forEach(hour => {
    const y = height - paddingBottom - (hour / maxHours) * chartHeight;
    
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", paddingLeft);
    line.setAttribute("y1", y);
    line.setAttribute("x2", width - paddingRight);
    line.setAttribute("y2", y);
    line.setAttribute("class", hour === state.sleepTarget ? "chart-axis-line" : "chart-grid-line");
    if (hour === state.sleepTarget) {
      line.setAttribute("stroke", "var(--accent-lavender)");
    }
    svg.appendChild(line);

    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text.setAttribute("x", paddingLeft - 8);
    text.setAttribute("y", y + 4);
    text.setAttribute("class", "chart-label");
    text.setAttribute("style", "text-anchor: end;");
    text.textContent = `${hour}sa`;
    svg.appendChild(text);
  });

  // Calculate coordinates for line path
  const spacing = chartWidth / (last7Days.length - 1);
  const points = [];

  last7Days.forEach((dateKey, index) => {
    const data = state.history[dateKey] || { sleep: 0 };
    const x = paddingLeft + (index * spacing);
    const y = height - paddingBottom - (Math.min(maxHours, data.sleep) / maxHours) * chartHeight;
    points.push({ x, y, value: data.sleep, dateKey });
  });

  // Generate smooth line path
  if (points.length > 1) {
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    const dStr = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(" ");
    path.setAttribute("d", dStr);
    path.setAttribute("class", "chart-line");
    svg.appendChild(path);
  }

  // Draw dots and tooltip data
  points.forEach(p => {
    const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circle.setAttribute("cx", p.x);
    circle.setAttribute("cy", p.y);
    circle.setAttribute("r", "4.5");
    circle.setAttribute("class", "chart-dot");
    
    // Add title element for simple mouse hover tooltip on desktop
    const title = document.createElementNS("http://www.w3.org/2000/svg", "title");
    title.textContent = `${parseFloat(p.value).toFixed(1)} Saat uyku`;
    circle.appendChild(title);

    svg.appendChild(circle);

    // Day labels
    const labelDate = new Date(p.dateKey);
    const xLabel = document.createElementNS("http://www.w3.org/2000/svg", "text");
    xLabel.setAttribute("x", p.x);
    xLabel.setAttribute("y", height - 8);
    xLabel.setAttribute("class", "chart-label");
    xLabel.textContent = `${labelDate.getDate()}`;
    svg.appendChild(xLabel);
  });
}

function renderMoodPieChart() {
  const svg = document.getElementById("mood-pie-chart");
  const legend = document.getElementById("mood-dist-legend");
  
  svg.innerHTML = "";
  legend.innerHTML = "";

  // 1. Calculate mood distribution in last 30 days
  const today = new Date();
  const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  let totalCount = 0;

  for (let i = 0; i < 30; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateKey = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    const data = state.history[dateKey];
    if (data && data.mood > 0) {
      counts[data.mood]++;
      totalCount++;
    }
  }

  const moodColors = {
    5: "var(--accent-yellow)",
    4: "var(--accent-mint)",
    3: "var(--accent-blue)",
    2: "var(--accent-lavender)",
    1: "var(--accent-peach)"
  };
  const moodNames = {
    5: "Harika 😁",
    4: "İyi 🙂",
    3: "Nötr 😐",
    2: "Halsiz 😔",
    1: "Kötü 😢"
  };

  if (totalCount === 0) {
    svg.innerHTML = `<circle cx="50" cy="50" r="40" fill="transparent" stroke="var(--border-color)" stroke-width="12"/>
                     <text x="50" y="55" class="chart-label" style="font-size:8px;">Kayıt Yok</text>`;
    
    legend.innerHTML = `<div style="font-size:12px; color:var(--text-secondary); text-align:center;">Son 30 güne ait ruh hali kaydı bulunamadı.</div>`;
    return;
  }

  // 2. Render SVG Donut segments
  let accumulatedPercent = 0;
  const radius = 35;
  const circumference = 2 * Math.PI * radius;

  // Add background circle
  const bgCircle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  bgCircle.setAttribute("cx", "50");
  bgCircle.setAttribute("cy", "50");
  bgCircle.setAttribute("r", radius);
  bgCircle.setAttribute("fill", "transparent");
  bgCircle.setAttribute("stroke", "var(--border-color)");
  bgCircle.setAttribute("stroke-width", "12");
  svg.appendChild(bgCircle);

  // Print segments
  Object.keys(counts).sort((a,b) => b-a).forEach(moodKey => {
    const count = counts[moodKey];
    if (count === 0) return;

    const percent = count / totalCount;
    const strokeDash = percent * circumference;
    const strokeOffset = circumference - strokeDash + (accumulatedPercent * circumference);

    const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circle.setAttribute("cx", "50");
    circle.setAttribute("cy", "50");
    circle.setAttribute("r", radius);
    circle.setAttribute("fill", "transparent");
    circle.setAttribute("stroke", moodColors[moodKey]);
    circle.setAttribute("stroke-width", "12");
    circle.setAttribute("stroke-dasharray", `${strokeDash} ${circumference}`);
    // Rotate starting point to top (-90 degrees offset)
    circle.setAttribute("transform", "rotate(-90 50 50)");
    circle.setAttribute("stroke-dashoffset", -accumulatedPercent * circumference);
    circle.setAttribute("class", "pie-slice");

    svg.appendChild(circle);

    accumulatedPercent += percent;
  });

  // Middle text
  const textVal = document.createElementNS("http://www.w3.org/2000/svg", "text");
  textVal.setAttribute("x", "50");
  textVal.setAttribute("y", "53");
  textVal.setAttribute("class", "chart-label");
  textVal.setAttribute("style", "font-size: 11px; font-weight: 700; fill: var(--text-primary);");
  textVal.textContent = `${totalCount} Gün`;
  svg.appendChild(textVal);

  // 3. Render Legend row items
  Object.keys(counts).sort((a,b) => b-a).forEach(moodKey => {
    const count = counts[moodKey];
    const pct = totalCount > 0 ? Math.round((count / totalCount) * 100) : 0;

    const row = document.createElement("div");
    row.className = "mood-legend-row";
    row.innerHTML = `
      <span class="mood-legend-name">
        <span class="dot" style="background-color: ${moodColors[moodKey]}"></span>
        <span>${moodNames[moodKey]}</span>
      </span>
      <strong>%${pct} (${count} gün)</strong>
    `;
    legend.appendChild(row);
  });
}

// 11. PROFILE & SETTINGS
function initProfileSection() {
  const setUserName = document.getElementById("set-user-name");
  const setWaterTarget = document.getElementById("set-water-target");
  const setSleepTarget = document.getElementById("set-sleep-target");
  const saveGoalsBtn = document.getElementById("save-goals-btn");

  // Load defaults
  setUserName.value = state.username;
  setWaterTarget.value = state.waterTarget;
  setSleepTarget.value = state.sleepTarget;

  // Save targets trigger
  saveGoalsBtn.onclick = function() {
    const name = setUserName.value.trim();
    const water = parseInt(setWaterTarget.value);
    const sleep = parseFloat(setSleepTarget.value);

    if (!name) {
      showToast("Lütfen geçerli bir ad girin.", "mood");
      return;
    }
    if (isNaN(water) || water < 500) {
      showToast("Su hedefi en az 500ml olmalıdır.", "water");
      return;
    }
    if (isNaN(sleep) || sleep < 4 || sleep > 12) {
      showToast("Uyku hedefi 4 ile 12 saat arasında olmalıdır.", "sleep");
      return;
    }

    state.username = name;
    state.waterTarget = water;
    state.sleepTarget = sleep;

    saveState();
    
    // Refresh sections
    document.getElementById("profile-name-display").textContent = name;
    renderHeaderAndGreeting();
    renderWaterSection();
    renderDailySummaryRing();

    showToast("Hedefler başarıyla güncellendi! 🌱", "motivate");
  };

  // Profile Name Display Update
  document.getElementById("profile-name-display").textContent = state.username;

  // Manage Habits Render
  renderProfileHabitsManager();

  // New Habit Add Button
  const newHabitInput = document.getElementById("new-habit-input");
  const addHabitBtn = document.getElementById("add-habit-btn");

  addHabitBtn.onclick = function() {
    const habitText = newHabitInput.value.trim();
    if (habitText) {
      if (state.habits.includes(habitText)) {
        showToast("Bu alışkanlık zaten ekli.", "mood");
        return;
      }
      state.habits.push(habitText);
      saveState();
      newHabitInput.value = "";
      renderProfileHabitsManager();
      renderHabitsSection();
      renderDailySummaryRing();
      showToast("Yeni alışkanlık eklendi! 🎉", "habit");
    }
  };

  // Theme & Notification Toggle Checkboxes
  const themeToggle = document.getElementById("dark-mode-toggle");
  themeToggle.checked = state.theme === "dark";
  
  themeToggle.onchange = function(e) {
    const isDark = e.target.checked;
    state.theme = isDark ? "dark" : "light";
    saveState();
    applyTheme();
    showToast(isDark ? "Karanlık mod aktif" : "Aydınlık mod aktif");
  };

  const notifToggle = document.getElementById("notifications-toggle");
  notifToggle.checked = state.notificationsEnabled;
  notifToggle.onchange = function(e) {
    state.notificationsEnabled = e.target.checked;
    saveState();
    showToast(state.notificationsEnabled ? "Hatırlatıcılar açıldı" : "Hatırlatıcılar kapatıldı");
  };

  // Reset Data Button
  const resetBtn = document.getElementById("reset-data-btn");
  resetBtn.onclick = function() {
    if (confirm("Tüm kayıtlarınızı sıfırlamak istediğinize emin misiniz? Bu işlem geri alınamaz.")) {
      localStorage.removeItem("mySun_state");
      showToast("Tüm veriler sıfırlandı. Yeniden başlatılıyor...");
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    }
  };
}

function renderProfileHabitsManager() {
  const container = document.getElementById("manage-habits-list");
  container.innerHTML = "";

  state.habits.forEach((habit, index) => {
    const li = document.createElement("li");
    li.className = "manage-habit-item";
    li.innerHTML = `
      <span>${habit}</span>
      <button class="delete-habit-btn" data-index="${index}" aria-label="Alışkanlığı Sil">×</button>
    `;

    li.querySelector(".delete-habit-btn").onclick = function() {
      const idx = parseInt(this.getAttribute("data-index"));
      const removed = state.habits[idx];
      state.habits.splice(idx, 1);
      
      saveState();
      renderProfileHabitsManager();
      renderHabitsSection();
      renderDailySummaryRing();
      showToast(`Alışkanlık silindi: ${removed}`, "habit");
    };

    container.appendChild(li);
  });
}

// Apply theme dynamically to document body
function applyTheme() {
  const body = document.body;
  const headerMoonIcon = document.querySelector(".icon-moon");
  const headerSunIcon = document.querySelector(".icon-sun");

  if (state.theme === "dark") {
    body.setAttribute("data-theme", "dark");
    headerMoonIcon.classList.add("hidden");
    headerSunIcon.classList.remove("hidden");
  } else {
    body.removeAttribute("data-theme");
    headerMoonIcon.classList.remove("hidden");
    headerSunIcon.classList.add("hidden");
  }
}

// 12. NOTIFICATION TOAST ENGINE
function showToast(message, type = "normal") {
  const container = document.getElementById("notification-container");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  
  const emojis = {
    water: "💧",
    habit: "🌿",
    sleep: "💤",
    mood: "😊",
    motivate: "✨",
    normal: "ℹ️"
  };

  toast.innerHTML = `
    <span class="toast-icon">${emojis[type] || emojis.normal}</span>
    <span class="toast-content">${message}</span>
  `;

  container.appendChild(toast);

  // Trigger slide-in animation
  setTimeout(() => {
    toast.classList.add("show");
  }, 10);

  // Slide-out and remove after duration
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 3500);
}

// 13. SIMULATED PERIODIC NOTIFICATIONS
function setupReminderEngine() {
  // Let's schedule a reminder in-app notification every 2 minutes for demo purposes, 
  // reminding user to keep hydrated!
  setInterval(() => {
    if (state.notificationsEnabled) {
      const todayKey = getTodayDateString();
      const todayData = state.history[todayKey];
      if (todayData && todayData.water < state.waterTarget) {
        showToast("Su içme zamanı! Bugün hedefine henüz ulaşamadın. 💧", "water");
      }
    }
  }, 120000); // 2 minutes (120000ms)
}

// 14. APP INITIALIZATION ENTRY POINT
window.onload = function() {
  // Load State from LocalStorage
  loadState();
  
  // Ensure today's object exists
  initTodayEntry();
  
  // Apply Active Theme
  applyTheme();

  // Render Header & Daily Summary Ring
  renderHeaderAndGreeting();
  renderDailySummaryRing();

  // Render Sections
  renderWaterSection();
  initSleepSection();
  initMoodSection();
  renderHabitsSection();

  // Init Profile settings tab details
  initProfileSection();

  // Set header theme button click listener
  document.getElementById("theme-toggle-btn").onclick = function() {
    const isDark = state.theme === "dark";
    state.theme = isDark ? "light" : "dark";
    saveState();
    applyTheme();
    // sync checkbox state if profile tab is active
    document.getElementById("dark-mode-toggle").checked = state.theme === "dark";
    showToast(state.theme === "dark" ? "Karanlık mod aktif" : "Aydınlık mod aktif");
  };

  // Nav Bar Routing Switcher
  const navItems = document.querySelectorAll(".nav-item");
  const tabPanels = document.querySelectorAll(".tab-panel");

  navItems.forEach(item => {
    item.addEventListener("click", function() {
      const targetTab = this.getAttribute("data-tab");

      navItems.forEach(nav => nav.classList.remove("active"));
      this.classList.add("active");

      tabPanels.forEach(panel => {
        panel.classList.remove("active");
        if (panel.getAttribute("id") === `tab-${targetTab}`) {
          panel.classList.add("active");
        }
      });

      // Special Tab Actions when active
      if (targetTab === "calendar") {
        renderCalendar();
      } else if (targetTab === "stats") {
        renderStatisticsCharts();
      } else if (targetTab === "home") {
        // Refresh home data just in case
        renderDailySummaryRing();
        renderWaterSection();
        renderHabitsSection();
        initMoodSection();
      }
    });
  });

  // Calendar prev/next buttons hookups
  document.getElementById("prev-month-btn").onclick = function() {
    calendarCurrentDate.setMonth(calendarCurrentDate.getMonth() - 1);
    renderCalendar();
  };

  document.getElementById("next-month-btn").onclick = function() {
    calendarCurrentDate.setMonth(calendarCurrentDate.getMonth() + 1);
    renderCalendar();
  };

  // Load reminder notifications scheduler
  setupReminderEngine();
  
  // App loaded notification
  showToast("mySun sağlıklı yaşam asistanınız hazır! ☀️", "motivate");
};
