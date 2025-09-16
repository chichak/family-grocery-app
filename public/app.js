// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDKCI6ZLpRL5HHWrMf3KmftFJuzgKYgshQ",
  authDomain: "family-grocery-list-d75f8.firebaseapp.com",
  projectId: "family-grocery-list-d75f8",
  storageBucket: "family-grocery-list-d75f8.firebasestorage.app",
  messagingSenderId: "640152677933",
  appId: "1:640152677933:web:9917450889574c636712a4"
};

// Initialize Firebase
// const app = initializeApp(firebaseConfig);

// Initialize Firebase (compat libs loaded in index.html)
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

const addBtn = document.getElementById('addBtn');
const itemNameInput = document.getElementById('itemName');
const itemQtyInput = document.getElementById('itemQty');
const listBody = document.getElementById('listBody');
const statsEl = document.getElementById('stats');

addBtn.addEventListener('click', addItem);
itemNameInput.addEventListener('keyup', (e) => { if (e.key === 'Enter') addItem(); });

function sanitize(str){
  return String(str || '').trim();
}

async function addItem(){
  const name = sanitize(itemNameInput.value);
  const qty = parseInt(itemQtyInput.value) || 1;
  if (!name) { itemNameInput.focus(); return; }

  try {
    await db.collection('groceryItems').add({
      name,
      qty,
      checked: false,
      price: 0,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    itemNameInput.value = '';
    itemQtyInput.value = '';
  } catch (err) {
    console.error('Add item error', err);
    alert('Failed to add item.');
  }
}

// Real-time listener: order by createdAt
db.collection('groceryItems').orderBy('createdAt','asc').onSnapshot(snapshot => {
  const docs = [];
  snapshot.forEach(doc => docs.push({ id: doc.id, ...doc.data() }));
  renderList(docs);
}, err => {
  console.error('Listener error', err);
});

function renderList(items){
  listBody.innerHTML = '';
  let boughtCount = 0;
  let totalPrice = 0;
  items.forEach(item => {
    const tr = document.createElement('tr');
    if (item.checked) tr.classList.add('row-checked');

    const priceVal = (item.price || 0).toFixed ? (Number(item.price||0)).toFixed(2) : '0.00';
    const nameCell = `<td><strong>${escapeHtml(item.name)}</strong></td>`;
    const qtyCell = `<td class="col-qty">${item.qty || 1}</td>`;
    const priceCell = `<td>
      <input type="number" min="0" step="0.01" value="${priceVal}" data-id="${item.id}" class="price-input" />
    </td>`;
    const checkboxCell = `<td class="col-action">
      <input type="checkbox" ${item.checked ? 'checked' : ''} data-id="${item.id}" class="check-input"/>
    </td>`;
    const actionsCell = `<td class="col-action">
      <button class="btn btn-edit btn-small" data-id="${item.id}" data-action="edit">Edit</button>
      <button class="btn btn-delete btn-small" data-id="${item.id}" data-action="delete">Del</button>
    </td>`;

    tr.innerHTML = nameCell + qtyCell + priceCell + checkboxCell + actionsCell;
    listBody.appendChild(tr);

    if (item.checked) {
      boughtCount++;
      totalPrice += Number(item.price || 0);
    }
  });

  statsEl.innerText = `Items: ${items.length} • Bought: ${boughtCount} • Total Spent: $${totalPrice.toFixed(2)}`;

  // attach event handlers for newly created elements
  document.querySelectorAll('.check-input').forEach(inp => {
    inp.addEventListener('change', async (e) => {
      const id = e.target.dataset.id;
      try {
        await db.collection('groceryItems').doc(id).update({
          checked: e.target.checked,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
      } catch (err) { console.error(err); alert('Failed to toggle item'); }
    });
  });

  document.querySelectorAll('.price-input').forEach(inp => {
    inp.addEventListener('change', async (e) => {
      const id = e.target.dataset.id;
      const value = parseFloat(e.target.value) || 0;
      try {
        await db.collection('groceryItems').doc(id).update({
          price: value,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
      } catch (err) { console.error(err); alert('Failed to update price'); }
    });
  });

  document.querySelectorAll('button[data-action="edit"]').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const id = e.target.dataset.id;
      // Simple edit prompt for name and qty
      const doc = await db.collection('groceryItems').doc(id).get();
      const data = doc.data() || {};
      const newName = prompt('Edit item name:', data.name) || data.name;
      const newQty = prompt('Edit quantity:', data.qty || 1) || data.qty;
      try {
        await db.collection('groceryItems').doc(id).update({
          name: String(newName).trim(),
          qty: Number(newQty) || 1,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
      } catch (err) { console.error(err); alert('Failed to update item'); }
    });
  });

  document.querySelectorAll('button[data-action="delete"]').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const id = e.target.dataset.id;
      if (!confirm('Delete this item?')) return;
      try {
        await db.collection('groceryItems').doc(id).delete();
      } catch (err) { console.error(err); alert('Failed to delete item'); }
    });
  });
}

function escapeHtml(s){
  if(!s) return '';
  return s.replace(/[&<>"']/g, (m) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"}[m]));
}
