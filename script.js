// ===== TIMEDORO - BEAUTIFUL POMODORO TIMER =====

class TimedoroApp {
    constructor() {
        // Timer state
        this.isRunning = false;
        this.currentSession = 'focus'; // 'focus', 'shortBreak', 'longBreak'
        this.sessionCount = 1;
        this.timeRemaining = 25 * 60; // 25 minutes in seconds
        this.totalTime = 25 * 60;
        this.timerInterval = null;

        // Settings
        this.settings = {
            focusTime: 25,
            shortBreak: 5,
            longBreak: 15,
            sessionsUntilLongBreak: 4,
            ambientSound: 'none',
            soundVolume: 50,
            enableNotifications: true,
            theme: 'light',
            notificationBannerDismissed: false
        };

        // Audio contexts
        this.audioContext = null;
        this.ambientAudio = null;
        this.notificationAudio = null;
        this.pendingAmbientPlay = false;

        // Data tracking
        this.sessionData = {
            todaysSessions: 0,
            todaysTime: 0,
            totalSessions: 0,
            currentStreak: 0,
            lastSessionDate: null,
            achievements: [],
            sessionNotes: []
        };

        // Task management
        this.tasks = [];
        this.currentTaskId = null;

        // DOM elements
        this.elements = {};

        // Initialize
        this.init();
    }

    init() {
        this.bindElements();
        this.loadData();
        this.setupEventListeners();
        this.updateDisplay();
        this.setupProgressRing();
        this.checkNotificationPermission();
        this.setupAudio();

        // Request notification permission after a delay
        setTimeout(() => {
            this.showNotificationBanner();
        }, 2000);
    }

    bindElements() {
        // Timer elements
        this.elements.timeDisplay = document.getElementById('timeDisplay');
        this.elements.sessionType = document.getElementById('sessionType');
        this.elements.sessionCount = document.getElementById('sessionCount');
        this.elements.playPauseBtn = document.getElementById('playPauseBtn');
        this.elements.playPauseIcon = document.getElementById('playPauseIcon');
        this.elements.playPauseText = document.getElementById('playPauseText');
        this.elements.resetBtn = document.getElementById('resetBtn');
        this.elements.skipBtn = document.getElementById('skipBtn');

        // Progress ring
        this.elements.progressRing = document.querySelector('.progress-ring-progress');

        // Help elements
        this.elements.helpPanel = document.getElementById('helpPanel');
        this.elements.helpToggle = document.getElementById('helpToggle');
        this.elements.closeHelp = document.getElementById('closeHelp');

        // Settings elements
        this.elements.settingsPanel = document.getElementById('settingsPanel');
        this.elements.settingsToggle = document.getElementById('settingsToggle');
        this.elements.closeSettings = document.getElementById('closeSettings');
        this.elements.overlay = document.getElementById('overlay');

        // Theme elements
        this.elements.themeToggle = document.getElementById('themeToggle');
        this.elements.themeOptions = document.querySelectorAll('.theme-option');

        // Settings inputs
        this.elements.focusTime = document.getElementById('focusTime');
        this.elements.shortBreak = document.getElementById('shortBreak');
        this.elements.longBreak = document.getElementById('longBreak');
        this.elements.sessionsUntilLongBreak = document.getElementById('sessionsUntilLongBreak');
        this.elements.ambientSound = document.getElementById('ambientSound');
        this.elements.soundVolume = document.getElementById('soundVolume');
        this.elements.enableNotifications = document.getElementById('enableNotifications');

        // Insights elements
        this.elements.todaysSessions = document.getElementById('todaysSessions');
        this.elements.todaysTime = document.getElementById('todaysTime');
        this.elements.currentStreak = document.getElementById('currentStreak');
        this.elements.totalSessions = document.getElementById('totalSessions');
        this.elements.achievementBadges = document.getElementById('achievementBadges');

                // Notes
        this.elements.sessionNoteInput = document.getElementById('sessionNoteInput');

        // Tasks
        this.elements.taskInput = document.getElementById('taskInput');
        this.elements.addTaskBtn = document.getElementById('addTaskBtn');
        this.elements.taskList = document.getElementById('taskList');
        this.elements.currentTaskDisplay = document.getElementById('currentTaskDisplay');
        this.elements.currentTaskText = document.getElementById('currentTaskText');

        // Notification banner
        this.elements.notificationBanner = document.getElementById('notificationBanner');
        this.elements.enableNotificationsBtn = document.getElementById('enableNotificationsBtn');
        this.elements.dismissNotifications = document.getElementById('dismissNotifications');
    }

    setupEventListeners() {
        // Timer controls
        this.elements.playPauseBtn.addEventListener('click', () => this.toggleTimer());
        this.elements.resetBtn.addEventListener('click', () => this.resetTimer());
        this.elements.skipBtn.addEventListener('click', () => this.skipSession());

        // Help panel
        this.elements.helpToggle.addEventListener('click', () => this.toggleHelp());
        this.elements.closeHelp.addEventListener('click', () => this.closeHelp());

        // Settings panel
        this.elements.settingsToggle.addEventListener('click', () => this.toggleSettings());
        this.elements.closeSettings.addEventListener('click', () => this.closeSettings());
        this.elements.overlay.addEventListener('click', () => this.closePanels());

        // Theme controls
        this.elements.themeToggle.addEventListener('click', () => this.cycleTheme());
        this.elements.themeOptions.forEach(option => {
            option.addEventListener('click', (e) => {
                this.setTheme(e.currentTarget.dataset.theme);
            });
        });

        // Settings inputs
        this.elements.focusTime.addEventListener('change', () => this.updateSettings());
        this.elements.shortBreak.addEventListener('change', () => this.updateSettings());
        this.elements.longBreak.addEventListener('change', () => this.updateSettings());
        this.elements.sessionsUntilLongBreak.addEventListener('change', () => this.updateSettings());
        this.elements.ambientSound.addEventListener('change', () => this.updateAmbientSound());
        this.elements.soundVolume.addEventListener('input', () => this.updateVolume());
        this.elements.enableNotifications.addEventListener('change', () => this.updateSettings());

        // Tasks
        this.elements.addTaskBtn.addEventListener('click', () => this.addTask());
        this.elements.taskInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                this.addTask();
            }
        });

        // Notification banner
        this.elements.enableNotificationsBtn.addEventListener('click', () => this.requestNotificationPermission());
        this.elements.dismissNotifications.addEventListener('click', () => this.hideNotificationBanner());

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));

        // Window events
        window.addEventListener('beforeunload', () => this.saveData());
        document.addEventListener('visibilitychange', () => this.handleVisibilityChange());
        window.addEventListener('resize', () => this.handleResize());
    }

    setupProgressRing() {
        const radius = 140; // Fixed radius - viewBox handles scaling
        const circumference = 2 * Math.PI * radius;
        this.elements.progressRing.style.strokeDasharray = circumference;
        this.elements.progressRing.style.strokeDashoffset = circumference;
        this.circumference = circumference;
    }

    updateProgressRing(progress) {
        const offset = this.circumference - (progress * this.circumference);
        this.elements.progressRing.style.strokeDashoffset = offset;
    }

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    updateDisplay() {
        // Update time display
        this.elements.timeDisplay.textContent = this.formatTime(this.timeRemaining);

        // Update session type
        const sessionTypes = {
            focus: 'Focus Time',
            shortBreak: 'Short Break',
            longBreak: 'Long Break'
        };
        this.elements.sessionType.textContent = sessionTypes[this.currentSession];

        // Update session count
        this.elements.sessionCount.textContent = `Session ${this.sessionCount} of ${this.settings.sessionsUntilLongBreak}`;

        // Update progress ring
        const progress = 1 - (this.timeRemaining / this.totalTime);
        this.updateProgressRing(progress);

        // Update play/pause button
        if (this.isRunning) {
            this.elements.playPauseIcon.textContent = '⏸';
            this.elements.playPauseText.textContent = 'Pause';
        } else {
            this.elements.playPauseIcon.textContent = '▶';
            this.elements.playPauseText.textContent = this.timeRemaining === this.totalTime ? 'Start' : 'Resume';
        }

        // Update document title
        document.title = `${this.formatTime(this.timeRemaining)} - ${sessionTypes[this.currentSession]} - Timedoro`;

        // Update insights
        this.updateInsights();
    }

    updateInsights() {
        // Calculate today's time in hours and minutes
        const hours = Math.floor(this.sessionData.todaysTime / 60);
        const minutes = this.sessionData.todaysTime % 60;
        const timeText = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

        this.elements.todaysSessions.textContent = this.sessionData.todaysSessions;
        this.elements.todaysTime.textContent = timeText;
        this.elements.currentStreak.textContent = this.sessionData.currentStreak;
        this.elements.totalSessions.textContent = this.sessionData.totalSessions;

        this.updateAchievements();
    }

    toggleTimer() {
        if (this.isRunning) {
            this.pauseTimer();
        } else {
            this.startTimer();
        }
    }

    startTimer() {
        this.isRunning = true;
        this.updateDisplay();

        this.timerInterval = setInterval(() => {
            this.timeRemaining--;
            this.updateDisplay();

            if (this.timeRemaining <= 0) {
                this.completeSession();
            }
        }, 1000);

        // Start ambient sound if enabled
        this.playAmbientSound();

        // Add visual feedback
        this.elements.playPauseBtn.classList.add('pulse');
        setTimeout(() => {
            this.elements.playPauseBtn.classList.remove('pulse');
        }, 500);
    }

    pauseTimer() {
        this.isRunning = false;
        clearInterval(this.timerInterval);
        this.updateDisplay();

        // Pause ambient sound
        this.pauseAmbientSound();
    }

    resetTimer() {
        this.pauseTimer();
        this.setSessionTime();
        this.updateDisplay();

        // Add shake animation
        this.elements.resetBtn.classList.add('shake');
        setTimeout(() => {
            this.elements.resetBtn.classList.remove('shake');
        }, 500);
    }

    skipSession() {
        this.pauseTimer();
        this.completeSession();

        // Add bounce animation
        this.elements.skipBtn.classList.add('bounce');
        setTimeout(() => {
            this.elements.skipBtn.classList.remove('bounce');
        }, 500);
    }

    completeSession() {
        this.pauseTimer();

        // Save session note if provided
        const note = this.elements.sessionNoteInput.value.trim();
        const currentTaskText = this.getCurrentTaskText();

        if ((note || currentTaskText) && this.currentSession === 'focus') {
            this.sessionData.sessionNotes.push({
                date: new Date().toISOString(),
                note: note,
                task: currentTaskText,
                session: this.sessionCount
            });
        }

        // Update session data
        if (this.currentSession === 'focus') {
            this.sessionData.todaysSessions++;
            this.sessionData.todaysTime += this.settings.focusTime;
            this.sessionData.totalSessions++;
            this.updateStreak();
            this.checkAchievements();
        }

        // Show notification
        this.showNotification();

        // Play completion sound
        this.playNotificationSound();

        // Move to next session
        this.nextSession();

        // Clear session note
        this.elements.sessionNoteInput.value = '';

        // Save data
        this.saveData();

        // Add completion animation
        this.elements.timeDisplay.classList.add('bounce');
        setTimeout(() => {
            this.elements.timeDisplay.classList.remove('bounce');
        }, 1000);
    }

    nextSession() {
        if (this.currentSession === 'focus') {
            if (this.sessionCount === this.settings.sessionsUntilLongBreak) {
                this.currentSession = 'longBreak';
                this.sessionCount = 1;
            } else {
                this.currentSession = 'shortBreak';
            }
        } else {
            this.currentSession = 'focus';
            if (this.currentSession === 'focus' && this.sessionCount < this.settings.sessionsUntilLongBreak) {
                this.sessionCount++;
            }
        }

        this.setSessionTime();
        this.updateDisplay();
    }

    setSessionTime() {
        switch (this.currentSession) {
            case 'focus':
                this.timeRemaining = this.settings.focusTime * 60;
                this.totalTime = this.settings.focusTime * 60;
                break;
            case 'shortBreak':
                this.timeRemaining = this.settings.shortBreak * 60;
                this.totalTime = this.settings.shortBreak * 60;
                break;
            case 'longBreak':
                this.timeRemaining = this.settings.longBreak * 60;
                this.totalTime = this.settings.longBreak * 60;
                break;
        }
    }

    updateStreak() {
        const today = new Date().toDateString();
        const lastSession = this.sessionData.lastSessionDate;

        if (!lastSession) {
            this.sessionData.currentStreak = 1;
        } else {
            const lastDate = new Date(lastSession).toDateString();
            const yesterday = new Date(Date.now() - 86400000).toDateString();

            if (lastDate === today) {
                // Same day, streak continues
            } else if (lastDate === yesterday) {
                // Consecutive day
                if (this.sessionData.todaysSessions === 1) {
                    this.sessionData.currentStreak++;
                }
            } else {
                // Streak broken
                this.sessionData.currentStreak = 1;
            }
        }

        this.sessionData.lastSessionDate = new Date().toISOString();
    }

    checkAchievements() {
        const achievements = [
            { id: 'first-session', name: 'Getting Started', emoji: '🚀', condition: () => this.sessionData.totalSessions >= 1 },
            { id: 'ten-sessions', name: 'Building Momentum', emoji: '💪', condition: () => this.sessionData.totalSessions >= 10 },
            { id: 'fifty-sessions', name: 'Focus Master', emoji: '🧠', condition: () => this.sessionData.totalSessions >= 50 },
            { id: 'hundred-sessions', name: 'Century Club', emoji: '💯', condition: () => this.sessionData.totalSessions >= 100 },
            { id: 'week-streak', name: 'Week Warrior', emoji: '🔥', condition: () => this.sessionData.currentStreak >= 7 },
            { id: 'month-streak', name: 'Consistency King', emoji: '👑', condition: () => this.sessionData.currentStreak >= 30 },
            { id: 'daily-goal', name: 'Daily Champion', emoji: '🏆', condition: () => this.sessionData.todaysSessions >= 8 },
            { id: 'focus-time', name: 'Time Lord', emoji: '⏰', condition: () => this.sessionData.todaysTime >= 120 }
        ];

        achievements.forEach(achievement => {
            if (!this.sessionData.achievements.includes(achievement.id) && achievement.condition()) {
                this.sessionData.achievements.push(achievement.id);
                this.showAchievement(achievement);
            }
        });
    }

    showAchievement(achievement) {
        const badge = document.createElement('div');
        badge.className = 'achievement-badge new';
        badge.innerHTML = `<span>${achievement.emoji}</span> ${achievement.name}`;

        this.elements.achievementBadges.appendChild(badge);

        // Remove 'new' class after animation
        setTimeout(() => {
            badge.classList.remove('new');
        }, 2000);

        // Show notification for achievement
        if (this.settings.enableNotifications && Notification.permission === 'granted') {
            new Notification('🎉 Achievement Unlocked!', {
                body: `${achievement.emoji} ${achievement.name}`,
                icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🍅</text></svg>',
                tag: 'timedoro-achievement'
            });
        }
    }

    updateAchievements() {
        const achievements = [
            { id: 'first-session', name: 'Getting Started', emoji: '🚀' },
            { id: 'ten-sessions', name: 'Building Momentum', emoji: '💪' },
            { id: 'fifty-sessions', name: 'Focus Master', emoji: '🧠' },
            { id: 'hundred-sessions', name: 'Century Club', emoji: '💯' },
            { id: 'week-streak', name: 'Week Warrior', emoji: '🔥' },
            { id: 'month-streak', name: 'Consistency King', emoji: '👑' },
            { id: 'daily-goal', name: 'Daily Champion', emoji: '🏆' },
            { id: 'focus-time', name: 'Time Lord', emoji: '⏰' }
        ];

        this.elements.achievementBadges.innerHTML = '';

        this.sessionData.achievements.forEach(achievementId => {
            const achievement = achievements.find(a => a.id === achievementId);
            if (achievement) {
                const badge = document.createElement('div');
                badge.className = 'achievement-badge';
                badge.innerHTML = `<span>${achievement.emoji}</span> ${achievement.name}`;
                this.elements.achievementBadges.appendChild(badge);
            }
        });
    }

    // Help Management
    toggleHelp() {
        this.closeSettings(); // Close settings if open
        this.elements.helpPanel.classList.add('active');
        this.elements.overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    closeHelp() {
        this.elements.helpPanel.classList.remove('active');
        this.elements.overlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    // Settings Management
    toggleSettings() {
        this.closeHelp(); // Close help if open
        this.elements.settingsPanel.classList.add('active');
        this.elements.overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    closeSettings() {
        this.elements.settingsPanel.classList.remove('active');
        this.elements.overlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    closePanels() {
        this.closeHelp();
        this.closeSettings();
    }

    updateSettings() {
        this.settings.focusTime = parseInt(this.elements.focusTime.value);
        this.settings.shortBreak = parseInt(this.elements.shortBreak.value);
        this.settings.longBreak = parseInt(this.elements.longBreak.value);
        this.settings.sessionsUntilLongBreak = parseInt(this.elements.sessionsUntilLongBreak.value);
        this.settings.enableNotifications = this.elements.enableNotifications.checked;

        // Update current session time if not running
        if (!this.isRunning && this.timeRemaining === this.totalTime) {
            this.setSessionTime();
            this.updateDisplay();
        }

        this.saveData();
    }

    updateVolume() {
        this.settings.soundVolume = parseInt(this.elements.soundVolume.value);
        document.querySelector('.volume-value').textContent = `${this.settings.soundVolume}%`;

        if (this.ambientAudio) {
            this.ambientAudio.volume = (this.settings.soundVolume / 100) * 0.3; // Max 30% for ambient sounds
        }

        this.saveData();
    }

    updateAmbientSound() {
        // Remember if sound was currently playing
        const wasPlaying = this.ambientAudio && !this.ambientAudio.paused;

        this.settings.ambientSound = this.elements.ambientSound.value;

        // Set flag for pending play if timer is running and sound was playing
        this.pendingAmbientPlay = this.isRunning && wasPlaying && this.settings.ambientSound !== 'none';

        this.setupAmbientSound();

        // If the audio is already loaded and ready, play immediately
        if (this.pendingAmbientPlay && this.ambientAudio && this.ambientAudio.readyState >= 4) {
            this.playAmbientSound();
            this.pendingAmbientPlay = false;
        }

        this.saveData();
    }

    // Theme Management
    setTheme(theme) {
        this.settings.theme = theme;
        document.body.className = `theme-${theme}`;

        // Update theme toggle icon
        const themeIcons = {
            light: '🌙',
            dark: '☀️',
            warm: '❄️',
            cool: '🌸'
        };

        document.querySelector('.theme-icon').textContent = themeIcons[theme];

        // Update active theme option
        this.elements.themeOptions.forEach(option => {
            option.classList.toggle('active', option.dataset.theme === theme);
        });

        this.saveData();
    }

    cycleTheme() {
        const themes = ['light', 'dark', 'warm', 'cool'];
        const currentIndex = themes.indexOf(this.settings.theme);
        const nextIndex = (currentIndex + 1) % themes.length;
        this.setTheme(themes[nextIndex]);
    }

    // Audio System
    setupAudio() {
        this.setupAmbientSound();
        this.setupNotificationSound();
    }

    setupAmbientSound() {
        if (this.ambientAudio) {
            this.pauseAmbientSound();
            this.ambientAudio = null;
        }

        if (this.settings.ambientSound !== 'none') {
            this.createAmbientSound(this.settings.ambientSound);
        }
    }

    createAmbientSound(type) {
        try {
            // Create HTML Audio element for MP3 files
            this.ambientAudio = new Audio(`sounds/${type}.mp3`);
            this.ambientAudio.loop = true;
            this.ambientAudio.volume = (this.settings.soundVolume / 100) * 0.3; // Max 30% for ambient sounds
            this.ambientAudio.preload = 'auto';

            // Handle loading errors gracefully
            this.ambientAudio.addEventListener('error', (e) => {
                console.log(`Could not load ambient sound: ${type}.mp3`);
                this.ambientAudio = null;
            });

            // Handle successful load
            this.ambientAudio.addEventListener('canplaythrough', () => {
                console.log(`Ambient sound loaded: ${type}.mp3`);
                // If timer is running and we're waiting to play this sound, start it now
                if (this.isRunning && this.pendingAmbientPlay) {
                    this.playAmbientSound();
                    this.pendingAmbientPlay = false;
                }
            });

        } catch (e) {
            console.log('Could not create ambient audio:', e);
            this.ambientAudio = null;
        }
    }

    playAmbientSound() {
        if (this.ambientAudio && this.settings.ambientSound !== 'none') {
            try {
                this.ambientAudio.play();
            } catch (e) {
                console.log('Could not play ambient sound:', e);
            }
        }
    }

    pauseAmbientSound() {
        if (this.ambientAudio) {
            try {
                this.ambientAudio.pause();
            } catch (e) {
                console.log('Could not pause ambient sound:', e);
            }
        }
    }

    setupNotificationSound() {
        // Create a simple notification beep
        try {
            if (!this.audioContext) {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }
        } catch (e) {
            console.log('Web Audio API not supported');
        }
    }

    playNotificationSound() {
        if (!this.audioContext) return;

        try {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);

            oscillator.frequency.value = 800;
            oscillator.type = 'sine';

            gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(0.1, this.audioContext.currentTime + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);

            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + 0.5);
        } catch (e) {
            console.log('Could not play notification sound');
        }
    }

    // Notifications
    checkNotificationPermission() {
        if ('Notification' in window) {
            if (Notification.permission === 'granted') {
                this.settings.enableNotifications = true;
                this.elements.enableNotifications.checked = true;
            } else if (Notification.permission === 'denied') {
                this.settings.enableNotifications = false;
                this.elements.enableNotifications.checked = false;
            }
        }
    }

    showNotificationBanner() {
        if ('Notification' in window && Notification.permission === 'default' && !this.settings.notificationBannerDismissed) {
            this.elements.notificationBanner.classList.add('show');
        }
    }

    hideNotificationBanner() {
        this.elements.notificationBanner.classList.remove('show');
        this.settings.notificationBannerDismissed = true;
        this.saveData();
    }

    requestNotificationPermission() {
        if ('Notification' in window) {
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    this.settings.enableNotifications = true;
                    this.elements.enableNotifications.checked = true;
                    this.hideNotificationBanner();

                    // Show test notification
                    new Notification('Notifications Enabled! 🎉', {
                        body: 'You\'ll now be notified when sessions complete.',
                        icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🍅</text></svg>',
                        tag: 'timedoro-welcome'
                    });
                } else {
                    this.settings.enableNotifications = false;
                    this.elements.enableNotifications.checked = false;
                    this.hideNotificationBanner();
                }
                this.saveData();
            });
        }
    }

    showNotification() {
        if (!this.settings.enableNotifications || Notification.permission !== 'granted') return;

        const messages = {
            focus: {
                title: '🎯 Focus Session Complete!',
                body: `Great work! Time for a ${this.sessionCount === this.settings.sessionsUntilLongBreak ? 'long' : 'short'} break.`
            },
            shortBreak: {
                title: '☕ Break Time Over!',
                body: 'Ready to focus again? Let\'s get back to work!'
            },
            longBreak: {
                title: '🌟 Long Break Complete!',
                body: 'You\'ve completed a full cycle! Ready for more productivity?'
            }
        };

        const message = messages[this.currentSession];

        const notification = new Notification(message.title, {
            body: message.body,
            icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🍅</text></svg>',
            tag: 'timedoro-session',
            requireInteraction: false
        });

        // Auto-close after 5 seconds
        setTimeout(() => {
            notification.close();
        }, 5000);

        // Click to focus window
        notification.onclick = () => {
            window.focus();
            notification.close();
        };
    }

    // Keyboard Shortcuts
    handleKeyboard(e) {
        // Don't trigger shortcuts when typing in inputs
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

        switch (e.code) {
            case 'Space':
                e.preventDefault();
                this.toggleTimer();
                break;
            case 'KeyR':
                e.preventDefault();
                this.resetTimer();
                break;
            case 'KeyS':
                e.preventDefault();
                this.skipSession();
                break;
            case 'Digit1':
                e.preventDefault();
                this.setTheme('light');
                break;
            case 'Digit2':
                e.preventDefault();
                this.setTheme('dark');
                break;
            case 'Digit3':
                e.preventDefault();
                this.setTheme('warm');
                break;
            case 'Digit4':
                e.preventDefault();
                this.setTheme('cool');
                break;
            case 'Escape':
                e.preventDefault();
                this.closePanels();
                break;
        }
    }

    // Visibility handling for tab switching
    handleVisibilityChange() {
        if (document.hidden && this.isRunning) {
            // Tab is hidden, continue timer in background
            this.backgroundStartTime = Date.now();
        } else if (!document.hidden && this.backgroundStartTime && this.isRunning) {
            // Tab is visible again, sync timer
            const elapsed = Math.floor((Date.now() - this.backgroundStartTime) / 1000);
            this.timeRemaining = Math.max(0, this.timeRemaining - elapsed);
            this.backgroundStartTime = null;

            if (this.timeRemaining <= 0) {
                this.completeSession();
            } else {
                this.updateDisplay();
            }
        }
    }

    // Handle window resize to update display
    handleResize() {
        // Debounce resize events
        clearTimeout(this.resizeTimeout);
        this.resizeTimeout = setTimeout(() => {
            this.updateDisplay();
        }, 250);
    }

    // Task Management
    addTask() {
        const taskText = this.elements.taskInput.value.trim();
        if (!taskText) return;

        const task = {
            id: Date.now().toString(),
            text: taskText,
            completed: false,
            createdAt: new Date().toISOString()
        };

        this.tasks.unshift(task); // Add to beginning of array
        this.elements.taskInput.value = '';
        this.renderTasks();
        this.saveData();

        // Add a subtle animation
        this.elements.addTaskBtn.classList.add('bounce');
        setTimeout(() => {
            this.elements.addTaskBtn.classList.remove('bounce');
        }, 500);
    }

    renderTasks() {
        this.elements.taskList.innerHTML = '';

        this.tasks.forEach(task => {
            const taskElement = this.createTaskElement(task);
            this.elements.taskList.appendChild(taskElement);
        });

        this.updateCurrentTaskDisplay();
    }

    createTaskElement(task) {
        const taskItem = document.createElement('div');
        taskItem.className = `task-item ${task.completed ? 'completed' : ''} ${task.id === this.currentTaskId ? 'current' : ''}`;
        taskItem.dataset.taskId = task.id;

        taskItem.innerHTML = `
            <div class="task-checkbox ${task.completed ? 'checked' : ''}" data-action="toggle"></div>
            <div class="task-text">${this.escapeHtml(task.text)}</div>
            <div class="task-actions">
                <button class="task-action-btn ${task.id === this.currentTaskId ? 'current-btn' : ''}"
                        data-action="current" title="${task.id === this.currentTaskId ? 'Current task' : 'Set as current'}">
                    ${task.id === this.currentTaskId ? '●' : '○'}
                </button>
                <button class="task-action-btn" data-action="delete" title="Delete task">×</button>
            </div>
        `;

        // Add event listeners
        taskItem.addEventListener('click', (e) => {
            const action = e.target.dataset.action;
            const taskId = taskItem.dataset.taskId;

            switch (action) {
                case 'toggle':
                    this.toggleTaskComplete(taskId);
                    break;
                case 'current':
                    this.setCurrentTask(taskId === this.currentTaskId ? null : taskId);
                    break;
                case 'delete':
                    this.deleteTask(taskId);
                    break;
            }
        });

        return taskItem;
    }

    toggleTaskComplete(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) return;

        task.completed = !task.completed;
        task.completedAt = task.completed ? new Date().toISOString() : null;

        // If completing the current task, clear current task selection
        if (task.completed && this.currentTaskId === taskId) {
            this.setCurrentTask(null);
        }

        this.renderTasks();
        this.saveData();
    }

    setCurrentTask(taskId) {
        this.currentTaskId = taskId;
        this.renderTasks();
        this.updateCurrentTaskDisplay();
        this.saveData();
    }

    deleteTask(taskId) {
        this.tasks = this.tasks.filter(t => t.id !== taskId);

        // Clear current task if it was deleted
        if (this.currentTaskId === taskId) {
            this.currentTaskId = null;
        }

        this.renderTasks();
        this.saveData();
    }

    updateCurrentTaskDisplay() {
        const currentTask = this.tasks.find(t => t.id === this.currentTaskId);

        if (currentTask && !currentTask.completed) {
            this.elements.currentTaskDisplay.style.display = 'block';
            this.elements.currentTaskText.textContent = currentTask.text;
        } else {
            this.elements.currentTaskDisplay.style.display = 'none';
            this.currentTaskId = null;
        }
    }

    getCurrentTaskText() {
        const currentTask = this.tasks.find(t => t.id === this.currentTaskId);
        return currentTask ? currentTask.text : null;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Data Management
    loadData() {
        try {
            // Load settings
            const savedSettings = localStorage.getItem('timedoro-settings');
            if (savedSettings) {
                this.settings = { ...this.settings, ...JSON.parse(savedSettings) };
            }

            // Load session data
            const savedData = localStorage.getItem('timedoro-data');
            if (savedData) {
                this.sessionData = { ...this.sessionData, ...JSON.parse(savedData) };
            }

            // Load tasks
            const savedTasks = localStorage.getItem('timedoro-tasks');
            if (savedTasks) {
                const taskData = JSON.parse(savedTasks);
                this.tasks = taskData.tasks || [];
                this.currentTaskId = taskData.currentTaskId || null;
            }

            // Reset daily data if it's a new day
            const today = new Date().toDateString();
            const lastDate = this.sessionData.lastSessionDate ?
                new Date(this.sessionData.lastSessionDate).toDateString() : null;

            if (lastDate && lastDate !== today) {
                this.sessionData.todaysSessions = 0;
                this.sessionData.todaysTime = 0;
            }

            // Apply loaded settings
            this.applySettings();

        } catch (e) {
            console.log('Could not load saved data');
        }
    }

    saveData() {
        try {
            localStorage.setItem('timedoro-settings', JSON.stringify(this.settings));
            localStorage.setItem('timedoro-data', JSON.stringify(this.sessionData));
            localStorage.setItem('timedoro-tasks', JSON.stringify({
                tasks: this.tasks,
                currentTaskId: this.currentTaskId
            }));
        } catch (e) {
            console.log('Could not save data');
        }
    }

    applySettings() {
        // Apply theme
        this.setTheme(this.settings.theme);

        // Apply timer settings
        this.elements.focusTime.value = this.settings.focusTime;
        this.elements.shortBreak.value = this.settings.shortBreak;
        this.elements.longBreak.value = this.settings.longBreak;
        this.elements.sessionsUntilLongBreak.value = this.settings.sessionsUntilLongBreak;

        // Apply sound settings
        this.elements.ambientSound.value = this.settings.ambientSound;
        this.elements.soundVolume.value = this.settings.soundVolume;
        this.elements.enableNotifications.checked = this.settings.enableNotifications;

        // Update volume display
        document.querySelector('.volume-value').textContent = `${this.settings.soundVolume}%`;

        // Set initial session time
        this.setSessionTime();

        // Render tasks
        this.renderTasks();
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new TimedoroApp();
});

// Register service worker for better performance (optional)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(() => console.log('Service Worker registered'))
            .catch(() => console.log('Service Worker registration failed'));
    });
}
