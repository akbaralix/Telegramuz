const username = localStorage.getItem("username");
const avatarUrl = localStorage.getItem("profileImage");
document.getElementById("user-avatar-header").src = avatarUrl;

if (!username || username.trim() === "") {
  window.location.href = "/login.html";
}

const audio = new Audio("send-msg/send-message.mp3");
const chatMessages = document.getElementById("chat-messages");
const messageInput = document.getElementById("message-input");
const sendButton = document.getElementById("send-button");
const onlineUsersToggle = document.getElementById("online-users-toggle");
const onlineUsersPanel = document.getElementById("online-users-panel");
const onlineUsersList = document.getElementById("online-users-list");
const closeOnlineUsersPanelBtn = document.getElementById(
  "close-online-users-panel"
);

const chatlink = document.getElementById("chat-link");

chatlink.addEventListener("click", (e) => {
  e.preventDefault();

  const msg1 = document.getElementById("chatmsg");
  const msg2 = document.getElementById("chatmsgs");

  // ko'rsatish
  msg1.style.display = "block";
  msg2.style.display = "block";

  setTimeout(() => {
    msg1.classList.add("show");
    msg2.classList.add("show");
  }, 10); // keyingi freymda opacity ishga tushadi

  // 5 soniyadan keyin yo'qotish
  setTimeout(() => {
    msg1.classList.remove("show");
    msg2.classList.remove("show");
    setTimeout(() => {
      msg1.style.display = "none";
      msg2.style.display = "none";
    }, 500); // animatsiya tugashini kutish
  }, 5000);
});

const socket = io("https://telegramuz.onrender.com/", {
  transports: ["websocket"],
});

function sendMessage() {
  const messageText = messageInput.value.trim();
  if (messageText && username) {
    socket.emit("chatMessage", messageText);
    messageInput.value = "";
    toggleSendButton();
  }
}

sendButton.addEventListener("click", () => {
  audio.play();
});
sendButton.addEventListener("click", sendMessage);
messageInput.addEventListener("input", toggleSendButton);

document.addEventListener("keydown", (e) => {
  messageInput.focus(); // inputni faollashtiradi
  messageInput.value += e.key.length === 0 ? e.key : ""; // faqat harflarni qo‘shadi
});

messageInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter" && messageInput.value.trim() !== "") {
    sendMessage();
    audio.play();
  }
});

function toggleSendButton() {
  sendButton.disabled = messageInput.value.trim() === "";
}

function addMessageToChat(msg) {
  const messageWrapper = document.createElement("div");
  messageWrapper.classList.add("message-wrapper");

  const messageDiv = document.createElement("div");
  messageDiv.classList.add("message");

  const timestampSpan = document.createElement("span");
  timestampSpan.classList.add("timestamp");
  timestampSpan.textContent = msg.timestamp;

  if (msg.user === username) {
    messageWrapper.classList.add("user-message");
    messageDiv.classList.add("user");
  } else {
    messageWrapper.classList.add("other-message");
    messageDiv.classList.add("other");

    const avatarDiv = document.createElement("div");
    avatarDiv.classList.add("avatar");
    avatarDiv.textContent = msg.user.charAt(0).toUpperCase();

    const senderNameSpan = document.createElement("span");
    senderNameSpan.classList.add("sender-name");
    senderNameSpan.textContent = msg.user;

    messageDiv.appendChild(senderNameSpan);
    messageWrapper.appendChild(avatarDiv);
  }

  const textNode = document.createTextNode(msg.text);
  messageDiv.appendChild(textNode);
  messageDiv.appendChild(timestampSpan);
  messageWrapper.appendChild(messageDiv);
  chatMessages.appendChild(messageWrapper);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function addSystemMessage(text) {
  const systemMessageDiv = document.createElement("div");
  systemMessageDiv.classList.add("system-message");
  systemMessageDiv.textContent = text;
  chatMessages.appendChild(systemMessageDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}
// isimni taxrislash

function stringToColor(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  let color = "#";
  for (let i = 0; i < 3; i++) {
    const value = (hash >> (i * 8)) & 0xff;
    color += ("00" + value.toString(16)).substr(-2);
  }
  return color;
}

function updateOnlineUsersList(users) {
  onlineUsersList.innerHTML = "";
  users.forEach((user) => {
    const li = document.createElement("li");
    const avatarSpan = document.createElement("span");
    avatarSpan.textContent = user.charAt(0).toUpperCase();
    avatarSpan.classList.add("user-avatar");
    avatarSpan.style.backgroundColor = stringToColor(user);
    const usernameSpan = document.createElement("span");
    usernameSpan.textContent = " " + user;
    li.appendChild(avatarSpan);
    li.appendChild(usernameSpan);
    onlineUsersList.appendChild(li);
  });
}

socket.on("connect", () => {
  socket.emit("setUsername", username);
});

socket.on("disconnect", () => {
  addSystemMessage("Server bilan aloqa uzildi.");
});

socket.on("message", (msg) => {
  addMessageToChat(msg);
});

socket.on("userJoined", (user) => {
  if (user !== username) {
    addSystemMessage(`${user} chatga qo‘shildi.`);
  }
});

socket.on("userLeft", (user) => {
  addSystemMessage(`${user} chatdan chiqdi.`);
});

socket.on("onlineUsers", (users) => {
  updateOnlineUsersList(users);
});

socket.on("updateOnlineUsers", (users) => {
  updateOnlineUsersList(users);
});

onlineUsersToggle.addEventListener("click", () => {
  onlineUsersPanel.classList.add("open");
});

closeOnlineUsersPanelBtn.addEventListener("click", () => {
  onlineUsersPanel.classList.remove("open");
});

document.addEventListener("click", (event) => {
  if (
    onlineUsersPanel.classList.contains("open") &&
    !onlineUsersPanel.contains(event.target) &&
    !onlineUsersToggle.contains(event.target)
  ) {
    onlineUsersPanel.classList.remove("open");
  }
});
function openSettings() {}
