import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

/**
 * Higher-Order Component that protects routes.
 * Redirects to /auth if the user is not authenticated.
 * Uses the AuthContext's isAuthenticated flag (JWT-based).
 */
const withAuth = (WrappedComponent) => {
    const AuthComponent = (props) => {
        const navigate         = useNavigate();
        const { isAuthenticated } = useAuth();

        useEffect(() => {
            if (!isAuthenticated) {
                navigate("/auth");
            }
        }, [isAuthenticated, navigate]);

        if (!isAuthenticated) {
            return null;
        }

        return <WrappedComponent {...props} />;
    };

    return AuthComponent;
};

export default withAuth;