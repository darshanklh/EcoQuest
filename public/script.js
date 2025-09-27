import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
// Combined and cleaned up Auth imports
import { getAuth, onAuthStateChanged, GoogleAuthProvider, getRedirectResult, signOut, setPersistence, browserLocalPersistence, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
// Firestore imports (no change needed)
import { getFirestore, collection, doc, setDoc, getDoc, getDocs, onSnapshot, query, orderBy, limit, writeBatch, updateDoc, increment, addDoc, serverTimestamp, where } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
// ADD a new import for Firebase Storage
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-storage.js";

// PASTE YOUR OPENROUTER API KEY HERE


document.addEventListener('DOMContentLoaded', () => {
    // --- Firebase Config & App Setup ---
    const firebaseConfig = {
          apiKey: "AIzaSyCjCiyLQGmjm9VrywOMeS7iz2X66218w_Y",
          authDomain: "ecoquest-e7178.firebaseapp.com",
          projectId: "ecoquest-e7178",
          storageBucket: "ecoquest-e7178.firebasestorage.app",
          messagingSenderId: "412287168738",
          appId: "1:412287168738:web:00f8c0b57c782212362ebb",
          measurementId: "G-ZBYR6BEGZD"
    };

    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const db = getFirestore(app);
    const storage = getStorage(app);

    const usersCollectionPath = 'users';
    const challengesCollectionPath = 'challenges';
    const quizAttemptsCollectionPath = 'quiz_attempts';

    // --- DOM Elements ---
    const loginView = document.getElementById('login-view');
    const dashboardLayout = document.getElementById('dashboard-layout');
    const googleSignInButton = document.getElementById('google-signin-button');
    
    const tabLinks = document.querySelectorAll('.tab-link');
    const tabContents = document.querySelectorAll('.tab-content');
    const authStatus = document.getElementById('auth-status');
    const emailSigninInput = document.getElementById('email-signin');
    const passwordSigninInput = document.getElementById('password-signin');
    const emailPasswordSigninButton = document.getElementById('email-password-signin-button');
    // NEW: Registration form elements
    const registerForm = document.getElementById('register-form');
    const nicknameRegisterInput = document.getElementById('nickname-register');
    const emailRegisterInput = document.getElementById('email-register');
    const passwordRegisterInput = document.getElementById('password-register');
    const registerStatus = document.getElementById('register-status');


    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const nickname = nicknameRegisterInput.value;
        const email = emailRegisterInput.value;
        const password = passwordRegisterInput.value;

        // Simple client-side validation
        if (password.length < 6) {
            registerStatus.textContent = "Password must be at least 6 characters.";
            return;
        }

        registerStatus.textContent = "Creating account...";
        try {
            // Create the user in Firebase Auth
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Immediately update the user's profile with their nickname
            await updateProfile(user, {
                displayName: nickname
            });

            // Create a user document in Firestore with initial data
            const userRef = doc(db, "users", user.uid);
            await setDoc(userRef, {
                nickname: nickname,
                points: 10,
                completedTasks: 0,
                userId: user.uid,
                treeBadges: 0,
                photoURL: user.photoURL || 'https://i.stack.imgur.com/34AD2.jpg',
                unlockedAchievements: [],
                gamesPlayed: 0,
                puzzlesWon: 0,
                lastLoginDate: serverTimestamp(),
                loginStreak: 1
            });

            // Success message and redirect to sign-in tab
            registerStatus.textContent = "✅ Account created successfully! Please sign in.";
            registerStatus.classList.remove('text-red-500');
            registerStatus.classList.add('text-green-500');

            // Find and click the 'Sign In' tab button to switch back
            const signInTab = document.querySelector('[data-tab="signin"]');
            if (signInTab) {
                signInTab.click();
            }

            // Clear the form fields after successful registration
            registerForm.reset();

        } catch (error) {
            console.error("Registration error:", error);
            registerStatus.classList.remove('text-green-500');
            registerStatus.classList.add('text-red-500');

            if (error.code === 'auth/email-already-in-use') {
                registerStatus.textContent = "This email is already registered. Please sign in or use a different email.";
            } else if (error.code === 'auth/weak-password') {
                registerStatus.textContent = "Password is too weak. Please choose a stronger one.";
            } else {
                registerStatus.textContent = "Registration failed. Please try again.";
            }
        }
    });
    const userNickname = document.getElementById('user-nickname');
    const userPoints = document.getElementById('user-points');
    const tasksGrid = document.getElementById('tasks-grid');
    const leaderboard = document.getElementById('leaderboard');
    const achievementsGrid = document.getElementById('achievements-grid');
    const quizzesGrid = document.getElementById('quizzes-grid');
    const sidebarNav = document.getElementById('sidebar-nav');
    const pageContents = document.querySelectorAll('.page-content');
    const searchForm = document.getElementById('search-form');
    const searchInput = document.getElementById('search-input');
    const searchFeedback = document.getElementById('search-feedback');
    const userBadges = document.getElementById('user-badges');
    const userStreak = document.getElementById('user-streak');
    const weeklyTaskContainer = document.getElementById('weekly-task-container');
    const cameraModalContainer = document.getElementById('camera-modal-container');
    const cameraCloseButton = document.getElementById('camera-close-button');
    const capturePhotoButton = document.getElementById('capture-photo-button');
    const dashboardSignOutButton = document.getElementById('dashboard-sign-out-button');
    const userPhoto = document.getElementById('user-photo');
    const photoContainer = document.getElementById('photo-container');
    const photoUploadInput = document.getElementById('photo-upload-input');
    let puzzleGrid = document.getElementById('puzzle-grid');
    let puzzleFeedback = document.getElementById('puzzle-feedback');
    let resetPuzzleButton = document.getElementById('reset-puzzle-button');
    const dashboardPoints = document.getElementById('dashboard-points');
    const dashboardCompleted = document.getElementById('dashboard-completed');
    const dashboardRank = document.getElementById('dashboard-rank');
    const modal = document.getElementById('submission-modal');
    const modalBackdrop = document.querySelector('.modal-backdrop');
    const modalTitle = document.getElementById('modal-title');
    const modalIcon = document.getElementById('modal-icon');
    const modalDescription = document.getElementById('modal-description');
    const modalPoints = document.getElementById('modal-points');
    const cancelButton = document.getElementById('cancel-button');
    const submissionForm = document.getElementById('submission-form');
    const quizModalContainer = document.getElementById('quiz-modal-container');
    const quizTitle = document.getElementById('quiz-title');
    const quizProgress = document.getElementById('quiz-progress');
    const quizCloseButton = document.getElementById('quiz-close-button');
    const quizQuestion = document.getElementById('quiz-question');
    const quizOptions = document.getElementById('quiz-options');
    const quizPrevButton = document.getElementById('quiz-prev-button');
    const quizNextButton = document.getElementById('quiz-next-button');
    const quizSubmitButton = document.getElementById('quiz-submit-button');
    const quizLoading = document.getElementById('quiz-loading');
    const resultsModalContainer = document.getElementById('results-modal-container');
    const resultsScore = document.getElementById('results-score');
    const resultsSummary = document.getElementById('results-summary');
    const resultsDetails = document.getElementById('results-details');
    const resultsCloseButton = document.getElementById('results-close-button');
    const profilePhotoUploadArea = document.getElementById('profile-photo-upload-area'); // New element to reference

    // --- NEW BOT UI ELEMENTS ---
    const botIconButton = document.getElementById('bot-icon-button');
    const botChatModal = document.getElementById('bot-chat-modal');
    const botCloseButton = document.getElementById('bot-close-button');
    const chatWindow = document.getElementById('chat-window');
    const chatInput = document.getElementById('chat-input');
    const chatSendButton = document.getElementById('chat-send-button');
    
    
    

    // --- App State ---
    let currentChallenge = null;
    let currentUser = null;
    let allTasks = [];
    let currentQuiz = null;
    let currentQuestionIndex = 0;
    let userAnswers = [];
    let puzzlePointsAwarded = false;
    let currentlyFeaturedTask = null;
    let currentlyFeaturedMonthlyTask = null;
    let currentTaskIdForGame = null;

    // --- Data Definitions ---
    const defaultTasks = [
        { id: 'waste-segregation', title: 'Waste Segregation', description: 'Learn to separate waste correctly, then test your sorting speed in the Recycle Rush challenge!', points: 10, icon: '🗑️' },
        { id: 'plant-sapling', title: 'Plant a Sapling', description: 'Plant a tree in your neighborhood or a designated area.', points: 50, icon: '🌱' },
        { id: 'reusable-bag', title: 'Use a Reusable Bag', description: 'Go shopping with a reusable cloth or jute bag.', points: 50, icon: '🛍️' },
        { id: 'energy-saver', title: 'Energy Saver', description: 'Unplug unused devices to prevent energy waste. Test your reflexes in the Lights Out! game!', points: 50, icon: '💡' },
        { id: 'water-conservation', title: 'Water Conservation', description: 'Fix a leaky tap or reduce your shower time.', points: 25, icon: '💧' },
        { id: 'local-commute', title: 'Eco-Friendly Commute', description: 'Use public transport, cycle, or walk instead of a private vehicle.', points: 30, icon: '🚲' }
    ];

    const achievements = [
        // --- Type: Points ---
        { id: 'novice', title: 'Eco Novice', description: 'Complete your first task.', type: 'points', value: 1, icon: '🔰' },
        { id: 'apprentice', title: 'Green Apprentice', description: 'Earn 50 points.', type: 'points', value: 50, icon: '🌿' },
        { id: 'warrior', title: 'Eco Warrior', description: 'Earn 100 points.', type: 'points', value: 100, icon: '🛡️' },
        { id: 'champion', title: 'Planet Champion', description: 'Earn 200 points.', type: 'points', value: 200, icon: '🏆' },
        { id: 'virtuoso', title: 'Eco Virtuoso', description: 'Earn 500 points.', type: 'points', value: 500, icon: '⭐' },
        { id: 'protector', title: 'Planet Protector', description: 'Earn 1,000 points.', type: 'points', value: 1000, icon: '🌎' },
        // --- Type: Tasks Completed ---
        { id: 'mission-master', title: 'Mission Master', description: 'Complete 15 total tasks.', type: 'tasks', value: 15, icon: '🎯' },
        { id: 'quest-conqueror', title: 'Quest Conqueror', description: 'Complete 30 total tasks.', type: 'tasks', value: 30, icon: '🎖️' },
        // --- Type: Trees Planted ---
        { id: 'sapling-starter', title: 'Sapling Starter', description: 'Plant your first tree.', type: 'trees', value: 1, icon: '🌳' },
        { id: 'forest-founder', title: 'Forest Founder', description: 'Plant 10 trees.', type: 'trees', value: 10, icon: '🌲' },
        { id: 'arboretum-architect', title: 'Arboretum Architect', description: 'Plant 25 trees.', type: 'trees', value: 25, icon: '🏞️' },
        // --- Type: Games Played ---
        { id: 'gamer', title: 'Gamer', description: 'Play any mini-game 10 times.', type: 'games', value: 10, icon: '🎮' },
        // --- Type: Puzzles Won ---
        { id: 'puzzle-pro', title: 'Puzzle Pro', description: 'Win the memory puzzle 10 times.', type: 'puzzles', value: 10, icon: '🧠' },
        // --- Type: Custom (Event-based) ---
        { id: 'knowledge-seeker', title: 'Knowledge Seeker', description: 'Complete your first AI quiz.', type: 'custom', icon: '🧑‍🏫' },
        { id: 'game-on', title: 'Game On!', description: 'Play any mini-game for the first time.', type: 'custom', icon: '🕹️' },
        { id: 'puzzle-solver', title: 'Puzzle Solver', description: 'Complete the memory puzzle for the first time.', type: 'custom', icon: '🧩' },
        { id: 'eco-shopper', title: 'Eco-Shopper', description: 'Score over 100 in the Bag Dodger game.', type: 'custom', icon: '🛒' },
        { id: 'straight-as', title: 'Straight A\'s', description: 'Get a perfect score on any quiz.', type: 'custom', icon: '💯' },
        { id: 'certified-champion', title: 'Certified Champion', description: 'Generate your first certificate.', type: 'custom', icon: '📜' },
    ];
    // ... after the achievements array ...
    // ... after the achievements array ...

// --- NEW MINDFUL LIVING DATA ---
// Replace the old guidedMeditations constant with this one

const guidedMeditations = [
    { id: 'nature-sounds', title: 'Forest Ambience', description: 'Relax to the calming sounds of a forest.', audioSrc: 'assets/forest.mp3' },
    { id: 'calm-water', title: 'Gentle Stream', description: 'Let the sound of a gentle stream wash away stress.', audioSrc: 'assets/stream.mp3' },
    { id: 'gratitude', title: 'Gratitude Meditation', description: 'A short session to focus on gratitude.', audioSrc: 'assets/gratitude.mp3' },
    { id: 'mindful', title: 'Temple Meditation', description: 'Sit back and relax ', audioSrc: 'assets/mindful.mp3' }
];

const journalPrompts = [
    "What is one eco-friendly action you took today, and how did it make you feel?",
    "Describe something beautiful you noticed in nature recently.",
    "How can you show more gratitude for the planet tomorrow?",
    "What is one 'un-green' habit you could mindfully try to change?",
    "Write about a time you felt deeply connected to the natural world."
];

// Replace your old natureChallenges array with this one
const natureChallenges = [
    // Original 4 Challenges
    { id: 'observe-sky', title: 'Sky Gazing', description: 'Spend 5 minutes simply watching the clouds or the stars. Notice the colors and shapes.', points: 10, icon: '☁️' },
    { id: 'barefoot-earth', title: 'Earthing Moment', description: 'Find a patch of grass or soil and stand barefoot on it for 2 minutes. Feel the connection.', points: 15, icon: '👣' },
    { id: 'find-insect', title: 'Spot a Bug', description: 'Mindfully look for an insect and observe its behavior without disturbing it.', points: 10, icon: '🐞' },
    { id: 'listen-nature', title: 'Nature\'s Symphony', description: 'Close your eyes for 3 minutes and identify as many different natural sounds as you can.', points: 10, icon: '🔊' },

    // 16 New Challenges
    { id: 'watch-sunrise-sunset', title: 'Watch the Sun', description: 'Take 5 minutes to watch a sunrise or sunset. Notice how the colors of the sky change.', points: 15, icon: '🌅' },
    { id: 'smell-flower', title: 'Smell a Flower', description: 'Find a flower and gently smell it. What does the scent remind you of?', points: 10, icon: '🌸' },
    { id: 'feel-rock', title: 'Feel a Rock\'s Texture', description: 'Pick up a rock or stone. Close your eyes and notice if it\'s smooth, rough, warm, or cold.', points: 10, icon: '🪨' },
    { id: 'listen-wind', title: 'Listen to the Wind', description: 'Find a quiet spot and listen to the sound of the wind. Does it whisper, rustle, or howl?', points: 10, icon: '🌬️' },
    { id: 'find-leaf', title: 'Find a Unique Leaf', description: 'Look for a leaf with an interesting shape, color, or pattern. Study its details for a minute.', points: 10, icon: '🍁' },
    { id: 'follow-ant', title: 'Follow an Ant', description: 'Find an ant and watch it for 60 seconds. Observe where it goes and what it does.', points: 15, icon: '🐜' },
    { id: 'mindful-sip', title: 'Mindful Sip of Water', description: 'Take a sip of water and pay full attention to the sensation of it in your mouth and as you swallow.', points: 5, icon: '💧' },
    { id: 'sketch-nature', title: 'Sketch a Natural Object', description: 'Quickly sketch a simple natural object near you, like a leaf, stone, or twig. Don\'t worry about perfection.', points: 15, icon: '✏️' },
    { id: 'hug-tree', title: 'Hug a Tree', description: 'Find a tree and give it a gentle hug for 30 seconds. Feel the texture of its bark.', points: 10, icon: '🫂' },
    { id: 'listen-rain', title: 'Listen to the Rain', description: 'If it\'s raining, listen to the sound it makes on different surfaces like leaves, windows, or the ground.', points: 10, icon: '🌧️' },
    { id: 'identify-plants', title: 'Identify Three Plants', description: 'Look around you and try to identify three different types of plants or trees.', points: 10, icon: '🌱' },
    { id: 'watch-shadow', title: 'Watch a Shadow Move', description: 'Find a shadow from a tree or building and watch it for two minutes. Notice how it subtly shifts.', points: 10, icon: '🕰️' },
    { id: 'smell-earth', title: 'Smell the Earth', description: 'Find a patch of damp soil or grass and take a moment to notice its unique, earthy scent.', points: 10, icon: '🍃' },
    { id: 'notice-sound', title: 'Isolate a Sound', description: 'Focus your hearing to isolate one specific sound, like a distant bird, a car, or a fan.', points: 5, icon: '👂' },
    { id: 'water-plant', title: 'Water a Plant Mindfully', description: 'If you have a plant, water it slowly and watch the soil absorb the water.', points: 10, icon: '🪴' },
    { id: 'one-litter-piece', title: 'Eco-Mindfulness', description: 'Find and properly dispose of one piece of litter you see outside. Notice the positive feeling it brings.', points: 20, icon: '🚮' }
];


    if (loginView && loginView.style.display !== 'none' && tabLinks.length > 0) {
        tabLinks.forEach(link => {
            link.addEventListener('click', () => {
                const tab = link.getAttribute('data-tab');

                // Update button styles
                tabLinks.forEach(item => {
                    item.classList.remove('font-bold', 'bg-white/50', 'dark:bg-gray-700/50');
                    item.classList.add('font-semibold', 'text-gray-500', 'dark:text-gray-400');
                });
                link.classList.add('font-bold', 'bg-white/50', 'dark:bg-gray-700/50');
                link.classList.remove('font-semibold', 'text-gray-500', 'dark:text-gray-400');

                // Show/hide content
                tabContents.forEach(content => {
                    if (content.id === `${tab}-content`) {
                        content.classList.remove('hidden');
                    } else {
                        content.classList.add('hidden');
                    }
                });
            });
        });
    }

    // NEW VIDEO LIBRARY DATA STRUCTURE
    const videoLibrary = [{
        id: 'vid_waste',
        title: 'How Does Waste Management Work?',
        description: 'Learn the journey of your trash from the bin to the processing plant and the importance of segregation.',
        videoId: '29OFyXJC_uA', // The part of the YouTube URL after "v="
        transcript: `
                Waste management is a critical process for keeping our cities clean and our environment healthy. It all starts with you, at home, when you throw something away. The first and most important step is waste segregation. This means separating your waste into different categories. The main ones are wet waste, like food scraps and vegetable peels, and dry waste, like plastic, paper, and glass. Wet waste can be composted to create nutrient-rich soil. Dry waste can be recycled to make new products. When you don't segregate, everything gets mixed up in a landfill, creating pollution and releasing harmful greenhouse gases. Once collected, segregated waste is taken to a material recovery facility. Here, dry waste is further sorted into paper, plastics, and metals. These materials are then cleaned, processed, and sent to industries to be reborn as new items. This process of recycling saves energy, conserves natural resources, and reduces pollution. Your simple act of separating waste at home is the first step in this powerful cycle.
            `
    }, {
        id: 'vid_water',
        title: 'Simple Ways to Conserve Water',
        description: 'Discover practical and easy tips to save water in your daily life, from the bathroom to the kitchen.',
        videoId: 'ehGjJrjPIrI',
        transcript: `
                Water is our most precious resource, but it's finite. Conserving it is essential for our future. You can make a big difference with small changes in your daily habits. Let's start in the bathroom. Turn off the tap while you brush your teeth. A running tap can waste over 6 liters of water per minute! Consider taking shorter showers. Every minute you cut from your shower time saves liters of water. Also, check for leaky faucets. A small drip can waste hundreds of liters of water over a year. In the kitchen, don't let the faucet run while washing vegetables. Instead, use a bowl of water. When washing dishes, fill one sink with wash water and the other with rinse water instead of letting the tap run. By being mindful of these small habits, we can collectively save a massive amount of water, ensuring there's enough for everyone and for the health of our planet.
            `
    }, {
        id: 'vid_planting',
        title: 'How to Plant a Tree',
        description: 'A step-by-step guide to saving trees & planting a sapling correctly to ensure it grows healthy and strong.',
        videoId: 'crtRkGM36kI',
        transcript: `
                Planting a tree is a hopeful act for the future. But planting it correctly is key to its survival. Here's how. First, choose the right location. Make sure it has enough sunlight and space to grow. The hole you dig is very important. It should be two to three times wider than the tree's root ball, but not deeper. This allows the roots to spread out easily into the surrounding soil. Gently remove the sapling from its container. If the roots are tightly packed, carefully loosen them with your fingers. Place the tree in the center of the hole. The top of the root ball should be level with or slightly above the ground. Now, backfill the hole with the soil you removed. Gently but firmly pack the soil around the root ball to remove any air pockets. Do not add fertilizer at this time. Finally, water the newly planted tree thoroughly. A deep watering helps settle the soil and gives the tree a great start.
            `
    }, {
        id: 'vid_5R',
        title: 'Refuse, Reduce, Reuse, Recycle, Rot',
        description: 'A step-by-step guide to use Refuse, Reduce, Reuse, Recycle, Rot in proper and efficient way.',
        videoId: 'OasbYWF4_S8',
        transcript: `
                You've probably heard about recycling, and it's a great habit! But what if I told you it's only the fourth best option for dealing with waste? Let's explore a more powerful framework: the 5 R's! Think of them as a step-by-step guide to becoming an eco-champion, in order of importance.

First and most powerful is Refuse. This is all about stopping waste before it even begins by saying "no" to things you don't need. This could be refusing a plastic straw at a restaurant, a plastic bag at the shop when you only have one item, or a freebie pen you know you'll never use. Every time you refuse, you send a message that you don't support wasteful products.

Next up is Reduce. This means consciously decreasing the amount of stuff you buy and use. Instead of buying many small plastic water bottles throughout the week, reduce your waste by refilling one large, durable bottle. Choose products with minimal packaging. Reducing consumption is one of the most effective ways to shrink your environmental footprint.

The third R is Reuse. Before you throw something away, ask yourself: "Can this item have another life?" This means repairing a broken appliance instead of buying a new one, using both sides of a piece of paper, or turning an empty glass jar into a container for spices or pens. Reusing items saves the energy and resources needed to create new ones.

Fourth on our list is the one you know well: Recycle. This is what we do with materials we couldn't refuse, reduce, or reuse. Recycling is the process of turning waste items like paper, certain plastics, glass, and metals back into raw materials. These materials can then be used to manufacture brand-new products, saving energy and conserving natural resources. Always check your local guidelines to know what you can recycle!

Finally, we have Rot. This R applies to all of our organic waste, like fruit and vegetable peels, coffee grounds, and eggshells. Instead of sending this waste to a landfill where it releases harmful methane gas, we can let it rot in a compost bin. This process creates nutrient-rich compost, which is like a superfood for our gardens and soil.

So there you have it! The 5 R's: Refuse, Reduce, Reuse, Recycle, and Rot. By following them in order, you can make a huge difference in protecting our beautiful planet.
            `
    },{
        id: 'vid_energysaver',
        title: 'How to Conserve the Energy',
        description: 'A step-by-step guide to save energy and live a proper life without energy wastage ',
        videoId: 'NB-A205XLDk',
        transcript: `Have you ever stopped to think about energy? It's the invisible force that powers our world. It lights up our homes, charges our phones, runs our cars, and cooks our food. But where does all this energy come from?
Most of the world's energy is generated by burning fossil fuels like coal, oil, and natural gas. While these have powered our progress, they come with two big problems: they are non-renewable, meaning they will eventually run out, and burning them releases greenhouse gases that contribute to climate change. The good news is, we all have the power to help solve this problem through a simple but powerful idea: energy conservation.
Energy conservation simply means using less energy. It's about making smart choices that reduce waste, and it often starts right at home. Let's look at some easy wins.
First, lighting. If you're still using old incandescent bulbs, switching to modern LED bulbs is a game-changer. An LED uses up to 80% less energy and can last 25 times longer! And, of course, always remember the simplest rule: turn off the lights when you leave a room.
Next, think about your electronics. Many devices are secret energy vampires! They pull power from the outlet even when they're turned off. This is called "phantom load." Your TV, game console, and phone chargers are common culprits. The solution? Unplug them when you're not using them, or connect them to a power strip that you can switch off with a single click.
Heating and cooling also use a massive amount of energy. A simple habit is to adjust your thermostat. Set it a couple of degrees lower in the winter and a couple of degrees higher in the summer. Sealing gaps in windows and doors can also make a huge difference, keeping the cool air in and the hot air out.
Finally, energy conservation extends beyond our homes. How we travel matters. Choosing to walk, ride a bicycle, or use public transportation instead of a car for short trips saves a significant amount of fuel and prevents pollution.
Conserving energy isn't about making big sacrifices. It's about making small, smart changes that add up. Every light switched off and every device unplugged is a step toward a cleaner, healthier planet. By saving energy, you also save money and protect Earth's precious resources for the future.
            `
    },
    {
        id: 'vid_',
        title: 'Nature & Planet Facts',
        description: 'A step-by-step guide to know the nature and the planet the facts never known ',
        videoId: 'uAwTWAC0vt0',
        transcript: `
                When we walk through a quiet forest, we see a collection of individual trees standing silently. But beneath our feet lies a bustling, hidden world of communication, trade, and even rivalry. Welcome to the "Wood Wide Web," nature's own biological internet.
So, what is this network? It's made of vast, intricate webs of fungi that live in the soil. The thread-like structures of these fungi, called mycelium, connect the roots of different trees, sometimes spanning entire forests. This isn't a random connection; it's a powerful symbiotic partnership.
Here’s how the deal works: Trees produce sugar through photosynthesis. They trade a portion of this sugary food with the fungi, who cannot produce their own. In return, the fungi's tiny threads act like a massive extension of the tree's root system, reaching far and wide to absorb essential water and nutrients like nitrogen and phosphorus, which they deliver back to the tree. It's a perfect win-win trade.
But this network does much more than just trade food. It allows trees to communicate. For example, if one tree is attacked by a pest like an aphid, it can send chemical distress signals through the fungal network to its neighbors. The nearby trees receive this warning and can start producing defense chemicals to protect themselves before the pests even arrive.
Even more amazingly, the network acts like a community support system. Large, well-established trees, sometimes called "Mother Trees," are the central hubs of this network. They can send surplus sugar and nutrients through the Wood Wide Web to younger saplings that are struggling for sunlight on the forest floor, essentially nurturing the next generation.
So, a forest isn't just a group of trees competing for space. It's a complex, interconnected community, linked by an ancient fungal network. The Wood Wide Web shows us that there is far more to the natural world than meets the eye, full of hidden cooperation and secret conversations happening right under our feet.
            `
    }, ];

    const weeklyTasks = [{
        id: 'weekly-plant-sapling',
        title: 'Plant a Sapling',
        description: 'Plant a young tree or a significant plant in your community, garden, or a pot. Nurture it and watch it grow!',
        points: 150,
        icon: '🌳',
        bgImage: 'https://images.unsplash.com/photo-1512428209929-29959265553d?q=80&w=2070&auto=format&fit=crop'
    }, ];

    // --- UI & NAVIGATION ---
    function showLogin() {
        loginView.style.display = 'flex';
        dashboardLayout.style.display = 'none';
    }
    // NEW: Toast Notification Function
    function showToastNotification(message, duration = 4000) {
        const toast = document.createElement('div');
        toast.className = 'toast-notification';
        toast.textContent = message;
        document.body.appendChild(toast);

        // Animate in
        setTimeout(() => {
            toast.classList.add('show');
        }, 100);

        // Animate out and remove
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 500);
        }, duration);
    }

    function showApp(userData) {
        document.getElementById('user-profile-skeleton').classList.add('hidden');
        document.getElementById('dashboard-stats-skeleton').classList.add('hidden');
        document.getElementById('user-profile').classList.remove('hidden');
        document.getElementById('dashboard-stats-content').classList.remove('hidden');
        updateUserInfo(userData);
        updateWelcomeMessage();
        loginView.style.display = 'none';
        dashboardLayout.style.display = 'block';

        if (searchForm) {
            searchForm.addEventListener('submit', handleSearch);
        }

        if (resetPuzzleButton) {
            resetPuzzleButton.addEventListener('click', renderPuzzle);
        }
        if (dashboardSignOutButton) {
            dashboardSignOutButton.addEventListener('click', () => {
                signOut(auth);
            });
        }
     if (profilePhotoUploadArea && photoUploadInput) {
    profilePhotoUploadArea.addEventListener('click', () => {
        photoUploadInput.click();
    });

    photoUploadInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            uploadProfilePicture(file);
        }
    });
}
        setupNavigation();
        seedTasksIfEmpty();
        listenForTasks();
        listenForLeaderboard();
        listenForUserUpdates();
        renderVideoLibrary(); // The new function call
        renderPuzzle();
        renderWeeklyTask();

        botIconButton.classList.add('visible'); 
    }

    function setupNavigation() {
        sidebarNav.addEventListener('click', (e) => {
            if (e.target.closest('a')) {
                e.preventDefault();
                const targetId = e.target.closest('a').hash.substring(1);
                switchPage(targetId);
            }
        });
        switchPage('dashboard');
    }

    function switchPage(pageId) {
        const mainContent = document.getElementById('main-content');
        pageContents.forEach(p => p.classList.add('hidden'));
        document.getElementById(`${pageId}-view`).classList.remove('hidden');

        sidebarNav.querySelectorAll('a').forEach(a => a.classList.remove('active'));
        sidebarNav.querySelector(`a[href="#${pageId}"]`).classList.add('active');

        mainContent.classList.remove('dashboard-background', 'tasks-background', 'points-background', 'achievements-background', 'quizzes-background', 'background','puzzles-background', 'weekly-tasks-background','eco-runner-background','mindful-living-background',);

        switch (pageId) {
            case 'dashboard':
                mainContent.classList.add('dashboard-background');
                break;
            case 'tasks':
                mainContent.classList.add('tasks-background');
                break;
            case 'points':
                mainContent.classList.add('points-background');
                break;
            case 'achievements':
                mainContent.classList.add('achievements-background');
                break;
            case 'quizzes': // This ID is still used for the view container
                mainContent.classList.add('quizzes-background');
                break;
            case 'puzzles':
                mainContent.classList.add('puzzles-background');
                break;
            case 'eco-runner': // 👈 ADD THIS NEW CASE
                mainContent.classList.add('eco-runner-background');
                launchEcoRunnerGame(); // This function will start the game
                break;
            // 👇 ADD THIS NEW CASE
            case 'mindful-living':
            mainContent.classList.add('mindful-living-background');
            renderMindfulLivingPage(); // We will create this function next
            break;
            case 'weekly-tasks':
                mainContent.classList.add('weekly-tasks-background');
                break;
        }
    }
    // A master function to call all the smaller render functions for the page
// A master function to call all the smaller render functions for the page
function renderMindfulLivingPage() {
    renderMeditationPlayer();
    renderJournal();
    renderNatureChallenge();

    const startBreathingBtn = document.getElementById('start-breathing-btn');
    // Ensure any old event listener is removed before adding a new one
    startBreathingBtn.removeEventListener('click', startBreathingExercise);
    // Add the event listener without the 'listener' attribute check
    startBreathingBtn.addEventListener('click', startBreathingExercise);
}

function renderMeditationPlayer() {
    const playlistEl = document.getElementById('meditation-playlist');
    const audioPlayer = document.getElementById('audio-player');
    const meditationTitle = document.getElementById('meditation-title');
    
    playlistEl.innerHTML = ''; // Clear previous list

    guidedMeditations.forEach(meditation => {
        const li = document.createElement('li');
        li.className = 'p-3 rounded-lg cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex justify-between items-center';
        li.innerHTML = `<span>${meditation.title}</span> <span class="text-xs text-gray-500">${meditation.description}</span>`;
        
        li.addEventListener('click', () => {
            audioPlayer.src = meditation.audioSrc;
            meditationTitle.textContent = meditation.title;
            audioPlayer.play();
            // Highlight active track
            document.querySelectorAll('#meditation-playlist li').forEach(item => item.classList.remove('active-track'));
            li.classList.add('active-track');
        });

        playlistEl.appendChild(li);
    });
}

// Replace your old renderJournal function with this new, simpler one
// Replace your old renderJournal function with this corrected version

// Replace your old journal function(s) with this one

async function renderJournal() {
    if (!currentUser) return;

    // Use the new ID to reliably find the card
    const journalCard = document.getElementById('daily-journal-card');
    if (!journalCard) {
        console.error("Journal card not found! Check the ID in your HTML.");
        return;
    }

    // Get today's date in a consistent YYYY-MM-DD format
    const todayStr = new Date().toISOString().slice(0, 10);

    // Get the user's data from Firestore
    const userDocRef = doc(db, usersCollectionPath, currentUser.uid);
    const userDocSnap = await getDoc(userDocRef);
    const lastEntryDate = userDocSnap.data()?.lastJournalDate;

    if (lastEntryDate === todayStr) {
        // --- STATE 1: User has already written today ---
        journalCard.innerHTML = `
            <h3 class="text-2xl font-bold mb-4">Today's Reflection</h3>
            <p class="mb-4 p-3 bg-green-100 dark:bg-green-900/50 rounded-lg text-green-800 dark:text-green-200 font-medium">
                You've completed your reflection for today. Great job!
            </p>
            <div class="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 flex-grow overflow-y-auto">
                <p class="text-left">Come back tomorrow for a new prompt.</p>
            </div>
            <button class="btn btn-primary w-full mt-4 bg-green-700 cursor-not-allowed" disabled>Completed for Today ✅</button>
        `;

    } else {
        // --- STATE 2: User has NOT written today ---
        const randomPrompt = journalPrompts[Math.floor(Math.random() * journalPrompts.length)];
        journalCard.innerHTML = `
            <h3 class="text-2xl font-bold mb-4">Daily Journal</h3>
            <p id="journal-prompt" class="mb-4 p-3 bg-green-100 dark:bg-green-900/50 rounded-lg text-green-800 dark:text-green-200 font-medium">${randomPrompt}</p>
            <textarea id="journal-textarea" rows="5" class="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500 flex-grow" placeholder="Write your thoughts here..."></textarea>
            <button id="save-journal-btn" class="btn btn-primary w-full mt-4">Save Entry & Earn 5 Points</button>
        `;

        const saveBtn = journalCard.querySelector('#save-journal-btn');
        const textarea = journalCard.querySelector('#journal-textarea');

        saveBtn.addEventListener('click', async () => {
            const entryText = textarea.value.trim();
            if (entryText.length < 10) {
                showToastNotification("Please write a little more to save your entry.", 3000);
                return;
            }

            // When saving, update Firestore with points and the date
            await updateDoc(userDocRef, {
                points: increment(5),
                lastJournalDate: todayStr // This locks it for the day
            });

            showToastNotification("Reflection saved! +5 points.", 4000);

            // Re-run this function to show the "completed" state
            renderJournal();
        });
    }
}
function renderNatureChallenge() {
    const card = document.getElementById('nature-challenge-card');
    // Get a new challenge each day
    const dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24);
    const challenge = natureChallenges[dayOfYear % natureChallenges.length];
    
    card.innerHTML = `
        <h3 class="text-2xl font-bold mb-2">Today's Nature Challenge</h3>
        <p class="text-xl font-bold mb-2 text-gray-900 dark:text-white">${challenge.icon} ${challenge.title}</p>
        <p class="card-description mb-4">${challenge.description}</p>
        <div class="text-right text-yellow-500 font-bold text-lg mt-2 mb-4">⭐ ${challenge.points} Points</div>
        <button id="complete-nature-challenge-btn" class="btn btn-secondary w-full">I did it!</button>
    `;

    document.getElementById('complete-nature-challenge-btn').addEventListener('click', async () => {
        if (!currentUser) return;
        // Simple honor system for completion
        const userRef = doc(db, usersCollectionPath, currentUser.uid);
        await updateDoc(userRef, { points: increment(challenge.points) });
        showToastNotification(`Awesome! +${challenge.points} points for connecting with nature.`, 4000);
        document.getElementById('complete-nature-challenge-btn').textContent = 'Completed! ✅';
        document.getElementById('complete-nature-challenge-btn').disabled = true;
    });
}

let breathingInterval = null; // This should already be above your function

function startBreathingExercise() {
    const animator = document.getElementById('breathing-animator');
    const instruction = document.getElementById('breathing-instruction');
    const startBtn = document.getElementById('start-breathing-btn');
    const audio = document.getElementById('breathing-audio'); // Get the audio element

    // If an interval is already running, this is the STOP logic
    if (breathingInterval) {
        clearInterval(breathingInterval);
        breathingInterval = null;
        instruction.textContent = "Press Start";
        startBtn.textContent = 'Start';
        animator.classList.remove('grow');
        
        audio.pause(); // Stop the audio
        audio.currentTime = 0; // Reset audio to the beginning

        return; 
    }

    // Otherwise, this is the START logic
    startBtn.disabled = true;
    startBtn.textContent = 'Stop';
    
    audio.play(); // Play the audio

    let step = 0;
    const steps = [
        { text: "Breathe In...", duration: 4000, action: () => animator.classList.add('grow') },
        { text: "Hold...", duration: 4000, action: () => {} },
        { text: "Breathe Out...", duration: 6000, action: () => animator.classList.remove('grow') }
    ];

    const runStep = () => {
        instruction.textContent = steps[step].text;
        steps[step].action();

        breathingInterval = setTimeout(() => {
            step = (step + 1) % steps.length;
            runStep();
        }, steps[step].duration);
    };

    runStep();

    setTimeout(() => {
        startBtn.disabled = false;
    }, 500);
}

    function updateUserInfo(userData) {
        // Define all variables from userData at the beginning
        const points = userData.points || 0;
        const completed = userData.completedTasks || 0;
        const badges = userData.treeBadges || 0;
        const streak = userData.loginStreak || 0; // This line was the problem. It's now correctly defined.
        const photoUrl = userData.photoURL || (currentUser ? currentUser.photoURL : 'https://i.stack.imgur.com/34AD2.jpg');

        // Update UI elements safely
        if (userPhoto) {
            userPhoto.src = photoUrl;
        }
        if (userNickname) {
            userNickname.textContent = userData.nickname;
        }
        if (userPoints) {
            userPoints.innerHTML = `⭐ ${points} Points`;
        }
        if (userBadges) {
            userBadges.textContent = `🌳 ${badges} Trees Planted`;
        }
        if (userStreak) {
            userStreak.innerHTML = `🔥 ${streak} Day Streak`;
        }
        if (dashboardPoints) {
            dashboardPoints.textContent = points;
        }
        if (dashboardCompleted) {
            dashboardCompleted.textContent = completed;
        }

        updateAchievements(userData);
    }

    function updateWelcomeMessage() {
        const userNameElement = document.getElementById('user-nickname');
        const userName = userNameElement.textContent || 'Player';
        const currentHour = new Date().getHours();
        let greeting;
        if (currentHour < 12) {
            greeting = 'Good morning';
        } else if (currentHour < 18) {
            greeting = 'Good afternoon';
        } else {
            greeting = 'Good evening';
        }
        const welcomeElement = document.getElementById('welcome-greeting');
        if (welcomeElement) {
            welcomeElement.textContent = `${greeting}, ${userName}!`;
        }
    }
    async function uploadProfilePicture(file) { 
    if (!currentUser || !file) return;

    // --- Cloudinary Configuration ---
    const CLOUD_NAME = "dtdkkjk1p"; // 👈 Your Cloud Name is here
    const UPLOAD_PRESET = "ecoquest_profiles"; // 👈 Your Upload Preset is here
    const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;
    // -----------------------------

    userPhoto.style.opacity = '0.5'; // Show a loading state

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', UPLOAD_PRESET);

    try {
        // 1. Upload the image to Cloudinary
        const response = await fetch(url, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            throw new Error('Image upload failed');
        }

        const data = await response.json();
        const imageUrl = data.secure_url; // This is the URL of the uploaded image

        // 2. Save the new image URL to Firestore
        const userDocRef = doc(db, 'users', currentUser.uid);
        await updateDoc(userDocRef, {
            photoURL: imageUrl 
        });

        // 3. Update the UI with the new image
        userPhoto.src = imageUrl;
        
    } catch (error) {
        console.error("Error uploading profile picture:", error);
        alert("Error uploading picture. Please try again.");
    } finally {
        userPhoto.style.opacity = '1'; // Reset loading state
    }
}

    function handleSearch(e) {
        e.preventDefault();
        const searchTerm = searchInput.value.trim().toLowerCase();
        if (!searchTerm) return;
        const keywords = {
            'tasks': ['tasks', 'challenges', 'game', 'games', 'play', 'real-world', 'activities', 'missions', 'quests', 'mini-games', 'energy', 'carbon', 'save', 'route', 'waste', 'recycle', 'bag', 'plants', 'plant'],
            'points': ['points', 'point', 'leaderboard', 'rank', 'ranking', 'score', 'scores', 'ranks', 'standings'],
            'achievements': ['achievements', 'badges', 'trophy', 'awards', 'medals', 'rewards', 'prizes'],
            'quizzes': ['quiz', 'quizzes', 'test', 'knowledge', 'questions', 'trivia', 'assessments', 'video', 'library'], // Added video keywords
            'puzzles': ['puzzle', 'puzzles', 'memory', 'match', 'brain-teasers', 'logic games', 'match game'],
            'dashboard': ['dashboard', 'home', 'main', 'summary', 'overview', 'profile', 'stats']
        };
        let pageFound = null;
        for (const pageId in keywords) {
            if (keywords[pageId].some(keyword => searchTerm.includes(keyword))) {
                pageFound = pageId;
                break;
            }
        }
        if (pageFound) {
            switchPage(pageFound);
            searchInput.value = '';
            searchFeedback.textContent = '';
        } else {
            searchFeedback.textContent = 'Section not found. Try "tasks", "video", "rank", etc.';
            setTimeout(() => {
                searchFeedback.textContent = '';
            }, 3000);
        }
    }

    async function handleUserLogin(user) {
        currentUser = user;
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
            const userData = userSnap.data();
            // *** START: Daily Login & Streak Logic ***
            const today = new Date().setHours(0, 0, 0, 0);
            const lastLogin = userData.lastLoginDate ? userData.lastLoginDate.toDate().setHours(0, 0, 0, 0) : null;

            if (lastLogin !== today) {
                const oneDay = 24 * 60 * 60 * 1000;
                const yesterday = new Date(today - oneDay).setHours(0, 0, 0, 0);
                let newStreak = userData.loginStreak || 0;
                let pointsToAdd = 10; // Base daily login points
                let notificationMessage = `Welcome back! +${pointsToAdd} points for your daily login.`;

                if (lastLogin === yesterday) {
                    newStreak++;
                    if (newStreak % 7 === 0) {
                        pointsToAdd += 50; // 7-day streak bonus
                        notificationMessage = `🔥 7-Day Streak! +${pointsToAdd} points bonus!`;
                    } else {
                        notificationMessage = `Streak: ${newStreak} days! +${pointsToAdd} points.`;
                    }
                } else {
                    newStreak = 1; // Reset streak
                }

                await updateDoc(userRef, {
                    points: increment(pointsToAdd),
                    loginStreak: newStreak,
                    lastLoginDate: serverTimestamp()
                });
                showToastNotification(notificationMessage);
            }
            // *** END: Daily Login & Streak Logic ***
            showApp(userData);
        } else {
            const newUser = {
                nickname: user.displayName,
                points: 10, // Start with 10 points for the first login
                completedTasks: 0,
                userId: user.uid,
                treeBadges: 0,
                photoURL: user.photoURL,
                unlockedAchievements: [],
                gamesPlayed: 0,
                puzzlesWon: 0,
                lastLoginDate: serverTimestamp(), // Set initial login date
                loginStreak: 1 // Start streak at 1
            };
            await setDoc(userRef, newUser);
            showToastNotification("Welcome to EcoQuest! +10 points for joining!");
            showApp(newUser);
        }
    }

    async function initializeAuth() {
        await setPersistence(auth, browserLocalPersistence);
        authStatus.textContent = 'Connecting...';
        try {
            const result = await getRedirectResult(auth);
            if (result) {
                console.log('Redirect result processed successfully.');
            }
        } catch (error) {
            console.error("Redirect error:", error);
            authStatus.textContent = `Error: ${error.message}`;
        }
        onAuthStateChanged(auth, async (user) => {
            if (user) {
                await handleUserLogin(user);
            } else {
                showLogin();
                authStatus.textContent = "Please sign in to continue.";
            }
        });
    }

    googleSignInButton.addEventListener("click", () => {
        const provider = new GoogleAuthProvider();
        signInWithPopup(auth, provider);
    });
    emailPasswordSigninButton.addEventListener("click", async () => {
        const email = emailSigninInput.value;
        const password = passwordSigninInput.value;

        if (!email || !password) {
            authStatus.textContent = "Please enter both email and password.";
            return;
        }

        authStatus.textContent = "Signing in...";
        try {
            await signInWithEmailAndPassword(auth, email, password);
            // On successful login, onAuthStateChanged will handle showApp()
            authStatus.textContent = "Signed in successfully!";
        } catch (error) {
            console.error("Email/Password sign-in error:", error);
            let errorMessage = "Sign-in failed. Please check your credentials.";
            if (error.code === 'auth/user-not-found') {
                errorMessage = "No account found with this email. Please register or check your email.";
            } else if (error.code === 'auth/wrong-password') {
                errorMessage = "Incorrect password. Please try again.";
            } else if (error.code === 'auth/invalid-email') {
                errorMessage = "Invalid email address format.";
            }
            authStatus.textContent = errorMessage;
        }
    });
    function listenForUserUpdates() {
        if (!currentUser) return;
        const userDocRef = doc(db, usersCollectionPath, currentUser.uid);
        onSnapshot(userDocRef, (doc) => {
            if (doc.exists()) {
                const userData = doc.data();
                updateUserInfo(userData);
                renderFeaturedTask(userData);
                renderFeaturedMonthlyTask(userData);
            }
        });
    }

    function listenForTasks() {
        const challengesCol = collection(db, challengesCollectionPath);
        onSnapshot(challengesCol,
            (snapshot) => {
                tasksGrid.innerHTML = '';
                allTasks = [];
                if (snapshot.empty) {
                    console.log("No challenges in Firestore, using default tasks.");
                    allTasks = defaultTasks;
                } else {
                    snapshot.forEach(doc => allTasks.push({
                        id: doc.id,
                        ...doc.data()
                    }));
                }
                allTasks.forEach(challenge => {
                    tasksGrid.appendChild(createTaskCard(challenge));
                });
            },
            (error) => {
                console.error("Error listening for tasks:", error);
                tasksGrid.innerHTML = '';
                allTasks = defaultTasks;
                allTasks.forEach(challenge => {
                    tasksGrid.appendChild(createTaskCard(challenge));
                });
            }
        );
    }

    function createTaskCard(challenge) {
    const card = document.createElement('div');
    card.className = "bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border dark:border-gray-700 flex flex-col text-center items-center";
    
    // The innerHTML now uses the new button structure
    card.innerHTML = `
        <div class="flex-grow w-full">
            <div class="text-5xl mb-4">${challenge.icon}</div>
            <h3 class="text-xl font-bold mb-2 text-gray-900 dark:text-white">${challenge.title}</h3>
            <p class="card-description mb-4">${challenge.description}</p>
        </div>
        <div class="text-yellow-500 font-bold text-lg mt-2 mb-4">⭐ ${challenge.points} Points</div>
        <div class="mt-auto w-full flex justify-center">
            <button type="button" class="uiverse-btn">
              <strong>START TASK</strong>
              <div class="container-stars">
                <div class="stars"></div>
              </div>
              <div class="glow">
                <div class="circle"></div>
                <div class="circle"></div>
              </div>
            </button>
        </div>
    `;

    // The query selector now looks for the new button class
    card.querySelector('.uiverse-btn').onclick = () => openMiniGame(challenge.id);
    return card;
}

    function createFeaturedTaskCard(challenge) {
    const card = document.createElement('div');
    card.className = "bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm p-6 rounded-2xl shadow-md border dark:border-gray-700 flex flex-col";
    
    // This innerHTML also uses the new button structure
    card.innerHTML = `
        <div class="flex-grow">
            <h3 class="text-xl font-bold mb-2 text-gray-900 dark:text-white">${challenge.icon} ${challenge.title}</h3>
            <p class="card-description mb-4">${challenge.description}</p>
        </div>
        <div class="text-right text-yellow-500 font-bold text-lg mt-2 mb-4">⭐ ${challenge.points} Points</div>
        <div class="mt-auto w-full flex justify-center">
            <button type="button" class="uiverse-btn">
              <strong>START TASK</strong>
              <div class="container-stars">
                <div class="stars"></div>
              </div>
              <div class="glow">
                <div class="circle"></div>
                <div class="circle"></div>
              </div>
            </button>
        </div>
    `;
    
    card.querySelector('.uiverse-btn').onclick = () => openMiniGame(challenge.id);
    return card;
}

    let activeGame = {
        cleanup: () => {}
    };

    function listenForLeaderboard() {
        const usersQuery = query(collection(db, usersCollectionPath), orderBy("points", "desc"), limit(10));
        onSnapshot(usersQuery, (snapshot) => {
            leaderboard.innerHTML = '';
            let rank = 1;
            snapshot.forEach(doc => {
                const user = doc.data();
                if (currentUser && user.userId === currentUser.uid) {
                    dashboardRank.textContent = `#${rank}`;
                }
                const rankIcon = ['🥇', '🥈', '🥉'][rank - 1] || `<span class="font-bold text-gray-500">${rank}</span>`;
                const entry = document.createElement('div');
                let bgClass = 'hover:bg-gray-100/50 dark:hover:bg-white/10';
                if (rank === 1) bgClass = 'bg-yellow-100/50 dark:bg-yellow-500/10';
                if (currentUser && user.userId === currentUser.uid) bgClass += ' border-2 border-green-500';

                // --- FIX STARTS HERE ---
                let certLink = '';
                if (rank <= 3) {
                    certLink = `<a class="cert-link" data-name="${user.nickname}" data-rank="${rank}" data-points="${user.points}">Generate Certificate</a>`;
                }
                // --- FIX ENDS HERE ---

                entry.className = `flex justify-between items-center p-3 rounded-lg transition-colors ${bgClass}`;

                // --- HTML IS UPDATED HERE ---
                entry.innerHTML = `<div class="flex items-center gap-4">
                                            <span class="text-2xl w-8 text-center">${rankIcon}</span>
                                            <div class="flex items-center">
                                                <span class="font-medium text-gray-800 dark:text-gray-200">${user.nickname}</span>
                                                ${certLink}
                                            </div>
                                        </div>
                                        <span class="font-bold text-yellow-500">⭐ ${user.points}</span>`;
                leaderboard.appendChild(entry);
                rank++;
            });
        }, (error) => {
            console.error("Error listening for leaderboard:", error);
        });
    }

    function updateAchievements(userData) {
        if (!achievementsGrid) return;
        achievementsGrid.innerHTML = '';
        const unlockedCustom = userData.unlockedAchievements || [];

        achievements.forEach(ach => {
            let isUnlocked = false;

            // Check unlock condition based on achievement type
            switch (ach.type) {
                case 'points':
                    isUnlocked = (userData.points || 0) >= ach.value;
                    break;
                case 'tasks':
                    isUnlocked = (userData.completedTasks || 0) >= ach.value;
                    break;
                case 'trees':
                    isUnlocked = (userData.treeBadges || 0) >= ach.value;
                    break;
                case 'games':
                    isUnlocked = (userData.gamesPlayed || 0) >= ach.value;
                    break;
                case 'puzzles':
                    isUnlocked = (userData.puzzlesWon || 0) >= ach.value;
                    break;
                case 'custom':
                    isUnlocked = unlockedCustom.includes(ach.id);
                    break;
            }

            const card = document.createElement('div');
            card.className = `p-6 rounded-2xl text-center shadow-md backdrop-blur-sm border ${isUnlocked ? 'bg-green-500/20 border-green-500/30' : 'bg-gray-500/20 border-gray-500/30'}`;
            card.innerHTML = `
                <div class="text-5xl mb-3 ${isUnlocked ? '' : 'opacity-30 grayscale'}">${ach.icon}</div>
                <h4 class="font-bold text-gray-800 dark:text-white">${ach.title}</h4>
                <p class="text-xs text-gray-600 dark:text-gray-300">${ach.description}</p>
            `;
            achievementsGrid.appendChild(card);
        });
    }
    // --- NEW ACHIEVEMENT UNLOCKING SYSTEM ---
    async function unlockAchievement(achievementId) {
        if (!currentUser) return;

        const userDocRef = doc(db, usersCollectionPath, currentUser.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
            const userData = userDoc.data();
            const unlocked = userData.unlockedAchievements || [];

            if (!unlocked.includes(achievementId)) {
                const newUnlocked = [...unlocked, achievementId];
                await updateDoc(userDocRef, { unlockedAchievements: newUnlocked });
                // Optional: Show a notification to the user
                const achievement = achievements.find(a => a.id === achievementId);
                if (achievement) {
                    console.log(`%c ACHIEVEMENT UNLOCKED: ${achievement.title}`, 'color: #f59e0b; font-weight: bold;');
                    // You could add a more visual pop-up alert here later
                }
            }
        }
    }

    function renderVideoLibrary() {
        quizzesGrid.innerHTML = '';

        videoLibrary.forEach(video => {
            const card = document.createElement('div');
            card.className = "bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-4 rounded-2xl shadow-lg border dark:border-gray-700 flex flex-col text-center items-center";

            const thumbnailUrl = `https://img.youtube.com/vi/${video.videoId}/hqdefault.jpg`;

            card.innerHTML = `
                <div class="w-full mb-4">
                    <img src="${thumbnailUrl}" alt="${video.title}" class="rounded-xl w-full object-cover aspect-video">
                </div>
                <h4 class="font-bold text-lg text-gray-800 dark:text-white mb-2 flex-grow">${video.title}</h4>
                <p class="card-description text-sm mb-4">${video.description}</p>
                <button data-video-id="${video.id}" class="btn btn-primary w-full mt-auto ai-quiz-btn">
                    Watch & Take AI Quiz
                </button>
            `;
            quizzesGrid.appendChild(card);
        });

        document.querySelectorAll('.ai-quiz-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const videoId = e.target.dataset.videoId;
                // This now calls the new modal function
                openLearnAboutModal(videoId);
            });
        });
    }
    /**
     * Opens a stylish modal to show a video, now styled with dedicated CSS.
     */
    function openLearnAboutModal(videoId) {
        const video = videoLibrary.find(v => v.id === videoId);
        if (!video) {
            console.error("Video not found for modal:", videoId);
            return;
        }

        const modalContainer = document.createElement('div');
        modalContainer.className = "fixed inset-0 bg-gray-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4";
        modalContainer.id = "learn-about-modal";

        // This HTML uses the new classes from your styles.css file
        modalContainer.innerHTML = `
            <div class="modal-content">

                <div class="modal-header">
                    <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Learn About: ${video.title}</h2>
                    <button id="learn-modal-close-button" class="text-2xl font-bold text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">&times;</button>
                </div>

                <div class="modal-video-wrapper">
                    <iframe
                        src="https://www.youtube.com/embed/${video.videoId}?autoplay=1&modestbranding=1&rel=0"
                        frameborder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowfullscreen>
                    </iframe>
                </div>

                <div class="modal-footer">
                    <button id="start-ai-quiz-btn" class="btn-start-quiz">
                        I'm Ready, Start the Quiz!
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modalContainer);

        const closeModal = () => {
            document.getElementById('learn-about-modal')?.remove();
        };

        document.getElementById('learn-modal-close-button').addEventListener('click', closeModal);

        document.getElementById('start-ai-quiz-btn').addEventListener('click', () => {
            closeModal();
            generateAndStartAIQuiz(videoId);
        });
    }
    /**
     * Generates and starts a quiz using the Gemini API based on a video's transcript.
     * @param {string} videoId - The ID of the video from our videoLibrary.
     */
async function generateAndStartAIQuiz(videoId) {
    const video = videoLibrary.find(v => v.id === videoId);
    if (!video) {
        console.error("Video not found!");
        return;
    }

    const loadingModal = document.createElement('div');
    loadingModal.className = "fixed inset-0 bg-gray-900/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-4 text-center";
    loadingModal.innerHTML = `
        <p class="text-2xl font-semibold text-white animate-pulse">🤖 Accessing AI...</p>
        <p class="text-white mt-2">Generating a custom quiz based on the video content. Please wait.</p>
    `;
    document.body.appendChild(loadingModal);

    const prompt = `
        Based on the following transcript from an environmental education video, please generate a multiple-choice quiz.

        TRANSCRIPT: """
        ${video.transcript}
        """

        INSTRUCTIONS:
        1. Create exactly 5 multiple-choice questions.
        2. Each question must have exactly 4 possible answers.
        3. The questions should be relevant to the main points of the transcript.
        4. Your entire response MUST be a single, valid JSON object. Do not include any text, explanations, or code formatting like \`\`\`json before or after the JSON object.
        5. The JSON object must have a "title" key with a string value (use the video title: "${video.title}"), and a "questions" key, which is an array of question objects.
        6. Each question object in the array must have three keys:
            - "q": a string for the question text.
            - "o": an array of 4 strings for the options.
            - "a": an integer representing the index (0-3) of the correct answer in the "o" array.
    `;

    try {
        // Send the request to your server's endpoint
        const response = await fetch('/api/generate-quiz', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ prompt: prompt, videoTitle: video.title }) // Pass the prompt and video title to your server
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Server request failed with status ${response.status}: ${JSON.stringify(errorData)}`);
        }

        const quizObject = await response.json(); // Your server will return the parsed JSON quiz object

        quizObject.id = `ai_${videoId}`;
        quizObject.icon = '🤖';
        quizObject.pointsPerCorrect = 15;

        startQuiz(quizObject);

    } catch (error) {
        console.error("Error generating AI quiz:", error);
        alert("Sorry, the AI could not generate a quiz at this moment. Please try again later. Error details: " + error.message);
    } finally {
        loadingModal.remove();
    }
}

    function openSubmissionModal(challenge) {
        currentChallenge = challenge;
        modalIcon.textContent = challenge.icon;
        modalTitle.textContent = challenge.title;
        modalDescription.textContent = challenge.description;
        modalPoints.textContent = challenge.points;
        modal.style.display = 'block';
        setTimeout(() => {
            modalBackdrop.classList.add('show');
            modal.classList.add('show');
        }, 10);
    }

    function closeSubmissionModal() {
        modalBackdrop.classList.remove('show');
        modal.classList.remove('show');
        setTimeout(() => {
            modal.style.display = 'none';
            submissionForm.reset();
        }, 300);
    }

    cancelButton.addEventListener('click', closeSubmissionModal);
    modalBackdrop.addEventListener('click', closeSubmissionModal);

    submissionForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!currentChallenge || !currentUser) return;
        const userRef = doc(db, usersCollectionPath, currentUser.uid);
        if (currentChallenge.weeklyTaskId) {
            const updateData = {
                points: increment(currentChallenge.points),
                lastWeeklyTaskCompleted: currentChallenge.weeklyTaskId
            };
            if (currentChallenge.id === 'weekly-plant-sapling') {
                updateData.treeBadges = increment(1);
            }
            await updateDoc(userRef, updateData);
            renderWeeklyTask();
        } else {
            await updateDoc(userRef, {
                points: increment(currentChallenge.points),
                completedTasks: increment(1)
            });
        }
        closeSubmissionModal();
    });

    /**
     * Starts a quiz. Can be initiated with a quiz ID (old way) or a full quiz object (new AI way).
     * @param {string|object} quizData - The ID of the quiz or the full quiz object.
     */
    function startQuiz(quizData) {
        let quizToStart = null;

        if (typeof quizData === 'object' && quizData !== null) {
            // This is a direct quiz object from the AI
            quizToStart = quizData;
        }
        // Fallback for any old, non-AI quizzes you might add back later
        else if (typeof quizData === 'string') {
            const allQuizzes = { /* ...quizzes, ...customQuizzes */ }; // Note: quizzes and customQuizzes are now removed, but this makes the function future-proof
            if (allQuizzes[quizData]) {
                quizToStart = {
                    id: quizData,
                    ...allQuizzes[quizData]
                };
            }
        }

        if (!quizToStart) {
            console.error("Could not find or load quiz data:", quizData);
            alert("Sorry, there was an error loading this quiz.");
            return;
        }

        currentQuiz = quizToStart;
        currentQuestionIndex = 0;
        userAnswers = new Array(currentQuiz.questions.length).fill(null);
        quizModalContainer.classList.remove('hidden');
        renderQuestion();
    }


    function closeQuiz() {
        quizModalContainer.classList.add('hidden');
    }

    function renderQuestion() {
        const question = currentQuiz.questions[currentQuestionIndex];
        quizTitle.textContent = currentQuiz.title;
        quizProgress.textContent = `Question ${currentQuestionIndex + 1} of ${currentQuiz.questions.length}`;
        quizQuestion.textContent = question.q;
        quizOptions.innerHTML = '';
        question.o.forEach((option, index) => {
            const optionEl = document.createElement('div');
            optionEl.className = 'quiz-option p-4 border-2 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors';
            optionEl.textContent = option;
            if (userAnswers[currentQuestionIndex] === index) {
                optionEl.classList.add('selected');
            }
            optionEl.onclick = () => selectAnswer(index);
            quizOptions.appendChild(optionEl);
        });
        quizPrevButton.disabled = currentQuestionIndex === 0;
        quizNextButton.classList.toggle('hidden', currentQuestionIndex === currentQuiz.questions.length - 1);
        quizSubmitButton.classList.toggle('hidden', currentQuestionIndex !== currentQuiz.questions.length - 1);
    }

    function selectAnswer(index) {
        userAnswers[currentQuestionIndex] = index;
        renderQuestion();
    }

    async function submitQuiz() {
        quizLoading.classList.remove('hidden');
        const manualResult = evaluateQuizManually();
        showResults(manualResult);
        saveQuizResultsToFirestore(manualResult.score);
        quizLoading.classList.add('hidden');
        closeQuiz();
    }

    function evaluateQuizManually() {
        let score = 0;
        const results = userAnswers.map((answer, index) => {
            const isCorrect = answer === currentQuiz.questions[index].a;
            if (isCorrect) score++;
            return isCorrect;
        });
        return {
            score,
            results
        };
    }

    function showResults(result) {
        const totalQuestions = currentQuiz.questions.length;
        resultsModalContainer.classList.remove('hidden');
        resultsScore.textContent = `${result.score} / ${totalQuestions}`;
        const pointsAwarded = result.score * currentQuiz.pointsPerCorrect;
        resultsSummary.textContent = `You earned ⭐ ${pointsAwarded} points!`;
        resultsDetails.innerHTML = '';
        currentQuiz.questions.forEach((q, index) => {
            const isCorrect = result.results[index];
            const userAnswer = userAnswers[index] !== null ? q.o[userAnswers[index]] : "No answer";
            const correctAnswer = q.o[q.a];
            const resultEl = document.createElement('div');
            resultEl.className = `p-3 rounded-lg ${isCorrect ? 'bg-green-100 dark:bg-green-900/50' : 'bg-red-100 dark:bg-red-900/50'}`;
            resultEl.innerHTML = `
                <p class="font-semibold text-gray-800 dark:text-gray-200">${index + 1}. ${q.q}</p>
                <p class="text-sm ${isCorrect ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}">Your answer: ${userAnswer}</p>
                ${!isCorrect ? `<p class="text-sm text-gray-600 dark:text-gray-400">Correct answer: ${correctAnswer}</p>` : ''}
            `;
            resultsDetails.appendChild(resultEl);
        });
    }

    async function saveQuizResultsToFirestore(score) {
        const pointsAwarded = score * currentQuiz.pointsPerCorrect;
        unlockAchievement('knowledge-seeker');
        if (score === currentQuiz.questions.length) {
            unlockAchievement('straight-as');
        }
        if (!currentUser || pointsAwarded === 0) return;
        const userRef = doc(db, usersCollectionPath, currentUser.uid);
        await updateDoc(userRef, {
            points: increment(pointsAwarded)
        });
        const attemptRef = collection(db, quizAttemptsCollectionPath);
        await addDoc(attemptRef, {
            userId: currentUser.uid,
            quizId: currentQuiz.id,
            score: score,
            totalQuestions: currentQuiz.questions.length,
            pointsAwarded: pointsAwarded,
            timestamp: serverTimestamp()
        });
    }

    quizCloseButton.addEventListener('click', closeQuiz);
    quizNextButton.addEventListener('click', () => {
        currentQuestionIndex++;
        renderQuestion();
    });
    quizPrevButton.addEventListener('click', () => {
        currentQuestionIndex--;
        renderQuestion();
    });
    quizSubmitButton.addEventListener('click', submitQuiz);
    resultsCloseButton.addEventListener('click', () => resultsModalContainer.classList.add('hidden'));

    async function seedTasksIfEmpty() {
        try {
            const challengesCol = collection(db, challengesCollectionPath);
            const snapshot = await getDoc(doc(challengesCol, 'waste-segregation'));
            if (!snapshot.exists()) {
                const batch = writeBatch(db);
                defaultTasks.forEach(challenge => {
                    const docRef = doc(db, challengesCollectionPath, challenge.id);
                    batch.set(docRef, challenge);
                });
                await batch.commit();
            }
        } catch (error) {
            console.warn("Could not seed challenges.", error);
        }
    }
    const puzzleIcons = ['🌳', '💧', '☀️', '♻️', '🌱', '🦋', '🌸', '🍄'];
    let flippedCards = [];
    let lockBoard = false;
    let wrongAttempts = 0;

    function createShuffledDeck() {
        const fullDeck = [...puzzleIcons, ...puzzleIcons];
        for (let i = fullDeck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [fullDeck[i], fullDeck[j]] = [fullDeck[j], fullDeck[i]];
        }
        return fullDeck;
    }

    function renderPuzzle() {
        puzzleGrid.innerHTML = '';
        puzzlePointsAwarded = false;
        wrongAttempts = 0;
        updateAttemptsCounter();
        puzzleFeedback.textContent = '';
        const deck = createShuffledDeck();
        deck.forEach(icon => {
            const card = document.createElement('div');
            card.className = 'puzzle-card';
            card.dataset.icon = icon;
            card.innerHTML = `
                <div class="card-face card-back">?</div>
                <div class="card-face card-front">${icon}</div>
            `;
            card.addEventListener('click', handleCardClick);
            puzzleGrid.appendChild(card);
        });
    }

    function handleCardClick(e) {
        const clickedCard = e.currentTarget;
        if (lockBoard || clickedCard.classList.contains('flipped') || clickedCard.classList.contains('matched')) return;
        clickedCard.classList.add('flipped');
        flippedCards.push(clickedCard);
        if (flippedCards.length === 2) {
            checkForMatch();
        }
    }

    function checkForMatch() {
        lockBoard = true;
        const [cardOne, cardTwo] = flippedCards;
        if (cardOne.dataset.icon === cardTwo.dataset.icon) {
            setTimeout(() => {
                cardOne.classList.add('matched');
                cardTwo.classList.add('matched');
                resetBoard();
                checkForWin();
            }, 500);
        } else {
            setTimeout(() => {
                cardOne.classList.remove('flipped');
                cardTwo.classList.remove('flipped');
                wrongAttempts++;
                updateAttemptsCounter();
                resetBoard();
            }, 1000);
        }
    }

    function resetBoard() {
        [flippedCards, lockBoard] = [
            [], false
        ];
    }
    async function checkForWin() {
        if (puzzlePointsAwarded) return;
        const allCards = document.querySelectorAll('.puzzle-card');
        const matchedCards = document.querySelectorAll('.puzzle-card.matched');
        if (allCards.length > 0 && allCards.length === matchedCards.length) {
            const finalScore = Math.max(0, 50 - (wrongAttempts * 5));
            puzzleFeedback.textContent = `You won! Score: ${finalScore} points!`;
            puzzleFeedback.className = 'text-center mt-4 h-6 font-semibold text-green-500';
            if (currentUser && !puzzlePointsAwarded) {
                const userRef = doc(db, usersCollectionPath, currentUser.uid);
                unlockAchievement('puzzle-solver');
                await updateDoc(userRef, {
                    points: increment(finalScore),
                    puzzlesWon: increment(1) // <-- ADD THIS LINE
                });
                puzzlePointsAwarded = true;
            }
        }
    }

    function updateAttemptsCounter() {
        const attemptsEl = document.getElementById('wrong-attempts');
        if (attemptsEl) {
            attemptsEl.textContent = wrongAttempts;
        }
    }
    // --- CERTIFICATE LOGIC ---
    const certificateView = document.getElementById('certificate-view');
    const certCloseButton = document.getElementById('cert-close-button');

    function generateCertificate(name, rank, points) {
        unlockAchievement('certified-champion');
        const certContent = document.getElementById('certificate-content');
        const certName = document.getElementById('cert-name');
        const certRank = document.getElementById('cert-rank');
        const certRankBadge = document.getElementById('cert-rank-badge');
        const certDate = document.getElementById('cert-date');

        // Populate the data
        certName.textContent = name;
        certRank.textContent = `Rank #${rank} with ${points} points`;
        certDate.textContent = `Awarded on: ${new Date().toLocaleDateString('en-IN', { dateStyle: 'long' })}`;

        // Updated rankInfo with border, text, and NEW background classes
        const rankInfo = {
            1: { medal: '🥇', css: 'cert-gold', textCss: 'text-gold', bgCss: 'cert-bg-gold' },
            2: { medal: '🥈', css: 'cert-silver', textCss: 'text-silver', bgCss: 'cert-bg-silver' },
            3: { medal: '🥉', css: 'cert-bronze', textCss: 'text-bronze', bgCss: 'cert-bg-bronze' }
        };

        // --- Class Toggling Logic ---
        const currentRankInfo = rankInfo[rank];

        // 1. Clear all old classes
        certContent.classList.remove('cert-gold', 'cert-silver', 'cert-bronze', 'cert-bg-gold', 'cert-bg-silver', 'cert-bg-bronze');
        certName.classList.remove('text-gold', 'text-silver', 'text-bronze');
        certRank.classList.remove('text-gold', 'text-silver', 'text-bronze');

        // 2. Add the new classes for the current rank
        certRankBadge.innerHTML = `<div class="cert-medal-emoji">${currentRankInfo.medal}</div>`;
        certContent.classList.add(currentRankInfo.css, currentRankInfo.bgCss); // Add both border and background classes
        certName.classList.add(currentRankInfo.textCss);
        certRank.classList.add(currentRankInfo.textCss);

        // Show the certificate
        certificateView.classList.remove('hidden');
    }

    // Event listener for the "Generate Certificate" links on the leaderboard
    leaderboard.addEventListener('click', (e) => {
        if (e.target.classList.contains('cert-link')) {
            const { name, rank, points } = e.target.dataset;
            generateCertificate(name, rank, points);
        }
    });

    // Event listener for the close button
    certCloseButton.addEventListener('click', () => {
        certificateView.classList.add('hidden');
    });

    // --- Certificate Download Logic ---
    const certDownloadButton = document.getElementById('cert-download-button');
    const certNameForFileName = document.getElementById('cert-name');

    if (certDownloadButton) {
        certDownloadButton.addEventListener('click', () => {
            const certificateContent = document.getElementById('certificate-content');
            const certNameForFileName = document.getElementById('cert-name');

            // 1. Hide buttons before capture
            certDownloadButton.style.visibility = 'hidden';
            certCloseButton.style.visibility = 'hidden';

            html2canvas(certificateContent, {
                scale: 2,
                useCORS: true,
                backgroundColor: null
            }).then(canvas => {
                // 2. Show buttons again after capture is complete
                certDownloadButton.style.visibility = 'visible';
                certCloseButton.style.visibility = 'visible';

                // 3. Create image and trigger download
                const imgData = canvas.toDataURL('image/png');
                const link = document.createElement('a');
                const fileName = `EcoQuest_Certificate_${certNameForFileName.textContent.replace(' ', '_')}.png`;
                link.download = fileName;
                link.href = imgData;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);

            }).catch(err => {
                // 4. Also show buttons again if there is an error
                certDownloadButton.style.visibility = 'visible';
                certCloseButton.style.visibility = 'visible';
                console.error("Error generating certificate image:", err);
                alert("Failed to download certificate. Please try again.");
            });
        });
    }
    async function renderFeaturedTask(userData) {
    const featuredTaskContainer = document.getElementById('featured-task-container');
    if (!featuredTaskContainer) return;

    const getWeekId = (d) => {
        d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
        d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        return `${d.getUTCFullYear()}-W${Math.ceil((((d - yearStart) / 86400000) + 1) / 7)}`;
    };

    const weekId = getWeekId(new Date());
    const taskForWeek = defaultTasks[parseInt(weekId.split('-W')[1]) % defaultTasks.length];
    const bonusId = `${weekId}-${taskForWeek.id}`;
    const bonusPoints = 10;
    const isBonusClaimed = userData.lastBonusTaskCompleted === bonusId;

    currentlyFeaturedTask = {
        id: taskForWeek.id,
        bonusId: bonusId,
        bonusPoints: bonusPoints,
        isClaimed: isBonusClaimed
    };

    let bonusBadgeHTML = '';
    if (isBonusClaimed) {
        bonusBadgeHTML = `<div class="absolute top-0 right-0 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg rounded-tr-xl">✅ Bonus Claimed</div>`;
    } else {
        bonusBadgeHTML = `<div class="absolute top-0 right-0 bg-yellow-400 text-gray-900 text-xs font-bold px-3 py-1 rounded-bl-lg rounded-tr-xl animate-pulse">⭐ ${bonusPoints} Bonus Points!</div>`;
    }

    // --- UPDATED HTML BLOCK ---
    featuredTaskContainer.innerHTML = `
        <div class="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border-2 dark:border-yellow-400/50 border-yellow-400/80 relative">
            ${bonusBadgeHTML}
            <h3 class="text-xl font-bold mb-2 text-gray-900 dark:text-white">${taskForWeek.icon} ${taskForWeek.title}</h3>
            <p class="card-description mb-4">${taskForWeek.description}</p>
            <div class="text-right text-yellow-500 font-bold text-lg mt-2 mb-4">⭐ ${taskForWeek.points} Points</div>
            <div class="mt-auto w-full flex justify-center">
                <button type="button" class="uiverse-btn">
                  <strong>START TASK</strong>
                  <div class="container-stars">
                    <div class="stars"></div>
                  </div>
                  <div class="glow">
                    <div class="circle"></div>
                    <div class="circle"></div>
                  </div>
                </button>
            </div>
        </div>
    `;

    // --- UPDATED EVENT LISTENER ---
    featuredTaskContainer.querySelector('.uiverse-btn').addEventListener('click', () => {
        openMiniGame(taskForWeek.id);
    });
}
    async function renderFeaturedMonthlyTask(userData) {
    const monthlyTaskContainer = document.getElementById('featured-monthly-task-container');
    if (!monthlyTaskContainer) return;

    const monthIndex = new Date().getMonth();
    const taskForMonth = defaultTasks[monthIndex % defaultTasks.length];
    const monthId = new Date().toISOString().slice(0, 7);
    const bonusId = `${monthId}-${taskForMonth.id}`;
    const bonusPoints = 50;
    const isBonusClaimed = userData.lastMonthlyBonusCompleted === bonusId;

    currentlyFeaturedMonthlyTask = {
        id: taskForMonth.id,
        bonusId: bonusId,
        bonusPoints: bonusPoints,
        isClaimed: isBonusClaimed
    };

    let bonusBadgeHTML = '';
    if (isBonusClaimed) {
        bonusBadgeHTML = `<div class="absolute top-0 right-0 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg rounded-tr-xl">✅ Bonus Claimed</div>`;
    } else {
        bonusBadgeHTML = `<div class="absolute top-0 right-0 bg-purple-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg rounded-tr-xl animate-pulse">🌟 ${bonusPoints} Monthly Bonus!</div>`;
    }
    
    // --- UPDATED HTML BLOCK ---
    monthlyTaskContainer.innerHTML = `
        <div class="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border-2 dark:border-purple-400/50 border-purple-400/80 relative h-full flex flex-col">
            ${bonusBadgeHTML}
            <h3 class="text-xl font-bold mb-2 text-gray-900 dark:text-white">${taskForMonth.icon} ${taskForMonth.title}</h3>
            <p class="card-description mb-4">${taskForMonth.description}</p>
            <div class="text-right text-yellow-500 font-bold text-lg mt-2 mb-4">⭐ ${taskForMonth.points} Points</div>
            <div class="mt-auto w-full flex justify-center">
                <button type="button" class="uiverse-btn">
                  <strong>START TASK</strong>
                  <div class="container-stars">
                    <div class="stars"></div>
                  </div>
                  <div class="glow">
                    <div class="circle"></div>
                    <div class="circle"></div>
                  </div>
                </button>
            </div>
        </div>
    `;

    // --- UPDATED EVENT LISTENER ---
    monthlyTaskContainer.querySelector('.uiverse-btn').addEventListener('click', () => {
        openMiniGame(taskForMonth.id);
    });
}

    const gameModalContainer = document.getElementById('game-modal-container');
    const gameTitle = document.getElementById('game-title');
    const gameContentArea = document.getElementById('game-content-area');
    const gameCloseButton = document.getElementById('game-close-button');

    gameCloseButton.addEventListener('click', () => {
        if (typeof activeGame.cleanup === 'function') {
            activeGame.cleanup();
        }
        gameModalContainer.classList.add('hidden');
    });

    function openMiniGame(taskId) {
        currentTaskIdForGame = taskId;
        gameContentArea.innerHTML = '';
        gameModalContainer.classList.remove('hidden');
        switch (taskId) {
            case 'waste-segregation':
                gameTitle.textContent = 'Recycle Rush';
                launchWasteSegregationGame();
                break;
            case 'energy-saver':
                gameTitle.textContent = "Light's Out!";
                launchEnergySaverGame();
                break;
            case 'local-commute':
                gameTitle.textContent = 'Green Route Planner';
                launchCommutePuzzleGame();
                break;
            case 'reusable-bag':
                gameTitle.textContent = 'Bag Dodger';
                launchBagDodgerGame();
                break;
            case 'water-conservation':
                gameTitle.textContent = "Pipe Patrol";
                launchPipePatrolGame();
                break;
            default:
                gameTitle.textContent = 'Coming Soon';
                gameContentArea.innerHTML = `<p class="text-center p-8">This mini-game is under construction. Check back later!</p>`;
        }
    }

    const fullItemList = [
        { name: 'Vegetable Peels 🥕', type: 'wet' }, { name: 'Leftover Food 🍲', type: 'wet' }, { name: 'Tea Bags ☕', type: 'wet' }, { name: 'Eggshells 🥚', type: 'wet' }, { name: 'Coconut Husk 🥥', type: 'wet' }, { name: 'Fruit Peels 🍌', type: 'wet' }, { name: 'Spoiled Fruits 🍓', type: 'wet' }, { name: 'Cooked Meat/Bones 🍗', type: 'wet' }, { name: 'Coffee Grounds', type: 'wet' }, { name: 'Stale Bread 🍞', type: 'wet' }, { name: 'Used Paper Towels', type: 'wet' }, { name: 'Garden Twigs & Leaves 🍂', type: 'wet' }, { name: 'Fish Bones 🐟', type: 'wet' },
        { name: 'Plastic Bottle 🧴', type: 'dry' }, { name: 'Newspaper 📰', type: 'dry' }, { name: 'Cardboard Box 📦', type: 'dry' }, { name: 'Glass Jar 🏺', type: 'dry' }, { name: 'Aluminum Can 🥫', type: 'dry' }, { name: 'Milk Carton 🥛', type: 'dry' }, { name: 'Chips Packet 🍟', type: 'dry' }, { name: 'Shampoo Bottle', type: 'dry' }, { name: 'Pizza Box (clean) 🍕', type: 'dry' }, { name: 'Magazines 📖', type: 'dry' }, { name: 'Office Paper 📄', type: 'dry' }, { name: 'Tin Foil ✨', type: 'dry' }, { name: 'Bubble Wrap', type: 'dry' }, { name: 'Styrofoam Cup', type: 'dry' }, { name: 'Plastic Food Container', type: 'dry' }, { name: 'Metal Bottle Cap', type: 'dry' }, { name: 'Old Clothes 👕', type: 'dry' }, { name: 'Pen 🖊️', type: 'dry' }, { name: 'Tetra Pak Juice Box', type: 'dry' },
        { name: 'Old Battery 🔋', type: 'ewaste' }, { name: 'Broken Charger 🔌', type: 'ewaste' }, { name: 'Old Headphones 🎧', type: 'ewaste' }, { name: 'CFL Bulb 💡', type: 'ewaste' }, { name: 'Old Phone 📱', type: 'ewaste' }, { name: 'Old Laptop 💻', type: 'ewaste' }, { name: 'Keyboard ⌨️', type: 'ewaste' }, { name: 'Mouse 🖱️', type: 'ewaste' }, { name: 'Printer Cartridge', type: 'ewaste' }, { name: 'USB Drive', type: 'ewaste' }, { name: 'Remote Control', type: 'ewaste' }, { name: 'CDs/DVDs 💿', type: 'ewaste' }, { name: 'Power Bank', type: 'ewaste' },
        { name: 'Expired Medicines 💊', type: 'hazardous' }, { name: 'Paint Can 🎨', type: 'hazardous' }, { name: 'Mosquito Repellent Can', type: 'hazardous' }, { name: 'Used Syringe 💉', type: 'hazardous' }, { name: 'Broken Glass 🍷', type: 'hazardous' }, { name: 'Cleaning Chemicals', type: 'hazardous' }, { name: 'Nail Polish Bottle 💅', type: 'hazardous' }, { name: 'Used Band-Aid', type: 'hazardous' }, { name: 'Lighter 🔥', type: 'hazardous' }
    ];

function launchWasteSegregationGame() {
    let score = 0;
    let timeLeft = 20; // 20 seconds for the game
    let gameInterval;
    let currentItemElement = null;

    // This new part handles cleanup if the modal is closed early
    activeGame.cleanup = () => {
        clearInterval(gameInterval);
    };

    gameContentArea.innerHTML = `
        <div class="flex justify-between font-bold text-lg mb-2 p-2 rounded-lg bg-gray-200 dark:bg-gray-700">
            <div id="waste-game-score">Score: 0</div>
            <div id="waste-game-timer">Time: 20s</div>
        </div>
        <div id="waste-item-area" class="relative text-center h-24 mb-4 flex justify-center items-center">
            </div>
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
        <div class="waste-bin" data-bin-type="wet">
            <div class="bin-lid bg-green-600 dark:bg-green-700"></div>
            <div class="bin-body bg-green-200 dark:bg-green-800">
                <div class="bin-symbol">🍎</div>
                <div class="bin-label">Wet</div>
            </div>
        </div>
        <div class="waste-bin" data-bin-type="dry">
            <div class="bin-lid bg-blue-600 dark:bg-blue-700"></div>
            <div class="bin-body bg-blue-200 dark:bg-blue-800">
                <div class="bin-symbol">♻️</div>
                <div class="bin-label">Dry</div>
            </div>
        </div>
        <div class="waste-bin" data-bin-type="ewaste">
            <div class="bin-lid bg-yellow-500 dark:bg-yellow-600"></div>
            <div class="bin-body bg-yellow-200 dark:bg-yellow-800">
                <div class="bin-symbol">💡</div>
                <div class="bin-label">E-Waste</div>
            </div>
        </div>
        <div class="waste-bin" data-bin-type="hazardous">
            <div class="bin-lid bg-red-600 dark:bg-red-700"></div>
            <div class="bin-body bg-red-200 dark:bg-red-800">
                <div class="bin-symbol">☣️</div>
                <div class="bin-label">Hazardous</div>
            </div>
        </div>
    </div>
        <p id="game-feedback" class="text-center h-6 mt-4 font-bold"></p>
    `;

    const itemArea = document.getElementById('waste-item-area');
    const scoreEl = document.getElementById('waste-game-score');
    const timerEl = document.getElementById('waste-game-timer');
    const feedbackEl = document.getElementById('game-feedback');

    function spawnNewItem() {
        const itemData = fullItemList[Math.floor(Math.random() * fullItemList.length)];
        const itemDiv = document.createElement('div');
        itemDiv.className = 'absolute p-2 bg-gray-300 dark:bg-gray-600 rounded cursor-grab text-lg font-semibold';
        itemDiv.style.transform = 'scale(0)';
        itemDiv.style.transition = 'transform 0.3s ease-out';
        itemDiv.textContent = itemData.name;
        itemDiv.draggable = true;
        itemDiv.dataset.itemType = itemData.type;
        itemArea.innerHTML = '';
        itemArea.appendChild(itemDiv);
        setTimeout(() => { itemDiv.style.transform = 'scale(1)'; }, 50);
        currentItemElement = itemDiv;
        currentItemElement.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('item-type', itemData.type);
            setTimeout(() => { currentItemElement.style.opacity = '0.5'; }, 0);
        });
        currentItemElement.addEventListener('dragend', () => {
            currentItemElement.style.opacity = '1';
        });
    }

    function updateScore(change) {
        score += change;
        scoreEl.textContent = `Score: ${score}`;
    }

    function handleDrop(e) {
        e.preventDefault();
        const bin = e.currentTarget;
        bin.style.transform = 'scale(1)';
        const droppedItemType = e.dataTransfer.getData('item-type');
        const binType = bin.dataset.binType;
        if (droppedItemType === binType) {
            updateScore(10);
            feedbackEl.textContent = 'Correct! +10';
            feedbackEl.className = 'text-center h-6 mt-4 font-bold text-green-500';
            bin.classList.add('animate-pulse');
        } else {
            updateScore(-5);
            feedbackEl.textContent = 'Wrong Bin! -5';
            feedbackEl.className = 'text-center h-6 mt-4 font-bold text-red-500';
            gameContentArea.parentElement.classList.add('animate-shake');
        }
        setTimeout(() => {
            bin.classList.remove('animate-pulse');
            gameContentArea.parentElement.classList.remove('animate-shake');
        }, 500);
        spawnNewItem();
    }

function endGame() {
        activeGame.cleanup(); // Clears the interval
        
        // UPDATED: Harsher point calculation (score / 4 instead of / 2.5)
        const pointsWon = Math.floor(score / 3.2); 

        gameContentArea.innerHTML = `
            <div class="text-center p-8 flex flex-col justify-center items-center h-full">
                <h3 class="text-3xl font-bold mb-4 text-gray-800 dark:text-white">Time's Up!</h3>
                <p class="text-xl mb-2 text-gray-600 dark:text-gray-300">Final Score: <span class="font-bold text-blue-500">${score}</span></p>
                <p class="text-2xl font-bold text-yellow-500 mt-4">Bonus Awarded: ⭐ ${Math.min(50, pointsWon)}</p>
            </div>
        `;
        // The final points are capped at 50 inside the addPointsForGame function
        addPointsForGame(pointsWon, 'waste-segregation', score);
    }

    if (!document.getElementById('game-animations')) {
        const styleSheet = document.createElement("style");
        styleSheet.id = 'game-animations';
        styleSheet.innerText = `
            @keyframes shake {
                10%, 90% { transform: translate3d(-1px, 0, 0); } 20%, 80% { transform: translate3d(2px, 0, 0); }
                30%, 50%, 70% { transform: translate3d(-4px, 0, 0); } 40%, 60% { transform: translate3d(4px, 0, 0); }
            } .animate-shake { animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both; }
        `;
        document.head.appendChild(styleSheet);
    }

    document.querySelectorAll('.waste-bin').forEach(bin => {
        bin.addEventListener('dragover', (e) => { e.preventDefault(); bin.style.transform = 'scale(1.05)'; });
        bin.addEventListener('dragleave', () => { bin.style.transform = 'scale(1)'; });
        bin.addEventListener('drop', handleDrop);
    });

    gameInterval = setInterval(() => {
        timeLeft--;
        timerEl.textContent = `Time: ${timeLeft}s`;
        if (timeLeft <= 0) {
            endGame();
        }
    }, 1000);

    spawnNewItem();
}

function launchEnergySaverGame() {
    let totalEnergyWasted = 0;
    let timeLeft = 30;
    let activeConsumption = 0;
    let gameLoop, activationLoop; // Define intervals here to be accessible by cleanup

    // This new part handles cleanup if the modal is closed early
    activeGame.cleanup = () => {
        clearInterval(gameLoop);
        clearInterval(activationLoop);
    };

    const appliances = [
        { id: 'living-light', name: '💡 Light', consumption: 1, isOn: false, isPenalizing: false },
        { id: 'tv', name: '📺 TV', consumption: 3, isOn: false, isPenalizing: false },
        { id: 'kitchen-light', name: '💡 Light', consumption: 1, isOn: false, isPenalizing: false },
        { id: 'fridge', name: '🧊 Fridge', consumption: 5, isOn: false, isPenalizing: false },
        { id: 'bedroom-light', name: '💡 Light', consumption: 1, isOn: false, isPenalizing: false },
        { id: 'computer', name: '💻 PC', consumption: 4, isOn: false, isPenalizing: false },
        { id: 'study-lamp', name: '🛋️ Lamp', consumption: 2, isOn: false, isPenalizing: false },
        { id: 'charger', name: '🔌 Charger', consumption: 1, isOn: false, isPenalizing: false }
    ];

    gameContentArea.innerHTML = `
        <div class="energy-game-header">
            <div id="game-timer">Time Left: 30s</div>
            <div id="energy-meter">Energy Wasted: 0</div>
        </div>
        <div class="house-container">
            <div class="room">
                <div class="appliance" data-id="living-light">${appliances[0].name}</div>
                <div class="appliance" data-id="tv">${appliances[1].name}</div>
            </div>
            <div class="room">
                <div class="appliance" data-id="kitchen-light">${appliances[2].name}</div>
                <div class="appliance" data-id="fridge">${appliances[3].name}</div>
            </div>
            <div class="room">
                <div class="appliance" data-id="bedroom-light">${appliances[4].name}</div>
                <div class="appliance" data-id="computer">${appliances[5].name}</div>
            </div>
            <div class="room">
                <div class="appliance" data-id="study-lamp">${appliances[6].name}</div>
                <div class="appliance" data-id="charger">${appliances[7].name}</div>
            </div>
        </div>
    `;

    const timerEl = document.getElementById('game-timer');
    const energyMeterEl = document.getElementById('energy-meter');
    const applianceElements = document.querySelectorAll('.appliance');

    gameLoop = setInterval(() => {
        timeLeft--;
        timerEl.textContent = `Time Left: ${timeLeft}s`;
        totalEnergyWasted += activeConsumption;
        energyMeterEl.textContent = `Energy Wasted: ${Math.floor(totalEnergyWasted)}`;
        if (timeLeft <= 0) {
            endGame();
        }
    }, 1000);

    activationLoop = setInterval(() => {
        const offAppliances = appliances.filter(a => !a.isOn);
        if (offAppliances.length > 0) {
            const applianceToTurnOn = offAppliances[Math.floor(Math.random() * offAppliances.length)];
            applianceToTurnOn.isOn = true;
            document.querySelector(`.appliance[data-id="${applianceToTurnOn.id}"]`).classList.add('on');
            setTimeout(() => {
                if (applianceToTurnOn.isOn) {
                    applianceToTurnOn.isPenalizing = true;
                    activeConsumption += applianceToTurnOn.consumption;
                }
            }, 10);
        }
    }, 1200);

    applianceElements.forEach(el => {
        el.addEventListener('click', () => {
            const appliance = appliances.find(a => a.id === el.dataset.id);
            if (appliance.isOn) {
                appliance.isOn = false;
                el.classList.remove('on');
                if (appliance.isPenalizing) {
                    activeConsumption -= appliance.consumption;
                    appliance.isPenalizing = false;
                }
            }
        });
    });

    function endGame() {
        activeGame.cleanup(); // Clears the intervals
        const wasted = Math.floor(totalEnergyWasted);
        let pointsWon = 0;
        if (wasted < 25) { pointsWon = 50; }
        else if (wasted < 35) { pointsWon = 40; }
        else if (wasted < 45) { pointsWon = 30; }
        else if (wasted < 55) { pointsWon = 15; }
        else { pointsWon = 5; }

        gameContentArea.innerHTML = `
            <div class="text-center p-8 flex flex-col justify-center items-center h-full">
                <h3 class="text-3xl font-bold mb-4 text-gray-800 dark:text-white">Time's Up!</h3>
                <p class="text-xl mb-2 text-gray-600 dark:text-gray-300">Total Energy Wasted: <span class="font-bold text-red-500">${wasted}</span></p>
                <p class="text-2xl font-bold text-yellow-500 mt-4">Points Awarded: ⭐ ${pointsWon}</p>
            </div>
        `;
        addPointsForGame(pointsWon, 'energy-saver', wasted || 1);
    }
}
/**
 * Generates a truly random and challenging map by creating a random landscape first,
 * then ensuring a solvable path exists within it.
 * @param {number} size The width and height of the map grid.
 * @returns {Array<Array<any>>} A 2D array representing the map layout.
 */
function generateRandomMap(size) {
    let map = Array(size).fill(0).map(() => Array(size).fill(0));

    // 1. Determine Start and End points
    const startR = 1;
    const startC = 1;
    const endR = size - 2;
    const endC = size - 2;

    // 2. Generate a "hidden" path of coordinates. This is our guarantee that a path exists.
    const hiddenPath = [];
    let current = { r: startR, c: startC };
    while (current.r !== endR || current.c !== endC) {
        hiddenPath.push({ ...current });
        if (Math.random() > 0.5 && current.r !== endR) {
            current.r += Math.sign(endR - current.r);
        } else if (current.c !== endC) {
            current.c += Math.sign(endC - current.c);
        } else {
             if (current.r !== endR) current.r += Math.sign(endR - current.r);
             else if (current.c !== endC) current.c += Math.sign(endC - current.c);
        }
    }
    hiddenPath.push({ r: endR, c: endC });

    // 3. Generate a completely random terrain for the ENTIRE map
    for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
            const rand = Math.random();
            if (rand < 0.25) { map[r][c] = 3; }      // 25% chance of obstacle
            else if (rand < 0.45) { map[r][c] = 2; } // 20% chance of bus lane
            else if (rand < 0.60) { map[r][c] = 4; } // 15% chance of park
            else if (rand < 0.70) { map[r][c] = 5; } // 10% chance of uphill road
            else { map[r][c] = 0; }                 // Default to road
        }
    }

    // 4. Ensure the hidden path is not blocked by obstacles
    hiddenPath.forEach(pos => {
        if (map[pos.r][pos.c] === 3) { // If a guaranteed path tile is an obstacle...
            map[pos.r][pos.c] = 0; // ...turn it into a simple road.
        }
    });

    // 5. Add "hints" - sprinkle a FEW bike paths along the hidden path
    hiddenPath.forEach(pos => {
        // Only give it a small chance to become a bike path
        if (Math.random() < 0.22) { // 22% chance
             map[pos.r][pos.c] = 1; // 1 = bike path
        }
    });

    // 6. Finally, firmly place the Start and End points
    map[startR][startC] = 'S';
    map[endR][endC] = 'E';

    return map;
}
function launchCommutePuzzleGame() {
    const gridSize = 12; // Define gridSize FIRST
    const tileCosts = { road: 5, bike: 1, bus: 2, park: 1, uphill: 8 };
    let playerPos = { r: 0, c: 0 }; // Initialize playerPos
    const mapLayout = generateRandomMap(gridSize); // NOW generate the map
    let totalCarbonScore = 0;
    let gameFinished = false;

    activeGame.cleanup = () => {
        document.removeEventListener('keydown', keydownHandler);
        document.querySelectorAll('.ctrl-btn').forEach(btn => btn.removeEventListener('click', controlsClickHandler));
    };

// Change the line to this:
gameContentArea.innerHTML = `
    <div class="puzzle-header">
        <h4>Find the most eco-friendly route!</h4>
        <p>Carbon Score: <span id="carbon-score">0</span></p>
    </div>
    <div class="commute-grid relative"></div> <div id="commute-controls" class="flex justify-center items-center mt-3 gap-2">
        <button class="ctrl-btn" data-dir="left">⬅️</button>
        <div class="flex flex-col gap-2">
            <button class="ctrl-btn" data-dir="up">⬆️</button>
            <button class="ctrl-btn" data-dir="down">⬇️</button>
        </div>
        <button class="ctrl-btn" data-dir="right">➡️</button>
    </div>
    <p id="game-feedback" class="text-center h-6 mt-2 font-bold"></p>
`;

    if (!document.getElementById('commute-game-styles')) {
        const styleSheet = document.createElement("style");
        styleSheet.id = 'commute-game-styles';
        styleSheet.innerText = `
            .ctrl-btn { width: 50px; height: 50px; font-size: 1.5rem; border-radius: 50%; border: 2px solid #9ca3af; background-color: #e5e7eb; color: #1f2937; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s; }
            .dark .ctrl-btn { background-color: #4b5563; border-color: #6b7280; color: #e5e7eb; }
            .ctrl-btn:active { transform: scale(0.9); background-color: #22c55e; }
        `;
        document.head.appendChild(styleSheet);
    }

    const grid = gameContentArea.querySelector('.commute-grid');
    const scoreEl = document.getElementById('carbon-score');
    const feedbackEl = document.getElementById('game-feedback');
    let playerElement;

    for (let r = 0; r < gridSize; r++) {
        for (let c = 0; c < gridSize; c++) {
            const tile = document.createElement('div');
            tile.classList.add('tile');
            tile.dataset.row = r;
            tile.dataset.col = c;
            let tileType = mapLayout[r][c];
            let icon = '';
            switch (tileType) {
                case 'S': tile.classList.add('start'); icon = '🏠'; playerPos = { r, c }; break; // Correctly sets local playerPos
                case 'E': tile.classList.add('end'); icon = '🏫'; break;
                case 1: tile.classList.add('bike'); tile.dataset.type = 'bike'; icon = '🚲'; break;
                case 2: tile.classList.add('bus'); tile.dataset.type = 'bus'; icon = '🚌'; break;
                case 3: tile.classList.add('obstacle'); tile.dataset.type = 'obstacle'; icon = '🏢'; break;
                case 4: tile.classList.add('park'); tile.dataset.type = 'park'; icon = '🌳'; break;
                case 5: tile.classList.add('uphill'); tile.dataset.type = 'uphill'; icon = '🚗'; break;
                default: tile.classList.add('road'); tile.dataset.type = 'road';
            }
            tile.innerHTML = icon;
            grid.appendChild(tile);
        }
    }

    playerElement = document.createElement('div');
    playerElement.id = 'player-marker';
    playerElement.innerHTML = '🚶';
    playerElement.style.cssText = `position: absolute; width: ${100 / gridSize}%; height: ${100 / gridSize}%; font-size: 1.2rem; display: flex; align-items: center; justify-content: center; transition: all 0.2s ease-in-out; z-index: 10; pointer-events: none;`;
    grid.appendChild(playerElement);
    updatePlayerPosition();

    function updatePlayerPosition() {
        playerElement.style.top = `${playerPos.r * (100 / gridSize)}%`;
        playerElement.style.left = `${playerPos.c * (100 / gridSize)}%`;
        const visitedTile = grid.querySelector(`[data-row='${playerPos.r}'][data-col='${playerPos.c}']`);
        if (visitedTile && !visitedTile.classList.contains('start')) {
            visitedTile.classList.add('path');
        }
    }

    function handleMove(dr, dc) {
        if (gameFinished) return;
        const newR = playerPos.r + dr;
        const newC = playerPos.c + dc;

        if (newR < 0 || newR >= gridSize || newC < 0 || newC >= gridSize) return;
        const targetTileValue = mapLayout[newR][newC];
        const targetTileElement = grid.querySelector(`[data-row='${newR}'][data-col='${newC}']`);

        if (targetTileValue === 3) {
            feedbackEl.textContent = "Can't move through buildings!";
            setTimeout(() => feedbackEl.textContent = "", 1500);
            return;
        }

        playerPos = { r: newR, c: newC };
        const typeKey = targetTileElement.dataset.type;
        if (typeKey) {
            totalCarbonScore += tileCosts[typeKey];
            scoreEl.textContent = totalCarbonScore;
        }
        updatePlayerPosition();

        if (targetTileValue === 'E') {
            endGame();
        }
    }

    function endGame() {
        gameFinished = true;
        feedbackEl.classList.add('text-green-500');
        feedbackEl.textContent = "You reached the destination!";
        activeGame.cleanup();

        // Points logic based on final score for a larger map
        let pointsWon = 0;
        if (totalCarbonScore < 40) pointsWon = 50;
        else if (totalCarbonScore < 60) pointsWon = 40;
        else if (totalCarbonScore < 80) pointsWon = 25;
        else pointsWon = 15;

        setTimeout(() => {
            gameContentArea.innerHTML = `
                <div class="text-center p-8 flex flex-col justify-center items-center h-full">
                    <h3 class="text-3xl font-bold mb-4">Route Complete!</h3>
                    <p class="text-xl mb-2">Your Carbon Score: <span class="font-bold text-green-500">${totalCarbonScore}</span></p>
                    <p class="text-2xl font-bold text-yellow-500">You earned ⭐ ${pointsWon} points!</p>
                </div>
            `;
            addPointsForGame(pointsWon, 'local-commute', totalCarbonScore);
        }, 1500);
    }

    function keydownHandler(e) {
        e.preventDefault();
        switch (e.key) {
            case 'ArrowUp': handleMove(-1, 0); break;
            case 'ArrowDown': handleMove(1, 0); break;
            case 'ArrowLeft': handleMove(0, -1); break;
            case 'ArrowRight': handleMove(0, 1); break;
        }
    }

    function controlsClickHandler(e) {
        const dir = e.currentTarget.dataset.dir;
        switch (dir) {
            case 'up': handleMove(-1, 0); break;
            case 'down': handleMove(1, 0); break;
            case 'left': handleMove(0, -1); break;
            case 'right': handleMove(0, 1); break;
        }
    }

    document.addEventListener('keydown', keydownHandler);
    document.querySelectorAll('.ctrl-btn').forEach(btn => btn.addEventListener('click', controlsClickHandler));
}

function launchBagDodgerGame() {
    // --- Setup ---
    gameContentArea.innerHTML = `<canvas id="game-canvas" width="550" height="350"></canvas>`;
    const canvas = document.getElementById('game-canvas');
    const ctx = canvas.getContext('2d');
    canvas.classList.add('game-background');

    let score = 0;
    let timeLeft = 30;
    let isGameOver = false;
    let animationFrameId, timerInterval, spawnInterval;

    // --- NEW: Game State for Combo System ---
    let comboStreak = 0;
    let floatingTexts = [];

    activeGame.cleanup = () => {
        if (isGameOver) return;
        isGameOver = true;
        cancelAnimationFrame(animationFrameId);
        clearInterval(timerInterval);
        clearInterval(spawnInterval);
        canvas.removeEventListener('mousemove', movePlayer);
        canvas.removeEventListener('touchmove', movePlayerWithTouch);
    };

    // --- Assets (Using your new values) ---
    const spriteSources = {
        player: 'https://pngimg.com/uploads/shopping_cart/shopping_cart_PNG47.png', apple: 'https://images.vexels.com/media/users/3/145460/isolated/lists/d08a1157100d2e42f31b4a752e71c33b-apple-illustration.png', bread: 'https://cdn-icons-png.flaticon.com/256/8620/8620877.png', milk: 'https://cdn-icons-png.flaticon.com/256/3747/3747872.png', carrot: 'https://cdn-icons-png.flaticon.com/256/766/766113.png', cheese: 'https://cdn-icons-png.flaticon.com/256/2276/2276931.png', bag: 'https://cdn-icons-png.flaticon.com/256/10753/10753285.png'
    };
    const images = {};
    const allGoodItems = [
        { id: 'apple', sprite: 'apple', points: 5, width: 24, height: 24 }, { id: 'bread', sprite: 'bread', points: 7, width: 30, height: 30 }, { id: 'milk', sprite: 'milk', points: 8, width: 36, height: 36 }, { id: 'carrot', sprite: 'carrot', points: 6, width: 30, height: 30 }, { id: 'cheese', sprite: 'cheese', points: 10, width: 33, height: 33 },
    ];
    const badItem = { sprite: 'bag', type: 'bad', points: -25, width: 48, height: 48 };

    // --- Loading and Initialization ---
    function loadImages() {
        const promises = [];
        const numImages = Object.keys(spriteSources).length;
        let loadedCount = 0;
        drawLoadingProgress(0);
        for (const key in spriteSources) {
            const promise = new Promise((resolve) => {
                const img = new Image();
                images[key] = img;
                img.onload = img.onerror = () => { loadedCount++; drawLoadingProgress(loadedCount / numImages); resolve(); };
                img.src = spriteSources[key];
            });
            promises.push(promise);
        }
        return Promise.all(promises);
    }

    function drawLoadingProgress(progress) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#FFFFFF'; ctx.font = '24px Inter, sans-serif'; ctx.textAlign = 'center';
        ctx.fillText('Loading Shopping Trip...', canvas.width / 2, canvas.height / 2 - 40);
        const barX = canvas.width * 0.2, barY = canvas.height / 2 - 15, barWidth = canvas.width * 0.6, barHeight = 30;
        ctx.strokeStyle = '#FFFFFF'; ctx.strokeRect(barX, barY, barWidth, barHeight);
        ctx.fillStyle = '#22c55e'; ctx.fillRect(barX, barY, barWidth * progress, barHeight);
        ctx.fillStyle = '#FFFFFF'; ctx.font = '16px Inter, sans-serif';
        ctx.fillText(`${Math.round(progress * 100)}%`, canvas.width / 2, canvas.height / 2 + 8);
        ctx.textAlign = 'start';
    }

    // --- Game Logic ---
    const player = { x: canvas.width / 2 - 30, y: canvas.height - 70, width: 60, height: 60, sprite: 'player' };
    let items = [];

    function movePlayer(e) { const rect = canvas.getBoundingClientRect(); player.x = e.clientX - rect.left - (player.width / 2); if (player.x < 0) player.x = 0; if (player.x > canvas.width - player.width) player.x = canvas.width - player.width; }
    function movePlayerWithTouch(e) { e.preventDefault(); const rect = canvas.getBoundingClientRect(); player.x = e.touches[0].clientX - rect.left - (player.width / 2); if (player.x < 0) player.x = 0; if (player.x > canvas.width - player.width) player.x = canvas.width - player.width; }

    function spawnWave() {
        if (isGameOver) return;
        const waveSize = Math.floor(Math.random() * 2) + 1;
        for (let i = 0; i < waveSize; i++) {
            const itemData = Math.random() < 0.45 ? badItem : allGoodItems[Math.floor(Math.random() * allGoodItems.length)]; // Increased bag chance slightly
            items.push({
                x: Math.random() * (canvas.width - itemData.width),
                y: -50 - (Math.random() * 80),
                speed: 2.5 + Math.random() * 3, // Faster speed
                ...itemData
            });
        }
    }

    function addFloatingText(text, x, y, color = 'white', size = 20) {
        floatingTexts.push({ text, x, y, color, size, life: 1.0 });
    }

    function detectCollision(a, b) { return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y; }

    function endGame() {
        activeGame.cleanup();
        // Using your harsher scoring tiers
        let pointsWon = 0;
        if (score >= 300) pointsWon = 50;
        else if (score >= 250) pointsWon = 45;
        else if (score >= 200) pointsWon = 35;
        else if (score >= 100) pointsWon = 25;
        else if (score >= 50) pointsWon = 15;
        else if (score > 0) pointsWon = 5;

        gameContentArea.innerHTML = `<div class="text-center p-8 flex flex-col justify-center items-center h-full"><h3 class="text-3xl font-bold mb-4 text-gray-800 dark:text-white">Trip Over!</h3><p class="text-xl mb-2 text-gray-600 dark:text-gray-300">Final Score: <span class="font-bold text-blue-500">${score}</span></p><p class="text-2xl font-bold text-yellow-500 mt-4">Bonus Awarded: ⭐ ${pointsWon}</p></div>`;
        addPointsForGame(pointsWon, 'reusable-bag', score);
    }

    // --- Main Game Loop ---
    function gameLoop() {
        if (isGameOver) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (images.player?.complete) ctx.drawImage(images.player, player.x, player.y, player.width, player.height);

        items.forEach((item, index) => {
            item.y += item.speed;
            if (images[item.sprite]?.complete) ctx.drawImage(images[item.sprite], item.x, item.y, item.width, item.height);

            if (detectCollision(player, item)) {
                if (item.type === 'bad') {
                    score += item.points;
                    addFloatingText(`${item.points}`, player.x + player.width / 2, player.y, 'red');
                    if (comboStreak > 1) addFloatingText(`Streak Lost!`, player.x + player.width / 2, player.y - 30, 'orange', 24);
                    comboStreak = 0; // COMBO: Reset on bag hit
                    canvas.classList.add('player-hit');
                    setTimeout(() => canvas.classList.remove('player-hit'), 300);
                } else {
                    // COMBO: Item caught, increase combo and add bonus points
                    comboStreak++;
                    const pointsGained = item.points + comboStreak; // Add combo bonus to base points
                    score += pointsGained;
                    addFloatingText(`+${pointsGained}`, player.x + player.width / 2, player.y, '#22c55e');
                }
                items.splice(index, 1);
            } else if (item.y > canvas.height) {
                if (item.type !== 'bad') {
                    score -= 5; // Penalty for missed food
                    addFloatingText(`-5`, item.x, canvas.height - 10, 'orange');
                    if (comboStreak > 1) addFloatingText(`Streak Lost!`, item.x, canvas.height - 40, 'orange', 24);
                    comboStreak = 0; // COMBO: Reset on miss
                }
                items.splice(index, 1);
            }
        });

        // --- Draw UI ---
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(0, 0, canvas.width, 40);
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 18px Inter, sans-serif';
        ctx.fillText(`Score: ${score}`, 10, 28);
        ctx.textAlign = 'center';
        
        // COMBO: Display the streak in the top bar
        if (comboStreak > 1) {
            ctx.fillStyle = '#f59e0b';
            ctx.fillText(`🔥 ${comboStreak}x Combo`, canvas.width / 2, 28);
        }

        ctx.fillStyle = '#FFFFFF';
        ctx.textAlign = 'right';
        ctx.fillText(`Time: ${timeLeft}`, canvas.width - 10, 28);
        ctx.textAlign = 'start';

        floatingTexts.forEach((ft, index) => {
            ctx.fillStyle = ft.color;
            ctx.font = `bold ${ft.size * ft.life}px Inter, sans-serif`;
            ctx.globalAlpha = ft.life;
            ctx.textAlign = 'center';
            ctx.fillText(ft.text, ft.x, ft.y);
            ft.y -= 1;
            ft.life -= 0.02;
            if (ft.life <= 0) floatingTexts.splice(index, 1);
        });
        ctx.globalAlpha = 1.0;
        ctx.textAlign = 'start';

        animationFrameId = requestAnimationFrame(gameLoop);
    }

    function startGame() {
        canvas.addEventListener('mousemove', movePlayer);
        canvas.addEventListener('touchmove', movePlayerWithTouch);
        timerInterval = setInterval(() => {
            if (isGameOver) return;
            timeLeft--;
            if (timeLeft <= 0) endGame();
        }, 1000);
        spawnInterval = setInterval(spawnWave, 1000); // Faster spawn rate for more action
        gameLoop();
    }

    loadImages().then(() => {
        setTimeout(startGame, 250);
    });
}
/**
 * A centralized function to handle all game-end rewards and penalties.
 * @param {number} finalScore - The raw score from the game.
 * @param {string} gameId - The unique ID of the game played (e.g., 'waste-segregation').
 */
/**
 * A centralized function to handle all game-end rewards and penalties.
 * @param {number} pointsEarned - The pre-calculated points won from the game.
 * @param {string} gameId - The unique ID of the game played (e.g., 'waste-segregation').
 * @param {number} rawScore - The raw score from the game (for win/loss checks).
 */
async function addPointsForGame(pointsEarned, gameId, rawScore = 1) { // Default rawScore to 1 to pass win checks
    if (!currentUser) return;
    const userRef = doc(db, usersCollectionPath, currentUser.uid);

    // --- 1. Define Win/Loss Conditions & Penalties ---
    const gameRules = {
        'waste-segregation': { winThreshold: 0, penalty: -5 },
        'energy-saver': { winThreshold: 0, penalty: -10 },
        'reusable-bag': { winThreshold: 0, penalty: -5 },
        'local-commute': { winThreshold: -1, penalty: 0 }, // Can't be "lost"
        'eco-runner': { winThreshold: 0, penalty: -5 }
    };

    const rules = gameRules[gameId];
    if (rawScore <= rules.winThreshold) {
        // --- Player Lost ---
        if (rules.penalty !== 0) {
            await updateDoc(userRef, { points: increment(rules.penalty) });
            showToastNotification(`Try again! You lost ${Math.abs(rules.penalty)} points.`);
        }
        return; // Stop further execution
    }

    // --- 2. Player Won: Use pre-calculated points (capped at 50) ---
    const basePoints = Math.min(50, pointsEarned); // Cap the reward at 50

    // --- 3. Check for One-Time Weekly/Monthly Bonuses ---
    let totalPointsToAdd = basePoints;
    const updatePayload = {
        completedTasks: increment(1),
        gamesPlayed: increment(1)
    };

    const userSnap = await getDoc(userRef);
    const latestUserData = userSnap.exists() ? userSnap.data() : {};

    // Check for Weekly Bonus
    if (currentlyFeaturedTask && gameId === currentlyFeaturedTask.id && latestUserData.lastBonusTaskCompleted !== currentlyFeaturedTask.bonusId) {
        totalPointsToAdd += currentlyFeaturedTask.bonusPoints;
        updatePayload.lastBonusTaskCompleted = currentlyFeaturedTask.bonusId;
        showToastNotification(`Weekly Bonus! +${currentlyFeaturedTask.bonusPoints} extra points!`);
    }
    // Check for Monthly Bonus
    if (currentlyFeaturedMonthlyTask && gameId === currentlyFeaturedMonthlyTask.id && latestUserData.lastMonthlyBonusCompleted !== currentlyFeaturedMonthlyTask.bonusId) {
        totalPointsToAdd += currentlyFeaturedMonthlyTask.bonusPoints;
        updatePayload.lastMonthlyBonusCompleted = currentlyFeaturedMonthlyTask.bonusId;
        showToastNotification(`Monthly Bonus! +${currentlyFeaturedMonthlyTask.bonusPoints} extra points!`);
    }

    // --- 4. Update Firestore Database ---
    unlockAchievement('game-on');
    updatePayload.points = increment(totalPointsToAdd);

    try {
        await updateDoc(userRef, updatePayload);
        showToastNotification(`Great job! You earned ${totalPointsToAdd} points.`);
    } catch (error) {
        console.error("Error updating points:", error);
    }
}
    async function renderWeeklyTask() {
    // This part of the function remains the same...
    const getWeekId = (d) => {
        d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
        d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        return `${d.getUTCFullYear()}-W${Math.ceil((((d - yearStart) / 86400000) + 1) / 7)}`;
    };
    const weekId = getWeekId(new Date());
    const currentTask = weeklyTasks[parseInt(weekId.split('-W')[1]) % weeklyTasks.length];
    const weeklyTaskId = `${weekId}-${currentTask.id}`;
    const userDoc = await getDoc(doc(db, usersCollectionPath, currentUser.uid));
    const isCompleted = userDoc.data().lastWeeklyTaskCompleted === weeklyTaskId;

    // --- THIS HTML BLOCK IS THE PART THAT CHANGES ---
    weeklyTaskContainer.innerHTML = `
        <div class="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm p-8 rounded-2xl shadow-xl border dark:border-gray-700 flex flex-col items-center text-center">
            <div class="text-7xl mb-4">${currentTask.icon}</div>
            <h3 class="text-3xl font-bold text-gray-900 dark:text-white">${currentTask.title}</h3>
            <p class="card-description my-4 max-w-lg">${currentTask.description}</p>
            <div class="font-bold text-2xl text-yellow-500 mb-6">⭐ ${currentTask.points} Points</div>
            ${isCompleted
                ? `<button class="w-full max-w-xs bg-green-500 text-white font-bold py-3 px-4 rounded-lg shadow-lg cursor-not-allowed">Completed for this week! ✅</button>`
                : `<button id="submit-weekly-task" class="camera-btn">
                     <span class="button-content">Submit with Camera</span>
                   </button>`
            }
        </div>
    `;

    // This part of the function remains the same...
    if (!isCompleted) {
        document.getElementById('submit-weekly-task').addEventListener('click', () => {
            openCameraModal({ ...currentTask,
                weeklyTaskId
            });
        });
    }
}
    let videoStream = null;

    function openCameraModal(task) {
        currentChallenge = task;
        cameraModalContainer.classList.remove('hidden');
        document.getElementById('verification-overlay').classList.add('hidden');
        initializeCamera();
    }
    async function initializeCamera() {
        try {
            if (videoStream) {
                videoStream.getTracks().forEach(track => track.stop());
            }
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'environment'
                }
            });
            const videoFeed = document.getElementById('camera-feed');
            videoFeed.srcObject = stream;
            videoStream = stream;
        } catch (err) {
            console.error("Error accessing camera:", err);
            alert("Could not access camera. Please ensure you have given permission.");
        }
    }

    function capturePhoto() {
        const videoFeed = document.getElementById('camera-feed');
        const canvas = document.getElementById('photo-canvas');
        canvas.width = videoFeed.videoWidth;
        canvas.height = videoFeed.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(videoFeed, 0, 0, canvas.width, canvas.height);

        // Stop the camera feed after taking the photo
        if (videoStream) {
            videoStream.getTracks().forEach(track => track.stop());
        }

        // Get the image data as a Base64 string
        const imageData = canvas.toDataURL('image/jpeg');

        // Call the new, real AI verification function
        verifyImageWithGemini(imageData);
    }

    /**
     * Sends an image to the Gemini API to verify if it contains a plant or sapling.
     * @param {string} base64ImageData - The image data from the canvas, in Base64 format.
     */
    async function verifyImageWithGemini(base64ImageData) {
    const verificationOverlay = document.getElementById('verification-overlay');
    verificationOverlay.classList.remove('hidden');

    // The API endpoint is now on your own backend server
    const serverApiUrl = '/api/verify-photo';

    try {
        const response = await fetch(serverApiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ image: base64ImageData }) // Send the raw base64 image data to your server
        });

        if (!response.ok) {
            throw new Error(`Server Error: ${response.status}`);
        }

        const result = await response.json(); // Your server will return { verified: true/false }

        if (result.verified) {
            // AI verification successful!
            alert("Verification successful! Plant detected. Badge and points awarded.");
            const userRef = doc(db, usersCollectionPath, currentUser.uid);
            const updateData = {
                points: increment(currentChallenge.points),
                lastWeeklyTaskCompleted: currentChallenge.weeklyTaskId,
                treeBadges: increment(1) // Award the tree badge
            };
            await updateDoc(userRef, updateData);
            renderWeeklyTask(); // Re-render the view to show completion
        } else {
            // AI verification failed.
            alert("Verification failed. The AI could not detect a plant or sapling. Please try again with a clearer photo.");
        }

    } catch (error) {
        console.error("AI Verification failed:", error);
        alert("An error occurred during verification. Please try again. Error details: " + error.message);
    } finally {
        // Hide the loading overlay and the camera modal
        verificationOverlay.classList.add('hidden');
        cameraModalContainer.classList.add('hidden');
    }
}

    capturePhotoButton.addEventListener('click', capturePhoto);
    cameraCloseButton.addEventListener('click', () => {
        if (videoStream) {
            videoStream.getTracks().forEach(track => track.stop());
        }
        cameraModalContainer.classList.add('hidden');
    });
// pix game
function launchEcoRunnerGame() {
    // --- Get all DOM elements ---
    const canvas = document.getElementById('eco-runner-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const scoreDisplay = document.getElementById('game-score-display');
    const distanceDisplay = document.getElementById('game-distance-display');
    const gameOverlay = document.getElementById('game-overlay');
    const overlayTitle = document.getElementById('overlay-title');
    const overlayText = document.getElementById('overlay-text');
    const overlayButton = document.getElementById('overlay-button');

    canvas.width = 800;
    canvas.height = 400;

    // --- Color Palette ---
    const palette = {
        sky_top: '#232a3f',
        sky_bottom: '#3d4566',
        star: 'rgba(240, 240, 240, 0.8)',
        mountain_far: '#4a5477',
        mountain_near: '#394264',
        tree_far: '#1a1f2a',
        tree_near: '#131720',
        fog: 'rgba(61, 69, 102, 0.3)',
        ground: '#1a1f2a',
        player_body: '#d4d4d4', player_cape: '#e53935',
        obstacle_stone: '#5a6979', obstacle_moss: '#558d53',
        drone: '#e53935', drone_glow: '#fecdd3',
        collectible_seed: '#f5d86d', collectible_diamond: '#87d7e7', diamond_shadow: '#54a2b1'
    };

    // --- Physics & Game Balance Constants ---
    const JUMP_FORCE = -13;
    const GRAVITY = 0.4;
    const MIN_OBSTACLE_GAP = 250;

    // --- Game State Variables ---
    let score, distance, gameSpeed, keys, isGameOver, currentQuestion, obstacles, frameCount, animationFrameId, collectibles, lastObstacle;
    let nextObstacleFrame, nextCollectibleFrame;
    let bgAssets = {
        stars: [],
        mountains: [{ points: [], speed: 0.15 }, { points: [], speed: 0.25 }],
        trees: [{ points: [], speed: 0.5 }, { points: [], speed: 0.8 }],
        worldWidth: 3200
    };
    const questions = [
        { q: "What should you do with vegetable peels?", o: ["Dry Waste", "Wet Waste", "Recycle", "Trash"], a: 1 },
        { q: "Turning off the tap while brushing saves...", o: ["Electricity", "Time", "Water", "Gas"], a: 2 },
        { q: "Which is NOT one of the 5 R's?", o: ["Reduce", "Rebuy", "Reuse", "Refuse"], a: 1 },
        { q: "Which of these is a major cause of air pollution?", o: ["Planting trees", "Burning fossil fuels", "Using solar panels", "Riding bicycles"], a: 1 },
        { q: "What does 'composting' do?", o: ["Turns organic waste into soil", "Purifies water", "Generates electricity", "Creates plastic"], a: 0 },
        { q: "Which of the following is a renewable energy source?", o: ["Coal", "Natural Gas", "Wind", "Oil"], a: 2 },
        { q: "The three R's stand for Reduce, Reuse, and...?", o: ["Recreate", "Recycle", "Repair", "Reimagine"], a: 1 },
        { q: "What is deforestation?", o: ["Planting new forests", "The clearing of trees", "Building dams", "Growing crops"], a: 1 },
        { q: "Plastic bags are harmful because they are...", o: ["Biodegradable", "Non-biodegradable", "Edible", "Cheap"], a: 1 },
        { q: "Carrying your own cloth bag to the store is an example of...?", o: ["Reducing", "Reusing", "Recycling", "Refusing"], a: 1 },
        { q: "Which human activity contributes to the greenhouse effect?", o: ["Riding a bicycle", "Driving a car", "Walking", "Gardening"], a: 1 },
        { q: "What should you do with used paper?", o: ["Throw it in the regular bin", "Burn it", "Recycle it", "Shred it for bedding"], a: 2 },
        { q: "Leaving lights on in an empty room wastes...", o: ["Water", "Time", "Electricity", "Space"], a: 2 },
        { q: "What is the primary material used to make glass bottles?", o: ["Plastic", "Sand", "Wood", "Metal"], a: 1 },
        { q: "Which of these helps protect wildlife?", o: ["Littering in forests", "Creating national parks", "Polluting rivers", "Hunting"], a: 1 },
        { q: "An electronic item that is no longer wanted is called...", o: ["E-waste", "Green waste", "Bio-waste", "Industrial waste"], a: 0 },
        { q: "What is the main purpose of an ozone layer?", o: ["To produce rain", "To block harmful UV rays", "To keep the Earth warm", "To create clouds"], a: 1 },
        { q: "What is rainwater harvesting?", o: ["Wasting rainwater", "Collecting and storing rainwater", "Purifying ocean water", "Creating artificial rain"], a: 1 },
        { q: "Which of these is considered 'green waste'?", o: ["Plastic bottle", "Grass clippings", "Aluminum can", "Glass jar"], a: 1 },
        { q: "The term 'carbon footprint' refers to the amount of...", o: ["Water you use", "Carbon dioxide you produce", "Waste you recycle", "Energy you consume"], a: 1 },
        { q: "Which is a common source of water pollution?", o: ["Solar panels", "Wind turbines", "Industrial waste", "Rainfall"], a: 2 },
        { q: "Using both sides of a paper is an example of...", o: ["Reducing", "Reusing", "Recycling", "Refusing"], a: 1 },
    ];

    // --- Player Object ---
    const player = {
        x: 50, y: canvas.height - 60, width: 24, height: 40,
        velocityY: 0, isJumping: false, isInvincible: false, invincibilityTimer: 0,
        startInvincibility() {
            this.isInvincible = true;
            this.invincibilityTimer = 60;
        },
        draw() {
            if (this.isInvincible && frameCount % 10 < 5) { return; }
            const bob = Math.sin(frameCount * 0.2) * 2;
            ctx.fillStyle = palette.player_body;
            ctx.fillRect(this.x, this.y + bob, this.width, this.height);
            ctx.fillRect(this.x + 4, this.y - 12 + bob, this.width - 8, 12);
            const capeWave = Math.sin(frameCount * 0.3) * 3;
            ctx.fillStyle = palette.player_cape;
            ctx.fillRect(this.x - 5, this.y + 5 + bob, 5, this.height - 10 + capeWave);
        },
        jump() {
            if (!this.isJumping) {
                this.isJumping = true;
                this.velocityY = JUMP_FORCE;
            }
        },
        update() {
            if (this.isInvincible) {
                this.invincibilityTimer--;
                if (this.invincibilityTimer <= 0) { this.isInvincible = false; }
            }
            this.y += this.velocityY;
            if (this.isJumping) { this.velocityY += GRAVITY; }
            if (this.y > canvas.height - 60) {
                this.y = canvas.height - 60;
                this.isJumping = false;
                this.velocityY = 0;
            }
            this.draw();
        },
        reset() {
            this.y = canvas.height - 60;
            this.velocityY = 0;
            this.isJumping = false;
            this.isInvincible = false;
            this.invincibilityTimer = 0;
        }
    };

    // --- Spawning Logic ---
    function spawnObstacle() {
        if (lastObstacle && (canvas.width - (lastObstacle.x + lastObstacle.width)) < MIN_OBSTACLE_GAP) { return; }
        const obstacleTypes = ['stone', 'pillar', 'drone'];
        const type = obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)];
        let newObstacle;
        if (type === 'drone') {
            newObstacle = {
                x: canvas.width, baseY: canvas.height - 120, width: 30, height: 20,
                amplitude: Math.random() * 40 + 30, speedY: Math.random() * 0.04 + 0.03,
                update() {
                    this.x -= gameSpeed;
                    this.y = this.baseY + Math.sin(frameCount * this.speedY) * this.amplitude;
                    this.draw();
                },
                draw() {
                    const glow = Math.abs(Math.sin(frameCount * this.speedY)) * 10;
                    ctx.fillStyle = palette.drone_glow; ctx.fillRect(this.x - glow / 2, this.y, this.width + glow, this.height);
                    ctx.fillStyle = palette.drone; ctx.fillRect(this.x, this.y, this.width, this.height);
                }
            };
        } else {
            const isPillar = type === 'pillar';
            const height = isPillar ? Math.random() * 80 + 50 : Math.random() * 40 + 20;
            const width = isPillar ? 30 : 50;
            newObstacle = {
                x: canvas.width, y: canvas.height - 10 - height, width: width, height: height,
                update() { this.x -= gameSpeed; this.draw(); },
                draw() {
                    ctx.fillStyle = palette.obstacle_stone; ctx.fillRect(this.x, this.y, this.width, this.height);
                    ctx.fillStyle = palette.obstacle_moss; ctx.fillRect(this.x, this.y, this.width, 10);
                }
            };
        }
        obstacles.push(newObstacle);
        lastObstacle = newObstacle;
    }
    function spawnCollectible() {
        const spawnX = canvas.width + Math.random() * 50;
        if (lastObstacle && spawnX < lastObstacle.x + lastObstacle.width + 80) { return; }
        const isQuizTrigger = Math.random() < 0.15;
        let collectible;
        if (isQuizTrigger) {
            collectible = {
                type: 'quiz_trigger', width: 20, height: 28, y: canvas.height - 120,
                draw() {
                    const pulse = Math.sin(frameCount * 0.1) * 3;
                    ctx.fillStyle = palette.diamond_shadow; ctx.fillRect(this.x, this.y + 4, this.width, this.height - 4);
                    ctx.fillStyle = palette.collectible_diamond; ctx.fillRect(this.x + 2, this.y - pulse, this.width - 4, this.height - 4);
                }
            };
        } else {
            collectible = {
                type: 'collectible', points: 10, width: 12, height: 12,
                y: Math.random() < 0.5 ? canvas.height - 25 : canvas.height - 85,
                draw() {
                    ctx.fillStyle = palette.collectible_seed; ctx.fillRect(this.x, this.y + 4, this.width, this.height - 8);
                    ctx.fillRect(this.x + 4, this.y, this.width - 8, this.height);
                }
            };
        }
        collectible.x = spawnX;
        collectible.update = function() { this.x -= gameSpeed; this.draw(); };
        collectibles.push(collectible);
    }

    // --- Background Logic ---
    function generateBackgroundAssets() {
        bgAssets.stars = [];
        bgAssets.mountains.forEach(m => m.points = []);
        bgAssets.trees.forEach(t => t.points = []);
        for (let i = 0; i < 100; i++) {
            bgAssets.stars.push({
                x: Math.random() * bgAssets.worldWidth, y: Math.random() * canvas.height * 0.7,
                r: Math.random() * 1.5
            });
        }
        [bgAssets.mountains[0], bgAssets.mountains[1]].forEach((mountainLayer, index) => {
            let currentX = 0;
            while (currentX < bgAssets.worldWidth) {
                const baseWidth = 200 + Math.random() * 150;
                const height = (index === 0) ? 80 + Math.random() * 50 : 120 + Math.random() * 80;
                mountainLayer.points.push({ x: currentX, y: canvas.height - 10 });
                mountainLayer.points.push({ x: currentX + baseWidth / 2, y: canvas.height - 10 - height });
                mountainLayer.points.push({ x: currentX + baseWidth, y: canvas.height - 10 });
                currentX += baseWidth;
            }
        });
        [bgAssets.trees[0], bgAssets.trees[1]].forEach((treeLayer, index) => {
            for (let i = 0; i < 80; i++) {
                const x = Math.random() * bgAssets.worldWidth;
                const h = (index === 0) ? 30 + Math.random() * 20 : 50 + Math.random() * 30;
                treeLayer.points.push({ x: x, h: h, w: 15 + Math.random() * 10 });
            }
        });
    }
    function drawBackground() {
        const skyGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        skyGradient.addColorStop(0, palette.sky_top);
        skyGradient.addColorStop(1, palette.sky_bottom);
        ctx.fillStyle = skyGradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = palette.star;
        bgAssets.stars.forEach(star => {
            ctx.globalAlpha = 0.5 + Math.sin(frameCount * 0.01 + star.x) * 0.5;
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.globalAlpha = 1.0;
        [bgAssets.mountains[0], bgAssets.mountains[1]].forEach((mountainLayer, index) => {
            ctx.fillStyle = index === 0 ? palette.mountain_far : palette.mountain_near;
            const speed = mountainLayer.speed;
            const offsetX = (distance * speed) % bgAssets.worldWidth;
            for (let i = 0; i < 2; i++) {
                ctx.beginPath();
                const startX = -offsetX + i * bgAssets.worldWidth;
                ctx.moveTo(startX + mountainLayer.points[0].x, mountainLayer.points[0].y);
                mountainLayer.points.forEach(p => { ctx.lineTo(startX + p.x, p.y); });
                ctx.closePath();
                ctx.fill();
            }
        });
        [bgAssets.trees[0], bgAssets.trees[1]].forEach((treeLayer, index) => {
            ctx.fillStyle = index === 0 ? palette.tree_far : palette.tree_near;
            const speed = treeLayer.speed;
            treeLayer.points.forEach(tree => {
                const xPos = ((tree.x - distance * speed) % bgAssets.worldWidth + bgAssets.worldWidth) % bgAssets.worldWidth;
                ctx.beginPath();
                ctx.moveTo(xPos, canvas.height - 10);
                ctx.lineTo(xPos + tree.w / 2, canvas.height - 10 - tree.h);
                ctx.lineTo(xPos + tree.w, canvas.height - 10);
                ctx.closePath();
                ctx.fill();
            });
        });
        const fogGradient = ctx.createLinearGradient(0, canvas.height - 150, 0, canvas.height);
        fogGradient.addColorStop(0, 'rgba(61, 69, 102, 0)');
        fogGradient.addColorStop(1, palette.fog);
        ctx.fillStyle = fogGradient;
        ctx.fillRect(0, canvas.height - 150, canvas.width, 150);
    }

    // --- Quiz Logic ---
    function askQuestion() {
        if (currentQuestion) return;
        cancelAnimationFrame(animationFrameId);
        currentQuestion = questions[Math.floor(Math.random() * questions.length)];
        const overlay = document.createElement('div');
        overlay.id = 'question-overlay';
        overlay.innerHTML = `<div class="question-box"><p>${currentQuestion.q}</p><div class="options">${currentQuestion.o.map((opt, i) => `<button data-index="${i}">${opt}</button>`).join('')}</div></div>`;
        document.getElementById('eco-runner-container').appendChild(overlay);
        overlay.querySelectorAll('button').forEach(btn => {
            btn.onclick = (e) => handleAnswer(parseInt(e.target.dataset.index));
        });
    }
    function handleAnswer(selectedIndex) {
        if (selectedIndex === currentQuestion.a) { score += 100; showFeedback(true, "+100!");
        } else { score -= 25; if (score < 0) score = 0; showFeedback(false, "-25"); }
        document.getElementById('question-overlay').remove();
        currentQuestion = null;
        setTimeout(() => {
            player.startInvincibility();
            gameLoop();
        }, 500);
    }
    function showFeedback(isCorrect, text) {
        const feedback = document.createElement('div');
        feedback.className = 'feedback-text'; feedback.textContent = text;
        feedback.style.color = isCorrect ? '#22c55e' : '#ef4444';
        document.getElementById('eco-runner-container').appendChild(feedback);
        setTimeout(() => feedback.remove(), 1000);
    }

    // --- Main Game Loop ---
    function gameLoop() {
        if (isGameOver) return;
        let quizTriggeredThisFrame = false;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        gameSpeed = 3 + Math.floor(distance / 500) * 0.2;
        drawBackground();
        ctx.fillStyle = palette.ground;
        ctx.fillRect(0, canvas.height - 10, canvas.width, 10);
        player.update();
        if (frameCount >= nextObstacleFrame) {
            spawnObstacle();
            nextObstacleFrame = frameCount + 60 + Math.random() * 80;
        }
        if (frameCount >= nextCollectibleFrame) {
            spawnCollectible();
            nextCollectibleFrame = frameCount + 50 + Math.random() * 60;
        }
        obstacles = obstacles.filter(obstacle => {
            obstacle.update();
            if (!player.isInvincible && player.x < obstacle.x + obstacle.width && player.x + player.width > obstacle.x &&
                player.y < obstacle.y + obstacle.height && player.y + player.height > obstacle.y) {
                gameOver();
                return false;
            }
            return obstacle.x + obstacle.width > 0;
        });
        collectibles = collectibles.filter(collectible => {
            collectible.update();
            if (player.x < collectible.x + collectible.width && player.x + player.width > collectible.x &&
                player.y < collectible.y + collectible.height && player.y + player.height > collectible.y) {
                if (collectible.type === 'quiz_trigger') {
                    askQuestion();
                    quizTriggeredThisFrame = true;
                } else { score += collectible.points; }
                return false;
            }
            return collectible.x + collectible.width > 0;
        });
        distance += gameSpeed / 10;
        distanceDisplay.textContent = `DISTANCE: ${Math.floor(distance)}m`;
        scoreDisplay.textContent = `SCORE: ${score}`;
        frameCount++;
        if (quizTriggeredThisFrame) { return; }
        animationFrameId = requestAnimationFrame(gameLoop);
    }

    // --- Game State Management ---
    function startGame() {
        gameOverlay.style.display = 'none';
        score = 0; distance = 0; gameSpeed = 3; isGameOver = false; currentQuestion = null;
        obstacles = []; collectibles = []; frameCount = 0; animationFrameId = null; lastObstacle = null;
        player.reset();
        generateBackgroundAssets();
        nextObstacleFrame = 100;
        nextCollectibleFrame = 70;
        gameLoop();
    }
    function gameOver() {
        isGameOver = true;
        cancelAnimationFrame(animationFrameId);
        gameOverlay.style.display = 'flex';
        overlayTitle.textContent = 'Game Over';
        overlayText.textContent = `You ran ${Math.floor(distance)}m and scored ${score} points!`;
        overlayButton.textContent = 'Restart Game';
    }

    // --- Initial Setup & Event Listeners ---
    overlayButton.onclick = startGame;
    keys = {};
    window.addEventListener('keydown', e => {
        keys[e.code] = true;
        if ((e.code === 'Space' || e.code === 'ArrowUp') && !isGameOver) {
            player.jump();
        }
    });
    window.addEventListener('keyup', e => {
        keys[e.code] = false;
        if ((e.code === 'Space' || e.code === 'ArrowUp')) {
            if (player.velocityY < 0) {
                player.velocityY *= 0.5;
            }
        }
    });

    // Final draw for initial state
    generateBackgroundAssets();
    drawBackground();
    ctx.fillStyle = palette.ground;
    ctx.fillRect(0, canvas.height - 10, canvas.width, 10);
    player.draw();
}
function launchPipePatrolGame() {
    const canvas = document.createElement('canvas');
    canvas.id = 'pipe-patrol-canvas';
    gameContentArea.innerHTML = ''; // Clear previous game content
    gameContentArea.appendChild(canvas);

    const ctx = canvas.getContext('2d');

    const GRID_SIZE = 20; // Size of each cell in pixels
    const MAZE_WIDTH = 25; // Cells wide
    const MAZE_HEIGHT = 15; // Cells high

    canvas.width = MAZE_WIDTH * GRID_SIZE;
    canvas.height = MAZE_HEIGHT * GRID_SIZE;

    const gameFont = "16px 'Inter', sans-serif";

    // Game Objects
    let Drip = { x: 1, y: 1, dx: 0, dy: 0, speed: 2 };
    let drips = [];
    let monsters = [];
    let wrench = null;
    let wrenchActive = false;
    let wrenchTimer = 0;
    let score = 0;
    let isGameOver = false;
    let animationFrameId;
    let inputBuffer = [];
    let totalDroplets = 0;
    

    const COLORS = {
        WALL: '#4A90E2', PATH: '#E8F5FF', DRIP: '#87CEFA', MONSTER_RUNNING_TAP: '#FF4136',
        MONSTER_BROKEN_PIPE: '#FF851B', MONSTER_SPRINKLER: '#2ECC40', WRENCH: '#FFD700',
        PLAYER: '#00BFFF', TEXT: '#333333'
    };
    const DARK_COLORS = {
        WALL: '#2D5B91', PATH: '#0F172A', DRIP: '#87CEFA', MONSTER_RUNNING_TAP: '#E2584B',
        MONSTER_BROKEN_PIPE: '#E76F00', MONSTER_SPRINKLER: '#1B9C2C', WRENCH: '#FFD700',
        PLAYER: '#00BFFF', TEXT: '#E0E0E0'
    };

    let currentPalette = COLORS;

    function applyDarkModeStyles() {
        currentPalette = document.body.classList.contains('dark') ? DARK_COLORS : COLORS;
    }

    let maze = [
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,1,1,1,0,1,1,1,0,1,0,1,0,1,1,1,0,1,1,1,0,1,0,1],
        [1,0,1,0,0,0,0,0,1,0,1,0,0,0,0,0,1,0,1,0,0,0,1,0,1],
        [1,0,1,0,1,1,1,0,1,0,1,1,1,1,1,0,1,0,1,0,1,1,1,0,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,1,1,1,0,1,1,1,0,1,0,1,0,1,1,1,0,1,0,1,1,1,0,1],
        [1,0,0,0,0,0,1,0,0,0,1,0,1,0,1,0,0,0,1,0,0,0,0,0,1],
        [1,0,1,1,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,1,1,0,1],
        [1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,1],
        [1,1,1,1,1,0,1,0,1,1,1,0,1,1,1,0,1,0,1,1,1,0,1,1,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,1,1,1,0,1,1,1,0,1,0,1,0,1,1,1,0,1,1,1,0,1,0,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
    ];

    activeGame.cleanup = () => {
        cancelAnimationFrame(animationFrameId);
        document.removeEventListener('keydown', handleInput);
    };

    function initGame() {
        applyDarkModeStyles();
        Drip = { x: 1, y: 1, dx: 0, dy: 0, speed: 2.0 };
        drips = []; monsters = []; wrench = null;
        wrenchActive = false; wrenchTimer = 0; score = 0;
        isGameOver = false; inputBuffer = [];

        for (let r = 0; r < MAZE_HEIGHT; r++) {
            for (let c = 0; c < MAZE_WIDTH; c++) {
                if (maze[r][c] === 0) {
                    drips.push({ x: c, y: r, collected: false });
                }
            }
        }
        totalDroplets = drips.length;
        
        monsters.push(createMonster('Running Tap', MAZE_WIDTH - 2, 1, COLORS.MONSTER_RUNNING_TAP));
        monsters.push(createMonster('Broken Pipe', 1, MAZE_HEIGHT - 2, COLORS.MONSTER_BROKEN_PIPE));
        monsters.push(createMonster('Sprinkler', MAZE_WIDTH - 2, MAZE_HEIGHT - 2, COLORS.MONSTER_SPRINKLER));

        spawnWrench();
        document.addEventListener('keydown', handleInput);
        gameLoop();
    }

    function createMonster(name, startX, startY, color) {
        return { name, x: startX, y: startY, dx: 0, dy: 0, speed: 1, color, isChasing: true };
    }

    function spawnWrench() {
        let r, c;
        // **FIX:** The old logic caused an infinite loop. This new logic just finds any empty path tile that isn't the player's starting spot.
        do {
            r = Math.floor(Math.random() * MAZE_HEIGHT);
            c = Math.floor(Math.random() * MAZE_WIDTH);
        } while (maze[r][c] === 1 || (c === 1 && r === 1));
        wrench = { x: c, y: r, active: true };
    }

    function handleInput(e) {
        const keyMap = { ArrowUp: { dx: 0, dy: -1 }, ArrowDown: { dx: 0, dy: 1 }, ArrowLeft: { dx: -1, dy: 0 }, ArrowRight: { dx: 1, dy: 0 }};
        if (keyMap[e.key]) {
            inputBuffer.push(keyMap[e.key]);
        }
    }

    function updateDrip() {
    // --- NEW "TRUE CORNERING" AND MOVEMENT LOGIC ---

    const currentGridX = Math.round(Drip.x);
    const currentGridY = Math.round(Drip.y);
    const isAtIntersection = Math.abs(Drip.x - currentGridX) < 0.1 && Math.abs(Drip.y - currentGridY) < 0.1;

    // 1. Check for a buffered turn if we are at an intersection.
    if (isAtIntersection && inputBuffer.length > 0) {
        const nextMove = inputBuffer[0];
        const nextTileX = currentGridX + nextMove.dx;
        const nextTileY = currentGridY + nextMove.dy;

        if (maze[nextTileY][nextTileX] === 0) {
            // Valid turn found! Snap to grid and apply the new direction.
            Drip.x = currentGridX;
            Drip.y = currentGridY;
            Drip.dx = nextMove.dx;
            Drip.dy = nextMove.dy;
            inputBuffer.shift(); // Consume the valid input from the buffer.
        }
    }
    
    // 2. Clear the buffer if the buffered move is invalid (e.g., trying to turn into a wall).
    // This stops the player from being stuck waiting for an impossible turn.
    if (inputBuffer.length > 0) {
        const nextMove = inputBuffer[0];
        const nextTileX = currentGridX + nextMove.dx;
        const nextTileY = currentGridY + nextMove.dy;
        if (maze[nextTileY][nextTileX] !== 0) {
            inputBuffer.shift();
        }
    }

    // 3. Calculate the next position based on the current direction.
    const nextX = Drip.x + Drip.dx * Drip.speed / GRID_SIZE;
    const nextY = Drip.y + Drip.dy * Drip.speed / GRID_SIZE;

    // 4. Check for wall collisions.
    const wallCheckX = (Drip.dx > 0) ? Math.ceil(nextX) : Math.floor(nextX);
    const wallCheckY = (Drip.dy > 0) ? Math.ceil(nextY) : Math.floor(nextY);

    if (maze[wallCheckY][wallCheckX] === 1) {
        // If moving into a wall, stop precisely at the grid line.
        Drip.x = currentGridX;
        Drip.y = currentGridY;
        Drip.dx = 0;
        Drip.dy = 0;
    } else {
        // Otherwise, continue the smooth movement.
        Drip.x = nextX;
        Drip.y = nextY;
    }

    // 5. Collect drips (no changes needed here).
    drips.forEach(drip => {
        if (!drip.collected && drip.x === Math.round(Drip.x) && drip.y === Math.round(Drip.y)) {
            drip.collected = true;
            score += 10;
        }
    });

    // 6. Collect wrench (no changes needed here).
    if (wrench && wrench.active && Math.round(Drip.x) === wrench.x && Math.round(Drip.y) === wrench.y) {
        wrenchActive = true;
        wrenchTimer = 300; // 5 seconds
        wrench.active = false;
    }
}

    function updateMonsters() {
        monsters.forEach(monster => {
            if (!monster.isChasing) return;

            const monsterGridX = Math.round(monster.x);
            const monsterGridY = Math.round(monster.y);

            if (Math.abs(monster.x - monsterGridX) < 0.1 && Math.abs(monster.y - monsterGridY) < 0.1) {
                const possibleMoves = [];
                if (maze[monsterGridY][monsterGridX + 1] === 0) possibleMoves.push({dx: 1, dy: 0});
                if (maze[monsterGridY][monsterGridX - 1] === 0) possibleMoves.push({dx: -1, dy: 0});
                if (maze[monsterGridY + 1][monsterGridX] === 0) possibleMoves.push({dx: 0, dy: 1});
                if (maze[monsterGridY - 1][monsterGridX] === 0) possibleMoves.push({dx: 0, dy: -1});

                const filteredMoves = possibleMoves.filter(m => !(m.dx === -monster.dx && m.dy === -monster.dy))
                const movesToConsider = filteredMoves.length > 0 ? filteredMoves : possibleMoves;

                let bestMove = movesToConsider[0];
                let bestDist = -1;

                movesToConsider.forEach(move => {
                    const dist = Math.hypot((monsterGridX + move.dx) - Drip.x, (monsterGridY + move.dy) - Drip.y);
                    if ((wrenchActive && dist > bestDist) || (!wrenchActive && (dist < bestDist || bestDist === -1))) {
                        bestDist = dist;
                        bestMove = move;
                    }
                });

                if (bestMove) {
                    monster.dx = bestMove.dx;
                    monster.dy = bestMove.dy;
                }
            }

            monster.x += monster.dx * monster.speed / GRID_SIZE;
            monster.y += monster.dy * monster.speed / GRID_SIZE;

            if (Math.hypot(Drip.x - monster.x, Drip.y - monster.y) < 0.8) {
                if (wrenchActive) {
                    monster.isChasing = false;
                    score += 50;
                    // **FIX:** This logic prevents the game from crashing when a monster respawns.
                    const respawnPoints = [
                        {x: MAZE_WIDTH - 2, y: 1}, {x: 1, y: MAZE_HEIGHT - 2}, {x: MAZE_WIDTH - 2, y: MAZE_HEIGHT - 2}
                    ];
                    const point = respawnPoints[Math.floor(Math.random() * respawnPoints.length)];
                    setTimeout(() => {
                        Object.assign(monster, createMonster(monster.name, point.x, point.y, monster.color));
                    }, 5000);
                } else {
                    gameOver(false);
                }
            }
        });
    }

    function updateWrenchTimer() {
        if (wrenchActive) {
            wrenchTimer--;
            if (wrenchTimer <= 0) {
                wrenchActive = false;
                setTimeout(spawnWrench, 5000);
            }
        }
    }

    function checkWinCondition() {
        if (drips.every(d => d.collected)) {
            gameOver(true);
        }
    }
    
    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        // Draw Maze
        for (let r = 0; r < MAZE_HEIGHT; r++) {
            for (let c = 0; c < MAZE_WIDTH; c++) {
                ctx.fillStyle = maze[r][c] === 1 ? currentPalette.WALL : currentPalette.PATH;
                ctx.fillRect(c * GRID_SIZE, r * GRID_SIZE, GRID_SIZE, GRID_SIZE);
            }
        }
        // Draw Drips, Monsters, Wrench, Player
        drips.forEach(d => { if (!d.collected) { ctx.fillStyle = currentPalette.DRIP; ctx.beginPath(); ctx.arc(d.x * GRID_SIZE + GRID_SIZE/2, d.y * GRID_SIZE + GRID_SIZE/2, GRID_SIZE/4, 0, Math.PI * 2); ctx.fill(); }});
        monsters.forEach(m => { if(m.isChasing) { ctx.fillStyle = m.color; ctx.beginPath(); ctx.arc(m.x * GRID_SIZE + GRID_SIZE/2, m.y * GRID_SIZE + GRID_SIZE/2, GRID_SIZE/2-2, 0, Math.PI * 2); ctx.fill(); }});
        if (wrench && wrench.active) { ctx.fillStyle = currentPalette.WRENCH; ctx.fillRect(wrench.x * GRID_SIZE + GRID_SIZE/4, wrench.y * GRID_SIZE + GRID_SIZE/4, GRID_SIZE/2, GRID_SIZE/2); }
        ctx.fillStyle = currentPalette.PLAYER; ctx.beginPath(); ctx.arc(Drip.x * GRID_SIZE + GRID_SIZE/2, Drip.y * GRID_SIZE + GRID_SIZE/2, GRID_SIZE/2-2, 0, Math.PI * 2); ctx.fill();

        // Draw UI
        ctx.font = gameFont; ctx.fillStyle = currentPalette.TEXT; ctx.textAlign = 'left';
        ctx.fillText(`Score: ${score}`, 5, canvas.height - 5);
        if (wrenchActive) { ctx.textAlign = 'right'; ctx.fillStyle = currentPalette.WRENCH; ctx.fillText(`Power: ${Math.ceil(wrenchTimer / 60)}s`, canvas.width - 5, canvas.height - 5); }
    }

    function gameLoop() {
        if (isGameOver) return;
        applyDarkModeStyles();
        updateDrip();
        updateMonsters();
        updateWrenchTimer();
        draw();
        checkWinCondition();
        animationFrameId = requestAnimationFrame(gameLoop);
    }

    function gameOver(win) {
    isGameOver = true;
    cancelAnimationFrame(animationFrameId);
    document.removeEventListener('keydown', handleInput);

    // --- NEW PROPORTIONAL SCORING LOGIC ---
    // 1. Calculate the percentage of droplets the player collected.
    const dropletsEaten = score / 10;
    const percentageCollected = totalDroplets > 0 ? (dropletsEaten / totalDroplets) : 0;

    // 2. Award points based on that percentage, capped at a max of 50.
    const finalPoints = Math.round(percentageCollected * 50);
    const rawScore = score > 0 ? score : 1; 

    gameContentArea.innerHTML = `
        <div class="text-center p-8 flex flex-col justify-center items-center h-full">
            <h3 class="text-3xl font-bold mb-4 ${win ? 'text-green-500' : 'text-red-500'}">${win ? 'YOU WIN! 🎉' : 'GAME OVER! 💧💥'}</h3>
            <p class="text-xl mb-2 text-gray-600 dark:text-gray-300">Droplets Collected: <span class="font-bold text-blue-500">${dropletsEaten} / ${totalDroplets}</span></p>
            <p class="text-2xl font-bold text-yellow-500 mt-4">Points Gained: ⭐ ${finalPoints}</p>
            <button id="restart-pipe-patrol" class="btn btn-primary mt-6">Try Again!</button>
        </div>
    `;

    document.getElementById('restart-pipe-patrol').addEventListener('click', () => {
        const newCanvas = document.createElement('canvas');
        newCanvas.id = 'pipe-patrol-canvas';
        gameContentArea.innerHTML = '';
        gameContentArea.appendChild(newCanvas);
        launchPipePatrolGame();
    });
    
    addPointsForGame(finalPoints, 'water-conservation', rawScore);
}
    initGame();
}
    // --- Start the app ---
    initializeAuth();

    // --- BOT FUNCTIONS & LOGIC ---

    // This function adds a new message to the chat window
    function appendMessage(sender, message) {
        const messageDiv = document.createElement('div');
        messageDiv.className = sender === 'user' ? 'user-message' : 'bot-message';
        messageDiv.textContent = message;
        chatWindow.appendChild(messageDiv);
        chatWindow.scrollTop = chatWindow.scrollHeight; // Auto-scroll to the latest message
    }

    // This object contains all the bot's possible replies
    const botResponses = {
        greetings: [
            "Hello! I'm here to help. What's on your mind?",
            "Hi there! How can I assist your EcoQuest today?",
            "Greetings, Earthling! Ask me anything about EcoQuest or being green!"
        ],
        farewells: [
            "Goodbye! Keep up the great work for the planet!",
            "See you later, EcoWarrior! Don't forget your tasks!",
            "Farewell! The planet thanks you for your efforts."
        ],
        generalQuestions: [
            {
                keywords: ["how are you", "you doing", "your day"],
                responses: ["I'm doing great, powered by clean energy and ready to assist you!", "As an AI, I don't have feelings, but I'm fully functional and happy to chat!"]
            },
            {
                keywords: ["what is ecoquest", "about ecoquest"],
                responses: ["EcoQuest is a gamified platform designed to inspire you to take real-world environmental actions, earn points, and make a positive impact!", "We're all about making eco-friendly habits fun and rewarding!"]
            },
            {
                keywords: ["points", "earn points", "get points"],
                responses: ["You earn points by completing real-world tasks, winning mini-games, acing quizzes, and even maintaining your daily login streak! Check out the 'Tasks' and 'Quizzes' sections!", "Every green action counts! From recycling to mindful living, points await you."]
            },
            {
                keywords: ["tasks", "challenges"],
                responses: ["Our 'Real-world Tasks' section is full of challenges you can complete to earn points and help the environment. Give them a try!", "Explore the 'Tasks' section for exciting environmental challenges!"]
            },
            {
                keywords: ["leaderboard", "rank"],
                responses: ["The 'Leaderboard' shows how you stack up against other EcoWarriors! Keep earning points to climb higher!", "Want to see your rank? Head over to the 'Leaderboard' section!"]
            },
            {
                keywords: ["achievements", "badges"],
                responses: ["Unlock special 'Achievements' for reaching milestones in your EcoQuest journey! They're like digital trophies for your dedication.", "Check out the 'Achievements' section to see what badges you can earn!"]
            },
            {
                keywords: ["quiz", "quizzes", "video library"],
                responses: ["The 'Video Library' has educational videos and AI-generated quizzes to test your eco-knowledge. It's a great way to learn and earn!", "Learn and earn with our video quizzes in the 'Video Library' section!"]
            },
            {
                keywords: ["puzzles", "memory game"],
                responses: ["Sharpen your mind with our 'Puzzles' section! Match pairs in the memory game to earn extra points.", "The 'Puzzles' section features fun memory games to challenge yourself!"]
            },
            {
                keywords: ["eco runner", "game"],
                responses: ["Try the 'Eco Runner Game'! Jump over obstacles, answer questions, and run as far as you can for bonus points!", "The 'Eco Runner' is a fun way to test your reflexes and eco-knowledge."]
            },
            {
                keywords: ["mindful living", "meditation", "journal"],
                responses: ["The 'Mindful Living' section offers guided meditations, daily journal prompts, and nature challenges to help you connect with the environment and yourself.", "Find calm and connection in the 'Mindful Living' section."]
            },
            {
                keywords: ["weekly challenge", "weekly tasks"],
                responses: ["Every week, there's a new 'Weekly Challenge' for extra points! It's a bigger impact task, often involving photo verification.", "Don't miss the 'Weekly Challenge' for a chance to earn big points!"]
            },
            {
                keywords: ["recycle", "waste segregation"],
                responses: ["Recycling is key to waste management! Separate your waste into wet, dry, e-waste, and hazardous. You can practice in the 'Recycle Rush' mini-game!", "Proper waste segregation (wet, dry, e-waste, hazardous) reduces landfill waste and pollution."]
            },
            {
                keywords: ["save water", "conserve water"],
                responses: ["Simple ways to save water include shorter showers, turning off the tap while brushing, and fixing leaks. Play 'Pipe Patrol' to learn more!", "Every drop counts! Conserve water by being mindful of your usage in the bathroom and kitchen."]
            },
            {
                keywords: ["plant a tree", "sapling"],
                responses: ["Planting a sapling is a fantastic way to give back to nature! Ensure proper sunlight and space. It's often a 'Weekly Challenge'!", "Trees are vital! Plant a sapling to earn points and help the planet breathe."]
            },
            {
                keywords: ["energy", "save energy"],
                responses: ["Unplug unused devices (phantom load!), switch to LED bulbs, and adjust your thermostat to save energy. Check out the 'Lights Out!' game!", "Conserving energy helps fight climate change. Small changes like unplugging chargers make a difference."]
            }
        ],
        default: [
            "I'm not sure how to answer that. Could you try rephrasing your question?",
            "Hmm, I don't have information on that specific topic. Is there anything else I can help with?",
            "My knowledge is focused on EcoQuest and environmental tips. Please ask something related to that!"
        ]
    };

    // This function decides which response the bot should give
    function getBotResponse(message) {
        const lowerMessage = message.toLowerCase();

        if (lowerMessage.includes("hello") || lowerMessage.includes("hi") || lowerMessage.includes("hey")) {
            return botResponses.greetings[Math.floor(Math.random() * botResponses.greetings.length)];
        }
        if (lowerMessage.includes("bye") || lowerMessage.includes("goodbye") || lowerMessage.includes("see you")) {
            return botResponses.farewells[Math.floor(Math.random() * botResponses.farewells.length)];
        }

        for (const category of botResponses.generalQuestions) {
            if (category.keywords.some(keyword => lowerMessage.includes(keyword))) {
                return category.responses[Math.floor(Math.random() * category.responses.length)];
            }
        }

        return botResponses.default[Math.floor(Math.random() * botResponses.default.length)];
    }

    // This function handles sending a message
    function handleChatSend() {
        const userMessage = chatInput.value.trim();
        if (userMessage) {
            appendMessage('user', userMessage);
            chatInput.value = '';

            setTimeout(() => {
                const botReply = getBotResponse(userMessage);
                appendMessage('bot', botReply);
            }, 800);
        }
    }

    // Event listeners to make the bot icon and modal work
    if (botIconButton) {
        botIconButton.addEventListener('click', () => {
            botChatModal.classList.toggle('visible'); // Toggle the 'visible' class
            if (botChatModal.classList.contains('visible') && chatWindow.children.length === 0) {
                 // Add a welcome message only if the chat is empty
                appendMessage('bot', "Hello there! I'm your Eco-Assistant. How can I help you today?");
            }
             // Ensure chat window scrolls to bottom when opened
            chatWindow.scrollTop = chatWindow.scrollHeight;
        });

        botCloseButton.addEventListener('click', () => {
            botChatModal.classList.remove('visible'); // Hide the modal
        });

        chatSendButton.addEventListener('click', handleChatSend);
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                handleChatSend();
            }
        });
    }
    // END OF BOT FUNCTIONS & LOGIC

});

