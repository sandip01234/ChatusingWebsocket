'use strict'; // Strict mode to catch common coding mistakes

// Getting references to various HTML elements
var usernamePage = document.querySelector('#username-page'); // The page where user inputs their name
var chatPage = document.querySelector('#chat-page'); // The chat interface page
var usernameForm = document.querySelector('#usernameForm'); // Form for username input
var messageForm = document.querySelector('#messageForm'); // Form to send chat messages
var messageInput = document.querySelector('#message'); // Input field for the message text
var messageArea = document.querySelector('#messageArea'); // Area where messages will be displayed
var connectingElement = document.querySelector('.connecting'); // Status message for connecting feedback

var stompClient = null; // WebSocket client object, initialized as null
var username = null; // Variable to store the username

// Predefined set of colors to assign a color to each user (for avatar or message display)
var colors = [
    '#2196F3', '#32c787', '#00BCD4', '#ff5652',
    '#ffc107', '#ff85af', '#FF9800', '#39bbb0'
];

// Function to handle the connection to the WebSocket server
// This gets triggered when the user submits their username
function connect(event) {
    username = document.querySelector('#name').value.trim(); // Get the entered username and trim spaces

    if (username) { // If a valid username is entered
        usernamePage.classList.add('hidden'); // Hide the username page
        chatPage.classList.remove('hidden'); // Show the chat page

        var socket = new SockJS('/ws'); // Create a new WebSocket connection using SockJS, matching the backend endpoint '/ws'
        stompClient = Stomp.over(socket); // Initialize the STOMP client over the WebSocket connection

        stompClient.connect({}, onConnected, onError); // Connect to the WebSocket server, call 'onConnected' on success or 'onError' on failure
    }
    event.preventDefault(); // Prevent the form from refreshing the page on submit
}

// Function called once the WebSocket connection is successfully established
function onConnected() {
    // Subscribe to the public chat topic to receive messages from other users
    stompClient.subscribe('/topic/public', onMessageReceived);

    // Notify the server that a new user has joined
    stompClient.send("/app/chat.addUser", // The backend endpoint for adding a user
        {},
        JSON.stringify({sender: username, type: 'JOIN'}) // Send a message with the username and 'JOIN' status
    );

    connectingElement.classList.add('hidden'); // Hide the "Connecting..." message once connected
}

// Function called if there's an error while connecting to the WebSocket server
function onError(error) {
    connectingElement.textContent = 'Could not connect to WebSocket server. Please refresh this page to try again!';
    connectingElement.style.color = 'red'; // Change the text color to red to indicate an error

    // Optionally log the error for debugging purposes
    console.error("WebSocket connection error:", error);
}

// Function to handle sending chat messages
// This gets triggered when the user submits a message in the chat
function sendMessage(event) {
    var messageContent = messageInput.value.trim(); // Get the message content and trim spaces

    if (messageContent && stompClient) { // If message content is not empty and WebSocket client is active
        var chatMessage = {
            sender: username, // Sender of the message (current user)
            content: messageContent, // The actual message content
            type: 'CHAT' // The type of message (CHAT)
        };

        // Send the message to the backend using the appropriate endpoint
        stompClient.send("/app/chat.sendMassage", {}, JSON.stringify(chatMessage));
        messageInput.value = ''; // Clear the message input field after sending
    }
    event.preventDefault(); // Prevent form from submitting traditionally (reloading page)
}

// Function called when a message is received from the server
function onMessageReceived(payload) {
    var message = JSON.parse(payload.body); // Parse the incoming message from JSON

    var messageElement = document.createElement('li'); // Create a new list element to display the message

    // Determine the type of message and format accordingly
    if (message.type === 'JOIN') {
        messageElement.classList.add('event-message'); // Special styling for 'join' events
        message.content = message.sender + ' joined!'; // Format the content for 'join' message
    } else if (message.type === 'LEAVE') {
        messageElement.classList.add('event-message'); // Special styling for 'leave' events
        message.content = message.sender + ' left!'; // Format the content for 'leave' message
    } else { // If it's a normal chat message
        messageElement.classList.add('chat-message'); // Apply chat message styling

        // Create an avatar for the message sender
        var avatarElement = document.createElement('i');
        var avatarText = document.createTextNode(message.sender[0]); // Use the first letter of the sender's name as the avatar
        avatarElement.appendChild(avatarText);
        avatarElement.style['background-color'] = getAvatarColor(message.sender); // Assign a color based on sender's name

        messageElement.appendChild(avatarElement); // Add avatar to the message element

        // Display the sender's name
        var usernameElement = document.createElement('span');
        var usernameText = document.createTextNode(message.sender);
        usernameElement.appendChild(usernameText);
        messageElement.appendChild(usernameElement);
    }

    // Create a text element for the message content
    var textElement = document.createElement('p');
    var messageText = document.createTextNode(message.content);
    textElement.appendChild(messageText);

    messageElement.appendChild(textElement); // Add the message content to the message element

    messageArea.appendChild(messageElement); // Append the message element to the chat area

    // Scroll the message area to the bottom to show the latest message
    messageArea.scrollTop = messageArea.scrollHeight;
}

// Function to generate a color for the avatar based on the sender's name
function getAvatarColor(messageSender) {
    var hash = 0;
    // Generate a hash code based on the sender's name
    for (var i = 0; i < messageSender.length; i++) {
        hash = 31 * hash + messageSender.charCodeAt(i); // Hash algorithm
    }
    var index = Math.abs(hash % colors.length); // Use the hash to select a color from the predefined list
    return colors[index]; // Return the selected color
}

// Add event listeners for form submissions
// When the user submits the username form, the 'connect' function is called
usernameForm.addEventListener('submit', connect, true);

// When the user submits the message form, the 'sendMessage' function is called
messageForm.addEventListener('submit', sendMessage, true);


