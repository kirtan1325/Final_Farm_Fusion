// frontend/src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth }  from "./context/AuthContext";
import { SocketProvider }       from "./context/SocketContext";
import { NotificationProvider } from "./context/NotificationContext";
import { ToastProvider }        from "./context/ToastContext";
import ProtectedRoute           from "./components/ProtectedRoute";
import VoiceAssistant           from "./components/VoiceAssistant";
import NotificationBell         from "./components/NotificationBell";

// ── Auth ──────────────────────────────────────────────
import FarmFusionLogin  from "./pages/FarmFusionLogin";
import OAuthCallback    from "./pages/OAuthCallback";

// ── Farmer pages ──────────────────────────────────────
import FarmerDashboard   from "./pages/FarmerDashboard";
import RequestManagement from "./pages/Requestmanagement";
import InventoryTracker  from "./pages/InventoryTracker";
import SoilHealthCard    from "./pages/SoilHealthCard";
import FarmerSales       from "./pages/FarmerSales";

// ── Buyer pages ───────────────────────────────────────
import BuyerDashboard from "./pages/BuyerDashboard";
import MyOrders       from "./pages/MyOrders";

// ── Shared pages (both roles) ─────────────────────────
import Marketplace         from "./pages/Marketplace";
import Settings            from "./pages/Settings";
import Notifications       from "./pages/Notifications";

// ── V3: Useful Tools ──────────────────────────────────
import Weather             from "./pages/Weather";
import CropPrices          from "./pages/CropPrices";
import GovernmentSchemes   from "./pages/GovernmentSchemes";
import CropAdvisory        from "./pages/CropAdvisory";
import CropRecommendation from "./pages/CropRecommendation";
import DiseaseDetection from "./pages/DiseaseDetection";
import Messages            from "./pages/Messages";

// ── V4: Community Forum ───────────────────────────────
import Forum               from "./pages/Forum";
import ForumPostDetail     from "./pages/ForumPostDetail";

// ── V5: Admin ─────────────────────────────────────────
import AdminDashboard      from "./pages/AdminDashboard";



// ── Global Top Right Menu (only when logged in) ──
function GlobalTopRightMenu() {
  const { user } = useAuth();
  if (!user) return null;
  return (
    <div className="fixed top-3 right-4 z-[60] flex items-center gap-3">
      <NotificationBell />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <NotificationProvider>
          <ToastProvider>
            <BrowserRouter>
              <Routes>

                {/* ── Public ─────────────────────────────── */}
                <Route path="/login"          element={<FarmFusionLogin />} />
                <Route path="/auth/callback"  element={<OAuthCallback />}   />

                {/* ── Farmer only ────────────────────────── */}
                <Route element={<ProtectedRoute allowedRoles={["farmer"]} />}>
                  <Route path="/farmer/dashboard"   element={<FarmerDashboard />}   />
                  <Route path="/farmer/requests"    element={<RequestManagement />} />
                  <Route path="/farmer/sales"       element={<FarmerSales />}       />
                  <Route path="/farmer/inventory"   element={<InventoryTracker />}  />
                  <Route path="/farmer/soil-health" element={<SoilHealthCard />}    />
                  <Route path="/farmer/settings"    element={<Settings />}          />
                </Route>

                {/* ── Buyer only ─────────────────────────── */}
                <Route element={<ProtectedRoute allowedRoles={["buyer"]} />}>
                  <Route path="/buyer/dashboard" element={<BuyerDashboard />} />
                  <Route path="/buyer/orders"    element={<MyOrders />}       />
                  <Route path="/buyer/settings"  element={<Settings />}       />
                </Route>

                {/* ── Admin only ─────────────────────────── */}
                <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
                  <Route path="/admin"           element={<AdminDashboard />} />
                  <Route path="/admin/dashboard" element={<AdminDashboard />} />
                </Route>

                {/* ── Shared (farmer + buyer + admin) ─────── */}
                <Route element={<ProtectedRoute allowedRoles={["farmer", "buyer", "admin"]} />}>
                  <Route path="/marketplace"         element={<Marketplace />}       />
                  <Route path="/notifications"       element={<Notifications />}     />
                  <Route path="/weather"             element={<Weather />}           />
                  <Route path="/crop-prices"         element={<CropPrices />}        />
                  <Route path="/schemes"             element={<GovernmentSchemes />} />
                  <Route path="/advisory"            element={<CropAdvisory />}      />
                  <Route path="/crop-recommendation" element={<CropRecommendation />} />
                  <Route path="/disease-detection"   element={<DiseaseDetection />} />
                  <Route path="/messages"            element={<Messages />}          />
                  <Route path="/forum"               element={<Forum />}             />
                  <Route path="/forum/:id"           element={<ForumPostDetail />}   />
                </Route>

                {/* ── Fallbacks ──────────────────────────── */}
                <Route path="/"  element={<Navigate to="/login" replace />} />
                <Route path="*"  element={<Navigate to="/login" replace />} />

              </Routes>
              <GlobalTopRightMenu />
              <VoiceAssistant />
            </BrowserRouter>
          </ToastProvider>
        </NotificationProvider>
      </SocketProvider>
    </AuthProvider>
  );
}
