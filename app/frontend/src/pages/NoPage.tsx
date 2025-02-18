import { Navigate, useLocation } from "react-router-dom";

const NoPage = () => {

    const location = useLocation();

    if (location.pathname.startsWith("code")) {
        return <Navigate to="/" replace />;
    }

    return <h1>404</h1>;
};

export default NoPage;
