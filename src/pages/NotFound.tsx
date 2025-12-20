import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold font-display">404</h1>
        <p className="mb-4 text-xl text-muted-foreground font-body">Página não encontrada</p>
        <Link to="/" className="text-primary underline hover:text-primary/90 font-body">
          Voltar para o início
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
