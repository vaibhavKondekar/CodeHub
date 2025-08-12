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
    const { user, setUser } = useContext(DataContext);

    function loadingStart() {
        setIsLoading(true);
    }
    function loadingStop() {
        setIsLoading(false);
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
        } else {

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

    function goToLogin() {
        document.getElementById("login-form").classList.add("active");
        document.getElementById("register-form").classList.remove('active');
        document.getElementById("error-message p").innerHTML = "";
        document.getElementById("error-message").classList.remove("active");
    }

    function goToRegister() {
        
        document.getElementById("login-form").classList.remove("active");
        document.getElementById("register-form").classList.add('active');
        // document.getElementById("error-message p").innerHTML = "";
        document.getElementById("error-message").classList.remove("active");
    }

    async function registerUser(e) {
        e.preventDefault();
      
        const passwordSame = document.getElementById("register-form").querySelector("#reg-password").value === document.getElementById("register-form").querySelector("#reg-passwordConfirm").value;
      
        if (passwordSame) {
                  const data = {
            name: document.getElementById("register-form").querySelector("#reg-name").value,
            email: document.getElementById("register-form").querySelector("#reg-email").value,
            password: document.getElementById("register-form").querySelector("#reg-password").value,
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
              showError('Unexpected response format. Please try again.'); // Handle missing user object
            }
          } catch (error) {
            showError(error.response?.data?.error || 'Registration failed. Please try again.'); // More informative error message
          }
        } else {
          showError("Passwords do not match");
        }
      }
      

    function loginUser(e) {
        e.preventDefault();

        const data = {
            email: document.getElementById("login-form").querySelector("#email").value,
            password: document.getElementById("login-form").querySelector("#password").value,
        }

        if (data.email === "" || data.password === "") {
            showError("Please fill all the fields");
            return;
        }


        axios.post(config.BACKEND_URL + "/users/login", data).then((response) => {
            setUser(response.data.user);
            localStorage.setItem('user', response.data.token);
        }).catch((error) => {
            if (error.response.status === 400) {
                showError("Invalid  Credentials");
            }
        });
    }

    function showError(message) {
        toast.error(message);
        const box = document.querySelector(".login-register");
        box.classList.add("error");
        setTimeout(() => {
            box.classList.remove("error");
        }, 500);

        const errorMessage = document.querySelector(".login-register #error-message");
        errorMessage.children[0].innerHTML = message;
        errorMessage.classList.add("active");

        setTimeout(() => {
            errorMessage.classList.remove("active");
        }, 2500);


    }

    return (
        isLoading === true ? (<Loader />) : (
            user == null ? (
                <>
                    <div className="login-register">
                        <div id="logo-login">
                            <img src="./app-logo.png" alt="logo" />
                            <img src="./app-logo-light.png" alt="logo-light" />
                        </div>
                        <GoogleOAuthProvider clientId={config.GOOGLE_CLIENT_ID}>
                            <GoogleLogin id="googlelogin"
                                onSuccess={credentialResponse => {
                                    onSuccess(credentialResponse);
                                }}
                                onError={() => {
                                    console.log('Login Failed');
                                }}
                                useOneTap
                            />
                        </GoogleOAuthProvider>

                        <div id="login-form" className="active">
                            <h1>Login</h1>
                            <form onSubmit={loginUser}>
                                <label htmlFor="email">Email</label>
                                <input type="email" id="email" name="email" />
                                <label htmlFor="password">Password</label>
                                <input type="password" id="password" name="password" />
                                <input type="submit" value="Submit" />
                            </form>
                            <p>New User? <a onClick={goToRegister}>Register</a></p>

                        </div>
                        <div id="register-form">
                            <h1>Register</h1>
                            <form onSubmit={registerUser}>
                                <label htmlFor="reg-name">Name</label>
                                <input type="text" id="reg-name" name="name" />
                                <label htmlFor="reg-email">Email</label>
                                <input type="email" id="reg-email" name="email" />
                                <label htmlFor="reg-password">Password</label>
                                <input type="password" id="reg-password" name="password" />
                                <label htmlFor="reg-passwordConfirm">Confirm Password</label>
                                <input type="password" id="reg-passwordConfirm" name="password" />
                                <input type="submit" value="Submit" />
                            </form>
                            <p>Already have an account? <a onClick={goToLogin}>Login</a></p>

                        </div>
                        <div id="error-message" className="error">
                            <p></p>
                        </div>

                    </div>
                    <ToastContainer autoClose={2000} />
                </>
            ) : (
                <>
                    <RoomData />
                    <ToastContainer autoClose={2000} />
                </>
            ))

    );
}

export default Login;