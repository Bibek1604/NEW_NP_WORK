import React from "react";
import { useEffect } from "react";
import { useNavigate } from "react-router";
import toast from "react-hot-toast";
import { useAuth } from "../stores";

function Logout() {
    const { logout, clearUserData, disconnectSocket } = useAuth();
    const navigate = useNavigate();
    
    const hasLoggedOut = React.useRef(false);
    
    useEffect(() => {
        if (hasLoggedOut.current) return;
        hasLoggedOut.current = true;

        // Step 1: Disconnect socket
        disconnectSocket();
        
        // Step 2: Clear user data from store
        clearUserData();
        
        // Step 3: Clear all localStorage
        localStorage.clear();
        
        // Step 4: Set isLoggedIn to false
        logout();
        
        // Step 5: Show success message
        toast.success("Logged Out Successfully", { id: "logout-success" });
        
        // Step 6: Redirect to login page
        navigate("/login", { replace: true });
    }, []);

    return (
        <div className="flex items-center justify-center min-h-screen bg-slate-50">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
                <p className="text-slate-600 font-medium">Logging out...</p>
            </div>
        </div>
    );
}

export default Logout;
