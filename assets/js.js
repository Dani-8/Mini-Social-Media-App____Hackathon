let POSTS_KEY = 'microInstaPosts';
let posts = []
// ========================================================================
let addPost = document.getElementById("add-post")
let modal = document.getElementById("post-modal")

addPost.addEventListener("click", () => {
    modal.classList.remove("hidden")
})


let createPostBTN = document.getElementById("create-btn")
let cancleBTN = document.getElementById("cancle-btn")

createPostBTN.addEventListener("click", createPost)
cancleBTN.addEventListener("click", () => {
    modal.classList.add("hidden")
})
// ========================================================================
let feedCont = document.getElementById("feed-cont")

function renderPosts(){
    feedCont.innerHTML = ""
    if(posts.length === 0){
        feedCont.innerHTML = `<p class="empty-feed-msg">The Feed is Empty....</p>`
    }


    posts.forEach(post => {
        let date = new Date(post.timestamp).toLocaleString();

        let postCont = document.createElement("div")
        postCont.id = `post-${post.id}`
        postCont.className = "post-cont"

        postCont.innerHTML = `
            <div class="user-info">
                <div class="user-img"></div>
                <p class="user-name">User</p>
            </div>

            <div class="content-details">
                <p class="caption">${post.caption}</p>
            </div>

            <div class="action-cont">
                <p class="date-time">${date}</p>
                <div class="action-items">
                    <button class="heart" id="like-btn">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clip-rule="evenodd" />
                        </svg>
                        <span class="like-num">${post.likes}</span>
                    </button>
                    <button class="delete" id="del-btn">Delete</button>
                </div>
            </div>
        `
        feedCont.appendChild(postCont)
    })
}
// feedUpgrade()
// ========================================================================
let captionInput = document.getElementById("caption-input")

function createPost(){
    let caption = captionInput.value.trim()

    if (caption.length === 0) {
        alert("Please add a caption for your photo.");
        return;
    }

    let postID = Date.now()

    let newPost = {
        id: postID,
        caption: caption,
        timestamp: new Date().toISOString(),
        likes: 0
        };


    posts.unshift(newPost)
    savePosts()

    captionInput.value = ""
    modal.classList.add("hidden")

    renderPosts();
}
// ========================================================================
let likeBTN = document.getElementById("like-btn")

function toggleLike(id) {
    const postIndex = posts.findIndex(p => p.id === id);
    if (postIndex > -1) {
        posts[postIndex].likes += 1; // Simple increment
        savePosts();
        
        // Optimized update for the specific element
        let likeCountEl = document.querySelector(`#post-${id} .like-count`);
        if (likeCountEl) {
            likeCountEl.textContent = posts[postIndex].likes;
        }
    }
}
likeBTN.addEventListener("click", toggleLike)


// ==============================================

let deleteBTN = document.getElementById("del-btn")

function deletePost(id) {
    if (!window.confirm("Are you sure you want to delete this post?")) return;
    posts = posts.filter(p => p.id !== id);
    savePosts();
    renderPosts();
}
deleteBTN.addEventListener("click", deletePost)










// ========================================================================
function loadPosts(){
    let storedPosts = localStorage.getItem(POSTS_KEY)
    posts = storedPosts ? JSON.parse(storedPosts) : []

    posts.sort((a, b) => b.id - a.id);
}

function savePosts(){
    localStorage.setItem(POSTS_KEY, JSON.stringify(posts));
}































