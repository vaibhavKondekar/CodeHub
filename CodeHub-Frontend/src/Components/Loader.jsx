import React from "react";

const Loader = () => {
    return (
        <div className="modern-loader">
            <div className="loader-container">
                <div className="loader-logo">
                    <h1>CodeHub</h1>
                    <p>Loading...</p>
                </div>
                
                <div className="loader-spinner">
                    <div className="spinner-ring"></div>
                    <div className="spinner-ring"></div>
                    <div className="spinner-ring"></div>
                </div>
                
                <div className="loader-dots">
                    <div className="dot"></div>
                    <div className="dot"></div>
                    <div className="dot"></div>
                </div>
            </div>
        </div>
    );
};

export default Loader;