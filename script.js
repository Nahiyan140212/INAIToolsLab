console.log('Script loaded'); // Debug
const loginBtn = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');
const loginModal = document.getElementById('loginModal');
const authForm = document.getElementById('authForm');
const loginSubmit = document.getElementById('loginSubmit');
const registerSubmit = document.getElementById('registerSubmit');
const closeModal = document.getElementById('closeModal');
const errorDiv = document.getElementById('error');
const appList = document.getElementById('appList');
const appViewer = document.getElementById('appViewer');
const appViewerTitle = document.getElementById('appViewerTitle');
const appIframe = document.getElementById('appIframe');

console.log('Login button:', loginBtn); // Debug
console.log('Login modal:', loginModal); // Debug
console.log('Auth form:', authForm); // Debug
console.log('Register button:', registerSubmit); // Debug
console.log('Error div:', errorDiv); // Debug
console.log('App list element:', appList); // Debug

// Initialize Supabase
console.log('Config loaded:', CONFIG); // Debug
let supabase;
try {
  supabase = window.supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);
  console.log('Supabase client initialized:', supabase); // Debug
} catch (err) {
  console.error('Supabase initialization error:', err);
  if (errorDiv) {
    errorDiv.textContent = 'Failed to connect to Supabase. Please check configuration.';
    errorDiv.classList.remove('hidden');
  }
}

// Check if user is logged in
if (supabase) {
  supabase.auth.getSession().then(({ data: { session } }) => {
    console.log('Session check:', session); // Debug
    if (session && session.user.email_confirmed_at) {
      // Only show content if user is confirmed
      console.log('User is confirmed, showing content'); // Debug
      loginBtn.classList.add('hidden');
      logoutBtn.classList.remove('hidden');
      fetchApps();
    } else if (session && !session.user.email_confirmed_at) {
      // User is signed in but not confirmed - sign them out
      console.log('User not confirmed, signing out'); // Debug
      supabase.auth.signOut();
    }
  }).catch(err => console.error('Session check error:', err));
}

// Show login modal
if (loginBtn && loginModal) {
  loginBtn.addEventListener('click', () => {
    console.log('Login button clicked'); // Debug
    loginModal.classList.remove('hidden');
    if (errorDiv) errorDiv.classList.add('hidden');
  });
} else {
  console.error('Login button or modal not found');
}

// Close modal
if (closeModal && loginModal) {
  closeModal.addEventListener('click', () => {
    console.log('Close modal clicked'); // Debug
    loginModal.classList.add('hidden');
    if (errorDiv) errorDiv.classList.add('hidden');
    if (authForm) authForm.reset();
  });
}

// Logout
if (logoutBtn && supabase) {
  logoutBtn.addEventListener('click', async () => {
    console.log('Logout clicked'); // Debug
    await supabase.auth.signOut();
    loginBtn.classList.remove('hidden');
    logoutBtn.classList.add('hidden');
    appList.innerHTML = '';
    appViewer.classList.add('hidden');
  });
}

// Form submission
if (authForm && supabase) {
  authForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    console.log('Form submitted, submitter ID:', e.submitter.id); // Debug
    console.log('Error div:', errorDiv); // Debug
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    console.log('Form data:', { email, password }); // Debug
    if (!email || !password) {
      errorDiv.textContent = 'Please enter both email and password';
      errorDiv.classList.remove('hidden');
      return;
    }

    try {
      if (e.submitter.id === 'loginSubmit') {
        console.log('Attempting login'); // Debug
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        console.log('Login response:', { data, error }); // Debug
        if (error) {
          errorDiv.textContent = error.message;
          errorDiv.classList.remove('hidden');
        } else if (data.user && !data.user.email_confirmed_at) {
          // User exists but email not confirmed
          console.log('User email not confirmed'); // Debug
          await supabase.auth.signOut();
          errorDiv.textContent = 'Please confirm your email address before logging in. Check your inbox.';
          errorDiv.classList.remove('hidden');
        } else {
          console.log('Login successful, fetching apps'); // Debug
          loginModal.classList.add('hidden');
          loginBtn.classList.add('hidden');
          logoutBtn.classList.remove('hidden');
          authForm.reset();
          fetchApps();
        }
      } else if (e.submitter.id === 'registerSubmit') {
        console.log('Attempting register'); // Debug
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin
          }
        });
        console.log('Register response:', { data, error }); // Debug
        if (error) {
          console.error('Registration error:', error.message); // Debug
          errorDiv.textContent = 'Registration failed: ' + error.message;
          errorDiv.classList.remove('hidden');
        } else {
          console.log('User created:', data.user); // Debug
          // Check if user is automatically signed in but not confirmed
          if (data.user && !data.user.email_confirmed_at) {
            // User registered but email not confirmed - sign them out
            console.log('Registration successful but not confirmed, signing out'); // Debug
            await supabase.auth.signOut();
            errorDiv.textContent = 'Registration successful! Please check your email to confirm your account, then login.';
            errorDiv.classList.remove('hidden');
          } else {
            // User is confirmed (auto-confirm enabled) or no session created
            console.log('Registration completed'); // Debug
            errorDiv.textContent = 'Registration successful! Please login.';
            errorDiv.classList.remove('hidden');
          }
          // Don't call fetchApps() here - user must login first
        }
      }
    } catch (err) {
      console.error('Auth error:', err);
      errorDiv.textContent = 'Network error: ' + err.message;
      errorDiv.classList.remove('hidden');
    }
  });
} else {
  console.error('Auth form or Supabase client not found');
}

// Fetch and display apps
async function fetchApps() {
  console.log('Fetching apps...'); // Debug
  try {
    const { data, error } = await supabase.from('apps').select('*');
    console.log('Apps data:', data, 'Error:', error); // Debug
    if (error) {
      console.error('Fetch apps error:', error);
      appList.innerHTML = '<p class="text-red-500">Failed to load apps: ' + error.message + '</p>';
      return;
    }
    if (!data || data.length === 0) {
      console.warn('No apps found in database');
      appList.innerHTML = '<p class="text-gray-500">No apps available.</p>';
      return;
    }
    appList.innerHTML = data.map(app => `
      <div class="card bg-white p-4 rounded shadow">
        <h3 class="text-xl font-bold">${app.name}</h3>
        <p>${app.description}</p>
        <button onclick="openApp('${app.url}', '${app.name}')" class="bg-blue-600 text-white p-2 rounded mt-2">Open App</button>
        <a href="${app.url}" target="_blank" class="text-blue-600 underline mt-2 inline-block">Open in New Tab</a>
      </div>
    `).join('');
  } catch (err) {
    console.error('Fetch apps error:', err);
    appList.innerHTML = '<p class="text-red-500">Error loading apps: ' + err.message + '</p>';
  }
}

// Open app in iframe
function openApp(url, name) {
  console.log('Opening app:', name, url); // Debug
  appViewerTitle.textContent = name;
  appIframe.src = url;
  appViewer.classList.remove('hidden');
}