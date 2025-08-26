export const signup = (req, res) => {
    const { first_name, last_name, email, password } = req.body;
    if(!first_name || !last_name || !email || !password) {
        return res.status(400).json({ message: "All fields are required" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email?.trim())) {
        return res.status(400).json({ error: "Invalid email format" });
    }
    
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
        return res.status(400).json({ error: "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character" });
    }

    const user = {
        first_name: first_name,
        last_name: last_name,
        email: email,
        password
    }
    // TODO: Check if user already exists
    res.json({ message: user });
    console.log(user);
}

export const login = (req, res) => {
    const { email, password } = req.body;

    if (!email?.trim() || !password) {
        return res.status(400).json({ error: "All fields are required" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
        return res.status(400).json({ error: "Invalid email format" });
    }

    if (password.length < 8) {
        return res.status(400).json({ error: "Password must be at least 8 characters long" });
    }

    // TODO: Replace with real user lookup and password verification logic
    // For now, assume success
    return res.json({ message: "Login Successful", user: { email } });
};

export const verifyMail = (req, res) => {
    const { code } = req.body;

    // Ensure a code was provided
    if (!code) {
        return res.status(400).json({ error: "Verification code is required" });
    }

    // Basic validation: 6-digit numeric code
    const codeRegex = /^\d{6}$/;
    if (!codeRegex.test(code)) {
        return res.status(400).json({ error: "Invalid verification code format" });
    }

    // TODO: Compare with code stored in DB / cache for the current user
    // For prototype, assume any valid 6-digit code succeeds
    return res.json({ message: "Email verified successfully" });
};

export const forgotPassword = (req, res) => {
    const { email } = req.body;
    if (!email?.trim()) {
        return res.status(400).json({ message: "Email is required" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
        return res.status(400).json({ error: "Invalid email format" });
    }

    // TODO: Implement actual email service integration
    return res.json({ message: `Password reset link sent to ${email}` });
};
