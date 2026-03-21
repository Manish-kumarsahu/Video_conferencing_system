import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

// Extracted outside component — pure function, no need to live inside render cycle
const isAuthenticated = () => Boolean(localStorage.getItem("token"));

const withAuth = (WrappedComponent) => {
    const AuthComponent = (props) => {
        const router = useNavigate();

        useEffect(() => {
            if (!isAuthenticated()) {
                router("/auth");
            }
        }, [router]);

        if (!isAuthenticated()) {
            return null;
        }

        return <WrappedComponent {...props} />;
    };

    return AuthComponent;
};

export default withAuth;