import { updateState, createId } from "../../state/store.js";
import { showToast } from "../../ui/toast.js";

/**
 * Lähettää viestin
 * @param {string} senderId - Lähettäjän ID tai sposti ("admin@demo.fi" tai pilotin ID)
 * @param {string} receiverId - Vastaanottajan ID tai sposti
 * @param {string} content - Viestin sisältö
 */
export function sendMessage(senderId, receiverId, content) {
  if (!content.trim()) return;

  const newMessage = {
    id: createId("msg"),
    senderId,
    receiverId,
    content: content.trim(),
    createdAt: new Date().toISOString(),
    read: false
  };

  updateState(draft => {
    if (!draft.messages) draft.messages = [];
    draft.messages.push(newMessage);
  }, "send_message");
}

/**
 * Merkitsee kaikki käyttäjän (tai adminin) saamat viestit luetuksi tietyltä lähettäjältä
 * @param {string} currentUserId - Kuka lukee (vastaanottaja)
 * @param {string} otherUserId - Kenen lähettämät viestit luetaan (lähettäjä)
 */
export function markThreadAsRead(currentUserId, otherUserId) {
  updateState(draft => {
    if (!draft.messages) return;
    let modified = false;
    draft.messages.forEach(msg => {
      if (msg.receiverId === currentUserId && msg.senderId === otherUserId && !msg.read) {
        msg.read = true;
        modified = true;
      }
    });
    // Vain jos on oikeasti luettavaa, päivitetään tila (vähentää turhia renderöintejä)
    if (!modified) return; 
  }, "read_messages");
}
