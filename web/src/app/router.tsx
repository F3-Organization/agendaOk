import { Routes, Route, Navigate } from 'react-router-dom';

// No futuro, estes componentes virão das suas pastas features/pages
const TempDashboard = () => <div className="p-8"><h1>Dashboard (Sincronizando com Google...)</h1></div>;
const TempLogin = () => <div className="h-screen flex items-center justify-center"><h1>Login (Google Auth)</h1></div>;

export const AppRouter = () => {
  const isAuthenticated = !!localStorage.getItem('auth_token');

  return (
    <Routes>
      <Route path="/login" element={<TempLogin />} />
      <Route 
        path="/dashboard" 
        element={isAuthenticated ? <TempDashboard /> : <Navigate to="/login" />} 
      />
      
      {/* Rota raiz redireciona para o dashboard ou login */}
      <Route path="/" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} />} />
      
      {/* 404 */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};
