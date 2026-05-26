import React, { useState } from 'react';
import { 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider,
  createUserWithEmailAndPassword
} from 'firebase/auth';
import { auth, syncUserProfile } from '../services/firebase.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { Smartphone, Lock, Mail, ChevronRight, AlertCircle, Loader2 } from 'lucide-react';

interface LoginScreenProps {
  onNotify: (msg: string, type: 'success' | 'error') => void;
}

export default function LoginScreen({ onNotify }: LoginScreenProps) {
  const { enterSandboxMode } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleCredentialsAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    const readyEmail = email.trim();
    const readyPassword = password.trim();

    if (!readyEmail || !readyPassword) {
      setErrorMessage("Please fill all required credentials fields.");
      setLoading(false);
      return;
    }

    try {
      if (isRegisterMode) {
        // Create user
        const credential = await createUserWithEmailAndPassword(auth, readyEmail, readyPassword);
        await syncUserProfile(credential.user);
        onNotify("Authorized staff account registered successfully", "success");
      } else {
        // Login user
        const credential = await signInWithEmailAndPassword(auth, readyEmail, readyPassword);
        await syncUserProfile(credential.user);
        onNotify("Staff authentication session initiated successfully", "success");
      }
    } catch (err: any) {
      console.error(err);
      let errMsg = err.message || "Credential authentication failed. Please try again.";
      if (err.code === 'auth/operation-not-allowed') {
        errMsg = "Email/Password sign-in is not enabled in your Firebase project. Please go to the Firebase Console > Authentication > Sign-in method tab, add 'Email/Password' as a provider, and toggle it to enabled. Alternatively, you can use Google Sign-In below or the Local Developer Sandbox.";
      }
      setErrorMessage(errMsg);
      onNotify(errMsg, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMessage(null);
    setLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      await syncUserProfile(result.user);
      onNotify("Google Employee session initiated", "success");
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || "Google Sign-In was cancelled or rejected.");
      onNotify(err.message || "Google auth error", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleLaunchLocalSandbox = (role: 'admin' | 'staff') => {
    enterSandboxMode(role, role === 'admin' ? 'admin@tecno.com' : 'staff@tecno.com', role === 'admin' ? 'Demo Administrator' : 'Demo Staff');
    onNotify(`Initiating Local Offline Sandbox session for ${role.toUpperCase()}...`, "success");
  };

  const handlePrefillAdmin = () => {
    setEmail('admin@tecno.com');
    setPassword('TecnoAdmin2026!');
    setIsRegisterMode(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 selection:bg-teal-400 selection:text-slate-950" id="login-layout">
      {/* Background radial overlays */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(13,148,136,0.06)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-teal-500/5 blur-3xl rounded-full pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/5 blur-3xl rounded-full pointer-events-none"></div>

      {/* Frame Box */}
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl overflow-hidden">
        
        {/* Top brand */}
        <div className="text-center mb-6 select-none">
          <div className="inline-flex bg-teal-400 p-3 rounded-2xl text-slate-950 shadow-md mb-3.5 shrink-0 animate-bounce-slow">
            <Smartphone size={26} className="stroke-[2.5]" />
          </div>
          <h2 className="text-xl font-black text-white tracking-tight">
            Tecno Tech Stockroom
          </h2>
          <p className="text-xs text-slate-400 mt-1 font-medium">
            Authorized Inventory Administration Portal
          </p>
        </div>

        {/* Central Card Form */}
        <form onSubmit={handleCredentialsAuth} className="space-y-4">
          
          {errorMessage && (
            <div className="flex gap-2 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs rounded-xl" id="login-error-toast">
              <AlertCircle size={15} className="shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Email input */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
              Employee Email
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 pointer-events-none">
                <Mail size={14} />
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9.5 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:border-teal-400 text-white sm:text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-teal-400/30 transition-all placeholder-slate-600"
                placeholder="name@tecno.com"
                id="login-email"
              />
            </div>
          </div>

          {/* Password input */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
              Secure Keyword
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 pointer-events-none">
                <Lock size={14} />
              </span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9.5 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:border-teal-400 text-white sm:text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-teal-400/30 transition-all placeholder-slate-600"
                placeholder="••••••••••••"
                id="login-password"
              />
            </div>
          </div>

          {/* Submit action button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-1 px-5 py-3 rounded-xl text-xs font-bold text-slate-950 bg-teal-400 hover:bg-teal-300 disabled:opacity-45 cursor-pointer transition-colors"
            id="login-submit-btn"
          >
            {loading ? (
              <Loader2 className="animate-spin text-slate-950" size={14} />
            ) : (
              <span>{isRegisterMode ? 'Register New Staff profile' : 'Initiate Secure Login'}</span>
            )}
            {!loading && <ChevronRight size={14} />}
          </button>

        </form>

        {/* Separator */}
        <div className="relative my-5 select-none text-center">
          <div className="absolute inset-y-1/2 left-0 right-0 border-t border-slate-800"></div>
          <span className="relative bg-slate-900 px-3.5 text-[10px] text-slate-500 font-bold uppercase tracking-widest">
            or choose federated key
          </span>
        </div>

        {/* Federated google action */}
        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          type="button"
          className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-800 hover:border-slate-700 bg-slate-950 text-slate-300 hover:text-white rounded-xl text-xs font-bold cursor-pointer transition-colors"
          id="google-login-btn"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>Authorized Google Sign-in</span>
        </button>

        {/* Access controls footer */}
        <div className="mt-6 flex flex-col items-center justify-center gap-2 select-none">
          <button
            onClick={() => setIsRegisterMode(!isRegisterMode)}
            className="text-xs text-teal-400 hover:text-teal-300 hover:underline font-semibold cursor-pointer"
            id="toggle-auth-mode-btn"
          >
            {isRegisterMode ? 'Already registered? Return to Login' : 'Need a new profile? Register here'}
          </button>

          <button
            onClick={handlePrefillAdmin}
            className="text-[10px] text-slate-500 hover:text-slate-400 font-bold uppercase tracking-wider cursor-pointer mt-1"
            title="Inject pre-configured administrator login credentials"
            id="prefill-credentials-btn"
          >
            Prefill Credentials
          </button>
        </div>

        {/* Local sandbox bypass section */}
        <div className="mt-6 pt-5 border-t border-slate-800 text-center select-none" id="sandbox-options">
          <span className="text-[10px] text-teal-400 font-extrabold uppercase tracking-widest block mb-2">
            💡 Local Developer Sandbox (Bypasses Auth)
          </span>
          <p className="text-[11px] text-slate-400 mb-3 ml-1 mr-1 leading-relaxed">
            If Email/Password is disabled in your Firebase Console, click below to try the app instantly offline!
          </p>
          <div className="flex gap-2.5 justify-center">
            <button
              onClick={() => handleLaunchLocalSandbox('admin')}
              type="button"
              className="px-3.5 py-2 bg-teal-500/10 hover:bg-teal-500/15 border border-teal-500/30 text-teal-350 hover:text-teal-200 text-xs font-bold rounded-xl cursor-pointer transition-all active:scale-[0.98]"
              id="sandbox-login-admin"
            >
              Enter as Admin
            </button>
            <button
              onClick={() => handleLaunchLocalSandbox('staff')}
              type="button"
              className="px-3.5 py-2 bg-indigo-500/10 hover:bg-indigo-500/15 border border-indigo-500/30 text-indigo-350 hover:text-indigo-200 text-xs font-bold rounded-xl cursor-pointer transition-all active:scale-[0.98]"
              id="sandbox-login-staff"
            >
              Enter as Staff
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
