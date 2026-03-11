# ThreadForge Studio

ThreadForge Studio is a full-stack custom apparel platform where shoppers can generate AI-powered T-shirt artwork, upload their own graphics, customize print placement, and place paid orders.

## Stack

- Frontend: React, Vite, Tailwind CSS, Framer Motion, React Router, Fabric.js
- Backend: Node.js, Express, MongoDB, Mongoose, JWT
- Integrations: OpenAI image generation, Cloudinary uploads, Stripe checkout, Resend email

## Apps

- `frontend`: customer-facing storefront and AI design studio
- `backend`: REST API, auth, order processing, AI generation, storage integrations

## Local setup

1. Copy `backend/.env.example` to `backend/.env`
2. Copy `frontend/.env.example` to `frontend/.env`
3. Install dependencies with `npm install`
4. Run frontend with `npm run dev:frontend`
5. Run backend with `npm run dev:backend`
6. Optionally seed catalog data with `npm run seed --workspace backend`

## Docker

- Start the full stack with `docker compose up --build`
- Frontend preview runs on `http://localhost:4173`
- Backend API runs on `http://localhost:5000`
- MongoDB runs on `mongodb://localhost:27017`

## Production notes

- Configure Stripe webhook signing secret on the backend
- Provide Cloudinary credentials for image storage
- Provide OpenAI key for prompt-based image generation
- Set CORS origins to your deployed frontend host
- If using MongoDB Atlas, ensure Atlas Network Access allows your host (Render often requires temporarily allowing `0.0.0.0/0`), and set `MONGODB_URI` in your hosting provider’s environment variables
- Build frontend with `npm run build --workspace frontend`
- Start backend with `npm run start --workspace backend`
# ThreadForge-Studio
