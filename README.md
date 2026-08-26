# 🌾 Farm Fusion - AI-Powered Agricultural Platform

> A comprehensive full-stack solution transforming modern farming through AI-driven crop recommendations, price prediction, disease detection, and multi-language support.

## 🎯 Features

### 🤖 Core AI Features
- **AI Crop Recommendations** - Intelligent crop suggestions based on soil type, season, and location
- **Smart Price Prediction** - 30-day market forecast with optimal selling time recommendations
- **Crop Disease Detection** - Image-based plant health analysis with organic & chemical treatments
- **Multi-Language Voice Assistant** - Support for English, Hindi, and Tamil languages
- **Weather Integration** - Real-time weather alerts and precipitation forecasts
- **Government Schemes** - Agricultural scheme recommendations and tracking

### 👥 Community & Marketplace
- **Interactive Marketplace** - Direct farmer-to-buyer transactions
- **Community Forum** - Knowledge sharing and peer support
- **Real-Time Messaging** - Socket.IO powered instant communication
- **Inventory Management** - Track crops and supplies in real-time

### 📊 Analytics & Admin
- **Soil Health Testing** - Track soil metrics and recommendations
- **Statistics Dashboard** - Performance analytics and insights
- **Admin Panel** - User management and platform monitoring
- **Notification System** - Price alerts and market opportunities

---

## 🏗️ Project Structure

```
_Farm_Fusion/
├── frontend/                 # React + Vite frontend application
│   ├── src/
│   │   ├── components/       # Reusable React components
│   │   ├── pages/            # Page components
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── public/               # Static assets
│   ├── package.json          # Frontend dependencies
│   ├── vite.config.js        # Vite configuration
│   └── README.md
│
├── backend/                  # Node.js/Express backend API
│   ├── config/               # Database & authentication config
│   ├── controllers/          # Business logic controllers
│   ├── models/               # MongoDB Mongoose schemas
│   ├── routes/               # API endpoint definitions
│   ├── middleware/           # Custom middleware (auth, validation)
│   ├── server.js             # Express server setup
│   ├── package.json          # Backend dependencies
│   └── package-lock.json
│
├── ml_backend/               # Python Flask ML service
│   ├── app.py                # Flask app with AI endpoints
│   ├── requirements.txt      # Python dependencies
│   └── models/               # ML models (if any)
│
├── package.json              # Root dependencies (Tailwind CSS)
├── .gitignore
└── README.md                 # This file

```

---

## 🛠️ Technology Stack

### Frontend
- **React 19** - UI framework
- **Vite** - Lightning-fast build tool
- **Tailwind CSS 4** - Utility-first styling
- **React Router v7** - Client-side routing
- **Socket.IO Client** - Real-time communication
- **Recharts** - Data visualization
- **Axios** - HTTP client
- **Lucide React** - Icon library

### Backend
- **Node.js + Express 5** - Server framework
- **MongoDB** - NoSQL database
- **Mongoose** - ODM for MongoDB
- **JWT** - Secure authentication
- **Passport.js** - OAuth 2.0 support (Google, Facebook)
- **Socket.IO** - WebSocket communication
- **Bcrypt** - Password hashing
- **CORS** - Cross-origin requests handling
- **Dotenv** - Environment variables

### ML Backend
- **Python 3.8+** - Programming language
- **Flask 3.0** - Lightweight web framework
- **Flask-CORS** - CORS handling
- **Hashlib** - Deterministic predictions (hash-based)

### Language Composition
- JavaScript: 98.5%
- Python: 1.4%
- Other: 0.1%

---

## 📋 Prerequisites

Ensure you have installed:
- **Node.js** (v16 or higher) - [Download](https://nodejs.org/)
- **npm** or **yarn** - Comes with Node.js
- **Python** (v3.8 or higher) - [Download](https://www.python.org/)
- **pip** - Comes with Python
- **MongoDB** - [Install locally](https://docs.mongodb.com/manual/installation/) or use [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- **Git** - [Download](https://git-scm.com/)

---

## 🚀 Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/kirtan1325/_Farm_Fusion.git
cd _Farm_Fusion
```

### 2. Install Root Dependencies

```bash
npm install
```

This installs Tailwind CSS and required root-level dependencies.

---

## 🔧 Running Each Module

### **FRONTEND - React + Vite**

#### Install Dependencies
```bash
cd frontend
npm install
```

#### Run Development Server
```bash
npm run dev
```
Frontend will be available at: **http://localhost:5173** (default Vite port)

#### Build for Production
```bash
npm run build
```

#### Preview Production Build
```bash
npm run preview
```

#### Lint Code
```bash
npm run lint
```

---

### **BACKEND - Node.js/Express API**

#### Install Dependencies
```bash
cd backend
npm install
```

#### Environment Setup
Create a `.env` file in the `backend/` directory:
```env
# Server Configuration
PORT=5001
NODE_ENV=development

# Database
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/farmfusion?retryWrites=true&w=majority
# Or local: mongodb://localhost:27017/farmfusion

# Authentication
JWT_SECRET=your_super_secret_jwt_key_here_change_in_production
JWT_EXPIRY=7d

# OAuth 2.0 Credentials
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret

# Frontend URL (CORS)
CLIENT_URL=http://localhost:3000
# Or production: https://yourdomain.com

# Weather API
WEATHER_API_KEY=your_openweathermap_api_key

# Email Configuration (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# Admin Credentials (for seeding)
ADMIN_EMAIL=admin@farmfusion.com
ADMIN_PASSWORD=secureAdminPassword123
```

#### Run Development Server
```bash
npm run dev
```
Backend API will be available at: **http://localhost:5001**

#### Start Production Server
```bash
npm start
```

#### Seed Database with Sample Data
```bash
npm run seed
```

#### Test (if configured)
```bash
npm test
```

---

### **ML BACKEND - Python Flask Service**

#### Install Dependencies
```bash
cd ml_backend
pip install -r requirements.txt
```

#### Create Virtual Environment (Recommended)
```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

#### Requirements
```
Flask==3.0.0
flask-cors==4.0.0
```

#### Run ML Service
```bash
python app.py
```
ML Backend will be available at: **http://localhost:5001**

**Note:** Both backend and ML service run on port 5001 by default. If running both locally, modify the ML backend port in `app.py`:
```python
if __name__ == '__main__':
    app.run(port=5002, debug=True)  # Change to 5002
```

---

## 🌐 Complete Startup Guide (All Services)

### Terminal 1: Frontend
```bash
cd frontend
npm install
npm run dev
```
✅ Frontend ready at: http://localhost:5173

### Terminal 2: Backend
```bash
cd backend
npm install
# Configure .env first!
npm run dev
```
✅ Backend API ready at: http://localhost:5001

### Terminal 3: ML Backend
```bash
cd ml_backend
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt
python app.py
```
✅ ML Service ready at: http://localhost:5001 (or custom port)

---

## 📡 API Endpoints Overview

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login with JWT
- `POST /api/auth/google` - Google OAuth login
- `POST /api/auth/facebook` - Facebook OAuth login
- `POST /api/auth/logout` - User logout

### AI Features
- `POST /predict-crop` - Get crop recommendations (ML)
- `POST /predict-price` - Get 30-day price forecast (ML)
- `POST /detect-disease` - Upload image for disease detection (ML)
- `POST /voice-assistant` - Multi-language voice queries (ML)

### Marketplace
- `GET /api/crops` - List all crops
- `POST /api/crops` - Create crop listing
- `GET /api/orders` - View orders
- `POST /api/requests` - Create purchase/sale requests

### Resources
- `GET /api/weather` - Weather data
- `GET /api/prices` - Current market prices
- `GET /api/schemes` - Government schemes
- `GET /api/advisory` - Agricultural advisory
- `GET /api/soil-health` - Soil test results

### Community
- `GET /api/forum` - Forum posts
- `GET /api/messages` - User messages
- `GET /api/notifications` - User notifications

---

## 🔐 Authentication Methods

### JWT (JSON Web Tokens)
- Email/password registration and login
- Token stored in `localStorage` (frontend)
- Automatically sent in request headers

### OAuth 2.0
- Google Sign-In
- Facebook Login
- Automatic account creation on first login

### Password Security
- bcryptjs: 10-round salt hashing
- Passwords never stored in plain text
- JWT expiration: 7 days

---

## 📦 Database Models

### User Schema
```javascript
{
  username: String,
  email: String (unique),
  password: String (hashed),
  role: String (farmer, buyer, admin),
  avatar: String (URL),
  bio: String,
  location: String,
  phone: String,
  verified: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### Crop Schema
```javascript
{
  name: String,
  season: String (Kharif, Rabi, Zaid),
  yield: Number,
  soilType: String,
  waterRequirement: Number,
  recommendedFertilizer: String,
  currentPrice: Number,
  createdBy: ObjectId (ref: User),
  createdAt: Date
}
```

### Order Schema
```javascript
{
  buyer: ObjectId (ref: User),
  seller: ObjectId (ref: User),
  crop: String,
  quantity: Number,
  price: Number,
  status: String (pending, confirmed, shipped, delivered),
  createdAt: Date,
  completedAt: Date
}
```

---

## 🧪 Testing the API

### Using cURL

#### Test Health Check
```bash
curl http://localhost:5001
```

#### Register User
```bash
curl -X POST http://localhost:5001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{\
    "username": "farmer1",\
    "email": "farmer@example.com",\
    "password": "SecurePass123"\
  }'
```

#### Login User
```bash
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{\
    "email": "farmer@example.com",\
    "password": "SecurePass123"\
  }'
```

#### Get ML Crop Recommendation
```bash
curl -X POST http://localhost:5001/predict-crop \
  -H "Content-Type: application/json" \
  -d '{\
    "soil_type": "Loamy",\
    "season": "Kharif",\
    "location": "Punjab"\
  }'
```

#### Get Price Prediction
```bash
curl -X POST http://localhost:5001/predict-price \
  -H "Content-Type: application/json" \
  -d '{"crop": "Wheat"}'
```

#### Disease Detection (Image Upload)
```bash
curl -X POST http://localhost:5001/detect-disease \
  -F "image=@/path/to/leaf-image.jpg"
```

### Using Postman
1. Download [Postman](https://www.postman.com/downloads/)
2. Import endpoints from API collection
3. Set `Authorization` header with JWT token: `Bearer <your_jwt_token>`
4. Test all endpoints with sample data

---

## 📊 Environment Variables Reference

| Variable | Purpose | Example |
|----------|---------|---------|
| PORT | Backend server port | 5001 |
| MONGO_URI | MongoDB connection string | mongodb+srv://user:pass@cluster.mongodb.net/db |
| JWT_SECRET | JWT signing key | your_secret_key_min_32_chars |
| CLIENT_URL | Frontend URL for CORS | http://localhost:5173 |
| WEATHER_API_KEY | OpenWeatherMap API key | abc123xyz789 |
| GOOGLE_CLIENT_ID | Google OAuth ID | xxxx.apps.googleusercontent.com |
| FACEBOOK_APP_ID | Facebook App ID | 1234567890 |

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/YourFeature`
3. **Commit** changes: `git commit -m 'Add YourFeature'`
4. **Push** to branch: `git push origin feature/YourFeature`
5. **Open** a Pull Request

### Contribution Guidelines
- Follow existing code style
- Add comments for complex logic
- Update README for new features
- Test thoroughly before submitting PR
- Include meaningful commit messages

---

## 🐛 Troubleshooting

### Frontend Issues

**Port 5173 already in use:**
```bash
# Kill the process or specify a different port
npm run dev -- --port 5174
```

**Module not found errors:**
```bash
rm -rf node_modules package-lock.json
npm install
```

### Backend Issues

**MongoDB Connection Error:**
- Verify MONGO_URI is correct
- Check MongoDB server is running
- Allow IP in MongoDB Atlas (if using cloud)

**JWT Secret Missing:**
```bash
# Add JWT_SECRET to .env file
echo "JWT_SECRET=your_secret_key_here" >> .env
```

**CORS Error:**
- Verify CLIENT_URL matches frontend URL in .env
- Check backend CORS configuration

### ML Backend Issues

**Python Module Not Found:**
```bash
pip install --upgrade pip
pip install -r requirements.txt
```

**Port Already in Use:**
```python
# Edit ml_backend/app.py
if __name__ == '__main__':
    app.run(port=5002, debug=True)  # Change port
```

---

## 📚 Documentation

- [Express.js Docs](https://expressjs.com/)
- [React Documentation](https://react.dev/)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [Vite Guide](https://vitejs.dev/)
- [Flask Documentation](https://flask.palletsprojects.com/)
- [Socket.IO Guide](https://socket.io/docs/)

---

## 📜 License

This project is licensed under the ISC License. See the LICENSE file for details.

---

## 👨‍💻 Author

**Kirtan** - Full Stack Developer

- GitHub: [@kirtan1325](https://github.com/kirtan1325)
- Project: [Farm Fusion](https://github.com/kirtan1325/_Farm_Fusion)

---

## 💡 Support & Questions

For issues, questions, or suggestions:
1. Check the [Troubleshooting](#-troubleshooting) section
2. Open a [GitHub Issue](https://github.com/kirtan1325/_Farm_Fusion/issues)
3. Check existing documentation

---

## 🎉 Thank You!

Thank you for using Farm Fusion! Together, we're revolutionizing modern farming through technology and innovation. 🌾✨

**Happy Farming!** 🚜
