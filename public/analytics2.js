// IMPORTANT: Use the same firebaseConfig values as in app.js
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


firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

const ctx = document.getElementById('spendingChart').getContext('2d');
let chart = null;

function toDateKey(ts) {
  // ts can be a Firestore Timestamp or Date
  const d = ts && ts.toDate ? ts.toDate() : (ts ? new Date(ts) : new Date());
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

// Listen to changes and recompute daily spending
db.collection('groceryItems').orderBy('createdAt','asc').onSnapshot(snapshot => {
  const items = [];
  snapshot.forEach(doc => {
    const d = doc.data();
    items.push({ id: doc.id, ...d });
  });

  // Filter: only checked items with price > 0
  const bought = items.filter(i => i.checked && Number(i.price) > 0);

  // Aggregate by purchase date (use updatedAt if available, else createdAt)
  const daily = {};
  let total = 0;
  bought.forEach(i => {
    const ts = i.updatedAt || i.createdAt;
    const key = toDateKey(ts);
    daily[key] = (daily[key] || 0) + Number(i.price || 0);
    total += Number(i.price || 0);
  });

  // Sort keys (dates)
  const labels = Object.keys(daily).sort();
  const data = labels.map(k => daily[k]);

  // If no data, show message
  if (labels.length === 0) {
    document.getElementById('analyticsStats').innerText = 'No purchased items with price yet.';
    if (chart) { chart.destroy(); chart = null; }
    return;
  } else {
    document.getElementById('analyticsStats').innerText = `Total spent: $${total.toFixed(2)} • Days: ${labels.length}`;
  }

  // Build or update Chart.js chart
  if (chart) {
    chart.data.labels = labels;
    chart.data.datasets[0].data = data;
    chart.update();
  } else {
    chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Daily spending ($)',
          data,
          fill: true,
          tension: 0.2,
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: true },
          tooltip: { mode: 'index', intersect: false }
        },
        interaction: {
          mode: 'index',
          intersect: false
        },
        scales: {
          x: { display: true, title: { display: true, text: 'Date' } },
          y: { display: true, title: { display: true, text: 'USD' }, beginAtZero: true }
        }
      }
    });
  }
}, err => {
  console.error('Analytics listener error', err);
  document.getElementById('analyticsStats').innerText = 'Failed to load analytics: ' + err.message;
});
