import React, { useState, useEffect } from "react";

function LightDark() {
    // Initialize theme based on user's preference or default to light mode
    const [isDarkMode, setIsDarkMode] = useState(() => {
        const savedTheme = localStorage.getItem("theme");
        return savedTheme ? savedTheme === "dark" : false;
    });

    // Use useEffect to apply the theme to the body and save preference
    useEffect(() => {
        if (isDarkMode) {
            document.body.classList.add("dark");
            localStorage.setItem("theme", "dark");
        } else {
            document.body.classList.remove("dark");
            localStorage.setItem("theme", "light");
        }
    }, [isDarkMode]);

    // Toggle theme function
    const toggleTheme = () => {
        setIsDarkMode(!isDarkMode);
    };

    return (
        <>
            <div className="light-dark-switch">
                <input
                    type="checkbox"
                    className="checkbox"
                    id="checkbox"
                    checked={isDarkMode}
                    onChange={toggleTheme}
                />
                <label htmlFor="checkbox" className="checkbox-label">
                    <i className="fas fa-moon"></i>
                    <i className="fas fa-sun"></i>
                    <span className="ball"></span>
                </label>
            </div>
        </>
    );
}

export default LightDark;