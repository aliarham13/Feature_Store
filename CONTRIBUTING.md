# Contributing to Feature Store (Eddy)

Thank you for your interest in contributing to the project! We welcome contributions of all levels, especially from first-time open-source contributors.

---

## 🚀 Quick Setup for Local Development

1. **Fork and clone the repository:**
   ```bash
   git clone https://github.com/<your-username>/Feature_Store.git
   cd Feature_Store
   ```

2. **Create a new branch:**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Configure environment:**
   ```bash
   # On Linux / macOS
   cp .env.example .env

   # On Windows PowerShell
   Copy-Item .env.example .env
   ```

4. **Run with Docker:**
   ```bash
   docker compose up -d --build
   ```
   Open the console at `http://localhost:8000`.

---

## 🎯 How to Contribute

- **Good First Issues:** Check the [issues tab](https://github.com/midhunsomu/Feature_Store/issues) for issues tagged with `good first issue`.
- **Comment first:** Please comment on the issue you wish to work on so we can assign it to you and avoid duplicate work.
- **Commit messages:** Write clear, concise commit messages (e.g. `docs: update setup steps`, `fix: add input validation`).

---

## 📥 Submitting a Pull Request (PR)

1. Push your branch to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```
2. Open a Pull Request targeting the `main` branch.
3. Describe the changes made and link the related issue (`Fixes #123`).

Thank you for helping make this project better! ⭐
