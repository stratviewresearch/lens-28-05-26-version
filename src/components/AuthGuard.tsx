import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAppSelector } from "@/store/hooks";

interface AuthGuardProps {
    children: React.ReactNode;
}

const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
    const { isAuthenticated } = useAppSelector((state: any) => state.auth);
    const location = useLocation();

    if (!isAuthenticated) {
        // Redirect to landing page and open login modal
        return <Navigate to="/?open_login=true" state={{ from: location }} replace />;
    }

    return <>{children}</>;
};

export default AuthGuard;
