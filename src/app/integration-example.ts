/**
 * ISPORA AUTHENTICATION - BACKEND INTEGRATION EXAMPLE
 * 
 * This file demonstrates how to integrate your HTML authentication UI
 * with the backend API endpoints.
 * 
 * Copy the relevant functions into your IsporaAuth.html <script> section.
 */

import * as auth from './utils/auth';

// ═══════════════════════════════════════════════════════════
// EXAMPLE: Sign Up Flow with Backend Integration
// ═══════════════════════════════════════════════════════════

/**
 * Replace your submitSignup1() function with this version
 */
async function submitSignup1_withBackend() {
  // Validate form (keep your existing validation)
  let ok = true;
  const firstName = document.getElementById('firstName').value.trim();
  const lastName = document.getElementById('lastName').value.trim();
  const email = document.getElementById('emailInput').value.trim();
  const password = document.getElementById('pwdInput').value;
  
  if (!firstName) { showErr('firstNameErr'); ok = false; }
  if (!lastName) { showErr('lastNameErr'); ok = false; }
  if (!email || !email.includes('@')) { showErr('emailErr'); ok = false; }
  if (password.length < 8) { showErr('pwdErr'); ok = false; }
  if (!document.getElementById('termsCheck').checked) { 
    showToast('Please agree to the Terms of Service', 'error'); 
    ok = false; 
  }
  
  if (!ok) return;

  // Show loading state
  showToast('Creating your account...', '');

  // Call backend API
  const result = await auth.signup({
    email,
    password,
    firstName,
    lastName,
    role: selectedRole // 'diaspora' or 'student'
  });

  if (!result.success) {
    showToast(result.error || 'Signup failed', 'error');
    return;
  }

  // Store email for verification step
  window.userEmail = email;
  
  // Log OTP for demo (in production, user receives via email)
  console.log('🔐 Your verification code:', result.otp);
  
  // Move to verification screen
  document.getElementById('verifyEmail').textContent = email;
  goTo('screen-verify');
  showToast('Verification code sent to ' + email, 'success');
}

// ═══════════════════════════════════════════════════════════
// EXAMPLE: OTP Verification with Backend
// ═══════════════════════════════════════════════════════════

/**
 * Replace your verifyOtp() function with this version
 */
async function verifyOtp_withBackend() {
  const code = getOtpValue();
  
  if (code.length < 6) {
    showToast('Please enter the full 6-digit code', 'error');
    return;
  }

  // Show loading state
  showToast('Verifying code...', '');

  // Call backend API
  const result = await auth.verifyOTP({
    email: window.userEmail,
    otp: code
  });

  if (!result.success) {
    showErr('otpErr');
    showToast(result.error || 'Invalid code', 'error');
    return;
  }

  // Verification successful
  showToast('Email verified!', 'success');
  
  // Build onboarding fields and move to next screen
  buildOnboardFields();
  goTo('screen-onboard');
}

// ═══════════════════════════════════════════════════════════
// EXAMPLE: Sign In with Backend
// ═══════════════════════════════════════════════════════════

/**
 * Replace your submitSignin() function with this version
 */
async function submitSignin_withBackend() {
  const email = document.getElementById('signinEmail').value.trim();
  const password = document.getElementById('signinPwd').value;
  
  if (!email || !email.includes('@')) {
    showErr('signinEmailErr');
    return;
  }
  
  if (!password) {
    showErr('signinPwdErr');
    return;
  }

  // Show loading state
  showToast('Signing you in...', '');

  // Call backend API
  const result = await auth.signin({ email, password });

  if (!result.success) {
    showToast(result.error || 'Sign in failed', 'error');
    return;
  }

  // Store user data
  window.currentUser = result.user;

  // Redirect to dashboard
  showToast('Welcome back, ' + result.user.firstName + '!', 'success');
  setTimeout(() => {
    goToDashboard();
  }, 1500);
}

// ═══════════════════════════════════════════════════════════
// EXAMPLE: Onboarding with Backend
// ═══════════════════════════════════════════════════════════

/**
 * Replace your submitOnboard() function with this version
 */
async function submitOnboard_withBackend() {
  // Collect form data based on role
  let profileData = {};

  if (selectedRole === 'diaspora') {
    const inputs = document.querySelectorAll('#onboardFields input');
    const selectedChips = Array.from(document.querySelectorAll('.sel-chip.on'))
      .map(chip => chip.textContent);

    profileData = {
      country: inputs[0]?.value || '',
      field: inputs[1]?.value || '',
      currentRole: inputs[2]?.value || '',
      offerings: selectedChips
    };
  } else {
    const inputs = document.querySelectorAll('#onboardFields input');
    const select = document.querySelector('#onboardFields select');
    const selectedChips = Array.from(document.querySelectorAll('.sel-chip.on'))
      .map(chip => chip.textContent);

    profileData = {
      university: inputs[0]?.value || '',
      courseOfStudy: inputs[1]?.value || '',
      yearOfStudy: select?.value || '',
      mentorshipNeeds: selectedChips
    };
  }

  // Show loading state
  showToast('Saving your profile...', '');

  // Call backend API
  const result = await auth.completeOnboarding({ profileData });

  if (!result.success) {
    showToast(result.error || 'Failed to save profile', 'error');
    return;
  }

  // Update success screen
  const firstName = document.getElementById('firstName')?.value || 'User';
  document.getElementById('successTitle').textContent = 'Welcome to Ispora, ' + firstName + '!';
  document.getElementById('successSub').textContent = selectedRole === 'diaspora'
    ? 'Your mentor profile is live. Students can now discover and connect with you.'
    : 'Your student profile is ready. Start browsing mentors and sending requests.';
  
  goTo('screen-success');
}

// ═══════════════════════════════════════════════════════════
// EXAMPLE: Resend OTP with Backend
// ═══════════════════════════════════════════════════════════

/**
 * Add this function to handle OTP resend
 */
async function resendOtpCode() {
  if (!window.userEmail) {
    showToast('Email not found', 'error');
    return;
  }

  const result = await auth.resendOTP(window.userEmail);

  if (!result.success) {
    showToast(result.error || 'Failed to resend code', 'error');
    return;
  }

  console.log('🔐 New verification code:', result.otp);
  showToast('New code sent!', 'success');
}

// ═══════════════════════════════════════════════════════════
// EXAMPLE: Forgot Password with Backend
// ═══════════════════════════════════════════════════════════

/**
 * Replace your submitForgot() function with this version
 */
async function submitForgot_withBackend() {
  const email = document.getElementById('forgotEmail').value.trim();
  
  if (!email || !email.includes('@')) {
    showToast('Please enter a valid email', 'error');
    return;
  }

  const result = await auth.forgotPassword(email);

  if (!result.success) {
    showToast(result.error || 'Failed to send reset link', 'error');
    return;
  }

  showToast('Reset link sent to ' + email, 'success');
  setTimeout(() => {
    goTo('screen-signin');
  }, 2000);
}

// ═══════════════════════════════════════════════════════════
// EXAMPLE: Check Authentication Status
// ═══════════════════════════════════════════════════════════

/**
 * Add this to your page initialization
 */
function checkAuthOnLoad() {
  if (auth.isAuthenticated()) {
    const user = auth.getCurrentUser();
    console.log('User is logged in:', user);
    // Optionally redirect to dashboard
    // window.location.href = '/dashboard';
  }
}

// Run on page load
window.addEventListener('DOMContentLoaded', checkAuthOnLoad);

// ═══════════════════════════════════════════════════════════
// EXAMPLE: Sign Out
// ═══════════════════════════════════════════════════════════

function signOut() {
  auth.signout();
  showToast('Signed out successfully', 'success');
  goTo('screen-signin');
}

// ═══════════════════════════════════════════════════════════
// QUICK START INSTRUCTIONS
// ═══════════════════════════════════════════════════════════

/*

TO INTEGRATE WITH YOUR HTML FILE:

1. Add this import at the top of a new <script type="module"> in your HTML:
   
   <script type="module">
     import * as auth from './utils/auth.js';
     
     // Make auth available globally
     window.authAPI = auth;
     
     // Your existing JavaScript code here...
   </script>

2. Update your function calls to use the backend:
   - Replace submitSignup1() with the _withBackend version
   - Replace verifyOtp() with the _withBackend version
   - Replace submitSignin() with the _withBackend version
   - Replace submitOnboard() with the _withBackend version
   - Replace submitForgot() with the _withBackend version

3. Update the "Resend code" link in your HTML:
   <a onclick="resendOtpCode()">Resend code</a>

4. Test the flow:
   - Sign up with a new email
   - Check browser console for OTP code
   - Enter the OTP to verify
   - Complete onboarding
   - Try signing in with the same credentials

DEMO MODE NOTES:
- OTP codes are logged to browser console
- In production, OTPs should be sent via email service
- Default demo OTP is "123456" (hardcoded in your HTML for testing)

*/

export {
  submitSignup1_withBackend,
  verifyOtp_withBackend,
  submitSignin_withBackend,
  submitOnboard_withBackend,
  submitForgot_withBackend,
  resendOtpCode,
  signOut,
  checkAuthOnLoad
};
