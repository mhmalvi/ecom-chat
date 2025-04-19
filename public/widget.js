/**
 * eCommerce AI Chat Widget
 * 
 * A lightweight, customizable chat widget for eCommerce websites.
 * It creates a floating chat button that expands into a chat interface.
 */

(function() {
  'use strict';
  
  // Configuration defaults
  const DEFAULT_COLOR = '#4F46E5';
  const DEFAULT_POSITION = 'right';
  const DEFAULT_TITLE = 'AI Assistant';
  const DEFAULT_WELCOME_MESSAGE = 'Hi there! How can I help you today?';
  
  // Get the current script element to extract data attributes
  const currentScript = document.currentScript;
  const apiKey = currentScript.getAttribute('data-api-key');
  
  // Check if API key is provided
  if (!apiKey) {
    console.error('AI Chatbot Widget Error: data-api-key attribute is required');
    return;
  }
  
  // Get configuration from data attributes
  const config = {
    apiKey: apiKey,
    apiUrl: currentScript.getAttribute('data-api-url') || getDefaultApiUrl(),
    color: currentScript.getAttribute('data-color') || DEFAULT_COLOR,
    position: currentScript.getAttribute('data-position') || DEFAULT_POSITION,
    title: currentScript.getAttribute('data-title') || DEFAULT_TITLE,
    welcomeMessage: currentScript.getAttribute('data-welcome-message') || DEFAULT_WELCOME_MESSAGE
  };
  
  // Chat state
  let state = {
    isOpen: false,
    sessionId: loadSessionId() || generateUUID(),
    messages: [],
    isLoading: false
  };
  
  // DOM Elements
  let widgetContainer, chatButton, chatWindow, messagesList, messageInput, sendButton;
  
  // Initialize the widget
  function init() {
    createWidgetElements();
    injectStyles();
    bindEvents();
    
    // Save session ID
    saveSessionId(state.sessionId);
    
    // Add welcome message
    addMessage('assistant', config.welcomeMessage);
  }
  
  // Create the widget DOM elements
  function createWidgetElements() {
    // Widget container
    widgetContainer = document.createElement('div');
    widgetContainer.className = 'ai-chatbot-widget';
    widgetContainer.setAttribute('data-position', config.position);
    
    // Chat button
    chatButton = document.createElement('button');
    chatButton.className = 'ai-chatbot-button';
    chatButton.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
      </svg>
    `;
    
    // Chat window
    chatWindow = document.createElement('div');
    chatWindow.className = 'ai-chatbot-window';
    chatWindow.style.display = 'none';
    
    // Chat header
    const chatHeader = document.createElement('div');
    chatHeader.className = 'ai-chatbot-header';
    chatHeader.innerHTML = `
      <h3>${escapeHtml(config.title)}</h3>
      <button class="ai-chatbot-close">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    `;
    
    // Messages list
    messagesList = document.createElement('div');
    messagesList.className = 'ai-chatbot-messages';
    
    // Chat input
    const chatInputContainer = document.createElement('div');
    chatInputContainer.className = 'ai-chatbot-input-container';
    
    messageInput = document.createElement('input');
    messageInput.className = 'ai-chatbot-input';
    messageInput.placeholder = 'Type your message...';
    messageInput.type = 'text';
    
    sendButton = document.createElement('button');
    sendButton.className = 'ai-chatbot-send';
    sendButton.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="22" y1="2" x2="11" y2="13"></line>
        <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
      </svg>
    `;
    
    // Assemble the widget
    chatInputContainer.appendChild(messageInput);
    chatInputContainer.appendChild(sendButton);
    
    chatWindow.appendChild(chatHeader);
    chatWindow.appendChild(messagesList);
    chatWindow.appendChild(chatInputContainer);
    
    widgetContainer.appendChild(chatButton);
    widgetContainer.appendChild(chatWindow);
    
    document.body.appendChild(widgetContainer);
  }
  
  // Bind event listeners
  function bindEvents() {
    // Open/close chat window
    chatButton.addEventListener('click', toggleChat);
    
    // Close button
    const closeButton = chatWindow.querySelector('.ai-chatbot-close');
    closeButton.addEventListener('click', toggleChat);
    
    // Send message on button click
    sendButton.addEventListener('click', sendMessage);
    
    // Send message on Enter key
    messageInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        sendMessage();
      }
    });
  }
  
  // Toggle chat window visibility
  function toggleChat() {
    state.isOpen = !state.isOpen;
    chatWindow.style.display = state.isOpen ? 'flex' : 'none';
    
    if (state.isOpen) {
      messageInput.focus();
    }
  }
  
  // Send message to API
  async function sendMessage() {
    const message = messageInput.value.trim();
    
    if (!message || state.isLoading) {
      return;
    }
    
    // Clear input
    messageInput.value = '';
    
    // Add message to chat
    addMessage('user', message);
    
    // Set loading state
    state.isLoading = true;
    addLoadingIndicator();
    
    try {
      const response = await fetch(`${config.apiUrl}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': config.apiKey
        },
        body: JSON.stringify({
          message,
          sessionId: state.sessionId
        })
      });
      
      // Remove loading indicator
      removeLoadingIndicator();
      
      if (!response.ok) {
        throw new Error('API request failed');
      }
      
      const data = await response.json();
      
      // Add response to chat
      addMessage('assistant', data.response);
      
      // Update session ID if changed
      if (data.sessionId && data.sessionId !== state.sessionId) {
        state.sessionId = data.sessionId;
        saveSessionId(state.sessionId);
      }
    } catch (error) {
      console.error('AI Chatbot Widget Error:', error);
      addMessage('assistant', 'Sorry, something went wrong. Please try again later.');
    } finally {
      state.isLoading = false;
    }
  }
  
  // Add message to chat
  function addMessage(role, content) {
    const messageElement = document.createElement('div');
    messageElement.className = `ai-chatbot-message ai-chatbot-message-${role}`;
    messageElement.innerHTML = `<div class="ai-chatbot-bubble">${escapeHtml(content)}</div>`;
    
    messagesList.appendChild(messageElement);
    
    // Scroll to bottom
    messagesList.scrollTop = messagesList.scrollHeight;
    
    // Store message in state
    state.messages.push({ role, content });
  }
  
  // Add loading indicator
  function addLoadingIndicator() {
    const loadingElement = document.createElement('div');
    loadingElement.className = 'ai-chatbot-message ai-chatbot-message-assistant ai-chatbot-loading';
    loadingElement.innerHTML = `
      <div class="ai-chatbot-bubble">
        <div class="ai-chatbot-dots">
          <span></span><span></span><span></span>
        </div>
      </div>
    `;
    
    messagesList.appendChild(loadingElement);
    messagesList.scrollTop = messagesList.scrollHeight;
  }
  
  // Remove loading indicator
  function removeLoadingIndicator() {
    const loadingElement = messagesList.querySelector('.ai-chatbot-loading');
    if (loadingElement) {
      messagesList.removeChild(loadingElement);
    }
  }
  
  // Generate a UUID for session identification
  function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
  
  // Escape HTML to prevent XSS
  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
  
  // Inject CSS styles
  function injectStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .ai-chatbot-widget {
        position: fixed;
        ${config.position === 'left' ? 'left' : 'right'}: 20px;
        bottom: 20px;
        z-index: 999999;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
        font-size: 14px;
      }
      
      .ai-chatbot-button {
        width: 60px;
        height: 60px;
        border-radius: 50%;
        background-color: ${config.color};
        color: white;
        border: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        transition: transform 0.3s ease;
      }
      
      .ai-chatbot-button:hover {
        transform: scale(1.05);
      }
      
      .ai-chatbot-window {
        position: absolute;
        bottom: 80px;
        ${config.position === 'left' ? 'left' : 'right'}: 0;
        width: 350px;
        height: 500px;
        background-color: white;
        border-radius: 10px;
        box-shadow: 0 5px 25px rgba(0, 0, 0, 0.15);
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }
      
      .ai-chatbot-header {
        background-color: ${config.color};
        color: white;
        padding: 15px;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      
      .ai-chatbot-header h3 {
        margin: 0;
        font-size: 16px;
        font-weight: 500;
      }
      
      .ai-chatbot-close {
        background: none;
        border: none;
        color: white;
        cursor: pointer;
        opacity: 0.8;
        transition: opacity 0.3s;
      }
      
      .ai-chatbot-close:hover {
        opacity: 1;
      }
      
      .ai-chatbot-messages {
        flex: 1;
        overflow-y: auto;
        padding: 15px;
        display: flex;
        flex-direction: column;
      }
      
      .ai-chatbot-message {
        margin-bottom: 10px;
        max-width: 80%;
      }
      
      .ai-chatbot-message-user {
        align-self: flex-end;
      }
      
      .ai-chatbot-message-assistant {
        align-self: flex-start;
      }
      
      .ai-chatbot-bubble {
        padding: 10px 15px;
        border-radius: 18px;
        line-height: 1.5;
        overflow-wrap: break-word;
      }
      
      .ai-chatbot-message-user .ai-chatbot-bubble {
        background-color: ${config.color};
        color: white;
        border-bottom-right-radius: 4px;
      }
      
      .ai-chatbot-message-assistant .ai-chatbot-bubble {
        background-color: #f0f0f0;
        color: #333;
        border-bottom-left-radius: 4px;
      }
      
      .ai-chatbot-input-container {
        display: flex;
        padding: 10px;
        border-top: 1px solid #eaeaea;
      }
      
      .ai-chatbot-input {
        flex: 1;
        padding: 10px 15px;
        border: 1px solid #ddd;
        border-radius: 20px;
        outline: none;
        font-size: 14px;
      }
      
      .ai-chatbot-input:focus {
        border-color: ${config.color};
      }
      
      .ai-chatbot-send {
        background: none;
        border: none;
        color: ${config.color};
        cursor: pointer;
        padding: 0 10px;
      }
      
      .ai-chatbot-dots {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 4px;
      }
      
      .ai-chatbot-dots span {
        width: 6px;
        height: 6px;
        background-color: #888;
        border-radius: 50%;
        animation: ai-chatbot-pulse 1.5s infinite ease-in-out;
      }
      
      .ai-chatbot-dots span:nth-child(2) {
        animation-delay: 0.2s;
      }
      
      .ai-chatbot-dots span:nth-child(3) {
        animation-delay: 0.4s;
      }
      
      @keyframes ai-chatbot-pulse {
        0%, 60%, 100% {
          transform: scale(1);
          opacity: 1;
        }
        30% {
          transform: scale(1.5);
          opacity: 0.8;
        }
      }
      
      @media (max-width: 480px) {
        .ai-chatbot-window {
          width: calc(100vw - 40px);
          height: 60vh;
          bottom: 80px;
          ${config.position === 'left' ? 'left' : 'right'}: 0;
        }
      }
    `;
    
    document.head.appendChild(style);
  }
  
  // Get default API URL based on current script location
  function getDefaultApiUrl() {
    // Default to the same origin if no API URL provided
    return window.location.origin;
  }
  
  // Save session ID to localStorage
  function saveSessionId(sessionId) {
    try {
      localStorage.setItem('ai-chatbot-session-id', sessionId);
    } catch (e) {
      console.error('AI Chatbot Widget: Failed to save session ID to localStorage');
    }
  }
  
  // Load session ID from localStorage
  function loadSessionId() {
    try {
      return localStorage.getItem('ai-chatbot-session-id');
    } catch (e) {
      console.error('AI Chatbot Widget: Failed to load session ID from localStorage');
      return null;
    }
  }
  
  // Initialize the widget
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    init();
  } else {
    document.addEventListener('DOMContentLoaded', init);
  }
})();
  