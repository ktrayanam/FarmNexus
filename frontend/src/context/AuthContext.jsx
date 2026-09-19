import React, { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

const ROLE_PERMISSIONS = {
  farmer: {
    allowedTabs: ["dashboard", "produce", "crop-doctor", "mandi-prices", "marketplace", "cold-storage", "logistics"],
    defaultTab: "dashboard"
  },
  buyer: {
    allowedTabs: ["marketplace", "mandi-prices", "cold-storage", "logistics"],
    defaultTab: "marketplace"
  },
  fpo: {
    allowedTabs: ["fpo", "produce", "mandi-prices", "cold-storage"],
    defaultTab: "fpo"
  },
  admin: {
    allowedTabs: ["dashboard", "produce", "crop-doctor", "mandi-prices", "marketplace", "fpo", "cold-storage", "logistics", "admin"],
    defaultTab: "admin"
  }
};

const DEFAULT_USERS = {
  farmer: {
    id: "farmer-01",
    name: "Ramesh Patel",
    role: "farmer",
    phone: "+91 98765 43210",
    location: "Guntur Rural, Andhra Pradesh",
    cropsGrown: ["Tomato", "Chilli", "Cotton", "Paddy"],
    farmSizeAcres: 4.5,
    avatar: "👨‍🌾"
  },
  buyer: {
    id: "buyer-01",
    name: "Vikram Singhal (Kisan Fresh)",
    role: "buyer",
    phone: "+91 98480 12345",
    location: "Bowenpally Agri Yard, Hyderabad",
    companyName: "Kisan Fresh Wholesale Supermarkets",
    mandiLicenseId: "APMC-HYD-W-2024-889",
    buyerType: "Wholesale Supermarket Sourcing",
    avatar: "🏢"
  },
  fpo: {
    id: "fpo-01",
    name: "Venkateswara Rao (Krishna Delta FPO)",
    role: "fpo",
    phone: "+91 94400 56789",
    location: "Tenali Hub, Guntur District",
    fpoRegNo: "FPO-AP-GNT-2022-098",
    memberCount: 142,
    avatar: "🤝"
  },
  admin: {
    id: "admin-01",
    name: "FarmNexus System Admin",
    role: "admin",
    phone: "+91 80000 11223",
    email: "admin@farmnexus.gov.in",
    location: "State Agricultural Command Center",
    avatar: "⚙️"
  }
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem("farmnexus_user");
      return saved ? JSON.parse(saved) : DEFAULT_USERS.farmer; // default to logged in as farmer
    } catch (e) {
      return DEFAULT_USERS.farmer;
    }
  });

  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return Boolean(localStorage.getItem("farmnexus_user"));
  });

  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState(null);

  const login = async (role, credentials = {}) => {
    setIsLoggingIn(true);
    setLoginError(null);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, ...credentials })
      });

      const data = await response.json();
      if (data.success && data.user) {
        setUser(data.user);
        setIsAuthenticated(true);
        localStorage.setItem("farmnexus_user", JSON.stringify(data.user));
      } else {
        // Fallback to local user
        const fallbackUser = DEFAULT_USERS[role] || DEFAULT_USERS.farmer;
        setUser(fallbackUser);
        setIsAuthenticated(true);
        localStorage.setItem("farmnexus_user", JSON.stringify(fallbackUser));
      }
    } catch (err) {
      // Local fallback on network error
      const fallbackUser = DEFAULT_USERS[role] || DEFAULT_USERS.farmer;
      setUser(fallbackUser);
      setIsAuthenticated(true);
      localStorage.setItem("farmnexus_user", JSON.stringify(fallbackUser));
    } finally {
      setIsLoggingIn(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("farmnexus_user");
    setIsAuthenticated(false);
    setUser(null);
  };

  const switchRole = (newRole) => {
    if (DEFAULT_USERS[newRole]) {
      const u = DEFAULT_USERS[newRole];
      setUser(u);
      setIsAuthenticated(true);
      localStorage.setItem("farmnexus_user", JSON.stringify(u));
    }
  };

  const currentRole = user?.role || "farmer";
  const permissions = ROLE_PERMISSIONS[currentRole] || ROLE_PERMISSIONS.farmer;

  const hasAccess = (tabId) => {
    return permissions.allowedTabs.includes(tabId);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        currentRole,
        isAuthenticated,
        isLoggingIn,
        loginError,
        login,
        logout,
        switchRole,
        hasAccess,
        allowedTabs: permissions.allowedTabs,
        defaultTab: permissions.defaultTab,
        allRoles: DEFAULT_USERS
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
