Family Grocery List — Real-time app (Node + Firebase) with Analytics

Quick start:
1. Install dependencies:
   npm install

2. Configure Firebase:
   - Create a Firebase project at https://console.firebase.google.com
   - Create a Web app and copy the firebaseConfig object
   - Enable Firestore (create database)
   - For development you can start with test rules, but lock them before production

3. Edit public/app.js and public/analytics.js:
   - Replace the firebaseConfig placeholders with your project's config.

4. Run locally:
   npm run dev
   Open http://localhost:3000

Analytics:
- Open http://localhost:3000/analytics.html to see the spending over time chart.
- The analytics page aggregates items that are marked as bought (checked = true) and have price > 0.
