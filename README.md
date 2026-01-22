# Manish's Master Plan Deployment Guide

This application is designed for high-performance personal productivity with private cloud sync via GitHub.

## 1. Setup Data Repository (Private)
1. Create a **Private** GitHub repository (e.g., `my-private-data`).
2. Generate a **Personal Access Token (classic)** at [GitHub Settings](https://github.com/settings/tokens).
   - Scopes required: `repo` (Full control of private repositories).
3. Copy this token.

## 2. Deploy Application to GitHub Pages
1. Push this code to a new repository.
2. Go to **Settings > Pages**.
3. Select **Deploy from a branch** (usually `main`).
4. Once deployed, visit the URL.

## 3. Configure Sync
1. Open the app.
2. Click the **Settings (Gear Icon)** in the sidebar.
3. Enter your Token, Username, and the Data Repo Name created in Step 1.
4. Click **Save Configuration**.
5. Click **Save All to GitHub** to initialize your cloud storage.

## Security Note
This app runs entirely in your browser. Your GitHub token is stored only in your browser's `localStorage` and is never sent to any server other than GitHub's official API.