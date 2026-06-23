# Flick

A full-stack video sharing platform built with the MERN stack. Users can upload videos, follow channels, build playlists, and interact through likes and comments — with a creator dashboard for tracking stats.

## Features

**Auth**
- Register with avatar and cover image upload
- Login / logout with access + refresh token rotation
- HTTP-only cookies for secure token storage
- Change password, update profile details

**Videos**
- Upload and stream videos via Cloudinary
- Search videos from the home feed
- Watch history tracking

**Social**
- Like / unlike videos and comments
- Comment on videos
- Subscribe / unsubscribe to channels
- Channel profile pages with subscriber counts

**Playlists**
- Create, rename, and delete playlists
- Add or remove videos from playlists
- View all your playlists

**Creator Dashboard**
- View total videos, total views, total likes, and total subscribers
- Manage uploaded videos (toggle publish, delete)

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React 19, React Router 7, Vite, Axios, Context API |
| Backend | Node.js, Express 5 |
| Database | MongoDB, Mongoose, mongoose-aggregate-paginate-v2 |
| Auth | JWT (access + refresh tokens), bcrypt |
| File Storage | Cloudinary, Multer |
| Security | express-rate-limit, HTTP-only cookies |

## Project Structure

```
flick/
├── backend/
│   └── src/
│       ├── controllers/   # comment, dashboard, like, playlist, subscription, user, video
│       ├── models/        # Mongoose schemas
│       ├── routes/        # Express routers
│       ├── middlewares/   # auth middleware
│       └── utils/         # ApiError, ApiResponse, asyncHandler, cloudinary
└── frontend/
    └── src/
        ├── pages/         # Home, VideoPlayer, Channel, Dashboard, Playlists, etc.
        ├── components/    # Navbar and shared UI
        ├── context/       # AuthContext, ToastContext
        └── api/           # Axios API calls
```

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- Cloudinary account

### Backend Setup

```bash
cd backend
npm install
cp .env.sample .env
# Fill in your values in .env
npm run dev
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

### Environment Variables

Create `backend/.env` based on `.env.sample`:

```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/flick
CORS_ORIGIN=http://localhost:5173

ACCESS_TOKEN_SECRET=your_access_token_secret
ACCESS_TOKEN_EXPIRY=1d
REFRESH_TOKEN_SECRET=your_refresh_token_secret
REFRESH_TOKEN_EXPIRY=10d

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

## API Overview

| Resource | Base Path |
|---|---|
| Auth / Users | `/api/v1/users` |
| Videos | `/api/v1/videos` |
| Comments | `/api/v1/comments` |
| Likes | `/api/v1/likes` |
| Playlists | `/api/v1/playlists` |
| Subscriptions | `/api/v1/subscriptions` |
| Dashboard | `/api/v1/dashboard` |
| Health Check | `/api/v1/healthcheck` |
