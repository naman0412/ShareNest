# 🏡 ShareNest — Local Peer-to-Peer Rental & Sharing Platform

> *"Share more. Buy less."*

ShareNest is a community-driven web application where neighbors can rent, lend, or borrow everyday items like electronics, tools, cameras, camping gear, and books in their local area (e.g., Indore, Ujjain, Dewas).

Built with the **MERN Stack** (MongoDB, Express, React, Node.js), Tailwind CSS, Vite, and JWT Authentication.

---

## 🚀 Live Deployment Guide (Render + MongoDB Atlas)

### Step 1: Set Up MongoDB Atlas (Cloud Database)

1. Log in to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Click **Create** to launch a new database:
   - Select the **M0 Free Tier** (Shared).
   - Select cloud provider & region (e.g., AWS / Singapore or Mumbai).
   - Click **Create Deployment**.
3. **Create Database User**:
   - Go to **Security** → **Database Access** → **Add New Database User**.
   - Authentication Method: **Password**.
   - Username: `sharenest_admin`
   - Password: `YourStrongPassword123!`
   - Role: **Atlas Admin** or **Read and write to any database**.
   - Click **Add User**.
4. **Whitelist Network Access (IP Whitelist)**:
   - Go to **Security** → **Network Access** → **Add IP Address**.
   - Select **Allow Access From Anywhere** (`0.0.0.0/0`) — *essential so Render cloud instances can reach your MongoDB Atlas instance*.
   - Click **Confirm**.
5. **Get your Connection String**:
   - Go to **Database** → click **Connect** next to your cluster.
   - Choose **Drivers** (Node.js).
   - Copy your connection string:
     ```text
     mongodb+srv://sharenest_admin:<password>@cluster0.xxxxx.mongodb.net/sharenest?retryWrites=true&w=majority
     ```
   - Replace `<password>` with your database password and ensure `/sharenest` is the database name.

---

### Step 2: Push Changes to GitHub

In your project terminal:
```bash
git add .
git commit -m "feat: configure ShareNest for Render and MongoDB Atlas deployment"
git push origin main
```

---

### Step 3: Deploy on Render

ShareNest is configured with single-service monorepo deployment (Express serves both the API and the React production build on the same domain, with zero CORS issues).

1. Log in to [dashboard.render.com](https://dashboard.render.com).
2. Click **New +** → **Web Service**.
3. Connect your GitHub repository: `https://github.com/naman0412/ShareNest`.
4. Configure the service:
   - **Name**: `sharenest`
   - **Region**: Singapore (or Oregon)
   - **Branch**: `main`
   - **Root Directory**: *(Leave blank)*
   - **Runtime**: `Node`
   - **Build Command**:
     ```bash
     npm run build
     ```
   - **Start Command**:
     ```bash
     npm start
     ```
   - **Plan**: `Free`
5. Under **Environment Variables**, add:
   - `NODE_ENV`: `production`
   - `MONGODB_URI`: *Your MongoDB Atlas connection URI from Step 1*
   - `JWT_SECRET`: *Any secure random 32-character string*
6. Click **Deploy Web Service**!

---

### Step 4: Seed Database with Sample Items

Once your MongoDB Atlas cluster is running, populate it with 10 users and 25 items by running:

```powershell
cd server
$env:MONGODB_URI="mongodb+srv://sharenest_admin:<password>@cluster0.xxxxx.mongodb.net/sharenest?retryWrites=true&w=majority"
npm run seed
```

---

## 👥 Seed Accounts

- **Email**: `user1@example.com` ... `user10@example.com`
- **Password**: `password123`
