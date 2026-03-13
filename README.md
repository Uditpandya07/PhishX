PhishX: AI-Powered Phishing Detection
Because the internet should be safe, and security tools shouldn't be boring.

Welcome to PhishX! 👋

PhishX is a full-stack web application designed to stop phishing attacks in their tracks. Instead of relying on static blocklists, PhishX uses a Machine Learning model to analyze the actual "DNA" of a URL in real-time, predicting whether a link is safe or malicious with a detailed risk score.

I built this project to combine serious cybersecurity with a beautiful, modern user interface. It’s not just a script in a terminal; it’s a fully interactive, animated, glassmorphism-styled dashboard.

🚀 What Makes It Tick? (The Tech Stack)
I wanted this app to be fast, accurate, and stunning. Here is what I used to build it:

🧠 The Brains (Backend & ML)
Python & FastAPI: Chosen for blazing-fast API responses so users don't have to wait.

Scikit-learn (Random Forest): The core AI model. It's trained on a balanced dataset of safe and phishing URLs.

Feature Extraction: The backend actively breaks down the URL to look for red flags—like excessive length, missing HTTPS, weird symbols (@, -), and raw IP addresses.

✨ The Beauty (Frontend)
React + Vite: For a snappy, component-driven user interface.

Framer Motion & GSAP: Smooth page transitions, animated risk bars, and dynamic hover effects.

OGL (WebGL): Powers the interactive 3D orb on the landing page for that "wow" factor.

Custom CSS: A sleek, dark-mode glassmorphism design that makes security look incredibly cool.

💡 How It Works (Behind the Scenes)
You drop a link: Paste any suspicious URL into the PhishX dashboard.

We dissect it: The FastAPI backend instantly tears the URL apart, counting digits, checking for subdomains, and looking for sneaky IP routing.

The AI decides: These features are fed into our pre-trained Random Forest model.

The Verdict: The frontend lights up with the result—giving you a clear ✅ Safe or 🚨 Phishing verdict, alongside a percentage-based Risk Score.

🛠️ Features
Real-Time Scanning: Instant threat detection with zero lag.

Detailed Risk Scoring: We don't just say "bad link"—we tell you how bad it is (e.g., 94% Phishing Probability).

Stunning UI/UX: An immersive dashboard with a WebGL animated background (Background.jsx), electric borders, and fluid animations.

User Authentication (UI): Built-in modals for logging in and signing up to track scan history.

Extensible API: Easily connect the /predict endpoint to other apps or browser extensions.

💻 Let's Get It Running
Want to run PhishX on your own machine? It's split into two parts: the backend server and the frontend client.

Step 1: Fire up the Backend & AI Model
Open your terminal and navigate to the project folder:

Bash
# 1. Create a virtual environment so we keep things clean
python -m venv venv

# 2. Activate the environment
# On Windows:
venv\Scripts\activate  
# On macOS/Linux:
# source venv/bin/activate  

# 3. Install all the necessary Python libraries
pip install -r requirements.txt

# 4. Train the Machine Learning model (it takes just a moment!)
cd model
python train_model.py
cd ..

# 5. Start the FastAPI server
uvicorn backend.main:app --reload
Awesome, your AI backend is now listening at http://127.0.0.1:8000!

Step 2: Launch the Frontend
Open a new terminal window/tab, and let's get the React app running:

Bash
# 1. Move into the frontend directory
cd phishx-frontend

# 2. Install the Node modules
npm install

# 3. Start the Vite development server
npm run dev
Click the local link Vite gives you (usually http://localhost:5173), click past the glowing orb on the landing page, and start scanning!

👨‍💻 About the Author
Built with ❤️ and lots of coffee by Udit Pandya (B.Tech CSE).

I built PhishX to explore the intersection of Machine Learning, web security, and modern frontend design. Feel free to explore the code, fork it, or reach out if you have ideas for making it even better!