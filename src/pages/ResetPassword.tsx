import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, ArrowRight, Loader2, Lock, CheckCircle, Eye, EyeOff, AlertCircle } from "lucide-react";
import BackgroundPattern from "@/components/BackgroundPattern";
import stratviewLogoWhite from "@/assets/stratview-logo-white.png";
import { Link } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { resetPassword, clearError } from "@/store/slices/authSlice";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Check, X } from "lucide-react";

const resetPasswordSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Must contain at least one uppercase letter")
    .regex(/[a-z]/, "Must contain at least one lowercase letter")
    .regex(/[0-9]/, "Must contain at least one number")
    .regex(/[!@#$%^&*]/, "Must contain at least one special character (!@#$%^&*)"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;

const ResetPassword = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { isLoading, error } = useAppSelector((state: any) => state.auth);
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [isSuccess, setIsSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
    mode: "onChange",
  });

  const passwordRules = [
    { label: "At least 8 characters", test: (p: string) => p.length >= 8 },
    { label: "One uppercase letter", test: (p: string) => /[A-Z]/.test(p) },
    { label: "One lowercase letter", test: (p: string) => /[a-z]/.test(p) },
    { label: "One number", test: (p: string) => /[0-9]/.test(p) },
    { label: "One special character (!@#$%^&*)", test: (p: string) => /[!@#$%^&*]/.test(p) },
  ];

  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

  const handleSubmit = async (values: ResetPasswordValues) => {
    if (!token) {
      toast.error("Invalid Request", {
        description: "Reset token is missing. Please use the link sent to your email.",
      });
      return;
    }

    try {
      const resultAction = await dispatch(resetPassword({ token, password: values.password }));
      
      if (resetPassword.fulfilled.match(resultAction)) {
        setIsSuccess(true);
        toast.success("Password reset successful!", {
          description: "You can now sign in with your new password.",
        });
      } else {
        toast.error("Reset Failed", {
          description: resultAction.payload as string || "We couldn't reset your password. The link may have expired.",
        });
      }
    } catch (err) {
      console.error('Password reset failed:', err);
      toast.error("Error", {
        description: "An unexpected error occurred. Please try again.",
      });
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center relative bg-background overflow-hidden">
        <BackgroundPattern />
        <div className="relative z-10 w-full max-w-md p-8 mx-4 bg-card border border-border rounded-2xl shadow-xl animate-fade-in-up">
          <div className="flex flex-col items-center text-center space-y-6">
            <div className="h-20 w-20 bg-success/10 rounded-full flex items-center justify-center mb-2">
              <CheckCircle className="h-12 w-12 text-success" />
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-foreground font-display">Success!</h1>
              <p className="text-muted-foreground leading-relaxed">
                Your password has been reset successfully. You can now access your account with your new credentials.
              </p>
            </div>
            <Button asChild className="w-full h-12 gradient-primary group shadow-lg shadow-primary/20">
              <Link to="/">
                Sign In Now
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-3/5 relative text-white">
        <BackgroundPattern />
        <div className="relative z-10 flex flex-col justify-between p-12 xl:p-16 w-full h-full">
          <div className="space-y-12">
            <div className="animate-fade-in-up">
              <img src={stratviewLogoWhite} alt="Stratview" className="h-16 xl:h-20 w-auto" />
            </div>
            <div className="space-y-8 animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
              <div className="space-y-4">
                <h1 className="text-4xl xl:text-5xl font-bold leading-tight font-display">
                  Secure Your
                  <span className="block text-stratview-mint">Account</span>
                </h1>
                <p className="text-lg xl:text-xl text-white/80 max-w-lg leading-relaxed">
                  Choose a strong password to ensure your market intelligence data stays protected and accessible only to you.
                </p>
              </div>
            </div>
          </div>
          <div className="animate-fade-in-up mt-auto" style={{ animationDelay: "0.4s" }}>
            <p className="text-sm text-white/60">
              © {new Date().getFullYear()} Stratview Research. All rights reserved.
            </p>
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="w-full lg:w-1/2 xl:w-2/5 flex flex-col justify-center px-6 sm:px-12 lg:px-16 xl:px-20 bg-background relative">
        <div className="w-full max-w-md mx-auto space-y-8 animate-fade-in">
          {!token && (
            <div className="p-4 rounded-xl bg-destructive/5 border border-destructive/20 mb-6 group">
                <div className="flex gap-3">
                    <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
                    <p className="text-sm text-destructive font-medium leading-relaxed">
                        Invalid or missing reset token. Please check your email link or request a new one.
                    </p>
                </div>
            </div>
          )}

          <div className="space-y-2 text-center lg:text-left">
            <h2 className="text-3xl font-bold text-foreground font-display">Set New Password</h2>
            <p className="text-muted-foreground">
              Please enter your new password below.
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel>New Password <span className="text-destructive ml-1">*</span></FormLabel>
                      <div className="relative group">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground transition-colors group-focus-within:text-primary" />
                        <FormControl>
                          <Input
                            {...field}
                            type={showPassword ? "text" : "password"}
                            placeholder="Create a strong password"
                            className="h-12 pl-12 pr-12 bg-background border-border focus:border-primary/50 focus:ring-primary/20 transition-all rounded-xl"
                          />
                        </FormControl>
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-muted"
                        >
                          {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                      {field.value && (
                        <div className="mt-2 space-y-1">
                          {passwordRules.map((rule, index) => {
                            const isValid = rule.test(field.value);
                            return (
                              <div key={index} className="flex items-center gap-2 text-sm">
                                {isValid ? (
                                  <Check className="h-4 w-4 text-green-500" />
                                ) : (
                                  <X className="h-4 w-4 text-muted-foreground" />
                                )}
                                <span className={isValid ? "text-green-500" : "text-muted-foreground"}>
                                  {rule.label}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel>Confirm New Password <span className="text-destructive ml-1">*</span></FormLabel>
                      <div className="relative group">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground transition-colors group-focus-within:text-primary" />
                        <FormControl>
                          <Input
                            {...field}
                            type={showPassword ? "text" : "password"}
                            placeholder="Confirm your password"
                            className="h-12 pl-12 bg-background border-border focus:border-primary/50 focus:ring-primary/20 transition-all rounded-xl"
                          />
                        </FormControl>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Button
                type="submit"
                disabled={isLoading || !token}
                className="w-full h-12 gradient-primary hover:opacity-95 text-white font-semibold text-lg transition-all rounded-xl shadow-lg shadow-primary/20 group"
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <span className="flex items-center justify-center">
                    Reset Password
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                )}
              </Button>
            </form>
          </Form>

          <div className="pt-6 border-t border-border mt-8">
            <Link
              to="/"
              className="flex items-center justify-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors group"
            >
              <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
              Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
