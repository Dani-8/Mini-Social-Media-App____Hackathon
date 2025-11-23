const POSTS_KEY = 'microInstaPostsV4';
const USERS_KEY = 'microInstaUsersV4';
const CURRENT_USER_KEY = 'microInstaCurrentUserV4';

let posts = [];
let users = {};
let currentUser = null;
let currentTab = 'feed'; // 'feed' or 'profile'

const REACTIONS = ['👍', '❤️', '🔥', '😂'];

// DOM element references
const body = document.body;
const appView = document.getElementById('appView');
const authView = document.getElementById('authView');
const feedContainer = document.getElementById('feedContainer');
const emptyMessage = document.getElementById('emptyMessage');
const newPostBtn = document.getElementById('newPostBtn');
const logoutBtn = document.getElementById('logoutBtn');
const postModal = document.getElementById('postModal');

const authHeader = document.getElementById('authHeader');
const authUsernameInput = document.getElementById('authUsername');
const authPasswordInput = document.getElementById('authPassword');
const authPfpFile = document.getElementById('authPfpFile'); // New PFP input
const pfpUploadContainer = document.getElementById('pfpUploadContainer'); // New container
const authMessage = document.getElementById('authMessage');
const loginBtn = document.getElementById('loginBtn');
const signupBtn = document.getElementById('signupBtn');
const showSignupBtn = document.getElementById('showSignupBtn');
const showLoginBtn = document.getElementById('showLoginBtn');

const userPfpContainer = document.getElementById('userPfpContainer'); // New header PFP container
const profileHeader = document.getElementById('profileHeader');
const profileUsername = document.getElementById('profileUsername');
const profilePfp = document.getElementById('profilePfp'); // Replaced profileInitials

const tabButtons = document.querySelectorAll('.tab-btn');
// Modal references
const modalTitle = document.getElementById('modalTitle');
const cancelPostBtn = document.getElementById('cancelPostBtn');
const submitPostBtn = document.getElementById('submitPostBtn');
const postTitleInput = document.getElementById('postTitle');
const postImageUrlInput = document.getElementById('postImageUrl');
const postImageFile = document.getElementById('postImageFile');
const imageSourceMessage = document.getElementById('imageSourceMessage');
const validationMessage = document.getElementById('validationMessage');
const postIdToEdit = document.getElementById('postIdToEdit');
const themeToggle = document.getElementById('themeToggle');
const sunIcon = document.getElementById('sunIcon');
const moonIcon = document.getElementById('moonIcon');


// --- Dark Mode Logic ---

function toggleTheme() {
    const isDark = body.classList.toggle('dark');
    body.classList.toggle('light', !isDark);
    sunIcon.classList.toggle('hidden', isDark);
    moonIcon.classList.toggle('hidden', !isDark);
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
}

function loadTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    body.classList.add(savedTheme);
    const isDark = savedTheme === 'dark';
    sunIcon.classList.toggle('hidden', isDark);
    moonIcon.classList.toggle('hidden', !isDark);
}


// --- Data Persistence ---

function loadData() {
    try {
        // Load Posts
        const storedPosts = localStorage.getItem(POSTS_KEY);
        posts = storedPosts ? JSON.parse(storedPosts) : [];
        posts.sort((a, b) => b.id - a.id); // Newest first
        
        // Load Users
        const storedUsers = localStorage.getItem(USERS_KEY);
        users = storedUsers ? JSON.parse(storedUsers) : {};

        // Load Current User
        const storedCurrentUser = localStorage.getItem(CURRENT_USER_KEY);
        currentUser = storedCurrentUser ? JSON.parse(storedCurrentUser) : null;
    } catch (e) {
        console.error("Error loading data:", e);
        posts = [];
        users = {};
        currentUser = null;
    }
}

function savePosts() {
    localStorage.setItem(POSTS_KEY, JSON.stringify(posts));
}

function saveUsers() {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function saveCurrentUser() {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(currentUser));
}

// --- Profile Picture Helpers ---

function renderPfpHtml(pfpUrl, username, sizeClass) {
    const initials = username.substring(0, 2).toUpperCase();
    const defaultStyle = `class="pfp-placeholder ${sizeClass} rounded-full"`;
    
    if (pfpUrl) {
        return `<img src="${pfpUrl}" alt="${username}'s PFP" ${defaultStyle}>`;
    } else {
        return `<div ${defaultStyle}>${initials}</div>`;
    }
}

// --- Authentication ---

function updateAuthState() {
    if (currentUser) {
        // Logged In State
        authView.classList.add('hidden');
        appView.classList.remove('hidden');
        logoutBtn.classList.remove('hidden');
        newPostBtn.classList.remove('hidden');
        userPfpContainer.classList.remove('hidden');
        
        // Render PFP in Header
        userPfpContainer.innerHTML = `
            ${renderPfpHtml(currentUser.pfpUrl, currentUser.username, 'w-8 h-8')}
            <span class="font-semibold text-sm text-primary">${currentUser.username}</span>
        `;

        // Clear auth inputs/messages
        authUsernameInput.value = '';
        authPasswordInput.value = '';
        authPfpFile.value = '';
        authMessage.classList.add('hidden');

        // Rerender based on current tab
        handleTabChange(currentTab); 

    } else {
        // Logged Out State
        authView.classList.remove('hidden');
        appView.classList.add('hidden');
        userPfpContainer.classList.add('hidden');
        logoutBtn.classList.add('hidden');
        newPostBtn.classList.add('hidden');
        
        // Default to Login view
        showAuthView('login');
    }
}

function showAuthView(mode) {
    authHeader.textContent = mode === 'login' ? 'Login to App' : 'Create New Account';
    loginBtn.classList.toggle('hidden', mode !== 'login');
    signupBtn.classList.toggle('hidden', mode !== 'signup');
    showSignupBtn.classList.toggle('hidden', mode !== 'login');
    showLoginBtn.classList.toggle('hidden', mode !== 'signup');
    pfpUploadContainer.classList.toggle('hidden', mode !== 'signup'); // Show PFP upload only for signup
    authMessage.classList.add('hidden');
}

function attemptLogin() {
    const username = authUsernameInput.value.trim();
    const password = authPasswordInput.value;

    if (!username || !password) {
        displayAuthMessage("Username and password are required.");
        return;
    }

    if (users[username] && users[username].password === password) {
        currentUser = { 
            userId: users[username].userId, 
            username: username,
            pfpUrl: users[username].pfpUrl || '' // Include PFP URL
        };
        saveCurrentUser();
        updateAuthState();
    } else {
        displayAuthMessage("Invalid username or password.");
    }
}

async function attemptSignup() {
    const username = authUsernameInput.value.trim();
    const password = authPasswordInput.value;

    if (!username || !password) {
        displayAuthMessage("Username and password are required.");
        return;
    }

    if (users[username]) {
        displayAuthMessage("Username already taken.");
        return;
    }

    if (username.length < 3) {
            displayAuthMessage("Username must be at least 3 characters.");
            return;
    }

    // Handle PFP upload
    let pfpUrl = '';
    const pfpFile = authPfpFile.files[0];
    if (pfpFile) {
        try {
            // Maximum 500kb size check for profile picture
            if (pfpFile.size > 500 * 1024) { 
                displayAuthMessage("Profile picture must be under 500KB.");
                return;
            }
            pfpUrl = await fileToBase64(pfpFile);
        } catch (error) {
            console.error("Error reading PFP file:", error);
            displayAuthMessage('Error processing profile picture file.');
            return;
        }
    }

    // Create new user 
    const newUserId = `user-${Date.now()}`;
    users[username] = { userId: newUserId, password: password, pfpUrl: pfpUrl };
    saveUsers();
    
    // Auto-login new user
    currentUser = { userId: newUserId, username: username, pfpUrl: pfpUrl };
    saveCurrentUser();
    updateAuthState();
}

function logout() {
    currentUser = null;
    saveCurrentUser();
    updateAuthState();
}

function displayAuthMessage(message) {
    authMessage.textContent = message;
    authMessage.classList.remove('hidden');
    authUsernameInput.focus();
}


// --- Post Creation/Editing/Interaction ---

function generatePlaceholderUrl(id, title) {
    const width = 500;
    const height = 300; // Adjusted for aspect-video
    const text = encodeURIComponent(title || 'MicroPic Post');
    const colorIndex = id % 5;
    const colors = [
        { bg: '0077b6', text: 'ffffff' }, { bg: 'ef476f', text: 'ffffff' }, 
        { bg: 'ffd166', text: '000000' }, { bg: '06d6a0', text: 'ffffff' }, 
        { bg: '118ab2', text: 'ffffff' }  
    ];
    const color = colors[colorIndex];
    return `https://placehold.co/${width}x${height}/${color.bg}/${color.text}?text=${text}`;
}

// Helper function to convert File to Base64 Data URL
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
        reader.readAsDataURL(file);
    });
}

async function savePost() {
    if (!currentUser) return;

    const title = postTitleInput.value.trim();
    let imageUrl = postImageUrlInput.value.trim();
    const imageFile = postImageFile.files[0];
    const editId = postIdToEdit.value;
    
    if (title.length === 0) {
        validationMessage.classList.remove('hidden');
        return;
    }
    validationMessage.classList.add('hidden');

    const placeholderId = editId ? parseInt(editId) : Date.now();

    // 1. Handle file upload (highest priority)
    if (imageFile) {
        try {
            imageUrl = await fileToBase64(imageFile);
        } catch (error) {
            console.error("Error reading file:", error);
            console.error('Error processing image file.'); 
            return;
        }
    } else if (editId && posts.find(p => p.id === parseInt(editId))?.imageUrl.startsWith('data:')) {
        // 2. If editing and the original image was a file (Base64) and no new file/URL is provided, keep the existing Base64.
        imageUrl = posts.find(p => p.id === parseInt(editId)).imageUrl;
    } else if (!imageUrl) {
        // 3. Handle placeholder if neither file nor URL is provided
        imageUrl = generatePlaceholderUrl(placeholderId, title);
    }

    if (editId) {
        // UPDATE existing post
        const postIndex = posts.findIndex(p => p.id === parseInt(editId));
        if (postIndex > -1) {
            posts[postIndex].title = title;
            posts[postIndex].imageUrl = imageUrl;
        }
    } else {
        // CREATE new post
        const newPostId = Date.now();
        const newPost = {
            id: newPostId,
            userId: currentUser.userId,       
            username: currentUser.username,  
            pfpUrl: currentUser.pfpUrl || '', // Store PFP URL with post
            title: title,
            imageUrl: imageUrl,
            reactions: REACTIONS.reduce((acc, r) => ({ ...acc, [r]: 0 }), {}),
            reactionsByUser: REACTIONS.reduce((acc, r) => ({ ...acc, [r]: [] }), {})
        };
        posts.unshift(newPost);
    }

    savePosts();
    closeModal();
    renderFeed();
}

function openCreateModal() {
    if (!currentUser) return;
    modalTitle.textContent = 'New Photo Post';
    submitPostBtn.textContent = 'Share Photo';
    postIdToEdit.value = '';
    postTitleInput.value = '';
    postImageUrlInput.value = '';
    postImageFile.value = ''; // Clear file input
    postImageUrlInput.disabled = false; // Enable URL input
    imageSourceMessage.classList.add('hidden'); // Hide message
    validationMessage.classList.add('hidden');
    postModal.classList.remove('hidden');
}

function openEditModal(id) {
    const post = posts.find(p => p.id === id);
    if (!post || post.userId !== currentUser?.userId) return; // Must be the owner

    modalTitle.textContent = 'Edit Post';
    submitPostBtn.textContent = 'Save Changes';
    postIdToEdit.value = post.id;
    postTitleInput.value = post.title;
    postImageFile.value = ''; // Clear file input on edit

    const isBase64 = post.imageUrl.startsWith('data:');
    const isPlaceholder = post.imageUrl.includes('placehold.co');
    
    if (isBase64) {
        postImageUrlInput.disabled = true;
        postImageUrlInput.placeholder = 'Image previously uploaded via file (select new file to replace)';
        postImageUrlInput.value = ''; 
        imageSourceMessage.classList.remove('hidden');
    } else {
        postImageUrlInput.disabled = false;
        postImageUrlInput.placeholder = 'Image URL (or leave blank for custom upload)';
        postImageUrlInput.value = isPlaceholder ? '' : post.imageUrl;
        imageSourceMessage.classList.add('hidden');
    }
    
    validationMessage.classList.add('hidden');
    postModal.classList.remove('hidden');
}

function closeModal() {
    postModal.classList.add('hidden');
    // Reset all inputs and state
    postTitleInput.value = '';
    postImageUrlInput.value = '';
    postImageFile.value = '';
    postIdToEdit.value = '';

    // Reset modal specific states
    postImageUrlInput.disabled = false;
    postImageUrlInput.placeholder = 'Image URL (or leave blank for custom upload)';
    imageSourceMessage.classList.add('hidden');
}

// UPDATED: Now enforces a single reaction per user per post
function toggleReaction(id, newReaction) {
    if (!currentUser) return;
    const postIndex = posts.findIndex(p => p.id === id);
    if (postIndex === -1) return;

    const post = posts[postIndex];
    const userId = currentUser.userId;

    // Find the current reaction (if any) this user has on this post
    let currentReaction = null;
    for (const r of REACTIONS) {
        if ((post.reactionsByUser[r] || []).includes(userId)) {
            currentReaction = r;
            break;
        }
    }
    
    // Scenario 1: User clicks the same reaction (UNLIKE/Remove)
    if (currentReaction === newReaction) {
        const userIndex = post.reactionsByUser[newReaction].indexOf(userId);
        post.reactionsByUser[newReaction].splice(userIndex, 1);
        post.reactions[newReaction] = (post.reactions[newReaction] || 1) - 1; 
    } 
    
    // Scenario 2: User clicks a DIFFERENT reaction or a new reaction
    else {
        // If there was an old reaction, remove it first
        if (currentReaction !== null) {
            const oldUserIndex = post.reactionsByUser[currentReaction].indexOf(userId);
            post.reactionsByUser[currentReaction].splice(oldUserIndex, 1);
            post.reactions[currentReaction] = (post.reactions[currentReaction] || 1) - 1; 
        }

        // Add the new reaction
        post.reactionsByUser[newReaction].push(userId);
        post.reactions[newReaction] = (post.reactions[newReaction] || 0) + 1; 
    }

    // Ensure counts are non-negative
    post.reactions[currentReaction] = Math.max(0, post.reactions[currentReaction] || 0);
    post.reactions[newReaction] = Math.max(0, post.reactions[newReaction] || 0);

    savePosts();
    handleTabChange(currentTab);
}

function deletePost(id) {
    const postElement = document.getElementById(`post-${id}`);
    const deleteBtn = postElement ? postElement.querySelector('.delete-btn') : null;

    if (!deleteBtn || posts.find(p => p.id === id).userId !== currentUser?.userId) return; 

    if (deleteBtn.textContent.includes('Confirm')) {
        // Execute deletion
        posts = posts.filter(p => p.id !== id);
        savePosts();
        renderFeed();
        return;
    }

    // First click: Ask for confirmation
    deleteBtn.textContent = 'Confirm?';
    deleteBtn.classList.replace('text-gray-400', 'text-red-600');
    
    setTimeout(() => {
        if (deleteBtn && deleteBtn.textContent.includes('Confirm')) {
            deleteBtn.textContent = 'Remove';
            deleteBtn.classList.replace('text-red-600', 'text-gray-400');
        }
    }, 3000); 
}

// --- Tabs and Rendering ---

function handleTabChange(tabName) {
    if (!currentUser) return;

    currentTab = tabName;

    // Update tab button styles
    tabButtons.forEach(btn => {
        const isActive = btn.dataset.tab === tabName;
        btn.classList.toggle('tab-active', isActive);
        btn.classList.toggle('border-pink-500', isActive);
        btn.classList.toggle('border-transparent', !isActive);
    });

    // Filter posts based on tab
    let postsToDisplay = [];
    if (tabName === 'feed') {
        postsToDisplay = posts; // All posts
        profileHeader.classList.add('hidden');
    } else if (tabName === 'profile') {
        postsToDisplay = posts.filter(p => p.userId === currentUser.userId);
        profileHeader.classList.remove('hidden');
        
        // Update profile header
        profileUsername.textContent = currentUser.username;
        profilePfp.innerHTML = renderPfpHtml(currentUser.pfpUrl, currentUser.username, 'w-24 h-24 text-3xl');
        profilePostCount.textContent = `${postsToDisplay.length} posts shared.`;
    }

    renderFeed(postsToDisplay);
}

function renderPostHeader(post) {
    const isOwner = post.userId === currentUser?.userId;
    
    const pfpHtml = renderPfpHtml(post.pfpUrl || users[post.username]?.pfpUrl || '', post.username, 'w-9 h-9');

    return `
        <div class="postheader-profile-info">
            ${pfpHtml}
            <span class="username-placeholder">${post.username}</span>
        </div>
        ${isOwner ? `
            <div class="post-header-btns-cont">
                <button data-id="${post.id}" class="edit-btn">
                    Edit
                </button>
                <button data-id="${post.id}" class="delete-btn">
                    Remove
                </button>
            </div>
        ` : ''}
    `;
}

// Renders the reaction buttons, checking if the current user has reacted.
function renderReactions(postId, post) {
    let html = '';
    const reactions = post.reactions || {};
    const reactionsByUser = post.reactionsByUser || {};
    const currentUserId = currentUser?.userId;
    
    REACTIONS.forEach(reaction => {
        const count = reactions[reaction] || 0;
        const userHasReacted = (reactionsByUser[reaction] || []).includes(currentUserId);

        const activeClass = userHasReacted ? 'reacted' : 'hover:bg-gray-100 dark:hover:bg-gray-600';

        html += `
            <button data-id="${postId}" data-reaction="${reaction}" class="reaction-btn ${activeClass}">
                ${reaction} 
                <span class="reaction-count" data-reaction="${reaction}">
                    ${count}
                </span>
            </button>
        `;
    });
    return html;
}

function renderFeed(postsToDisplay) {
    feedContainer.innerHTML = '';
    emptyMessage.classList.toggle('hidden', postsToDisplay.length > 0);
    emptyMessage.textContent = currentTab === 'profile' ? 
        `You haven't shared any photos yet, ${currentUser?.username}.` : 
        'No posts yet. Be the first to share!';

    postsToDisplay.forEach(post => {
        const postElement = document.createElement('article');
        postElement.id = `post-${post.id}`;
        // Reduced padding and rounded corners on card
        postElement.className = 'post-card';
        
        postElement.innerHTML = `
            <!-- Post Header -->
            <div class="post-header">
                ${renderPostHeader(post)}
            </div>
        
            <div class="post-pic-cont">
                <img src="${post.imageUrl}" alt="${post.title}" 
                        class="w-full h-full object-cover" 
                        onerror="this.onerror=null; this.src='https://placehold.co/500x300/cccccc/333333?text=Image+Load+Failed';" />
            </div>

            <!-- Reactions and Details -->
            <div class="p-3">
                <!-- Reactions -->
                <div class="reaction-container">
                    ${renderReactions(post.id, post)}
                </div>
                
                <p class="post-caption-cont">
                    <span class="post-username">${post.username}</span>
                    <span class="post-caption">${post.title}</span>
                </p>
            </div>
        `;
        feedContainer.appendChild(postElement);
    });

    // Reattach event listeners to all interactive elements
    document.querySelectorAll('.reaction-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            toggleReaction(parseInt(e.currentTarget.dataset.id), e.currentTarget.dataset.reaction);
        });
    });
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            deletePost(parseInt(e.currentTarget.dataset.id));
        });
    });
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            openEditModal(parseInt(e.currentTarget.dataset.id));
        });
    });
}


// --- Initialization and UI Events ---
document.addEventListener('DOMContentLoaded', () => {
    loadTheme();
    loadData();
    updateAuthState();

    // Theme Toggle
    themeToggle.addEventListener('click', toggleTheme);

    // Authentication Events
    showSignupBtn.addEventListener('click', () => showAuthView('signup'));
    showLoginBtn.addEventListener('click', () => showAuthView('login'));
    loginBtn.addEventListener('click', attemptLogin);
    signupBtn.addEventListener('click', attemptSignup);
    logoutBtn.addEventListener('click', logout);
    
    // Tab Navigation
    tabButtons.forEach(btn => {
        btn.addEventListener('click', (e) => handleTabChange(e.currentTarget.dataset.tab));
    });

    // Post Modal Controls
    newPostBtn.addEventListener('click', openCreateModal);
    cancelPostBtn.addEventListener('click', closeModal);
    submitPostBtn.addEventListener('click', savePost);
    
    // Close modal when clicking outside (on the overlay)
    postModal.addEventListener('click', (e) => {
        if (e.target === postModal) {
            closeModal();
        }
    });
});


















































