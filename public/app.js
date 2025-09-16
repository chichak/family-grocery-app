// Import Firebase modules from CDN (no bundler required)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { 
  getFirestore, collection, addDoc, doc, updateDoc, deleteDoc, getDoc,
  serverTimestamp, onSnapshot, orderBy, query
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDKCI6ZLpRL5HHWrMf3KmftFJuzgKYgshQ",
  authDomain: "family-grocery-list-d75f8.firebaseapp.com",
  projectId: "family-grocery-list-d75f8",
  storageBucket: "family-grocery-list-d75f8.firebasestorage.app",
  messagingSenderId: "640152677933",
  appId: "1:640152677933:web:9917450889574c636712a4"
};

// Initialize Firebase + Firestore
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// DOM elements
const addBtn = document.getElementById('addBtn');
const itemNameInput = document.getElementById('itemName');
const itemQtyInput = document.getElementById('itemQty');
const listBody = document.getElementById('listBody');
const statsEl = document.getElementById('stats');

// Event bindings
addBtn.addEventListener('click', addItem);
itemNameInput.addEventListener('keyup', (e) => { if (e.key === 'Enter') addItem(); });

// Helpers
function sanitize(str) {
  return String(str || '').trim();
}
function escapeHtml(s) {
  if (!s) return '';
  return s.replace(/[&<>"']/g, (m) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"}[m]));
}

// Add item
async function addItem() {
  const name = sanitize(itemNameInput.value);
  const qty = parseInt(itemQtyInput.value) || 1;
  if (!name) { itemNameInput.focus(); return; }

  try {
    await addDoc(collection(db, 'groceryItems'), {
      name,
      qty,
      checked: false,
      price: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    itemNameInput.value = '';
    itemQtyInput.value = '';
  } catch (err) {
    console.error('Add item error', err);
    alert('Failed to add item.');
  }
}

// Real-time listener: order by createdAt
const itemsQuery = query(collection(db, 'groceryItems'), orderBy('createdAt', 'asc'));
onSnapshot(itemsQuery, (snapshot) => {
  const docs = [];
  snapshot.forEach(docSnap => docs.push({ id: docSnap.id, ...docSnap.data() }));
  renderList(docs);
}, (err) => {
  console.error('Listener error', err);
});

function renderList(items) {
  listBody.innerHTML = '';
  let boughtCount = 0;
  let totalPrice = 0;

  items.forEach(item => {
    const tr = document.createElement('tr');
    if (item.checked) tr.classList.add('row-checked');

    const priceVal = (item.price || 0).toFixed ? Number(item.price || 0).toFixed(2) : '0.00';

    tr.innerHTML = `
      <td><strong>${escapeHtml(item.name)}</strong></td>
      <td class="col-qty">${item.qty || 1}</td>
      <td><input type="number" min="0" step="0.01" value="${priceVal}" data-id="${item.id}" class="price-input"/></td>
      <td class="col-action"><input type="checkbox" ${item.checked ? 'checked' : ''} data-id="${item.id}" class="check-input"/></td>
      <td class="col-action">
        <button class="btn btn-edit btn-small" data-id="${item.id}" data-action="edit">Edit</button>
        <button class="btn btn-delete btn-small" data-id="${item.id}" data-action="delete">Del</button>
      </td>
    `;
    listBody.appendChild(tr);

    if (item.checked) {
      boughtCount++;
      totalPrice += Number(item.price || 0);
    }
  });

  statsEl.innerText = `Items: ${items.length} • Bought: ${boughtCount} • Total Spent: $${totalPrice.toFixed(2)}`;

  // Attach handlers
  document.querySelectorAll('.check-input').forEach(inp => {
    inp.addEventListener('change', async (e) => {
      const id = e.target.dataset.id;
      try {
        await updateDoc(doc(db, 'groceryItems', id), {
          checked: e.target.checked,
          updatedAt: serverTimestamp()
        });
      } catch (err) { console.error(err); alert('Failed to toggle item'); }
    });
  });

  document.querySelectorAll('.price-input').forEach(inp => {
    inp.addEventListener('change', async (e) => {
      const id = e.target.dataset.id;
      const value = parseFloat(e.target.value) || 0;
      try {
        await updateDoc(doc(db, 'groceryItems', id), {
          price: value,
          updatedAt: serverTimestamp()
        });
      } catch (err) { console.error(err); alert('Failed to update price'); }
    });
  });

  document.querySelectorAll('button[data-action="edit"]').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const id = e.target.dataset.id;
      const docRef = doc(db, 'groceryItems', id);
      const snap = await getDoc(docRef);
      const data = snap.data() || {};
      const newName = prompt('Edit item name:', data.name) || data.name;
      const newQty = prompt('Edit quantity:', data.qty || 1) || data.qty;
      try {
        await updateDoc(docRef, {
          name: String(newName).trim(),
          qty: Number(newQty) || 1,
          updatedAt: serverTimestamp()
        });
      } catch (err) { console.error(err); alert('Failed to update item'); }
    });
  });

  document.querySelectorAll('button[data-action="delete"]').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const id = e.target.dataset.id;
      if (!confirm('Delete this item?')) return;
      try {
        await deleteDoc(doc(db, 'groceryItems', id));
      } catch (err) { console.error(err); alert('Failed to delete item'); }
    });
  });
}
