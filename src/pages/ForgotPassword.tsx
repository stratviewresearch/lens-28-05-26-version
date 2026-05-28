import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, ArrowRight, Loader2, Mail, CheckCircle, AlertCircle } from "lucide-react";
import BackgroundPattern from "@/components/BackgroundPattern";
import stratviewLogo from "@/assets/stratview-logo.png";
import stratviewLogoWhite from "@/assets/stratview-logo-white.png";
import { Link } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { requestPasswordReset } from "@/store/slices/authSlice";
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

const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

const ForgotPassword = () => {
  const dispatch = useAppDispatch();
  const { isLoading, error } = useAppSelector((state: any) => state.auth);
  const [submittedEmail, setSubmittedEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  const form = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  /**
   * BACKEND INTEGRATION: Password Reset Request
   */
  const handleSubmit = async (values: ForgotPasswordValues) => {
    try {
      const resultAction = await dispatch(requestPasswordReset(values.email));
      
      if (requestPasswordReset.fulfilled.match(resultAction)) {
        setSubmittedEmail(values.email);
        setIsSubmitted(true);
        toast.success("Reset link sent!", {
          description: "Please check your email for instructions.",
        });
      } else {
        toast.error("Request Failed", {
          description: resultAction.payload as string || "We couldn't process your request. Please check your email and try again.",
        });
      }
    } catch (err) {
      console.error('Password reset request failed:', err);
      toast.error("Error", {
        description: "An unexpected error occurred. Please try again.",
      });
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-3/5 relative">
        <BackgroundPattern />
        
        <div className="relative z-10 flex flex-col justify-between p-12 xl:p-16 w-full">
          {/* Logo and Main content grouped together */}
          <div className="space-y-12">
            {/* Logo */}
            <div className="animate-fade-in-up">
              <img 
                src={stratviewLogoWhite} 
                alt="Stratview Research" 
                className="h-16 xl:h-20 w-auto"
              />
            </div>

            {/* Main content */}
            <div className="space-y-8 animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
              <div className="space-y-4">
                <h1 className="text-4xl xl:text-5xl font-bold text-primary-foreground leading-tight">
                  Reset Your
                  <span className="block text-stratview-mint">Password</span>
                </h1>
                <p className="text-lg xl:text-xl text-primary-foreground/80 max-w-lg leading-relaxed">
                  Don't worry, it happens to the best of us. Enter your email 
                  and we'll send you instructions to reset your password.
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="animate-fade-in-up mt-auto pt-12" style={{ animationDelay: "0.4s" }}>
            <p className="text-sm text-primary-foreground/60">
              © {new Date().getFullYear()} Stratview Research. All rights reserved.
            </p>
          </div>
        </div>
      </div>

      {/* Right Panel - Forgot Password Form */}
      <div className="w-full lg:w-1/2 xl:w-2/5 flex flex-col justify-center px-6 sm:px-12 lg:px-16 xl:px-20 bg-background">
        <div className="w-full max-w-md mx-auto space-y-8">
          {/* Mobile Logo */}
          <div className="lg:hidden flex justify-center mb-8">
            <img 
              src={stratviewLogo} 
              alt="Stratview Research" 
              className="h-14 w-auto"
            />
          </div>

          {/* Back to Login Link */}
          <Link 
            to="/" 
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Sign In
          </Link>

          {!isSubmitted ? (
            <>
              {/* Header */}
              <div className="space-y-2 text-center lg:text-left">
                <h2 className="text-2xl xl:text-3xl font-bold text-foreground">
                  Forgot your password?
                </h2>
                <p className="text-muted-foreground">
                  Enter your email address and we'll send you a link to reset your password.
                </p>
              </div>

              {/* Forgot Password Form */}
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <FormLabel className="text-sm font-medium text-foreground">
                          Email Address <span className="text-destructive ml-1">*</span>
                        </FormLabel>
                        <div className="relative">
                          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                          <FormControl>
                            <Input
                              {...field}
                              type="email"
                              placeholder="name@company.com"
                              className="h-12 pl-12 bg-background border-border focus:border-secondary focus:ring-secondary/20 transition-all duration-200"
                            />
                          </FormControl>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-12 gradient-primary hover:opacity-90 text-primary-foreground font-semibold text-base transition-all duration-200 group"
                  >
                    {isLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <>
                        Send Reset Link
                        <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </>
          ) : (
            /* Success State */
            <div className="text-center space-y-6">
              <div className="flex justify-center">
                <div className="p-4 rounded-full bg-success/10">
                  <CheckCircle className="h-12 w-12 text-success" />
                </div>
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl xl:text-3xl font-bold text-foreground">
                  Check your email
                </h2>
                <p className="text-muted-foreground">
                  We've sent a password reset link to <span className="font-medium text-foreground">{submittedEmail}</span>
                </p>
              </div>
              <p className="text-sm text-muted-foreground">
                Didn't receive the email? Check your spam folder or{" "}
                <button 
                  onClick={() => setIsSubmitted(false)} 
                  className="text-secondary hover:text-stratview-mint transition-colors font-medium"
                >
                  try again
                </button>
              </p>
            </div>
          )}

          {/* Help text */}
          <div className="pt-6 border-t border-border">
            <p className="text-sm text-center text-muted-foreground">
              Remember your password?{" "}
              <Link to="/" className="font-medium text-secondary hover:text-stratview-mint transition-colors">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
