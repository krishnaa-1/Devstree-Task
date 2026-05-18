# User Availability and Slot Booking API  

## Description  
This project implements a role-based system where users and admins can manage availability slots. Users can add their availability within a 7-day range, while admins can view, book, and manage slots.  

## Features  

### Roles:  
1. **Admin:**  
   - View available slots date-wise.  
   - Book slots for users.  
   - Booked slot and adjacent slots are blocked for further booking.  

2. **User:**  
   - Add availability (date, start time, end time).  
   - Availability can be set for today up to 7 days ahead.  

---

## APIs  

### Authentication  
- **POST /api/login**  
  Authenticates users and returns a JWT token.  

### User API  
- **post('/availability', protect('User'), addAvailability)**  
  Adds availability for the user, with date, start time, and end time.  

### Admin APIs  
- **('/availability/:date', protect('Admin'), getAvailability**  
  Retrieves all available slots date-wise, divided into 30-minute intervals.  
- **post('/availability/book', protect('Admin'), bookSlot)**  
  Books an available slot for a user.  

---

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/krishnaa-1/Devstree-Task.git
cd Devstree-Task
```

### 2. Install Dependencies

```bash
cd backend
npm install

cd ../frontend
npm install
```

### 3. Environment Variables

Create `backend/.env`:

```env
MONGO_URI=your-mongodb-connection-string
JWT_SECRET=your-jwt-secret-key
PORT=5000
TOKEN_EXPIRY=1h
```

Create `frontend/.env`:

```env
VITE_API_URL=http://localhost:5000
```

### 4. Run the Application

```bash
cd backend
npm start
```

In another terminal:

```bash
cd frontend
npm run dev
```

Frontend: http://localhost:5173

## Deploy on Vercel

Deploy the app as two Vercel projects.

### Backend Project

Set the Vercel root directory to `backend`.

Set these environment variables:

```env
MONGO_URI=your-mongodb-connection-string
JWT_SECRET=your-jwt-secret-key
TOKEN_EXPIRY=1h
FRONTEND_URL=https://your-frontend-project.vercel.app
```

### Frontend Project

Set the Vercel root directory to `frontend`.

Set this environment variable:

```env
VITE_API_URL=https://your-backend-project.vercel.app
```

For local development, keep `frontend/.env` as shown above.

