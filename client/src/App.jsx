import { Routes, Route, Navigate } from "react-router-dom";
import { AppProvider, useApp } from "./context.jsx";
import Layout from "./components/Layout.jsx";
import { Spinner } from "./components/bits.jsx";
import AuthPage from "./pages/AuthPage.jsx";
import HomePage from "./pages/HomePage.jsx";
import SearchPage from "./pages/SearchPage.jsx";
import ExplorePage from "./pages/ExplorePage.jsx";
import ReelsPage from "./pages/ReelsPage.jsx";
import MessagesPage from "./pages/MessagesPage.jsx";
import VetsPage from "./pages/VetsPage.jsx";
import PetsPage from "./pages/PetsPage.jsx";
import ProductsPage from "./pages/ProductsPage.jsx";
import ProfilePage from "./pages/ProfilePage.jsx";

function Routed() {
  const { user, booting } = useApp();

  if (booting) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Spinner />
      </div>
    );
  }

  if (!user) return <AuthPage />;

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/explore" element={<ExplorePage />} />
        <Route path="/reels" element={<ReelsPage />} />
        <Route path="/messages" element={<MessagesPage />} />
        <Route path="/vets" element={<VetsPage />} />
        <Route path="/pets" element={<PetsPage />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/u/:username" element={<ProfilePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}

export default function App() {
  return (
    <AppProvider>
      <Routed />
    </AppProvider>
  );
}
