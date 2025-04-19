(() => {
    const apiKey = document.currentScript.getAttribute("data-api-key");
  
    // Create a floating button
    const button = document.createElement("div");
    button.innerText = "🤖 Chat";
    button.style = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: #4f46e5;
      color: white;
      padding: 12px 16px;
      border-radius: 50px;
      cursor: pointer;
      font-family: sans-serif;
      font-weight: bold;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
      z-index: 9999;
    `;
  
    document.body.appendChild(button);
  
    // Create a hidden chat window
    const iframe = document.createElement("iframe");
    iframe.src = `https://yourdomain.com/chat-ui.html?key=${apiKey}`;
    iframe.style = `
      position: fixed;
      bottom: 80px;
      right: 20px;
      width: 320px;
      height: 420px;
      border: none;
      border-radius: 10px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.3);
      display: none;
      z-index: 9999;
    `;
  
    document.body.appendChild(iframe);
  
    button.onclick = () => {
      iframe.style.display = iframe.style.display === "none" ? "block" : "none";
    };
  })();
  