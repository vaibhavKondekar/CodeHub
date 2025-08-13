import { useEffect, useState, useContext } from "react";
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import axios from 'axios';
import RoomData from './RoomData';
import { DataContext } from "./DataContext";
import Loader from "./Loader";
import { ToastContainer, toast } from "react-toastify";
import config from '../config';

axios.defaults.headers.post['Access-Control-Allow-Origin'] = '*';

function Login() {
    const [isLoading, setIsLoading] = useState(false);
    const [isLogin, setIsLogin] = useState(true);
    const { user, setUser } = useContext(DataContext);

    function loadingStart() {
        setIsLoading(true);
    }
    
    function loadingStop() {
        // Add a small delay to make the loader visible
        setTimeout(() => {
            setIsLoading(false);
        }, 800); // 800ms delay - just enough to see the beautiful loader
    }

    useEffect(() => {
        const token = localStorage.getItem('user');
        if (token) {
            loadingStart();
            axios({
                method: 'get',
                url: config.BACKEND_URL + "/users/fetch",
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            }).then((response) => {
                loadingStop();
                localStorage.setItem('user', response.data.token);
                setUser(response.data.user);
            }).catch((error) => {
                loadingStop();
                setUser(null);
                console.log("error in axios jwt call", error);
            });
        }
    }, []);

    const onSuccess = (credentialResponse) => {
        loadingStart();
        axios({
            method: 'post',
            url: config.BACKEND_URL + "/users/login",
            data: credentialResponse
        }).then((response) => {
            setUser(response.data.user);
            loadingStop();
            localStorage.setItem('user', response.data.token);
        }).catch((error) => {
            loadingStop();
            console.log("error in axios login call", error);
        });
    }

    async function registerUser(e) {
        e.preventDefault();
      
        const passwordSame = document.getElementById("reg-password").value === document.getElementById("reg-passwordConfirm").value;
      
        if (passwordSame) {
            const data = {
                name: document.getElementById("reg-name").value,
                email: document.getElementById("reg-email").value,
                password: document.getElementById("reg-password").value,
            };
      
            if (data.name === "" || data.email === "" || data.password === "") {
                showError("Please fill all the fields");
                return;
            }

            const url = config.BACKEND_URL + "/users/register";
      
            try {
                const response = await axios.post(url, data);
      
                if (response.data.user) {
                    setUser(response.data.user);
                    localStorage.setItem('user', response.data.token);
                } else {
                    showError('Unexpected response format. Please try again.');
                }
            } catch (error) {
                showError(error.response?.data?.error || 'Registration failed. Please try again.');
            }
        } else {
            showError("Passwords do not match");
        }
    }

    function loginUser(e) {
        e.preventDefault();

        const data = {
            email: document.getElementById("email").value,
            password: document.getElementById("password").value,
        }

        if (data.email === "" || data.password === "") {
            showError("Please fill all the fields");
            return;
        }

        axios.post(config.BACKEND_URL + "/users/login", data).then((response) => {
            setUser(response.data.user);
            localStorage.setItem('user', response.data.token);
        }).catch((error) => {
            if (error.response?.status === 400) {
                showError("Invalid Credentials");
            }
        });
    }

    function showError(message) {
        toast.error(message);
    }

    if (isLoading) {
        return <Loader />;
    }

    if (user) {
        return (
            <>
                <RoomData />
                <ToastContainer autoClose={2000} />
            </>
        );
    }

    return (
        <div className="auth-container">
            <div className="auth-card">
                <div className="auth-header">
                    <h1>CodeHub</h1>
                    <p>Collaborative Code Editor</p>
                </div>

                <div className="auth-tabs">
                    <button 
                        className={`tab ${isLogin ? 'active' : ''}`}
                        onClick={() => setIsLogin(true)}
                    >
                        Sign In
                    </button>
                    <button 
                        className={`tab ${!isLogin ? 'active' : ''}`}
                        onClick={() => setIsLogin(false)}
                    >
                        Sign Up
                    </button>
                </div>

                {isLogin ? (
                    <div className="auth-form">
                        <form onSubmit={loginUser}>
                            <div className="form-group">
                                <input 
                                    type="email" 
                                    id="email" 
                                    placeholder="Email"
                                    required 
                                />
                            </div>
                            <div className="form-group">
                                <input 
                                    type="password" 
                                    id="password" 
                                    placeholder="Password"
                                    required 
                                />
                            </div>
                            <button type="submit" className="submit-btn">
                                Sign In
                            </button>
                        </form>
                    </div>
                ) : (
                    <div className="auth-form">
                        <form onSubmit={registerUser}>
                            <div className="form-group">
                                <input 
                                    type="text" 
                                    id="reg-name" 
                                    placeholder="Full Name"
                                    required 
                                />
                            </div>
                            <div className="form-group">
                                <input 
                                    type="email" 
                                    id="reg-email" 
                                    placeholder="Email"
                                    required 
                                />
                            </div>
                            <div className="form-group">
                                <input 
                                    type="password" 
                                    id="reg-password" 
                                    placeholder="Password"
                                    required 
                                />
                            </div>
                            <div className="form-group">
                                <input 
                                    type="password" 
                                    id="reg-passwordConfirm" 
                                    placeholder="Confirm Password"
                                    required 
                                />
                            </div>
                            <button type="submit" className="submit-btn">
                                Sign Up
                            </button>
                        </form>
                    </div>
                )}

                <div className="divider">
                    <span>or</span>
                </div>

                <div className="google-auth">
                    <GoogleOAuthProvider clientId={config.GOOGLE_CLIENT_ID}>
                        <GoogleLogin 
                            onSuccess={onSuccess}
                            onError={() => console.log('Google Login Failed')}
                            useOneTap
                            theme="outline"
                            size="large"
                            text="continue_with"
                            shape="rectangular"
                        />
                    </GoogleOAuthProvider>
                </div>
            </div>
            <ToastContainer autoClose={2000} />
        </div>
    );
}

export default Login;