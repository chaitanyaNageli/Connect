import { useEffect, useState } from "react";

export default function Login({ setLogin, setMyNumber }) {

    const [number, setNumber] = useState("");
    const [showOTP, setShowOTP] = useState(false);
    const [otp, setOtp] = useState("");
    const [genOTP, setGenOTP] = useState("");
    const [error, setError] = useState("");
    const [status, setStatus] = useState(false);
    const [time, setTime] = useState(0);


    useEffect(() => {
    if (time === 0) return; 

    const interval = setInterval(() => {
      setTime((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [ time]);


    function otpGenerator() {
        const num = Math.floor(100000 + Math.random() * 900000);
        alert(num);
        return String(num);
    }
    function resendOTP(){
        validate_otp();
        setTime(10);
    }

    function validate_otp() {
        if (!/^\d{10}$/.test(number)) {
            setError("Enter valid 10-digit number");
            return;
        }
        setTime(10);
        const generated = otpGenerator();
        setGenOTP(generated);
        setShowOTP(true);
        setError("");
    }

    
    function verify_otp() {
        if (!/^\d{6}$/.test(otp)) {
            setError("Enter valid 6-digit OTP");
            return;
        }

        if (otp === genOTP) {
            setStatus(true);
            setError("");

            setTimeout(() => {
                setMyNumber(number);
                setLogin(true);
            }, 500);

        } else {
            setError("Wrong OTP");
        }
    }

    return (
        <div className="login">

            {!status && (
                <div className="verify">

                    <p className="text">Connect needs to verify the device</p>
                    <p className="text">Enter your mobile number</p>

                    <div className="get-verify">

                        <input
                            type="text"
                            className="ph-num"
                            placeholder="Enter number"
                            value={number}
                            maxLength={10}
                            onChange={(e) =>
                                setNumber(e.target.value.replace(/\D/g, ""))
                            }
                        />

                        {showOTP && (
                            <input
                                className="OTP"
                                placeholder="Enter OTP"
                                value={otp}
                                maxLength={6}
                                onChange={(e) =>
                                    setOtp(e.target.value.replace(/\D/g, ""))
                                }
                            />
                        )}

                        {error && <p style={{ color: "red" }}>{error}</p>}

                        {showOTP && (
                            <>
                                <button
                                    className="verify-now"
                                    disabled={time>0?true:false}
                                    onClick={resendOTP}

                                >
                                    Resend otp{ time>0 ? ` ? ${time}`:""}
                                </button>
                            </>)}


                        <button
                            className="verify-now"
                            onClick={showOTP ? verify_otp : validate_otp}
                        >
                            {showOTP ? "Verify OTP" : "Get OTP"}
                        </button>

                    </div>
                </div>
            )}



        </div>
    );
}