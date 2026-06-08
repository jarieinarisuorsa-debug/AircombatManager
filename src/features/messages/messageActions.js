import { updateState, createId } from "../../state/store.js";
import { showToast } from "../../ui/toast.js";
import { registerAction } from "../../core/actionRegistry.js";

/**
 * Lähettää viestin
 * @param {string} senderId - Lähettäjän ID tai sposti ("admin" tai pilotin ID)
 * @param {string} content - Viestin sisältö
 */
export function sendMessage(senderId, content) {
  if (!content.trim()) return;

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

export function initMessageActions() {
  registerAction("execute-delete-message", (event, button, { renderApp }) => {
    deleteMessage(button.dataset.messageId);
    renderApp();
    return true;
  });
}
