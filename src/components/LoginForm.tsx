 import { useState, useEffect, useRef } from "react";
 import { useNavigate, Link, useLocation } from "react-router-dom";
 import { useAppDispatch, useAppSelector } from "@/store/hooks";
 //import { loginUser, clearError } from "@/store/slices/authSlice";
 import { 
   loginUser, 
   clearError, 
   sendLoginOtp, 
   verifyLoginOtp 
 } from "@/store/slices/authSlice";
 import { Button } from "@/components/ui/button";
 import { Input } from "@/components/ui/input";
 import { Label } from "@/components/ui/label";
 import { Checkbox } from "@/components/ui/checkbox";
 import { Eye, EyeOff, ArrowRight, Loader2, Info, KeyRound, Lock } from "lucide-react";
 import { toast } from "sonner";
 
 type LoginMode = "otp" | "password";
 type OtpStep = "request" | "verify";
 
 const LoginForm = () => {
   const navigate = useNavigate();
   const location = useLocation();
 
   // Shared
   const [mode, setMode] = useState<LoginMode>("otp");
   const [identifier, setIdentifier] = useState(""); // email or mobile (used for OTP)
   const [redirectMessage, setRedirectMessage] = useState<string | null>(null);
 
   // Password mode
   const [email, setEmail] = useState("");
   const [password, setPassword] = useState("");
   const [showPassword, setShowPassword] = useState(false);
   const [rememberMe, setRememberMe] = useState(false);
 
   // OTP mode
   const [otpStep, setOtpStep] = useState<OtpStep>("request");
   const [otp, setOtp] = useState("");
   const [otpSending, setOtpSending] = useState(false);
   const [otpVerifying, setOtpVerifying] = useState(false);
   const [resendCountdown, setResendCountdown] = useState(0);
   const countdownRef = useRef<number | null>(null);
 
   const dispatch = useAppDispatch();
   const { isLoading, error } = useAppSelector((state: any) => state.auth);
 
     useEffect(() => {
       const params = new URLSearchParams(location.search);
        const token = localStorage.getItem("token"); // ðŸ‘ˆ ADD THIS
       if (params.get("open_login") === "true") {
         setRedirectMessage("Please sign in to access that page.");
       } else if (params.get("expired") === "true") {
         setRedirectMessage("Session expired. Please sign in again.");
       }else {
         setRedirectMessage(null); // ðŸ‘ˆ CLEAR MESSAGE AFTER LOGIN
       }
       dispatch(clearError());
     }, [location, dispatch]);
 
     // Resend countdown
     useEffect(() => {
       if (resendCountdown <= 0) {
         if (countdownRef.current) window.clearInterval(countdownRef.current);
         return;
       }
       countdownRef.current = window.setInterval(() => {
         setResendCountdown((s) => s - 1);
       }, 1000);
       return () => {
         if (countdownRef.current) window.clearInterval(countdownRef.current);
       };
     }, [resendCountdown]);
 
     useEffect(() => {
       const token = localStorage.getItem("token");
 
       if (token) {
         navigate("/dashboard", { replace: true });
       }
     }, []);
 
   // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   // PASSWORD LOGIN (already wired to backend â€” do not change)
   // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   const handlePasswordSubmit = async (e: React.FormEvent) => {
     e.preventDefault();
     try {
       const resultAction = await dispatch(loginUser({ email, password }));
       if (loginUser.fulfilled.match(resultAction)) {
         toast.success("Welcome back!", { description: "You have successfully signed in.", closeButton: true });
         navigate("/dashboard", { replace: true });
       } else {
         toast.error("Login Failed", {
           description: (resultAction.payload as string) || "Invalid email or password. Please try again.",
         });
       }
     } catch (err) {
       toast.error("Error", { description: "An unexpected error occurred. Please try again." });
     }
   };
 
   // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   // OTP LOGIN
   //
   // BACKEND INTEGRATION POINT (TO BE WIRED BY DEVELOPER):
   //   1. Send OTP:    POST /react/send-login-otp        body: { identifier }
   //                   sends OTP to BOTH the registered email AND mobile
   //                   linked to this account.
   //   2. Verify OTP:  POST /react/verify-login-otp      body: { identifier, otp }
   //                   on success returns { token, user } â€” same shape as
   //                   the password login response so it can be dispatched
   //                   through the existing authSlice.
   //
   // Until the API is ready, the two handlers below are no-op placeholders
   // that simulate success so the UI flow can be tested.
   // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   const handleSendOtp = async (e: React.FormEvent) => {
   e.preventDefault();
 
   if (!identifier.trim()) {
     toast.error("Please enter your email address.");
     return;
   }
 
   setOtpSending(true);
 
   try {
     const result = await dispatch(sendLoginOtp(identifier));
 
     if (sendLoginOtp.fulfilled.match(result)) {
       await new Promise((r) => setTimeout(r, 600));
 
       toast.success("OTP sent", {
         description: "We've sent a verification code to your registered email.",
       });
 
       setOtpStep("verify");
       setResendCountdown(30);
 
     } else {
       // â— important: handle rejected case from Redux
       const errorMsg = (result.payload as string)?.toLowerCase() || "";
 
       if (
         errorMsg.includes("not_registered") ||
         errorMsg.includes("not registered") ||
         errorMsg.includes("404")
       ) {
         toast.error("Email not registered", {
           description: "We couldn't find an account with that email.",
           action: { label: "Sign up", onClick: () => navigate("/signup") },
         });
       } else {
         toast.error("Could not send OTP", {
           description: result.payload as string || "Please try again.",
         });
       }
     }
 
   } catch (err) {
     // â— this only runs if something crashes (rare)
     toast.error("Something went wrong", {
       description: "Unexpected error occurred.",
     });
   } finally {
     setOtpSending(false);
   }
 };
 
 const handleVerifyOtp = async (e: React.FormEvent) => {
   e.preventDefault();
 
   if (otp.length < 4) {
     toast.error("Please enter the OTP sent to you.");
     return;
   }
 
   setOtpVerifying(true);
 
   try {
     const result = await dispatch(
       verifyLoginOtp({ identifier, otp })
     );
 
     if (verifyLoginOtp.fulfilled.match(result)) {
       await new Promise((r) => setTimeout(r, 600));
 
       toast.success("Verified!", { description: "You have successfully signed in.", closeButton: true });
 
       setRedirectMessage(null); 
       navigate("/dashboard", { replace: true });
 
     } else {
       toast.error("Invalid OTP", {
         description: result.payload as string || "Incorrect or expired OTP.",
       });
     }
 
   } catch (err) {
     toast.error("Something went wrong", {
       description: "Please try again.",
     });
   } finally {
     setOtpVerifying(false);
   }
 };
 
   const switchMode = (next: LoginMode) => {
     setMode(next);
     dispatch(clearError());
     if (next === "otp") {
       setOtpStep("request");
       setOtp("");
     }
   };
 
   // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   // RENDER
   // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   return (
     <div className="space-y-5">
       {redirectMessage && !error && (
         <div className="p-3 rounded-md bg-secondary/10 text-secondary text-sm font-medium flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
           <Info className="h-4 w-4" />
           {redirectMessage}
         </div>
       )}
 
       {/* Mode toggle */}
       <div className="grid grid-cols-2 gap-2 p-1 rounded-lg bg-muted/40 border border-border">
         <button
           type="button"
           onClick={() => switchMode("otp")}
           className={`flex items-center justify-center gap-2 h-10 rounded-md text-sm font-medium transition-all ${
             mode === "otp"
               ? "bg-background text-foreground shadow-sm"
               : "text-muted-foreground hover:text-foreground"
           }`}
         >
           <KeyRound className="h-4 w-4" />
           OTP
         </button>
         <button
           type="button"
           onClick={() => switchMode("password")}
           className={`flex items-center justify-center gap-2 h-10 rounded-md text-sm font-medium transition-all ${
             mode === "password"
               ? "bg-background text-foreground shadow-sm"
               : "text-muted-foreground hover:text-foreground"
           }`}
         >
           <Lock className="h-4 w-4" />
           Password
         </button>
       </div>
 
       {/* OTP MODE */}
       {mode === "otp" && (
         <form onSubmit={otpStep === "request" ? handleSendOtp : handleVerifyOtp} className="space-y-5">
           <div className="space-y-2">
             <Label htmlFor="identifier" className="text-sm font-medium text-foreground">
               Email Address
             </Label>
             <Input
               id="identifier"
               type="email"
               placeholder="name@company.com"
               value={identifier}
               onChange={(e) => setIdentifier(e.target.value)}
               disabled={otpStep === "verify"}
               className="h-12 bg-background border-border focus:border-secondary focus:ring-secondary/20 transition-all duration-200"
               required
             />
             <p className="text-xs text-muted-foreground">
               We'll send a verification code to your registered email.
             </p>
           </div>
 
           {otpStep === "verify" && (
             <div className="space-y-2 animate-in fade-in slide-in-from-top-1">
               <Label htmlFor="otp" className="text-sm font-medium text-foreground">
                 Enter OTP
               </Label>
               <Input
                 id="otp"
                 type="text"
                 inputMode="numeric"
                 autoComplete="one-time-code"
                 maxLength={6}
                 placeholder="6-digit code"
                 value={otp}
                 onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                 className="h-12 bg-background border-border focus:border-secondary focus:ring-secondary/20 transition-all duration-200 tracking-widest text-center text-lg"
                 required
               />
               <div className="flex items-center justify-between text-sm">
                 <button
                   type="button"
                   onClick={() => {
                     setOtpStep("request");
                     setOtp("");
                   }}
                   className="text-muted-foreground hover:text-foreground transition-colors"
                 >
                   Change email
                 </button>
                 <button
                   type="button"
                   disabled={resendCountdown > 0 || otpSending}
                   onClick={(e) => handleSendOtp(e as any)}
                   className="font-medium text-secondary hover:text-stratview-mint transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                 >
                   {resendCountdown > 0 ? `Resend in ${resendCountdown}s` : "Resend OTP"}
                 </button>
               </div>
             </div>
           )}
 
           <Button
             type="submit"
             disabled={otpSending || otpVerifying}
             className="w-full h-12 gradient-primary hover:opacity-90 text-primary-foreground font-semibold text-base transition-all duration-200 group"
           >
             {otpSending || otpVerifying ? (
               <Loader2 className="h-5 w-5 animate-spin" />
             ) : (
               <>
                 {otpStep === "request" ? "Send OTP" : "Verify & Sign In"}
                 <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
               </>
             )}
           </Button>
         </form>
       )}
 
       {/* PASSWORD MODE (existing â€” fully wired) */}
       {mode === "password" && (
         <form onSubmit={handlePasswordSubmit} className="space-y-5">
           <div className="space-y-2">
             <Label htmlFor="email" className="text-sm font-medium text-foreground">
               Email Address
             </Label>
             <Input
               id="email"
               type="email"
               placeholder="name@company.com"
               value={email}
               onChange={(e) => setEmail(e.target.value)}
               className="h-12 bg-background border-border focus:border-secondary focus:ring-secondary/20 transition-all duration-200"
               required
             />
           </div>
 
           <div className="space-y-2">
             <Label htmlFor="password" className="text-sm font-medium text-foreground">
               Password
             </Label>
             <div className="relative">
               <Input
                 id="password"
                 type={showPassword ? "text" : "password"}
                 placeholder="Enter your password"
                 value={password}
                 onChange={(e) => setPassword(e.target.value)}
                 className="h-12 bg-background border-border focus:border-secondary focus:ring-secondary/20 transition-all duration-200 pr-12"
                 required
               />
               <button
                 type="button"
                 onClick={() => setShowPassword(!showPassword)}
                 className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
               >
                 {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
               </button>
             </div>
           </div>
 
           <div className="flex items-center justify-between">
             <div className="flex items-center space-x-2">
               <Checkbox
                 id="remember"
                 checked={rememberMe}
                 onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                 className="border-border data-[state=checked]:bg-secondary data-[state=checked]:border-secondary"
               />
               <Label
                 htmlFor="remember"
                 className="text-sm font-normal text-muted-foreground cursor-pointer"
               >
                 Remember me
               </Label>
             </div>
             <Link
               to="/forgot-password"
               className="text-sm font-medium text-secondary hover:text-stratview-mint transition-colors"
             >
               Forgot password?
             </Link>
           </div>
 
           <Button
             type="submit"
             disabled={isLoading}
             className="w-full h-12 gradient-primary hover:opacity-90 text-primary-foreground font-semibold text-base transition-all duration-200 group"
           >
             {isLoading ? (
               <Loader2 className="h-5 w-5 animate-spin" />
             ) : (
               <>
                 Sign In
                 <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
               </>
             )}
           </Button>
         </form>
       )}
 
       <p className="text-center text-sm text-muted-foreground">
         Don't have an account?{" "}
         <Link to="/signup" className="font-medium text-secondary hover:text-stratview-mint transition-colors">
           Sign up now
         </Link>
       </p>
     </div>
   );
 };
 
 export default LoginForm;
 
