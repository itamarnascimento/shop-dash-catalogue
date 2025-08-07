import { useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import Header from "@/components/Header";
import CartDrawer from "@/components/CartDrawer";

const NotFound = () => {
  const location = useLocation();
  const [isCartOpen, setIsCartOpen] = useState(false);
  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background">
      <Header
        onCartClick={() => setIsCartOpen(true)}
      />
      <div className="flex items-center justify-center bg-gray-100 m-10">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">404</h1>
          <p className="text-xl text-gray-600 mb-4">Oops! Page not found</p>
          <a href="/" className="text-blue-500 hover:text-blue-700 underline">
            Return to Home
          </a>
        </div>
      </div>
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
      />
    </div>
  );
};

export default NotFound;
