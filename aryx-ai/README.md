# Aryx AI — Modern AI Chatbot Website

Aryx AI adalah website asisten AI modern full-stack berbasis web yang terinspirasi oleh antarmuka premium ChatGPT. Aplikasi ini dibangun secara tangguh dengan frontend interaktif (React + Vite), backend aman (Express.js), penyimpanan SQLite persisten, dan integrasi API model AI (Groq, Google Gemini & OpenAI) dengan respons streaming (Server-Sent Events).

---

## 1. Fitur Utama

- **Antarmuka Premium & Responsif**:
  - Tema Mode Gelap (default: `#0B0D12`, `#10131B`, `#171B25`, aksen `#7C6CFF` & `#45D6C5`) dan Mode Terang.
  - Tipografi Google Fonts Inter dengan micro-animations dan layout responsif untuk Desktop, Tablet, dan Mobile (drawer sidebar).
- **Halaman Awal Intuitif**:
  - Welcome screen dengan sambutan dan 4 kartu prompt siap pakai.
- **Percakapan Real-Time Streaming**:
  - Pengiriman pesan dengan Enter (Shift+Enter untuk baris baru).
  - Streaming token demi token menggunakan Server-Sent Events (SSE).
  - Tombol **Hentikan** generasi aktif untuk membatalkan streaming secara instan.
  - Indikator berpikir/animasi titik loading saat menunggu respons pertama.
- **Penyimpanan Riwayat Percakapan (SQLite)**:
  - Tersimpan secara persisten di database SQLite lokal via `node:sqlite` (DatabaseSync).
  - Daftar riwayat dikelompokkan berdasarkan tanggal (*Hari Ini*, *Kemarin*, *7 Hari Terakhir*, *30 Hari Terakhir*, *Lebih Lama*).
  - Fitur ubah nama (rename) judul dan hapus percakapan per item.
  - Auto-generate judul percakapan secara otomatis dari pesan pertama.
  - Hapus semua riwayat percakapan dengan modal konfirmasi keamanan.
- **Konteks Percakapan Dinamis**:
  - Riwayat percakapan terbaru dikirimkan kembali ke model AI agar memahami konteks tanya-jawab sebelumnya.
  - Pembatasan konteks (`MAX_CONTEXT_MESSAGES`) untuk mencegah token overflow.
- **Format Markdown & Blok Kode Lengkap**:
  - Syntax highlighting dengan blok kode terformat rapi dan tombol salin (copy to clipboard).
  - Dukungan tabel, link aman (`target="_blank"`), blockquote, daftar bertingkat, dan formatting teks.
  - Aksi pesan AI: Salin jawaban, Buat ulang jawaban (Regenerate), tombol Suka (thumbs up), dan Tidak Suka (thumbs down).
- **Pencarian Riwayat**:
  - Kolom pencarian realtime yang memfilter riwayat percakapan berdasarkan judul maupun isi pesan.
- **Panel Pengaturan (Settings Modal)**:
  - Pemilih tema Dark/Light.
  - Pemilih model AI langsung dari header.
  - Pemantauan status sistem & database.
  - Opsi reset/hapus data percakapan.

---

## 2. Arsitektur & Teknologi

### Frontend
- **React 19** + **Vite 6**
- **Vanilla CSS / CSS Custom Properties** untuk fleksibilitas tema dan estetika visual modern.
- **Lucide React** untuk icon set yang rapi dan konsisten.
- **React Markdown** + **remark-gfm** untuk rendering markdown dan tabel.
- **React Syntax Highlighter** (`Prism` + `oneDark`) untuk pewarnaan sintaksis kode.

### Backend
- **Node.js 22+ / 24+**
- **Express.js** untuk REST API & SSE streaming.
- **Native `node:sqlite` (`DatabaseSync`)**: Akses SQLite langsung tanpa ketergantungan compiler C++ / Python (zero external native build).
- **Lapisan Repository (`repository.js`)**: Memisahkan logika database dari controller sehingga mudah dimigrasikan ke PostgreSQL di kemudian hari.
- **Helmet**: Keamanan HTTP header.
- **CORS**: Pengendalian origin frontend.
- **Express Rate Limit**: Pembatasan request untuk mencegah penyalahgunaan API.

### AI Integration
- **SDK Resmi Google**: `@google/generative-ai` (Gemini 1.5 Flash, Gemini 1.5 Pro, Gemini 2.0 Flash).
- **SDK Resmi OpenAI**: `openai` (GPT-4o Mini, GPT-4o, kompatibel dengan Groq, Ollama, OpenRouter).
- **Desain Abstraksi Provider (`aiProvider.js`)**: Ganti model atau provider cukup lewat variabel environment tanpa mengubah frontend.

---

## 3. Struktur Direktori

```
aryx-ai/
├── client/                     # Frontend React + Vite
│   ├── public/
│   ├── src/
│   │   ├── components/         # ChatInput, MessageBubble, MarkdownRenderer,
│   │   │                       # Sidebar, WelcomeScreen, SettingsModal
│   │   ├── hooks/              # useTheme (dark/light)
│   │   ├── services/           # api.js (REST & SSE streaming client)
│   │   ├── styles/             # index.css (Design system & responsive styles)
│   │   ├── App.jsx             # Root layout & orchestration
│   │   └── main.jsx            # Entry point
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── server/                     # Backend Express
│   ├── src/
│   │   ├── config/             # index.js (Membaca env variables & limits)
│   │   ├── controllers/        # chatController, conversationsController, healthController
│   │   ├── db/                 # database.js (SQLite setup) & repository.js (Data layer)
│   │   ├── routes/             # api.js
│   │   ├── services/           # aiProvider.js (Google Gemini & OpenAI integration)
│   │   ├── app.js              # Express app, middleware, security & error handler
│   │   └── server.js           # Entry point & graceful shutdown
│   ├── test/                   # Automated tests (Node test runner)
│   │   └── api.test.js
│   └── package.json
├── .env.example                # Template variabel environment
├── .gitignore
├── README.md
└── package.json                # Root script orchestrator
```

---

## 4. Persyaratan Sistem

- **Node.js**: Versi 22.0.0 atau lebih tinggi (disarankan Node.js 24).
- **NPM**: Versi 10 atau lebih baru.
- Koneksi internet untuk mengunduh packages dan menghubungi API model AI.

---

## 5. Cara Instalasi

1. Clone atau buka folder proyek `aryx-ai`:
   ```bash
   cd aryx-ai
   ```

2. Pasang semua dependensi (root, server, dan client):
   ```bash
   npm run install:all
   ```
   *Atau pasang manual di masing-masing folder:*
   ```bash
   npm install
   cd client && npm install
   cd ../server && npm install
   ```

---

## 6. Konfigurasi Environment (`.env`)

Buat file `.env` di dalam folder `server/` (atau salin dari `.env.example` di root):

```bash
# Di dalam folder server/.env
PORT=3001
FRONTEND_ORIGIN=http://localhost:5173

# Konfigurasi AI Provider ('google' atau 'openai')
AI_PROVIDER=google
AI_MODEL=gemini-1.5-flash
AI_API_KEY=your_actual_api_key_here

# Opsional: Base URL jika menggunakan penyedia OpenAI-compatible (Groq / OpenRouter / Ollama)
# AI_BASE_URL=https://api.groq.com/openai/v1

# Pengaturan Batasan (Limits)
MAX_CONTEXT_MESSAGES=20
MAX_MESSAGE_LENGTH=10000
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=30
```

### Cara Memperoleh API Key:
1. **Google Gemini (Gratis & Cepat)**:
   - Kunjungi [Google AI Studio](https://aistudio.google.com/).
   - Masuk dengan akun Google Anda dan klik **"Get API key"**.
   - Salin kunci dan tempelkan ke `AI_API_KEY=...` di file `.env`.
2. **OpenAI**:
   - Kunjungi [OpenAI Platform](https://platform.openai.com/api-keys).
   - Buat secret key baru, lalu atur `AI_PROVIDER=openai`, `AI_MODEL=gpt-4o-mini`, dan `AI_API_KEY=...`.

> **Catatan Keamanan**: Jika `AI_API_KEY` belum diisi, server tetap dapat berjalan normal dan frontend akan menampilkan pesan panduan konfigurasi yang ramah tanpa menyebabkan crash. API key disimpan secara eksklusif di backend dan tidak pernah dikirim ke browser.

---

## 7. Cara Menjalankan Aplikasi

### Mode Pengembangan (Development)
Jalankan kedua layanan (backend port 3001 & frontend port 5173) secara bersamaan dari root folder:
```bash
npm run dev
```

Atau jalankan di terminal terpisah:
- **Terminal 1 (Backend)**:
  ```bash
  npm run dev:server
  ```
- **Terminal 2 (Frontend)**:
  ```bash
  npm run dev:client
  ```

Buka browser di **`http://localhost:5173`**.

---

## 8. Menjalankan Pengujian Otomatis

Aplikasi dilengkapi dengan automated test suite menggunakan Node.js built-in test runner:
```bash
npm test
```
Pengujian mencakup:
- Pemeriksaan endpoint `GET /api/health` dan validasi proteksi kebocoran API key.
- Siklus hidup CRUD percakapan (Create, Read, Update, Delete, List).
- Validasi penolakan pesan kosong.
- Penanganan ID percakapan tidak valid.
- Verifikasi repository database untuk pencarian dan pemotongan konteks pesan.

---

## 9. Catatan Keamanan & Keterbatasan

1. **Penyimpanan Lokal Single-User**:
   - Database SQLite saat ini ditujukan untuk satu pengguna lokal / tahap pengembangan.
   - Belum ada sistem otentikasi login multi-user. Jika ingin di-deploy ke lingkungan publik untuk banyak pengguna, tambahkan middleware otentikasi (JWT / session) dan kolom `user_id` pada tabel percakapan.
2. **Proteksi API Key**:
   - Variabel rahasia (`AI_API_KEY`) hanya dibaca oleh backend Node.js dan tidak pernah disertakan dalam bundle Vite frontend atau endpoint API.
3. **Rate Limiting & Input Validation**:
   - Endpoint chat dilindungi oleh rate limiter dan pembatasan ukuran payload untuk mencegah serangan Denial-of-Service atau pemborosan kuota API.
