// Admin Login Script

const loginForm = document.getElementById('loginForm');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const togglePassword = document.getElementById('togglePassword');
const errorMessage = document.getElementById('errorMessage');
const loadingOverlay = document.getElementById('loadingOverlay');
const loginBtn = document.getElementById('loginBtn');

// Check if already logged in
auth.onAuthStateChanged((user) => {
    if (user) {
        // User is signed in, redirect to dashboard
        window.location.href = 'dashboard.html';
    }
});

// Toggle password visibility
togglePassword.addEventListener('click', () => {
    const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordInput.setAttribute('type', type);
    togglePassword.querySelector('i').classList.toggle('fa-eye');
    togglePassword.querySelector('i').classList.toggle('fa-eye-slash');
});

// Show error message
function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
    setTimeout(() => {
        errorMessage.style.display = 'none';
    }, 5000);
}

// Show loading
function showLoading() {
    loadingOverlay.style.display = 'flex';
    loginBtn.disabled = true;
}

// Hide loading
function hideLoading() {
    loadingOverlay.style.display = 'none';
    loginBtn.disabled = false;
}

// Handle login form submission
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email || !password) {
        showError('Please fill in all fields');
        return;
    }

    showLoading();

    try {
        // Sign in with Firebase Auth
        await auth.signInWithEmailAndPassword(email, password);

        // Redirect to dashboard on success
        window.location.href = 'dashboard.html';
    } catch (error) {
        hideLoading();

        // Handle specific error codes
        switch (error.code) {
            case 'auth/invalid-email':
                showError('Invalid email address');
                break;
            case 'auth/user-disabled':
                showError('This account has been disabled');
                break;
            case 'auth/user-not-found':
                showError('No account found with this email');
                break;
            case 'auth/wrong-password':
                showError('Incorrect password');
                break;
            case 'auth/too-many-requests':
                showError('Too many failed attempts. Please try again later');
                break;
            default:
                showError('Login failed. Please try again');
                console.error('Login error:', error);
        }
    }
});

// Handle Enter key
passwordInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        loginForm.dispatchEvent(new Event('submit'));
    }
});
