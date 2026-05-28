import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { verifyEmail } from "@/store/slices/authSlice";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, XCircle, ArrowRight, Mail } from "lucide-react";
import BackgroundPattern from "@/components/BackgroundPattern";
import stratviewLogoWhite from "@/assets/stratview-logo-white.png";

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const dispatch = useAppDispatch();
  const { isLoading, error } = useAppSelector((state) => state.auth);
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    if (token) {
      handleVerification();
    }
  }, [token]);

  const handleVerification = async () => {
    try {
      const resultAction = await dispatch(verifyEmail(token as string));
      if (verifyEmail.fulfilled.match(resultAction)) {
        setIsVerified(true);
      }
    } catch (err) {
      console.error("Verification error:", err);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative bg-background overflow-hidden">
      <BackgroundPattern />
      
      <div className="relative z-10 w-full max-w-md p-8 mx-4 bg-card border border-border rounded-2xl shadow-xl animate-fade-in-up">
        <div className="flex flex-col items-center text-center space-y-6">
          {/* Logo */}
          <div className="mb-2">
            <div className="bg-primary p-3 rounded-xl inline-block">
                <img src={stratviewLogoWhite} alt="Stratview" className="h-8 w-auto" />
            </div>
          </div>

          {!token ? (
            <>
              <div className="h-16 w-16 bg-destructive/10 rounded-full flex items-center justify-center">
                <XCircle className="h-10 w-10 text-destructive" />
              </div>
              <div className="space-y-2">
                <h1 className="text-2xl font-bold text-foreground">Invalid Link</h1>
                <p className="text-muted-foreground">
                  The verification link is missing or invalid. Please check your email and try again.
                </p>
              </div>
              <Button asChild className="w-full h-12 gradient-primary">
                <Link to="/">Back to Login</Link>
              </Button>
            </>
          ) : isLoading ? (
            <>
              <div className="h-16 w-16 bg-secondary/10 rounded-full flex items-center justify-center">
                <Loader2 className="h-10 w-10 text-secondary animate-spin" />
              </div>
              <div className="space-y-2">
                <h1 className="text-2xl font-bold text-foreground">Verifying Account</h1>
                <p className="text-muted-foreground">
                  Please wait while we verify your email address...
                </p>
              </div>
            </>
          ) : isVerified ? (
            <>
              <div className="h-16 w-16 bg-success/10 rounded-full flex items-center justify-center">
                <CheckCircle2 className="h-10 w-10 text-success" />
              </div>
              <div className="space-y-2">
                <h1 className="text-2xl font-bold text-foreground">Account Activated!</h1>
                <p className="text-muted-foreground">
                  Your email has been successfully verified. You can now access your account.
                </p>
              </div>
              <Button asChild className="w-full h-12 gradient-primary group">
                <Link to="/">
                  Sign In
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </>
          ) : (
            <>
              <div className="h-16 w-16 bg-destructive/10 rounded-full flex items-center justify-center">
                <XCircle className="h-10 w-10 text-destructive" />
              </div>
              <div className="space-y-2">
                <h1 className="text-2xl font-bold text-foreground">Verification Failed</h1>
                <p className="text-muted-foreground">
                  {error || "We couldn't verify your email. The link may have expired or is already used."}
                </p>
              </div>
              <div className="flex flex-col w-full gap-3">
                <Button onClick={handleVerification} variant="outline" className="w-full h-12">
                  Try Again
                </Button>
                <Button asChild variant="ghost" className="w-full h-12 text-secondary hover:text-secondary/80">
                  <Link to="/">Back to Login</Link>
                </Button>
              </div>
            </>
          )}

          {/* Help footer */}
          <div className="pt-6 border-t border-border w-full">
            <p className="text-sm text-muted-foreground">
              Need help? <a href="mailto:support@stratviewresearch.com" className="text-secondary font-medium">Contact Support</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
