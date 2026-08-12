let currentUser = localStorage.getItem("nexus_user") || "User";
let currentChatId = localStorage.getItem("nexus_current_chat") || null;
let chats = JSON.parse(localStorage.getItem("nexus_chats")) || [];

const BACKEND_URL = 'https://nexus-ai-yh3t.onrender.com';

document.addEventListener("DOMContentLoaded", () => {
    const isLoggedIn = localStorage.getItem("nexus_logged_in");
    if (!isLoggedIn) {
        window.location.href = "login.html";
        return;
    }

    const userNameElem = document.getElementById("sidebarUserName");
    if (userNameElem) userNameElem.innerText = currentUser;
    
    renderNavbarAuth();
    renderChatHistory();

    if (currentChatId && chats.some(c => c.id === currentChatId)) {
        loadChat(currentChatId);
    } else if (chats.length > 0) {
        loadChat(chats[0].id);
    } else {
        createNewChat();
    }

    const userInput = document.getElementById("userInput");
    if (userInput) {
        userInput.addEventListener("keypress", function(e) {
            if (e.key === "Enter") sendUserMessage();
        });
    }

    const sendBtn = document.getElementById("sendButton");
    if (sendBtn) {
        sendBtn.addEventListener("click", sendUserMessage);
    }
});

function renderNavbarAuth() {
    const navAuth = document.getElementById("navAuthSection");
    if (!navAuth) return;
    navAuth.innerHTML = `
        <div class="flex items-center space-x-3 text-sm">
            <div class="flex items-center space-x-2 bg-[#131625] border border-gray-800 px-3 py-1.5 rounded-xl">
                <div class="w-6 h-6 rounded-full bg-purple-600 flex items-center justify-center text-xs font-bold text-white">${currentUser.charAt(0).toUpperCase()}</div>
                <span class="font-medium text-gray-200">${currentUser}</span>
            </div>
            <button onclick="handleLogout()" class="text-xs bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 px-3 py-1.5 rounded-xl transition">Log Out</button>
        </div>
    `;
}

function handleLogout() {
    localStorage.removeItem("nexus_logged_in");
    localStorage.removeItem("nexus_user");
    localStorage.removeItem("nexus_email");
    window.location.href = "login.html";
}

function createNewChat() {
    const newChatObj = {
        id: 'chat_' + Date.now(),
        title: 'New Conversation',
        messages: []
    };
    chats.unshift(newChatObj);
    currentChatId = newChatObj.id;
    saveChats();
    renderChatHistory();
    loadChat(currentChatId);
}

function saveChats() {
    localStorage.setItem("nexus_chats", JSON.stringify(chats));
    localStorage.setItem("nexus_current_chat", currentChatId);
}

function renderChatHistory() {
    const list = document.getElementById("chatHistoryList");
    if (!list) return;
    list.innerHTML = "";
    if (chats.length === 0) {
        list.innerHTML = '<div class="text-xs text-gray-500 px-2 py-1">No recent chats</div>';
        return;
    }
    chats.forEach(chat => {
        const isActive = chat.id === currentChatId;
        const div = document.createElement("div");
        div.className = `group flex items-center justify-between p-2.5 rounded-xl text-sm cursor-pointer transition ${isActive ? 'bg-[#1c2035] text-white font-medium border border-gray-700/50' : 'text-gray-400 hover:bg-[#161a2b] hover:text-gray-200'}`;
        div.innerHTML = `
            <span onclick="loadChat('${chat.id}')" class="truncate flex-1">${escapeHtml(chat.title)}</span>
            <button onclick="deleteChat(event, '${chat.id}')" class="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 p-1 transition">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
            </button>
        `;
        list.appendChild(div);
    });
}

function loadChat(chatId) {
    currentChatId = chatId;
    saveChats();
    renderChatHistory();
    const chat = chats.find(c => c.id === chatId);
    if (!chat) return;

    const titleElem = document.getElementById("currentChatTitle");
    if (titleElem) titleElem.innerText = chat.title;

    const container = document.getElementById("chatContainer");
    if (!container) return;
    container.innerHTML = "";

    if (chat.messages.length === 0) {
        container.innerHTML = `
            <div class="flex flex-col items-center justify-center h-full text-center space-y-3 text-gray-500">
                <div class="w-12 h-12 rounded-2xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400 font-bold text-lg">NX</div>
                <h3 class="text-lg font-medium text-gray-300">How can NEXUS help you today?</h3>
                <p class="text-xs text-gray-500 max-w-sm">Type a message below to begin chatting with secure AI.</p>
            </div>
        `;
        return;
    }

    chat.messages.forEach(msg => {
        appendMessageUI(msg.sender, msg.text, false);
    });
    container.scrollTop = container.scrollHeight;
}

function deleteChat(event, chatId) {
    event.stopPropagation();
    chats = chats.filter(c => c.id !== chatId);
    saveChats();
    if (currentChatId === chatId) {
        if (chats.length > 0) {
            loadChat(chats[0].id);
        } else {
            createNewChat();
        }
    } else {
        renderChatHistory();
    }
}

async function sendUserMessage() {
    const input = document.getElementById("userInput");
    if (!input) return;
    const text = input.value.trim();
    if (!text) return;

    let chat = chats.find(c => c.id === currentChatId);
    if (!chat) {
        createNewChat();
        chat = chats[0];
    }

    if (chat.title === 'New Conversation') {
        chat.title = text.length > 25 ? text.substring(0, 25) + '...' : text;
        const titleElem = document.getElementById("currentChatTitle");
        if (titleElem) titleElem.innerText = chat.title;
        renderChatHistory();
    }

    input.value = "";
    
    const container = document.getElementById("chatContainer");
    if (chat.messages.length === 0) {
        container.innerHTML = "";
    }

    chat.messages.push({ sender: 'user', text: text });
    appendMessageUI('user', text, true);

    const botMsgId = 'bot_' + Date.now();
    appendBotPlaceholder(botMsgId);

    let botReply = "";
    try {
        const res = await fetch(`${BACKEND_URL}/api/chat`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: text })
        });
        const data = await res.json();
        
        if (data.success) {
            botReply = data.reply;
        } else {
            botReply = data.message || "Received empty response from AI server.";
        }
    } catch (err) {
        console.error(err);
        botReply = "Error connecting to backend server.";
    }

    const botElem = document.getElementById(botMsgId);
    if (botElem) {
        botElem.innerHTML = escapeHtml(botReply).replace(/\n/g, '<br>');
        botElem.classList.remove("animate-pulse", "text-gray-400");
        botElem.classList.add("text-gray-200");
    }

    chat.messages.push({ sender: 'nexus', text: botReply });
    saveChats();
    if (container) container.scrollTop = container.scrollHeight;
}

function appendMessageUI(sender, text, scroll = true) {
    const container = document.getElementById("chatContainer");
    if (!container) return;
    const div = document.createElement("div");
    
    if (sender === 'user') {
        div.className = "flex justify-end";
        div.innerHTML = `<div class="bg-indigo-600 text-white px-4 py-3 rounded-2xl max-w-lg text-sm shadow-md">${escapeHtml(text)}</div>`;
    } else {
        div.className = "flex items-start space-x-3";
        div.innerHTML = `
            <div class="w-8 h-8 rounded-full bg-purple-600/30 border border-purple-500/50 flex items-center justify-center font-bold text-xs text-purple-300 shrink-0">NX</div>
            <div class="bg-[#131625] border border-gray-800 text-gray-200 px-4 py-3 rounded-2xl max-w-2xl text-sm leading-relaxed shadow-md">${escapeHtml(text).replace(/\n/g, '<br>')}</div>
        `;
    }
    container.appendChild(div);
    if (scroll) container.scrollTop = container.scrollHeight;
}

function appendBotPlaceholder(id) {
    const container = document.getElementById("chatContainer");
    if (!container) return;
    const div = document.createElement("div");
    div.className = "flex items-start space-x-3";
    div.innerHTML = `
        <div class="w-8 h-8 rounded-full bg-purple-600/30 border border-purple-500/50 flex items-center justify-center font-bold text-xs text-purple-300 shrink-0">NX</div>
        <div id="${id}" class="bg-[#131625] border border-gray-800 text-gray-400 px-4 py-3 rounded-2xl max-w-2xl text-sm leading-relaxed shadow-md animate-pulse">NEXUS is thinking...</div>
    `;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
}

function escapeHtml(text) {
    if (!text) return "";
    return text.toString().replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}