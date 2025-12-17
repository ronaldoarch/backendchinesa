import { useState } from "react";
import { NavLink, Route, Routes, Navigate } from "react-router-dom";
import { AdminDashboardPage } from "./admin/AdminDashboardPage";
import { AdminBrandingPage } from "./admin/AdminBrandingPage";
import { AdminPlayfiversPage } from "./admin/AdminPlayfiversPage";
import { AdminBannersPage } from "./admin/AdminBannersPage";
import { AdminUsersPage } from "./admin/AdminUsersPage";
import { AdminDepositsPage } from "./admin/AdminDepositsPage";
import { AdminPromotionsPage } from "./admin/AdminPromotionsPage";
import { AdminSuitPayPage } from "./admin/AdminSuitPayPage";
import { AdminTrackingPage } from "./admin/AdminTrackingPage";
import { AdminBonusesPage } from "./admin/AdminBonusesPage";

export function AdminPage() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="admin-shell">
      <button
        type="button"
        className="admin-menu-toggle"
        onClick={() => setMenuOpen((v) => !v)}
      >
        ☰
      </button>

      <aside className={`admin-menu ${menuOpen ? "open" : ""}`}>
        <h2 className="admin-menu-title">Painel Admin</h2>
        <nav className="admin-menu-list">
          <NavLink
            to="/admin"
            end
            className={({ isActive }) =>
              `admin-menu-item${isActive ? " active" : ""}`
            }
            onClick={() => setMenuOpen(false)}
          >
            Dashboard
          </NavLink>
          <NavLink
            to="/admin/branding"
            className={({ isActive }) =>
              `admin-menu-item${isActive ? " active" : ""}`
            }
            onClick={() => setMenuOpen(false)}
          >
            Logo & Favicon
          </NavLink>
          <NavLink
            to="/admin/playfivers"
            className={({ isActive }) =>
              `admin-menu-item${isActive ? " active" : ""}`
            }
            onClick={() => setMenuOpen(false)}
          >
            PlayFivers
          </NavLink>
          <NavLink
            to="/admin/banners"
            className={({ isActive }) =>
              `admin-menu-item${isActive ? " active" : ""}`
            }
            onClick={() => setMenuOpen(false)}
          >
            Banners
          </NavLink>
          <NavLink
            to="/admin/usuarios"
            className={({ isActive }) =>
              `admin-menu-item${isActive ? " active" : ""}`
            }
            onClick={() => setMenuOpen(false)}
          >
            Usuários
          </NavLink>
          <NavLink
            to="/admin/depositos"
            className={({ isActive }) =>
              `admin-menu-item${isActive ? " active" : ""}`
            }
            onClick={() => setMenuOpen(false)}
          >
            Depósitos
          </NavLink>
          <NavLink
            to="/admin/promocoes"
            className={({ isActive }) =>
              `admin-menu-item${isActive ? " active" : ""}`
            }
            onClick={() => setMenuOpen(false)}
          >
            Promoções
          </NavLink>
          <NavLink
            to="/admin/suitpay"
            className={({ isActive }) =>
              `admin-menu-item${isActive ? " active" : ""}`
            }
            onClick={() => setMenuOpen(false)}
          >
            SuitPay
          </NavLink>
          <NavLink
            to="/admin/tracking"
            className={({ isActive }) =>
              `admin-menu-item${isActive ? " active" : ""}`
            }
            onClick={() => setMenuOpen(false)}
          >
            Tracking
          </NavLink>
          <NavLink
            to="/admin/bonus"
            className={({ isActive }) =>
              `admin-menu-item${isActive ? " active" : ""}`
            }
            onClick={() => setMenuOpen(false)}
          >
            Bônus
          </NavLink>
        </nav>
      </aside>

      <div className="admin-layout">
        <Routes>
          <Route path="/" element={<AdminDashboardPage />} />
          <Route path="branding" element={<AdminBrandingPage />} />
          <Route path="playfivers" element={<AdminPlayfiversPage />} />
          <Route path="banners" element={<AdminBannersPage />} />
          <Route path="usuarios" element={<AdminUsersPage />} />
          <Route path="depositos" element={<AdminDepositsPage />} />
          <Route path="promocoes" element={<AdminPromotionsPage />} />
          <Route path="suitpay" element={<AdminSuitPayPage />} />
          <Route path="tracking" element={<AdminTrackingPage />} />
          <Route path="bonus" element={<AdminBonusesPage />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </div>
    </div>
  );
}

