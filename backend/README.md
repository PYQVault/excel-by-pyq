backend/
├── config/
│   └── db.js              ← MongoDB connection logic
├── models/
│   ├── User.js
│   ├── Question.js
│   ├── Quiz.js
│   └── QuizAttempt.js
├── routes/
│   ├── authRoutes.js
│   ├── quizRoutes.js
│   └── attemptRoutes.js
├── controllers/
│   ├── authController.js
│   ├── quizController.js
│   └── attemptController.js
├── middleware/
│   ├── authMiddleware.js   ← JWT protect middleware
│   └── errorMiddleware.js  ← Global error handler
├── scripts/
│   └── importQuiz.js
├── .env
├── .gitignore
├── server.js              ← Entry point
└── package.json 

Step 3A → Auth API       (register, login)
Step 3B → Quiz API       (list, single quiz)
Step 3C → Attempt API    (start/resume, answer, submit)
Step 4  → Frontend Setup (React + Tailwind + folders)
Step 5  → Auth Pages     (Login, Register)
Step 6  → Quiz List Page
Step 7  → Quiz Engine    (Question + Palette + Timer)
Step 8  → Results Page
Step 9  → Dark/Light Mode + Final Polish