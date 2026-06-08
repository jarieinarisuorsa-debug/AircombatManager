import { updateState, createId } from "../../state/store.js";
import { showToast } from "../../ui/toast.js";
import { registerAction } from "../../core/actionRegistry.js";

let lastMessageTime = 0;

/**
 * Lähettää viestin
 * @param {string} senderId - Lähettäjän ID tai sposti ("admin" tai pilotin ID)
 * @param {string} content - Viestin sisältö
 */
export function sendMessage(senderId, content) {
  if (!content.trim()) return;

  const now = Date.now();
  // 3 sekunnin rajoitus (admin voi aina lähettää)
  if (senderId !== "admin" && now - lastMessageTime < 3000) {
    showToast("Odota hetki ennen seuraavan viestin lähettämistä (3s).", "warning");
    return false; // palautetaan false jotta kutsuja tietää ettei viestiä lähetetty
  }
  
  lastMessageTime = now;

  const newMessage = {
    id: createId("msg"),
    senderId,
    content: content.trim(),
    createdAt: new Date().toISOString(),
    readBy: [senderId] // Lähettäjä on aina lukenut oman viestinsä
  };

  updateState(draft => {
    if (!draft.messages) draft.messages = [];
    draft.messages.push(newMessage);
  }, "send_message");

  import("../../main.js").then(m => m.updateMessagesDOM());
}

/**
 * Merkitsee kaikki viestit luetuksi käyttäjälle
 * @param {string} currentUserId - Kuka lukee
 */
export function markThreadAsRead(currentUserId) {
  updateState(draft => {
    if (!draft.messages) return;
    let modified = false;
    draft.messages.forEach(msg => {
      if (!msg.readBy) msg.readBy = [msg.senderId];
      if (!msg.readBy.includes(currentUserId)) {
        msg.readBy.push(currentUserId);
        modified = true;
      }
    });
    // Vain jos on oikeasti luettavaa, päivitetään tila
    if (!modified) return; 
  }, "read_messages");
}

/**
 * Poistaa viestin
 * @param {string} messageId - Poistettavan viestin ID
 */
export function deleteMessage(messageId) {
  updateState(draft => {
    if (!draft.messages) return;
    draft.messages = draft.messages.filter(m => m.id !== messageId);
  }, "delete_message");
}

export function clearAllMessages() {
  updateState(draft => {
    draft.messages = [];
  }, "clear_all_messages");
}

export function initMessageActions() {
  registerAction("execute-delete-message", (event, button, { renderApp }) => {
    deleteMessage(button.dataset.messageId);
    renderApp();
    return true;
  });

  registerAction("execute-clear-all-messages", (event, button, { renderApp }) => {
    clearAllMessages();
    renderApp();
    return true;
  });
}
