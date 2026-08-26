import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import * as THREE from "three";
import { loginUser, registerUser } from "../api/authService";
import { useAuth } from "../context/AuthContext";

const ROLES = [
  {
    id: "farmer",
    label: "Farmer",
    description: "List & sell your crops directly",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
        <polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    ),
  },
  {
    id: "buyer",
    label: "Buyer",
    description: "Source fresh crops from farmers",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
      </svg>
    ),
  },
];

// ── Icons ──────────────────────────────────────────────
const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);
const FacebookIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="#1877F2">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);
const EyeIcon = ({ open }) => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {open ? (
      <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>
    ) : (
      <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></>
    )}
  </svg>
);
const MailIcon     = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>);
const LockIcon     = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>);
const PersonIcon   = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>);
const BuildingIcon = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>);
const PinIcon      = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>);

const InputField = ({ label, type = "text", placeholder, value, onChange, icon, rightElement, required }) => (
  <div className="flex flex-col gap-1.5 text-left">
    <label className="text-sm font-semibold text-gray-300">{label}</label>
    <div className="ff-input-group">
      {icon}
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        className="placeholder-gray-600 w-full bg-transparent text-white outline-none"
      />
      {rightElement}
    </div>
  </div>
);

export default function FarmFusionLogin() {
  const [searchParams] = useSearchParams();
  const [tab, setTab] = useState("login");
  const [role, setRole] = useState("farmer");

  // ── LOGIN form state (isolated) ────────────────────
  const [loginEmail,    setLoginEmail]    = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPass, setShowLoginPass] = useState(false);
  const [remember,      setRemember]      = useState(false);

  // ── REGISTER form state (isolated) ─────────────────
  const [regName,        setRegName]        = useState("");
  const [regEmail,       setRegEmail]       = useState("");
  const [regPassword,    setRegPassword]    = useState("");
  const [regConfirm,     setRegConfirm]     = useState("");
  const [regFarmName,    setRegFarmName]    = useState("");
  const [regCompany,     setRegCompany]     = useState("");
  const [regLocation,    setRegLocation]    = useState("");
  const [showRegPass,    setShowRegPass]    = useState(false);
  const [showRegConfirm, setShowRegConfirm] = useState(false);

  // ── Shared UI state ─────────────────────────────────
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error,   setError]   = useState("");

  const { login }      = useAuth();
  const navigate       = useNavigate();
  const selectedRole   = ROLES.find((r) => r.id === role);

  const canvasRef = useRef(null);

  // Show error if OAuth failed
  useEffect(() => {
    const oauthError = searchParams.get("error");
    if (oauthError) {
      setError(
        oauthError === "google_not_configured"   ? "Google login is not set up yet. Add GOOGLE_CLIENT_ID to your backend .env file." :
        oauthError === "facebook_not_configured" ? "Facebook login is not set up yet. Add FACEBOOK_APP_ID to your backend .env file." :
        oauthError === "google_failed"           ? "Google sign-in failed. Please try again." :
        oauthError === "facebook_failed"         ? "Facebook sign-in failed. Please try again." :
        "Social login failed. Please use email login instead."
      );
    }
  }, [searchParams]);

  // Three.js Interactive 3D Node Web Animation
  useEffect(() => {
    if (!canvasRef.current) return;
    const container = canvasRef.current;
    
    // Scene setup
    const scene = new THREE.Scene();
    
    // Camera
    const camera = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 0.1, 100);
    camera.position.z = 12;
    
    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);
    
    // Create random interconnected node points
    const particleCount = 70;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    
    const minRange = -7;
    const maxRange = 7;
    for (let i = 0; i < particleCount * 3; i += 3) {
      positions[i] = minRange + Math.random() * (maxRange - minRange);
      positions[i + 1] = minRange + Math.random() * (maxRange - minRange);
      positions[i + 2] = minRange + Math.random() * (maxRange - minRange);
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    // Particle Material - Cyan glowing points
    const material = new THREE.PointsMaterial({
      color: 0x00f5ff,
      size: 0.15,
      transparent: true,
      opacity: 0.9
    });
    
    const particles = new THREE.Points(geometry, material);
    scene.add(particles);
    
    // Line connections between near nodes
    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0x10b981,
      transparent: true,
      opacity: 0.2
    });
    
    const lineGeometry = new THREE.BufferGeometry();
    const linePositions = [];
    
    const pos = positions;
    for (let i = 0; i < particleCount; i++) {
      for (let j = i + 1; j < particleCount; j++) {
        const dx = pos[i * 3] - pos[j * 3];
        const dy = pos[i * 3 + 1] - pos[j * 3 + 1];
        const dz = pos[i * 3 + 2] - pos[j * 3 + 2];
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        
        if (dist < 4.0) {
          linePositions.push(pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]);
          linePositions.push(pos[j * 3], pos[j * 3 + 1], pos[j * 3 + 2]);
        }
      }
    }
    
    lineGeometry.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
    const lines = new THREE.LineSegments(lineGeometry, lineMaterial);
    scene.add(lines);
    
    // Animation loop & physics mouse alignment
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;
    
    const onMouseMove = (e) => {
      const rect = container.getBoundingClientRect();
      mouseX = (e.clientX - rect.left - rect.width / 2) / (rect.width / 2);
      mouseY = (e.clientY - rect.top - rect.height / 2) / (rect.height / 2);
    };
    
    window.addEventListener('mousemove', onMouseMove);
    
    let reqId;
    const animate = () => {
      reqId = requestAnimationFrame(animate);
      
      targetX += (mouseX - targetX) * 0.05;
      targetY += (mouseY - targetY) * 0.05;
      
      particles.rotation.y = targetX * 0.4;
      particles.rotation.x = -targetY * 0.4;
      lines.rotation.y = targetX * 0.4;
      lines.rotation.x = -targetY * 0.4;
      
      particles.rotation.y += 0.0012;
      lines.rotation.y += 0.0012;
      
      renderer.render(scene, camera);
    };
    
    animate();
    
    // Resize handling
    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    
    window.addEventListener('resize', handleResize);
    
    // Cleanup
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(reqId);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  const switchTab = (t) => {
    setTab(t);
    setError("");
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await loginUser({ email: loginEmail, password: loginPassword });
      login(data);
      setSuccess(true);
      setTimeout(() => {
        if (data.user.role === "farmer")     navigate("/farmer/dashboard");
        else if (data.user.role === "buyer") navigate("/buyer/dashboard");
        else                                 navigate("/marketplace");
      }, 700);
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    if (regPassword !== regConfirm) { setError("Passwords do not match."); return; }
    if (regPassword.length < 6)     { setError("Password must be at least 6 characters."); return; }
    setLoading(true);
    try {
      const data = await registerUser({
        name:        regName,
        email:       regEmail,
        password:    regPassword,
        role,
        farmName:    role === "farmer" ? regFarmName : undefined,
        companyName: role === "buyer"  ? regCompany  : undefined,
        location:    regLocation,
      });
      login(data);
      setSuccess(true);
      setTimeout(() => {
        if (data.user.role === "farmer")     navigate("/farmer/dashboard");
        else if (data.user.role === "buyer") navigate("/buyer/dashboard");
        else                                 navigate("/marketplace");
      }, 700);
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const BACKEND = import.meta.env.VITE_API_URL || "https://farm-fusion-4.onrender.com";
  const handleGoogle   = () => { window.location.href = `${BACKEND}/api/auth/google`; };
  const handleFacebook = () => { window.location.href = `${BACKEND}/api/auth/facebook`; };

  return (
    <div className="min-h-screen flex flex-col font-sans relative text-white" style={{ background: "#050814" }}>
      {/* Background orbs */}
      <div className="ff-orb ff-orb-1" />
      <div className="ff-orb ff-orb-2" />
      <div className="ff-orb ff-orb-3" />

      {/* ── Navbar ── */}
      <nav className="w-full px-4 sm:px-8 h-14 flex items-center justify-between flex-shrink-0 border-b border-gray-800/50 backdrop-blur-md sticky top-0 z-40 bg-[#050814]/75">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 shadow-[0_0_10px_rgba(16,185,129,0.3)]" style={{ background: "linear-gradient(135deg, #10b981, #00f5ff)" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
          </div>
          <span className="font-extrabold text-white text-base sm:text-lg uppercase tracking-wider font-mono">Farm Fusion</span>
        </div>
        <button className="hidden sm:flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest rounded-lg px-3 py-1.5 transition-colors cursor-pointer border border-[#00f5ff] text-[#00f5ff] hover:bg-[#00f5ff]/10">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          Support
        </button>
      </nav>

      {/* ── Main Panel ── */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8 relative z-10 max-w-7xl mx-auto w-full">
        <div className="w-full max-w-5xl rounded-2xl overflow-hidden flex flex-col lg:flex-row ff-fade-in"
          style={{ boxShadow: "0 32px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.06)", background: "#080f25" }}>

          {/* ── Left Panel (Holds Three.js Animation + Brand Text) ── */}
          <div className="w-full lg:w-[42%] p-6 sm:p-8 flex flex-col justify-between gap-6 relative overflow-hidden bg-black/30"
            style={{ borderRight: "1px solid rgba(16,185,129,0.15)" }}>
            
            {/* Embedded Three.js Canvas */}
            <div ref={canvasRef} className="absolute inset-0 z-0 pointer-events-none opacity-80" />

            {/* Top section */}
            <div className="relative z-10 text-left">
              {/* Logo */}
              <div className="flex items-center gap-2.5 mb-8">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 shadow-[0_0_15px_rgba(16,185,129,0.4)]"
                  style={{ background: "linear-gradient(135deg, #10b981, #00f5ff)" }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                    <polyline points="9 22 9 12 15 12 15 22"/>
                  </svg>
                </div>
                <span className="text-white font-extrabold text-lg tracking-wider uppercase font-mono ff-title-glow">Farm Fusion</span>
              </div>

              {/* Headline */}
              <h1 className="text-white font-extrabold text-2xl sm:text-[1.85rem] leading-snug mb-5 uppercase tracking-wide font-mono ff-title-glow">
                Cultivating the future<br/>of agriculture.
              </h1>

              {/* Glassmorphism description card */}
              <div className="ff-glass p-5 mb-2 border border-gray-800">
                <p className="text-xs leading-relaxed text-gray-300">
                  Join thousands of farmers and buyers connecting directly to build a smarter, fresher supply chain.
                </p>
              </div>
            </div>

            {/* Role selector (Only displayed on register tab) */}
            <div className="relative z-10 text-left">
              <p className="text-[10px] font-bold uppercase tracking-widest mb-3 text-gray-500">
                {tab === "register" ? "Select Domain Portal Role" : "Secure Node Connection"}
              </p>

              <div className="grid grid-cols-2 gap-2.5 mb-3">
                {ROLES.map((r) => {
                  const isSelected = role === r.id && tab === "register";
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => tab === "register" && setRole(r.id)}
                      className={`flex flex-col items-center gap-1.5 rounded-xl py-3 px-2 text-white text-xs font-semibold uppercase tracking-wider transition-all duration-200 ${tab === "login" ? "opacity-30 cursor-not-allowed" : "cursor-pointer"}`}
                      style={{
                        background: isSelected ? "rgba(16,185,129,0.12)" : "rgba(255,255,255,0.02)",
                        border: isSelected ? "1.5px solid #10b981" : "1.5px solid rgba(255,255,255,0.06)",
                        boxShadow: isSelected ? "0 0 16px rgba(16,185,129,0.15)" : "none",
                      }}>
                      <span style={{ color: isSelected ? "#10b981" : "rgba(255,255,255,0.6)" }}>{r.icon}</span>
                      <span style={{ color: isSelected ? "#fff" : "rgba(255,255,255,0.6)" }} className="text-[10px] font-mono">{r.label}</span>
                    </button>
                  );
                })}
              </div>

              <p className="text-[10px] text-center text-gray-400 font-mono">
                {tab === "register"
                  ? selectedRole?.description
                  : "Interface role verified dynamically during login"}
              </p>
            </div>

            {/* Trust row */}
            <div className="flex items-center gap-3 relative z-10">
              <div className="flex">
                {["👩‍🌾","👨‍🌾","🧑‍🌾"].map((emoji, i) => (
                  <span key={i}
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${i > 0 ? "-ml-2" : ""}`}
                    style={{ background: "rgba(16,185,129,0.08)", border: "2px solid rgba(16,185,129,0.2)" }}>
                    {emoji}
                  </span>
                ))}
              </div>
              <span className="text-xs font-semibold text-gray-400">Trusted by 5,000+ farmers</span>
            </div>
          </div>

          {/* ── Right Panel (Holds Form Controls) ── */}
          <div className="w-full lg:w-[58%] p-6 sm:p-8 flex flex-col justify-center bg-[#080f25]">

            {/* Heading */}
            <div className="mb-5 text-left">
              <h2 className="text-2xl font-extrabold uppercase font-mono tracking-wider text-white mb-1">
                {tab === "login" ? (
                  <>Link <span className="ff-gradient-text">Operator</span></>
                ) : (
                  <>Register <span className="ff-gradient-text">Node</span></>
                )}
              </h2>
              <p className="text-gray-400 text-xs font-mono uppercase tracking-wider">
                {tab === "login"
                  ? "Initialize auth credentials to connect"
                  : `Connecting to ${selectedRole?.label} gateway`}
              </p>
            </div>

            {/* Tab switcher */}
            <div className="flex gap-1 rounded-xl p-1 mb-5 bg-[#050814] border border-gray-800">
              {["login","register"].map((t) => (
                <button key={t} onClick={() => switchTab(t)}
                  className="flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer"
                  style={{
                    background: tab === t ? "linear-gradient(135deg, #10b981, #059669)" : "transparent",
                    color: tab === t ? "#fff" : "#889ac2",
                  }}>
                  {t === "login" ? "Login" : "Register"}
                </button>
              ))}
            </div>

            {/* Social buttons */}
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <button onClick={handleGoogle}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold uppercase tracking-wider text-gray-300 border border-gray-800 hover:border-gray-600 hover:bg-white/5 transition-all cursor-pointer bg-transparent">
                <GoogleIcon /> Continue with Google
              </button>
              <button onClick={handleFacebook}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold uppercase tracking-wider text-gray-300 border border-gray-800 hover:border-gray-600 hover:bg-white/5 transition-all cursor-pointer bg-transparent">
                <FacebookIcon /> Continue with Facebook
              </button>
            </div>

            {/* OR divider */}
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px bg-gray-800"/>
              <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest whitespace-nowrap">Or Node Handshake</span>
              <div className="flex-1 h-px bg-gray-800"/>
            </div>

            {/* Error banner */}
            {error && (
              <div className="flex items-center gap-2.5 rounded-xl px-4 py-3 text-xs font-semibold mb-4 text-left border border-red-950/40"
                style={{ background: "rgba(239, 68, 68, 0.06)", color: "#f87171" }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="flex-shrink-0">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <span>{error}</span>
              </div>
            )}

            {/* ══ LOGIN FORM ══ */}
            {tab === "login" && (
              <form onSubmit={handleLogin} className="flex flex-col gap-4">
                <InputField 
                  label="Node Email Address" 
                  type="email" 
                  placeholder="you@domain.com"
                  value={loginEmail} 
                  onChange={(e) => setLoginEmail(e.target.value)}
                  icon={<MailIcon/>} 
                  required
                />

                <div className="flex flex-col gap-1.5 text-left">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-semibold text-gray-300">Operator Passcode</label>
                    <button type="button" className="text-xs font-bold text-emerald-400 hover:underline cursor-pointer">
                      Recovery?
                    </button>
                  </div>
                  <div className="ff-input-group">
                    <LockIcon/>
                    <input
                      type={showLoginPass ? "text" : "password"}
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                      className="placeholder-gray-600 bg-transparent text-white outline-none w-full"
                    />
                    <button type="button" onClick={() => setShowLoginPass(!showLoginPass)}
                      className="flex-shrink-0 cursor-pointer text-gray-400 hover:text-white">
                      <EyeIcon open={showLoginPass}/>
                    </button>
                  </div>
                </div>

                <label className="flex items-center gap-2.5 cursor-pointer select-none py-1 text-left">
                  <input type="checkbox" checked={remember} onChange={() => setRemember(!remember)}
                    className="w-4 h-4 rounded border-gray-700 bg-black cursor-pointer accent-emerald-500"/>
                  <span className="text-xs text-gray-400">Remember sequence for 30 cycles</span>
                </label>

                <button type="submit" disabled={loading}
                  className="ff-btn ff-btn-primary w-full py-3 text-xs uppercase tracking-widest font-bold mt-1">
                  {loading ? (
                    <span className="ff-spinner" style={{ width: "16px", height: "16px", borderWidth: "2px", borderTopColor: "#fff", borderColor: "rgba(255,255,255,0.3)" }} />
                  ) : null}
                  {loading ? "Authorizing node..." : success ? "✓ Access Granted" : "Initialize Link Connection"}
                </button>

                <p className="text-center text-xs text-gray-400 font-mono uppercase mt-2">
                  No active signature?{" "}
                  <button type="button" onClick={() => switchTab("register")}
                    className="font-bold text-emerald-400 hover:underline cursor-pointer">
                    Register Node
                  </button>
                </p>
              </form>
            )}

            {/* ══ REGISTER FORM ══ */}
            {tab === "register" && (
              <form onSubmit={handleRegister} className="flex flex-col gap-3.5">
                <InputField 
                  label="Operator Full Name *" 
                  placeholder="e.g. John Doe"
                  value={regName} 
                  onChange={(e) => setRegName(e.target.value)}
                  icon={<PersonIcon/>} 
                  required
                />

                <InputField 
                  label="Node Email Address *" 
                  type="email" 
                  placeholder="you@domain.com"
                  value={regEmail} 
                  onChange={(e) => setRegEmail(e.target.value)}
                  icon={<MailIcon/>} 
                  required
                />

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5 text-left">
                    <label className="text-xs font-semibold text-gray-300">Passcode *</label>
                    <div className="ff-input-group">
                      <LockIcon/>
                      <input
                        type={showRegPass ? "text" : "password"}
                        placeholder="Min 6 chars"
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        required
                        className="placeholder-gray-600 bg-transparent text-white outline-none w-full text-xs"
                      />
                      <button type="button" onClick={() => setShowRegPass(!showRegPass)} className="text-gray-400 hover:text-white">
                        <EyeIcon open={showRegPass}/>
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5 text-left">
                    <label className="text-xs font-semibold text-gray-300">Repeat Passcode *</label>
                    <div className="ff-input-group">
                      <LockIcon/>
                      <input
                        type={showRegConfirm ? "text" : "password"}
                        placeholder="Verify"
                        value={regConfirm}
                        onChange={(e) => setRegConfirm(e.target.value)}
                        required
                        className="placeholder-gray-600 bg-transparent text-white outline-none w-full text-xs"
                      />
                      <button type="button" onClick={() => setShowRegConfirm(!showRegConfirm)} className="text-gray-400 hover:text-white">
                        <EyeIcon open={showRegConfirm}/>
                      </button>
                    </div>
                  </div>
                </div>

                {role === "farmer" && (
                  <InputField 
                    label="Dome / Farm Name" 
                    placeholder="e.g. Green Dome Sector"
                    value={regFarmName} 
                    onChange={(e) => setRegFarmName(e.target.value)} 
                    icon={<BuildingIcon/>}
                  />
                )}
                {role === "buyer" && (
                  <InputField 
                    label="Corporate / Organization Name" 
                    placeholder="e.g. Sourcing Ltd"
                    value={regCompany} 
                    onChange={(e) => setRegCompany(e.target.value)} 
                    icon={<BuildingIcon/>}
                  />
                )}

                <InputField 
                  label="Operations Location" 
                  placeholder="e.g. Gujarat, India"
                  value={regLocation} 
                  onChange={(e) => setRegLocation(e.target.value)} 
                  icon={<PinIcon/>}
                />

                <label className="flex items-center gap-2.5 cursor-pointer select-none text-left">
                  <input type="checkbox" required className="w-4 h-4 rounded border-gray-700 bg-black cursor-pointer accent-emerald-500"/>
                  <span className="text-[10px] text-gray-400">Accept Directive Protocols &amp; Data Command Policies</span>
                </label>

                <button type="submit" disabled={loading}
                  className="ff-btn ff-btn-primary w-full py-3 text-xs uppercase tracking-widest font-bold mt-1">
                  {loading ? (
                    <span className="ff-spinner" style={{ width: "16px", height: "16px", borderWidth: "2px", borderTopColor: "#fff", borderColor: "rgba(255,255,255,0.3)" }} />
                  ) : null}
                  {loading ? "Registering node..." : success ? "✓ Signature Logged" : "Register Operator Node"}
                </button>

                <p className="text-center text-xs text-gray-400 font-mono uppercase mt-2">
                  Already mapped node?{" "}
                  <button type="button" onClick={() => switchTab("login")}
                    className="font-bold text-emerald-400 hover:underline cursor-pointer">
                    Sign In
                  </button>
                </p>
              </form>
            )}
          </div>
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="w-full py-4 text-xs flex flex-wrap items-center justify-center gap-2 px-4 border-t border-gray-900 bg-black/40 relative z-10" style={{ color: "rgba(255,255,255,0.2)" }}>
        <span>© 2024 Farm Fusion Global. All rights reserved.</span>
        <span className="hidden sm:inline">|</span>
        <a href="#" className="transition-colors hover:text-emerald-400">Privacy Policy</a>
        <span>|</span>
        <a href="#" className="transition-colors hover:text-emerald-400">Terms of Service</a>
      </footer>
    </div>
  );
}