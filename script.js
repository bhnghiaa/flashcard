// Flashcard Application
class FlashcardApp {
    constructor() {
        this.flashcards = [];
        this.currentCardIndex = 0;
        this.isFlipped = false;
        this.filteredCards = [];
        this.studyMode = false;
        this.stats = {
            totalWords: 0,
            studiedToday: 0,
            streak: 0,
            accuracy: 0,
            correctAnswers: 0,
            totalAnswers: 0
        };
        
        this.init();
    }

    init() {
        this.loadFromStorage();
        this.bindEvents();
        this.updateDisplay();
        this.updateStats();
        this.checkDailyStreak();
        this.setupiOSOptimizations();
    }

    // Event Bindings
    bindEvents() {
        // Navigation buttons
        document.getElementById('prevBtn').addEventListener('click', () => this.previousCard());
        document.getElementById('nextBtn').addEventListener('click', () => this.nextCard());
        document.getElementById('flipBtn').addEventListener('click', () => this.flipCard());
        
        // Card click to flip
        document.getElementById('flashcard').addEventListener('click', () => this.flipCard());
        
        // Modal events
        document.getElementById('addCardBtn').addEventListener('click', () => this.openModal('addCardModal'));
        document.getElementById('statsBtn').addEventListener('click', () => this.openModal('statsModal'));
        document.getElementById('closeModal').addEventListener('click', () => this.closeModal('addCardModal'));
        document.getElementById('closeStatsModal').addEventListener('click', () => this.closeModal('statsModal'));
        document.getElementById('cancelBtn').addEventListener('click', () => this.closeModal('addCardModal'));
        
        // Form submission
        document.getElementById('addCardForm').addEventListener('submit', (e) => this.addCard(e));
        
        // Search and filters
        document.getElementById('searchInput').addEventListener('input', (e) => this.searchCards(e.target.value));
        document.getElementById('categoryFilter').addEventListener('change', (e) => this.filterCards());
        document.getElementById('difficultyFilter').addEventListener('change', (e) => this.filterCards());
        document.getElementById('shuffleBtn').addEventListener('click', () => this.shuffleCards());
        
        // Learning actions
        document.querySelectorAll('.difficulty-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleDifficultyFeedback(e.target.dataset.difficulty));
        });
        
        // Audio playback
        document.getElementById('playAudio').addEventListener('click', () => this.playAudio());
        
        // Keyboard navigation
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));
        
        // Close modal on outside click
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal(modal.id);
                }
            });
        });
    }

    // Card Management
    addCard(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const card = {
            id: Date.now().toString(),
            word: formData.get('word') || document.getElementById('wordInput').value,
            pronunciation: formData.get('pronunciation') || document.getElementById('pronunciationInput').value,
            definition: formData.get('definition') || document.getElementById('definitionInput').value,
            vietnameseDefinition: formData.get('vietnameseDefinition') || document.getElementById('vietnameseDefinitionInput').value,
            example: formData.get('example') || document.getElementById('exampleInput').value,
            category: formData.get('category') || document.getElementById('categoryInput').value,
            wordType: formData.get('wordType') || document.getElementById('wordTypeInput').value,
            difficulty: 'medium',
            timesStudied: 0,
            correctCount: 0,
            incorrectCount: 0,
            lastStudied: null,
            created: new Date().toISOString()
        };

        this.flashcards.push(card);
        this.saveToStorage();
        this.updateDisplay();
        this.updateStats();
        this.closeModal('addCardModal');
        this.resetForm();
        this.showNotification('Flashcard added successfully!', 'success');
    }

    deleteCard(cardId) {
        if (confirm('Are you sure you want to delete this flashcard?')) {
            this.flashcards = this.flashcards.filter(card => card.id !== cardId);
            if (this.currentCardIndex >= this.flashcards.length) {
                this.currentCardIndex = Math.max(0, this.flashcards.length - 1);
            }
            this.saveToStorage();
            this.updateDisplay();
            this.updateStats();
            this.showNotification('Flashcard deleted successfully!', 'success');
        }
    }

    // Navigation
    nextCard() {
        if (this.filteredCards.length === 0) return;
        
        this.currentCardIndex = (this.currentCardIndex + 1) % this.filteredCards.length;
        this.updateDisplay();
        this.resetCardState();
    }

    previousCard() {
        if (this.filteredCards.length === 0) return;
        
        this.currentCardIndex = this.currentCardIndex === 0 ? 
            this.filteredCards.length - 1 : 
            this.currentCardIndex - 1;
        this.updateDisplay();
        this.resetCardState();
    }

    flipCard() {
        const flashcard = document.getElementById('flashcard');
        this.isFlipped = !this.isFlipped;
        flashcard.classList.toggle('flipped', this.isFlipped);
        
        // Show learning actions when flipped to back
        const learningActions = document.getElementById('learningActions');
        if (this.isFlipped && this.studyMode) {
            learningActions.style.display = 'block';
        } else {
            learningActions.style.display = 'none';
        }
    }

    resetCardState() {
        this.isFlipped = false;
        document.getElementById('flashcard').classList.remove('flipped');
        document.getElementById('learningActions').style.display = 'none';
    }

    // Search and Filter
    searchCards(query) {
        this.filterCards();
    }

    filterCards() {
        const searchQuery = document.getElementById('searchInput').value.toLowerCase();
        const categoryFilter = document.getElementById('categoryFilter').value;
        const difficultyFilter = document.getElementById('difficultyFilter').value;

        this.filteredCards = this.flashcards.filter(card => {
            const matchesSearch = !searchQuery || 
                card.word.toLowerCase().includes(searchQuery) ||
                card.definition.toLowerCase().includes(searchQuery) ||
                (card.vietnameseDefinition && card.vietnameseDefinition.toLowerCase().includes(searchQuery)) ||
                card.example.toLowerCase().includes(searchQuery);
            
            const matchesCategory = !categoryFilter || card.category === categoryFilter;
            const matchesDifficulty = !difficultyFilter || card.difficulty === difficultyFilter;
            
            return matchesSearch && matchesCategory && matchesDifficulty;
        });

        // Reset current index if filtered cards changed
        if (this.currentCardIndex >= this.filteredCards.length) {
            this.currentCardIndex = 0;
        }

        this.updateDisplay();
    }

    shuffleCards() {
        this.filteredCards = this.shuffleArray([...this.filteredCards]);
        this.currentCardIndex = 0;
        this.updateDisplay();
        this.showNotification('Cards shuffled!', 'info');
    }

    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    // Display Updates
    updateDisplay() {
        if (this.filteredCards.length === 0) {
            this.filteredCards = [...this.flashcards];
        }

        const currentCard = this.filteredCards[this.currentCardIndex];
        
        if (!currentCard) {
            this.showEmptyState();
            return;
        }

        // Update card content
        document.getElementById('frontWord').textContent = currentCard.word;
        document.getElementById('pronunciation').textContent = currentCard.pronunciation || '';
        document.getElementById('backDefinition').textContent = currentCard.definition;
        document.getElementById('vietnameseDefinition').textContent = currentCard.vietnameseDefinition || '';
        document.getElementById('example').textContent = currentCard.example || '';
        document.getElementById('wordType').textContent = currentCard.wordType || '';
        
        // Update categories and difficulty
        document.getElementById('cardCategory').textContent = currentCard.category;
        document.getElementById('cardDifficulty').textContent = currentCard.difficulty;
        document.getElementById('backCategory').textContent = currentCard.category;
        document.getElementById('backDifficulty').textContent = currentCard.difficulty;
        
        // Update progress
        document.getElementById('currentCard').textContent = this.currentCardIndex + 1;
        document.getElementById('totalCards').textContent = this.filteredCards.length;
        
        const progressPercentage = ((this.currentCardIndex + 1) / this.filteredCards.length) * 100;
        document.getElementById('progressFill').style.width = `${progressPercentage}%`;
        document.getElementById('progressPercentage').textContent = `${Math.round(progressPercentage)}%`;
        
        // Update navigation buttons
        document.getElementById('prevBtn').disabled = this.filteredCards.length <= 1;
        document.getElementById('nextBtn').disabled = this.filteredCards.length <= 1;
        
        // Hide empty state
        document.querySelector('.flashcard-container').style.display = 'flex';
    }

    showEmptyState() {
        document.getElementById('frontWord').textContent = 'No flashcards available';
        document.getElementById('pronunciation').textContent = '';
        document.getElementById('backDefinition').textContent = 'Add your first flashcard to get started!';
        document.getElementById('vietnameseDefinition').textContent = '';
        document.getElementById('example').textContent = '';
        document.getElementById('wordType').textContent = '';
        document.getElementById('currentCard').textContent = '0';
        document.getElementById('totalCards').textContent = '0';
        document.getElementById('progressFill').style.width = '0%';
        document.getElementById('progressPercentage').textContent = '0%';
    }

    // Learning System
    handleDifficultyFeedback(difficulty) {
        const currentCard = this.filteredCards[this.currentCardIndex];
        if (!currentCard) return;

        // Update card statistics
        currentCard.timesStudied++;
        currentCard.lastStudied = new Date().toISOString();
        
        if (difficulty === 'easy') {
            currentCard.correctCount++;
            currentCard.difficulty = 'easy';
        } else if (difficulty === 'medium') {
            currentCard.correctCount++;
        } else {
            currentCard.incorrectCount++;
            currentCard.difficulty = 'hard';
        }

        // Update global stats
        this.stats.totalAnswers++;
        if (difficulty !== 'hard') {
            this.stats.correctAnswers++;
        }
        this.stats.studiedToday++;
        this.stats.accuracy = Math.round((this.stats.correctAnswers / this.stats.totalAnswers) * 100);

        this.saveToStorage();
        this.updateStats();
        
        // Move to next card
        setTimeout(() => {
            this.nextCard();
        }, 500);
    }

    // Statistics
    updateStats() {
        this.stats.totalWords = this.flashcards.length;
        
        document.getElementById('totalWordsStats').textContent = this.stats.totalWords;
        document.getElementById('studiedTodayStats').textContent = this.stats.studiedToday;
        document.getElementById('streakStats').textContent = this.stats.streak;
        document.getElementById('accuracyStats').textContent = `${this.stats.accuracy}%`;
    }

    checkDailyStreak() {
        const today = new Date().toDateString();
        const lastStudy = localStorage.getItem('lastStudyDate');
        
        if (lastStudy === today) {
            // Already studied today
            return;
        }
        
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        
        if (lastStudy === yesterday.toDateString()) {
            // Studied yesterday, continue streak
            this.stats.streak++;
        } else if (lastStudy !== today) {
            // Broke streak or first time
            this.stats.streak = this.stats.studiedToday > 0 ? 1 : 0;
        }
        
        if (this.stats.studiedToday > 0) {
            localStorage.setItem('lastStudyDate', today);
        }
    }

    // Audio
    playAudio() {
        const currentCard = this.filteredCards[this.currentCardIndex];
        if (!currentCard) return;

        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(currentCard.word);
            utterance.lang = 'en-US';
            utterance.rate = 0.8;
            speechSynthesis.speak(utterance);
        } else {
            this.showNotification('Speech synthesis not supported in this browser', 'warning');
        }
    }

    // Keyboard Navigation
    handleKeyboard(e) {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
            return;
        }

        switch (e.key) {
            case 'ArrowLeft':
                e.preventDefault();
                this.previousCard();
                break;
            case 'ArrowRight':
                e.preventDefault();
                this.nextCard();
                break;
            case ' ':
            case 'Enter':
                e.preventDefault();
                this.flipCard();
                break;
            case 'Escape':
                this.closeAllModals();
                break;
            case 'n':
                if (e.ctrlKey) {
                    e.preventDefault();
                    this.openModal('addCardModal');
                }
                break;
        }
    }

    // iOS-specific optimizations
    setupiOSOptimizations() {
        // Detect iPhone 13 and similar devices
        const isIPhone = /iPhone|iPad|iPod/.test(navigator.userAgent) && !window.MSStream;
        const isIPhone13 = window.screen.width === 390 && window.screen.height === 844;
        
        if (isIPhone || isIPhone13) {
            // Prevent zoom on input focus
            document.addEventListener('touchstart', (e) => {
                if (e.touches.length > 1) {
                    e.preventDefault();
                }
            }, { passive: false });

            // Prevent double-tap zoom
            let lastTouchEnd = 0;
            document.addEventListener('touchend', (e) => {
                const now = (new Date()).getTime();
                if (now - lastTouchEnd <= 300) {
                    e.preventDefault();
                }
                lastTouchEnd = now;
            }, false);

            // Optimize scrolling
            document.body.style.webkitOverflowScrolling = 'touch';
            
            // Add specific class for iPhone styling
            document.body.classList.add('ios-device');
            
            if (isIPhone13) {
                document.body.classList.add('iphone-13');
            }

            // Prevent bounce effect
            document.addEventListener('touchmove', (e) => {
                if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
                    e.preventDefault();
                }
            }, { passive: false });
        }
    }

    // Modal Management
    openModal(modalId) {
        document.getElementById(modalId).classList.add('active');
        if (modalId === 'addCardModal') {
            document.getElementById('wordInput').focus();
        }
    }

    closeModal(modalId) {
        document.getElementById(modalId).classList.remove('active');
        if (modalId === 'addCardModal') {
            this.resetForm();
        }
    }

    closeAllModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.remove('active');
        });
    }

    resetForm() {
        document.getElementById('addCardForm').reset();
    }

    // Storage
    saveToStorage() {
        localStorage.setItem('flashcards', JSON.stringify(this.flashcards));
        localStorage.setItem('flashcardStats', JSON.stringify(this.stats));
    }

    loadFromStorage() {
        const savedCards = localStorage.getItem('flashcards');
        const savedStats = localStorage.getItem('flashcardStats');
        
        if (savedCards) {
            this.flashcards = JSON.parse(savedCards);
        }
        
        if (savedStats) {
            this.stats = { ...this.stats, ...JSON.parse(savedStats) };
        }
        
        this.filteredCards = [...this.flashcards];
    }

    // Notifications
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        const style = document.createElement('style');
        style.textContent = `
            .notification {
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 1rem 1.5rem;
                border-radius: 0.5rem;
                color: white;
                font-weight: 500;
                z-index: 9999;
                animation: slideInRight 0.3s ease, fadeOut 0.3s ease 2.7s;
                max-width: 300px;
            }
            .notification.success { background: #10b981; }
            .notification.error { background: #ef4444; }
            .notification.warning { background: #f59e0b; }
            .notification.info { background: #06b6d4; }
            @keyframes slideInRight {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes fadeOut {
                from { opacity: 1; }
                to { opacity: 0; }
            }
        `;
        
        document.head.appendChild(style);
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
            style.remove();
        }, 3000);
    }

    // Study Mode
    startStudyMode() {
        this.studyMode = true;
        this.shuffleCards();
        this.showNotification('Study mode started! Rate your knowledge after each card.', 'info');
    }

    stopStudyMode() {
        this.studyMode = false;
        document.getElementById('learningActions').style.display = 'none';
    }
}

// Sample data for demonstration
const sampleFlashcards = [
    {
        id: '1',
        word: 'Insulation',
        pronunciation: '/ˌɪn.səˈleɪ.ʃən/',
        definition: 'Material used to prevent the loss or transfer of heat, electricity, or sound',
        vietnameseDefinition: 'Vật liệu cách nhiệt, cách điện hoặc cách âm',
        example: 'These walls need proper insulation to keep the house warm in winter.',
        category: 'technical',
        wordType: 'noun',
        difficulty: 'medium',
        timesStudied: 0,
        correctCount: 0,
        incorrectCount: 0,
        lastStudied: null,
        created: new Date().toISOString()
    },
    {
        id: '2',
        word: 'Efficient',
        pronunciation: '/ɪˈfɪʃ.ənt/',
        definition: 'Capable of producing desired results with little or no waste of time, materials, or energy',
        vietnameseDefinition: 'Hiệu quả, có khả năng tạo ra kết quả mong muốn với ít lãng phí',
        example: 'The new air conditioner is more efficient than our old one.',
        category: 'general',
        wordType: 'adjective',
        difficulty: 'medium',
        timesStudied: 0,
        correctCount: 0,
        incorrectCount: 0,
        lastStudied: null,
        created: new Date().toISOString()
    },
    {
        id: '3',
        word: 'Expressive',
        pronunciation: '/ɪkˈspres.ɪv/',
        definition: 'Effectively conveying thought or feeling; full of expression',
        vietnameseDefinition: 'Biểu cảm, có sức diễn đạt mạnh mẽ tư tưởng và cảm xúc',
        example: 'She has very expressive eyes that show exactly what she\'s thinking.',
        category: 'general',
        wordType: 'adjective',
        difficulty: 'medium',
        timesStudied: 0,
        correctCount: 0,
        incorrectCount: 0,
        lastStudied: null,
        created: new Date().toISOString()
    },
    {
        id: '4',
        word: 'Express',
        pronunciation: '/ɪkˈspres/',
        definition: 'To convey or communicate thoughts, feelings, or ideas; to make known',
        vietnameseDefinition: 'Biểu đạt, thể hiện tư tưởng, cảm xúc hoặc ý tưởng',
        example: 'Words cannot express how grateful I am for your help.',
        category: 'general',
        wordType: 'verb',
        difficulty: 'easy',
        timesStudied: 0,
        correctCount: 0,
        incorrectCount: 0,
        lastStudied: null,
        created: new Date().toISOString()
    },
    {
        id: '5',
        word: 'Expression',
        pronunciation: '/ɪkˈspreʃ.ən/',
        definition: 'The action of expressing thoughts or feelings; a particular way of phrasing an idea',
        vietnameseDefinition: 'Biểu hiện, cách diễn đạt tư tưởng hoặc cảm xúc',
        example: 'The expression "break a leg" should not be taken literally.',
        category: 'general',
        wordType: 'noun',
        difficulty: 'medium',
        timesStudied: 0,
        correctCount: 0,
        incorrectCount: 0,
        lastStudied: null,
        created: new Date().toISOString()
    },
    {
        id: '6',
        word: 'Reliable',
        pronunciation: '/rɪˈlaɪ.ə.bəl/',
        definition: 'Capable of being relied on; dependable and trustworthy',
        vietnameseDefinition: 'Đáng tin cậy, có thể dựa vào được',
        example: 'She is a reliable assistant who always completes her work on time.',
        category: 'general',
        wordType: 'adjective',
        difficulty: 'easy',
        timesStudied: 0,
        correctCount: 0,
        incorrectCount: 0,
        lastStudied: null,
        created: new Date().toISOString()
    },
    {
        id: '7',
        word: 'Partial',
        pronunciation: '/ˈpɑːr.ʃəl/',
        definition: 'Not complete or entire; existing only in part',
        vietnameseDefinition: 'Một phần, không hoàn chỉnh hoặc toàn bộ',
        example: 'The project received only partial funding, so we had to scale it down.',
        category: 'general',
        wordType: 'adjective',
        difficulty: 'medium',
        timesStudied: 0,
        correctCount: 0,
        incorrectCount: 0,
        lastStudied: null,
        created: new Date().toISOString()
    },
    {
        id: '8',
        word: 'Extreme',
        pronunciation: '/ɪkˈstriːm/',
        definition: 'Existing in a very high degree; going to great or exaggerated lengths',
        vietnameseDefinition: 'Cực đoan, cực kỳ, ở mức độ rất cao',
        example: 'The plant is sensitive to extreme heat and cold.',
        category: 'general',
        wordType: 'adjective',
        difficulty: 'medium',
        timesStudied: 0,
        correctCount: 0,
        incorrectCount: 0,
        lastStudied: null,
        created: new Date().toISOString()
    },
    {
        id: '9',
        word: 'Suburban',
        pronunciation: '/səˈbɜːr.bən/',
        definition: 'Relating to or characteristic of a suburb; located in a suburb',
        vietnameseDefinition: 'Thuộc về vùng ngoại ô',
        example: 'They moved to a quiet suburban neighborhood with tree-lined streets.',
        category: 'general',
        wordType: 'adjective',
        difficulty: 'easy',
        timesStudied: 0,
        correctCount: 0,
        incorrectCount: 0,
        lastStudied: null,
        created: new Date().toISOString()
    },
    {
        id: '10',
        word: 'Outsell',
        pronunciation: '/ˌaʊtˈsel/',
        definition: 'To sell more than; to exceed in sales',
        vietnameseDefinition: 'Bán nhiều hơn, vượt qua về doanh số',
        example: 'Our new product managed to outsell all competitors this quarter.',
        category: 'business',
        wordType: 'verb',
        difficulty: 'medium',
        timesStudied: 0,
        correctCount: 0,
        incorrectCount: 0,
        lastStudied: null,
        created: new Date().toISOString()
    },
    {
        id: '11',
        word: 'Competitors',
        pronunciation: '/kəmˈpet.ɪ.tərz/',
        definition: 'Companies or individuals who compete against each other in business or sport',
        vietnameseDefinition: 'Đối thủ cạnh tranh',
        example: 'The company studied its competitors carefully before launching the new product.',
        category: 'business',
        wordType: 'noun',
        difficulty: 'easy',
        timesStudied: 0,
        correctCount: 0,
        incorrectCount: 0,
        lastStudied: null,
        created: new Date().toISOString()
    },
    {
        id: '12',
        word: 'Strategy',
        pronunciation: '/ˈstræt.ə.dʒi/',
        definition: 'A plan of action designed to achieve a long-term or overall aim',
        vietnameseDefinition: 'Chiến lược',
        example: 'The marketing strategy helped increase brand awareness significantly.',
        category: 'business',
        wordType: 'noun',
        difficulty: 'medium',
        timesStudied: 0,
        correctCount: 0,
        incorrectCount: 0,
        lastStudied: null,
        created: new Date().toISOString()
    },
    {
        id: '13',
        word: 'Addressed the audience',
        pronunciation: '/əˈdrest ði ˈɔː.di.əns/',
        definition: 'Spoke to or delivered a speech to a group of people',
        vietnameseDefinition: 'Phát biểu trước khán giả',
        example: 'The CEO addressed the audience about the company\'s future plans.',
        category: 'communication',
        wordType: 'verb phrase',
        difficulty: 'medium',
        timesStudied: 0,
        correctCount: 0,
        incorrectCount: 0,
        lastStudied: null,
        created: new Date().toISOString()
    },
    {
        id: '14',
        word: 'Engine',
        pronunciation: '/ˈen.dʒɪn/',
        definition: 'A machine with moving parts that converts power into motion',
        vietnameseDefinition: 'Động cơ',
        example: 'The car\'s engine needs regular maintenance to run smoothly.',
        category: 'technical',
        wordType: 'noun',
        difficulty: 'easy',
        timesStudied: 0,
        correctCount: 0,
        incorrectCount: 0,
        lastStudied: null,
        created: new Date().toISOString()
    },
    {
        id: '15',
        word: 'Aid',
        pronunciation: '/eɪd/',
        definition: 'Help, assistance, or support; to help or assist',
        vietnameseDefinition: 'Hỗ trợ, giúp đỡ',
        example: 'International aid was provided to the disaster-affected areas.',
        category: 'general',
        wordType: 'noun/verb',
        difficulty: 'easy',
        timesStudied: 0,
        correctCount: 0,
        incorrectCount: 0,
        lastStudied: null,
        created: new Date().toISOString()
    },
    {
        id: '16',
        word: 'Legal',
        pronunciation: '/ˈliː.ɡəl/',
        definition: 'Relating to the law; permitted by law',
        vietnameseDefinition: 'Hợp pháp, thuộc về luật',
        example: 'You should seek legal advice before signing the contract.',
        category: 'legal',
        wordType: 'adjective',
        difficulty: 'easy',
        timesStudied: 0,
        correctCount: 0,
        incorrectCount: 0,
        lastStudied: null,
        created: new Date().toISOString()
    },
    {
        id: '17',
        word: 'Upscale',
        pronunciation: '/ˈʌp.skeɪl/',
        definition: 'Expensive and of high quality; designed for wealthy people',
        vietnameseDefinition: 'Cao cấp, sang trọng',
        example: 'The upscale restaurant serves gourmet cuisine at premium prices.',
        category: 'general',
        wordType: 'adjective',
        difficulty: 'medium',
        timesStudied: 0,
        correctCount: 0,
        incorrectCount: 0,
        lastStudied: null,
        created: new Date().toISOString()
    },
    {
        id: '18',
        word: 'Boutique',
        pronunciation: '/buːˈtiːk/',
        definition: 'A small store selling fashionable clothes or accessories',
        vietnameseDefinition: 'Cửa hàng thời trang nhỏ',
        example: 'She opened a boutique specializing in vintage clothing.',
        category: 'business',
        wordType: 'noun',
        difficulty: 'medium',
        timesStudied: 0,
        correctCount: 0,
        incorrectCount: 0,
        lastStudied: null,
        created: new Date().toISOString()
    },
    {
        id: '19',
        word: 'Accessories',
        pronunciation: '/əkˈses.ər.iz/',
        definition: 'Additional items of dress or equipment carried or worn',
        vietnameseDefinition: 'Phụ kiện',
        example: 'The store sells clothing and accessories like bags and jewelry.',
        category: 'fashion',
        wordType: 'noun',
        difficulty: 'easy',
        timesStudied: 0,
        correctCount: 0,
        incorrectCount: 0,
        lastStudied: null,
        created: new Date().toISOString()
    },
    {
        id: '20',
        word: 'Recognize',
        pronunciation: '/ˈrek.əɡ.naɪz/',
        definition: 'To identify or acknowledge; to accept as valid',
        vietnameseDefinition: 'Nhận ra, công nhận',
        example: 'I didn\'t recognize him with his new haircut.',
        category: 'general',
        wordType: 'verb',
        difficulty: 'easy',
        timesStudied: 0,
        correctCount: 0,
        incorrectCount: 0,
        lastStudied: null,
        created: new Date().toISOString()
    },
    {
        id: '21',
        word: 'Responsibly',
        pronunciation: '/rɪˈspɒn.sə.bli/',
        definition: 'In a responsible manner; with care and thought for consequences',
        vietnameseDefinition: 'Một cách có trách nhiệm',
        example: 'Everyone should use natural resources responsibly.',
        category: 'general',
        wordType: 'adverb',
        difficulty: 'medium',
        timesStudied: 0,
        correctCount: 0,
        incorrectCount: 0,
        lastStudied: null,
        created: new Date().toISOString()
    },
    {
        id: '22',
        word: 'Riskiest',
        pronunciation: '/ˈrɪs.ki.ɪst/',
        definition: 'Most dangerous or involving the most risk',
        vietnameseDefinition: 'Rủi ro nhất',
        example: 'Investing in startups is often the riskiest but potentially most rewarding option.',
        category: 'business',
        wordType: 'adjective',
        difficulty: 'medium',
        timesStudied: 0,
        correctCount: 0,
        incorrectCount: 0,
        lastStudied: null,
        created: new Date().toISOString()
    },
    {
        id: '23',
        word: 'Medications',
        pronunciation: '/ˌmed.ɪˈkeɪ.ʃənz/',
        definition: 'Drugs or medicines used to treat illness',
        vietnameseDefinition: 'Thuốc men',
        example: 'Patients should take their medications exactly as prescribed by the doctor.',
        category: 'medical',
        wordType: 'noun',
        difficulty: 'easy',
        timesStudied: 0,
        correctCount: 0,
        incorrectCount: 0,
        lastStudied: null,
        created: new Date().toISOString()
    },
    {
        id: '24',
        word: 'Stages',
        pronunciation: '/steɪdʒɪz/',
        definition: 'Distinct phases or steps in a process or development',
        vietnameseDefinition: 'Giai đoạn, bước',
        example: 'The project will be completed in three stages over the next year.',
        category: 'general',
        wordType: 'noun',
        difficulty: 'easy',
        timesStudied: 0,
        correctCount: 0,
        incorrectCount: 0,
        lastStudied: null,
        created: new Date().toISOString()
    },
    {
        id: '25',
        word: 'Installments',
        pronunciation: '/ɪnˈstɔːl.mənts/',
        definition: 'Payments made at regular intervals; parts of something delivered in succession',
        vietnameseDefinition: 'Kỳ trả góp',
        example: 'They bought the car on installments, paying monthly for three years.',
        category: 'business',
        wordType: 'noun',
        difficulty: 'medium',
        timesStudied: 0,
        correctCount: 0,
        incorrectCount: 0,
        lastStudied: null,
        created: new Date().toISOString()
    },
    {
        id: '26',
        word: 'Perspectives',
        pronunciation: '/pərˈspek.tɪvz/',
        definition: 'Particular attitudes toward or ways of regarding something; viewpoints',
        vietnameseDefinition: 'Quan điểm, góc nhìn',
        example: 'The discussion brought together different perspectives on climate change.',
        category: 'general',
        wordType: 'noun',
        difficulty: 'medium',
        timesStudied: 0,
        correctCount: 0,
        incorrectCount: 0,
        lastStudied: null,
        created: new Date().toISOString()
    },
    {
        id: '27',
        word: 'Seeking',
        pronunciation: '/ˈsiː.kɪŋ/',
        definition: 'Trying to find or obtain; searching for',
        vietnameseDefinition: 'Tìm kiếm',
        example: 'Many graduates are seeking employment in the technology sector.',
        category: 'general',
        wordType: 'verb',
        difficulty: 'easy',
        timesStudied: 0,
        correctCount: 0,
        incorrectCount: 0,
        lastStudied: null,
        created: new Date().toISOString()
    }
];

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const app = new FlashcardApp();
    
    // Load sample data if no cards exist
    if (app.flashcards.length === 0) {
        app.flashcards = sampleFlashcards;
        app.filteredCards = [...app.flashcards];
        app.saveToStorage();
        app.updateDisplay();
        app.updateStats();
    }
    
    // Make app globally accessible for debugging
    window.flashcardApp = app;
    
    // Add study mode button functionality
    const studyModeBtn = document.createElement('button');
    studyModeBtn.textContent = 'Study Mode';
    studyModeBtn.className = 'btn btn-primary';
    studyModeBtn.style.marginLeft = '1rem';
    studyModeBtn.addEventListener('click', () => app.startStudyMode());
    
    document.querySelector('.controls').appendChild(studyModeBtn);
});

// Service Worker Registration (for PWA capabilities)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => console.log('SW registered'))
            .catch(error => console.log('SW registration failed'));
    });
} 