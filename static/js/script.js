document.addEventListener('DOMContentLoaded', () => {
    const createSessionButton = document.getElementById('create-session');
    const joinSessionButton = document.getElementById('join-session');
    const adminButton = document.getElementById('admin-button');
    const adminPopup = document.getElementById('admin-popup');
    const adminCloseButton = document.getElementById('admin-close');
    const adminSessionsContainer = document.getElementById('admin-sessions');
    const sessionCodeInput = document.getElementById('session-code-input');
    const sessionCodeDisplay = document.getElementById('session-code');
    const messagingSection = document.getElementById('messaging');
    const messageForm = document.getElementById('message-form');
    const messageInput = document.getElementById('message-input');
    const messagesContainer = document.getElementById('messages');
    const hamburgerMenu = document.getElementById('hamburger-menu');
    const newSessionButton = document.getElementById('new-session');
    const joinSessionMenuButton = document.getElementById('join-session-menu');
    const joinSessionPopup = document.getElementById('join-session-popup');
    const joinSessionInput = document.getElementById('join-session-input');
    const joinSessionArrow = document.getElementById('join-session-arrow');

    let sessionCode = '';

    // Function to create a new session
    async function createSession() {
        try {
            const response = await fetch('/api/create_session', { method: 'POST' });
            const data = await response.json();
            sessionCode = data.session_code;
            sessionCodeDisplay.textContent = `Session Code: ${sessionCode}`;
            messagingSection.classList.remove('hidden');
            document.getElementById('session-creation').classList.add('hidden');
        } catch (error) {
            console.error('Error creating session:', error);
        }
    }

    // Function to join an existing session
    function joinSession() {
        sessionCode = joinSessionInput.value.trim();
        if (sessionCode) {
            sessionCodeDisplay.textContent = `Session Code: ${sessionCode}`;
            messagingSection.classList.remove('hidden');
            joinSessionPopup.classList.add('hidden');
            fetchMessages();
        } else {
            alert('Please enter a valid session code');
        }
    }

    // Function to send a message
    async function sendMessage(message) {
        try {
            const response = await fetch('/api/send_message', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ session_code: sessionCode, content: message })
            });
            const data = await response.json();
            if (response.ok) {
                messageInput.value = '';
                await fetchMessages();
            } else {
                alert(data.error || 'Error sending message');
            }
        } catch (error) {
            console.error('Error sending message:', error);
            alert('Error sending message. Please try again.');
        }
    }

    // Function to fetch messages
    async function fetchMessages() {
        if (sessionCode) {
            try {
                const response = await fetch(`/api/get_messages/${sessionCode}`);
                const messages = await response.json();
                messagesContainer.innerHTML = messages.map(m => `<p>${decodeURIComponent(escape(atob(m.content)))}</p>`).join('');
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
                if (!document.getElementById('session-expiry')) {
                    const sessionExpiry = new Date(new Date().getTime() + 14 * 24 * 60 * 60 * 1000);
                    const expiryMessage = document.createElement('div');
                    expiryMessage.id = 'session-expiry';
                    expiryMessage.textContent = `Session expires on: ${sessionExpiry.toLocaleString()}`;
                    expiryMessage.style.position = 'fixed';
                    expiryMessage.style.bottom = '10px';
                    expiryMessage.style.left = '10px';
                    expiryMessage.style.color = 'white';
                    document.body.appendChild(expiryMessage);
                }
            } catch (error) {
                console.error('Error fetching messages:', error);
            }
        }
    
    }

    // Event listeners
    createSessionButton.addEventListener('click', createSession);
    joinSessionButton.addEventListener('click', () => joinSessionPopup.classList.remove('hidden'));
    joinSessionArrow.addEventListener('click', joinSession);
    joinSessionPopup.addEventListener('click', (e) => {
        if (e.target === joinSessionPopup) joinSessionPopup.classList.add('hidden');
    });
    hamburgerMenu.addEventListener('click', () => {
        document.getElementById('menu').classList.toggle('hidden');
    });
    newSessionButton.addEventListener('click', createSession);
    joinSessionMenuButton.addEventListener('click', () => joinSessionPopup.classList.remove('hidden'));
    adminButton.addEventListener('click', async () => {
        document.getElementById('admin-login-popup').classList.remove('hidden');
    });
    document.getElementById('admin-login-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const code = document.getElementById('admin-code-input').value;
        const response = await fetch('/api/verify_admin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ admin_code: code })
        });
        if (response.ok) {
            document.getElementById('admin-login-popup').classList.add('hidden');
            adminPopup.classList.remove('hidden');
            await fetchSessions();
        } else {
            alert('Invalid admin code');
        }
    });
    adminCloseButton.addEventListener('click', () => adminPopup.classList.add('hidden'));

    messageForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const message = messageInput.value.trim();
        if (message && sessionCode) {
            await sendMessage(message);
        }
    });

    // Fetch messages periodically
    setInterval(fetchMessages, 5000);

    async function fetchSessions() {
        try {
            const response = await fetch('/api/get_sessions', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            if (response.status === 403) {
                alert('Access forbidden. Invalid admin code.');
                return;
            }
            const sessions = await response.json();
            adminSessionsContainer.innerHTML = sessions.map(s => `
                <div class="session-item">
                    <span>${s.session_code} (${s.message_count} messages)</span>
                    <button onclick="deleteSession('${s.session_code}')">Delete</button>
                </div>
            `).join('');
        } catch (error) {
            console.error('Error fetching sessions:', error);
        }
    }

    async function deleteSession(session_code) {
        try {
            await fetch(`/api/delete_session/${session_code}`, { method: 'DELETE' });
            await fetchSessions();
        } catch (error) {
            console.error('Error deleting session:', error);
        }
    }
    window.deleteSession = deleteSession;

    // Cleanup old sessions periodically
    async function cleanupSessions() {
        try {
            await fetch('/api/cleanup_sessions', { method: 'POST' });
        } catch (error) {
            console.error('Error cleaning up sessions:', error);
        }
    }
    setInterval(cleanupSessions, 24 * 60 * 60 * 1000); // Run cleanup every 24 hours
});
