import { 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  updateProfile
} from 'firebase/auth';

class AuthModal {
  constructor() {
    this.modal = document.querySelector('.auth-modal');
    this.form = this.modal?.querySelector('form');
    this.closeBtn = this.modal?.querySelector('.close-button');
    this.switchBtn = this.modal?.querySelector('.switch-mode');
    this.errorDiv = this.modal?.querySelector('.error-message');
    this.rememberMeCheckbox = this.modal?.querySelector('#remember-me');
    this.forgotPasswordBtn = this.modal?.querySelector('.forgot-password');
    this.googleBtn = this.modal?.querySelector('.google-signin');
    
    this.isLoginMode = true;
    this.setupEventListeners();
  }

  setupEventListeners() {
    console.log('Setting up event listeners...');
    if (!this.modal || !this.form || !this.closeBtn || !this.switchBtn) {
      console.error('Required elements not found');
      return;
    }

    console.log('Form found:', !!this.form);
    console.log('Close button found:', !!this.closeBtn);
    console.log('Switch button found:', !!this.switchBtn);

    this.form.addEventListener('submit', this.handleSubmit.bind(this));
    this.closeBtn.addEventListener('click', this.closeModal.bind(this));
    this.switchBtn.addEventListener('click', this.switchMode.bind(this));
    this.googleBtn?.addEventListener('click', this.handleGoogleSignIn.bind(this));
    this.forgotPasswordBtn?.addEventListener('click', this.handleForgotPassword.bind(this));

    console.log('Event listeners setup completed');
  }

  async handleSubmit(event) {
    event.preventDefault();
    console.log('Form submission started...');

    const formElements = {
      email: this.form.email.value,
      password: this.form.password.value,
      confirmPassword: this.form.confirmPassword?.value,
      rememberMe: this.rememberMeCheckbox?.checked
    };

    console.log('Form elements found:', formElements);

    try {
      // Set persistence based on remember me checkbox
      await setPersistence(auth, formElements.rememberMe ? browserLocalPersistence : browserSessionPersistence);

      if (this.isLoginMode) {
        const userCredential = await signInWithEmailAndPassword(auth, formElements.email, formElements.password);
        console.log('Login successful:', userCredential.user.email);
      } else {
        if (formElements.password !== formElements.confirmPassword) {
          throw new Error('Passwords do not match');
        }
        const userCredential = await createUserWithEmailAndPassword(auth, formElements.email, formElements.password);
        // Set display name as email username
        const displayName = formElements.email.split('@')[0];
        await updateProfile(userCredential.user, {
          displayName: displayName
        });
        console.log('Registration successful:', userCredential.user.email);
      }

      this.closeModal();
      window.location.reload();
    } catch (error) {
      console.error('Form submission error:', error);
      this.showError(this.getErrorMessage(error.code || error.message));
    }

    console.log('Form submission completed');
  }

  async handleGoogleSignIn() {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      console.log('Google sign in successful:', result.user.email);
      this.closeModal();
      window.location.reload();
    } catch (error) {
      console.error('Google sign in error:', error);
      this.showError(this.getErrorMessage(error.code));
    }
  }

  async handleForgotPassword(event) {
    event.preventDefault();
    const email = this.form.email.value;

    if (!email) {
      this.showError('Please enter your email address');
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      this.showSuccess('Password reset email sent. Please check your inbox.');
    } catch (error) {
      console.error('Password reset error:', error);
      this.showError(this.getErrorMessage(error.code));
    }
  }

  switchMode() {
    this.isLoginMode = !this.isLoginMode;
    this.updateModalUI();
  }

  updateModalUI() {
    const title = this.modal.querySelector('.modal-title');
    const submitBtn = this.form.querySelector('button[type="submit"]');
    const confirmPasswordField = this.form.querySelector('.confirm-password-field');
    
    if (this.isLoginMode) {
      title.textContent = 'Login';
      submitBtn.textContent = 'Sign In';
      this.switchBtn.textContent = 'Need an account? Register';
      confirmPasswordField?.classList.add('hidden');
      this.forgotPasswordBtn?.classList.remove('hidden');
    } else {
      title.textContent = 'Register';
      submitBtn.textContent = 'Sign Up';
      this.switchBtn.textContent = 'Already have an account? Login';
      confirmPasswordField?.classList.remove('hidden');
      this.forgotPasswordBtn?.classList.add('hidden');
    }
  }

  getErrorMessage(code) {
    const errorMessages = {
      'auth/wrong-password': 'Invalid password',
      'auth/user-not-found': 'No account found with this email',
      'auth/email-already-in-use': 'Email already registered',
      'auth/weak-password': 'Password should be at least 6 characters',
      'auth/invalid-email': 'Invalid email address',
      'auth/too-many-requests': 'Too many attempts. Please try again later',
      'auth/network-request-failed': 'Network error. Please check your connection',
      'auth/popup-closed-by-user': 'Google sign in was cancelled',
      'auth/cancelled-popup-request': 'Only one popup can be open at a time',
      'auth/popup-blocked': 'The sign in popup was blocked by your browser'
    };
    return errorMessages[code] || code || 'An error occurred during authentication';
  }

  showError(message) {
    if (this.errorDiv) {
      this.errorDiv.textContent = message;
      this.errorDiv.classList.remove('success');
      this.errorDiv.classList.add('error');
      this.errorDiv.style.display = 'block';
    }
  }

  showSuccess(message) {
    if (this.errorDiv) {
      this.errorDiv.textContent = message;
      this.errorDiv.classList.remove('error');
      this.errorDiv.classList.add('success');
      this.errorDiv.style.display = 'block';
    }
  }

  closeModal() {
    this.modal.style.display = 'none';
    this.form.reset();
    if (this.errorDiv) {
      this.errorDiv.style.display = 'none';
    }
  }

  open(mode = 'login') {
    this.isLoginMode = mode === 'login';
    this.updateModalUI();
    this.modal.style.display = 'block';
  }
}

export default AuthModal; 