document.addEventListener('DOMContentLoaded', () => {
    const createSessionButton = document.getElementById('create-session');
    const joinSessionButton = document.getElementById('join-session');
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
            await fetch('/api/send_message', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ session_code: sessionCode, content: message })
            });
            messageInput.value = '';
            await fetchMessages();
        } catch (error) {
            console.error('Error sending message:', error);
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

    messageForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const message = messageInput.value.trim();
        if (message && sessionCode) {
            await sendMessage(message);
        }
    });

    // Fetch messages periodically
    setInterval(fetchMessages, 5000);
});