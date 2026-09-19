import React, { createContext, useContext, useState } from "react";

const AuthContext = createContext();

const MOCK_USERS = {
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
    name: "Vikram Singhal (Kisan Fresh Wholesale)",
    role: "buyer",
    phone: "+91 98480 12345",
    location: "Bowenpally Agri Yard, Hyderabad",
    buyerType: "Wholesale Supermarket Sourcing",
    avatar: "🏢"
  },
  fpo: {
    id: "fpo-01",
    name: "Venkateswara Rao (Krishna Delta FPO)",
    role: "fpo",
    phone: "+91 94400 56789",
    location: "Tenali Hub, Guntur District",
    memberCount: 142,
    avatar: "🤝"
  },
  admin: {
    id: "admin-01",
    name: "FarmNexus Admin (Agri Dept)",
    role: "admin",
    phone: "+91 80000 11223",
    location: "State Agricultural Command Center",
    avatar: "⚙️"
  }
};

export function AuthProvider({ children }) {
  const [currentRole, setCurrentRole] = useState("farmer");
  const user = MOCK_USERS[currentRole] || MOCK_USERS.farmer;

  const switchRole = (role) => {
    if (MOCK_USERS[role]) {
      setCurrentRole(role);
    }
  };

  return (
    <AuthContext.Provider value={{ currentRole, user, switchRole, allRoles: MOCK_USERS }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
