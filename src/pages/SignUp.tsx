 import { useState } from "react";
import { Link } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { signupUser } from "@/store/slices/authSlice";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight, Loader2, ArrowLeft, Eye, EyeOff, Check, X, Mail } from "lucide-react";
import BackgroundPattern from "@/components/BackgroundPattern";
import stratviewLogo from "@/assets/stratview-logo.png";
import stratviewLogoWhite from "@/assets/stratview-logo-white.png";
import { toast } from "sonner";
import { CountrySelector } from "@/components/CountrySelector";
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

const PUBLIC_EMAIL_DOMAINS = [
  "gmail.com",
  "yahoo.com",
  "yahoo.co.in",
  "outlook.com",
  "hotmail.com",
  "icloud.com",
  "msn.com",
  "live.com",
  "live.in",
  "aol.com",
  "ymail.com",
  "protonmail.com",
  "zoho.com",
  "rediffmail.com",
  "gmx.com",
  "mail.com"
];

const isPublicEmail = (email: string) => {
  const domain = email.split("@")[1]?.toLowerCase();
  return domain ? PUBLIC_EMAIL_DOMAINS.includes(domain) : false;
};

const signupSchema = z.object({
  name: z.string()
    .min(2, "Name must be at least 2 characters")
    .regex(/^[a-zA-Z\s]*$/, "Name can only contain letters and spaces"),
  company: z.string()
    .min(2, "Company name must be at least 2 characters")
    .regex(/^[a-zA-Z\s]*$/, "Company can only contain letters and spaces"),
  designation: z.string()
    .min(2, "Designation must be at least 2 characters")
    .regex(/^[a-zA-Z\s]*$/, "Designation can only contain letters and spaces"),
  phone: z.string()
    .min(7, "Phone number must be at least 7 digits")
    .max(15, "Phone number cannot exceed 15 digits")
    .regex(/^[0-9]*$/, "Phone number must contain only digits"),
  email: z.string()
    .email("Invalid email address")
    .refine((email) => !isPublicEmail(email), {
      message: "Please use your official company email address.",
    }),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Must contain at least one uppercase letter")
    .regex(/[a-z]/, "Must contain at least one lowercase letter")
    .regex(/[0-9]/, "Must contain at least one number")
    .regex(/[!@#$%^&*]/, "Must contain at least one special character (!@#$%^&*)"),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type SignupFormValues = z.infer<typeof signupSchema>;

const SignUp = () => {
  const [phoneCode, setPhoneCode] = useState("+1");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);

  const dispatch = useAppDispatch();
  const { isLoading } = useAppSelector((state: any) => state.auth);

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: "",
      company: "",
      designation: "",
      phone: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
    mode: "onChange",
  });

  const onSubmit = async (values: SignupFormValues) => {
    const signupPayload = {
      company: values.company,
      name: values.name,
      designation: values.designation,
      phone_number: values.phone.trim(),
      country_code: phoneCode,
      email: values.email,
      password: values.password,
      confirm_password: values.confirmPassword,
    };

    try {
      const resultAction = await dispatch(signupUser(signupPayload));

      if (signupUser.fulfilled.match(resultAction)) {
        toast.success("Account Created", {
          description: "Your account has been created successfully. Please check your email to activate your account.",
        });
        setIsRegistered(true);
      } else {
        const errorMsg = resultAction.payload as string || "Registration failed. Please try again.";
        toast.error("Registration Failed", {
          description: errorMsg,
        });
      }
    } catch (err) {
      console.error('Registration exception:', err);
      toast.error("Error", {
        description: "An unexpected error occurred. Please try again.",
      });
    }
  };

  const passwordRules = [
    { label: "At least 8 characters", test: (p: string) => p.length >= 8 },
    { label: "One uppercase letter", test: (p: string) => /[A-Z]/.test(p) },
    { label: "One lowercase letter", test: (p: string) => /[a-z]/.test(p) },
    { label: "One number", test: (p: string) => /[0-9]/.test(p) },
    { label: "One special character (!@#$%^&*)", test: (p: string) => /[!@#$%^&*]/.test(p) },
  ];

  const currentPassword = form.watch("password");
  const currentConfirmPassword = form.watch("confirmPassword");
  const passwordsMatch = currentPassword === currentConfirmPassword && currentConfirmPassword !== "";

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-1/2 relative">
        <BackgroundPattern />

        <div className="relative z-10 flex flex-col justify-between p-12 xl:p-16 w-full">
          <div className="space-y-8">
            <div className="animate-fade-in-up">
              <img
                src={stratviewLogoWhite}
                alt="Stratview Research"
                className="h-16 xl:h-20 w-auto"
              />
            </div>

            <div className="space-y-6 animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
              <div className="space-y-4">
                <h1 className="text-4xl xl:text-5xl font-bold text-primary-foreground leading-tight">
                  Join
                  <span className="block text-stratview-mint">Stratview Lens</span>
                </h1>
                <p className="text-lg xl:text-xl text-primary-foreground/80 max-w-lg leading-relaxed">
                  Get access to comprehensive market research data, industry insights,
                  and strategic intelligence tailored to your business needs.
                </p>
              </div>
            </div>
          </div>

          <div className="animate-fade-in-up mt-auto pt-12" style={{ animationDelay: "0.4s" }}>
            <p className="text-sm text-primary-foreground/60">
              © {new Date().getFullYear()} Stratview Research. All rights reserved.
            </p>
          </div>
        </div>
      </div>

      {/* Right Panel - Sign Up Form */}
      <div className="w-full lg:w-1/2 xl:w-1/2 flex flex-col justify-start px-6 sm:px-12 lg:px-16 xl:px-20 py-8 bg-background overflow-y-auto">
        <div className="w-full max-w-lg mx-auto space-y-6">
          <div className="lg:hidden flex justify-center mb-6">
            <img
              src={stratviewLogo}
              alt="Stratview Research"
              className="h-14 w-auto"
            />
          </div>

          {isRegistered ? (
            <div className="flex flex-col items-center text-center space-y-8 py-12 animate-fade-in-up">
              <div className="h-24 w-24 bg-secondary/10 rounded-full flex items-center justify-center mb-4">
                <Mail className="h-12 w-12 text-secondary animate-pulse" />
              </div>

              <div className="space-y-4">
                <h2 className="text-3xl font-bold text-foreground">
                  Registration Successful!
                </h2>
                <div className="space-y-2">
                  <p className="text-lg text-muted-foreground">
                    We've sent an activation link to <span className="text-foreground font-semibold">{form.getValues("email")}</span>.
                  </p>
                  <p className="text-muted-foreground">
                    Please check your inbox and click the link to activate your account.
                    Don't forget to check your spam folder just in case!
                  </p>
                </div>
              </div>

              <div className="w-full pt-8 space-y-4">
                <Button asChild className="w-full h-12 gradient-primary">
                  <Link to="/">Back to Login</Link>
                </Button>

                <p className="text-sm text-muted-foreground">
                  Didn't receive the email?{" "}
                  <button
                    onClick={() => {
                      toast.info("Resend Link", {
                        description: "Feature coming soon. Please contact support if you haven't received the email.",
                      });
                    }}
                    className="text-secondary hover:text-stratview-mint font-medium underline underline-offset-4"
                  >
                    Resend Email
                  </button>
                </p>
              </div>
            </div>
          ) : (
            <>
              <Link
                to="/"
                className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to login
              </Link>

              <div className="space-y-2">
                <h2 className="text-2xl xl:text-3xl font-bold text-foreground">
                  Create your account
                </h2>
                <div className="flex flex-col gap-1">
                  <p className="text-muted-foreground">
                    Fill in your details to get started
                  </p>
                  <p className="text-xs font-medium text-destructive/80 flex items-center gap-1">
                    <span className="text-base">*</span> All fields are mandatory
                  </p>
                </div>
              </div>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                  {/* Name */}
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <FormLabel className="text-sm font-medium text-foreground">Full Name <span className="text-destructive ml-1">*</span></FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="John Doe"
                            className="h-12 bg-background border-border focus:border-secondary focus:ring-secondary/20 transition-all duration-200"
                            onChange={(e) => {
                              const val = e.target.value.replace(/[^a-zA-Z\s]/g, "");
                              field.onChange(val);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Company */}
                  <FormField
                    control={form.control}
                    name="company"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <FormLabel className="text-sm font-medium text-foreground">Company <span className="text-destructive ml-1">*</span></FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Your Company Name"
                            className="h-12 bg-background border-border focus:border-secondary focus:ring-secondary/20 transition-all duration-200"
                            onChange={(e) => {
                              const val = e.target.value.replace(/[^a-zA-Z\s]/g, "");
                              field.onChange(val);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Designation */}
                  <FormField
                    control={form.control}
                    name="designation"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <FormLabel className="text-sm font-medium text-foreground">Designation <span className="text-destructive ml-1">*</span></FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="e.g. Research Analyst"
                            className="h-12 bg-background border-border focus:border-secondary focus:ring-secondary/20 transition-all duration-200"
                            onChange={(e) => {
                              const val = e.target.value.replace(/[^a-zA-Z\s]/g, "");
                              field.onChange(val);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Phone */}
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <FormLabel className="text-sm font-medium text-foreground">Phone Number <span className="text-destructive ml-1">*</span></FormLabel>
                        <div className="flex gap-0">
                          <CountrySelector
                            value={phoneCode}
                            onValueChange={setPhoneCode}
                            className="h-12 rounded-r-none border-r-0 bg-background border-border focus:ring-0 focus:ring-offset-0"
                          />
                          <FormControl>
                            <Input
                              {...field}
                              type="tel"
                              placeholder="1234567890"
                              maxLength={15}
                              className="h-12 rounded-l-none focus-visible:ring-1 bg-background border-border focus:border-secondary"
                              onChange={(e) => {
                                const val = e.target.value.replace(/[^0-9]/g, "").slice(0, 15);
                                field.onChange(val);
                              }}
                            />
                          </FormControl>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Email */}
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <FormLabel className="text-sm font-medium text-foreground">Official Email Address <span className="text-destructive ml-1">*</span></FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="email"
                            placeholder="name@company.com"
                            className="h-12 bg-background border-border focus:border-secondary focus:ring-secondary/20 transition-all duration-200"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Password */}
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <FormLabel className="text-sm font-medium text-foreground">Create Password <span className="text-destructive ml-1">*</span></FormLabel>
                        <div className="relative">
                          <FormControl>
                            <Input
                              {...field}
                              type={showPassword ? "text" : "password"}
                              placeholder="Create a strong password"
                              className="h-12 bg-background border-border focus:border-secondary focus:ring-secondary/20 transition-all duration-200 pr-12"
                            />
                          </FormControl>
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
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

                  {/* Confirm Password */}
                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <FormLabel className="text-sm font-medium text-foreground">Confirm Password <span className="text-destructive ml-1">*</span></FormLabel>
                        <div className="relative">
                          <FormControl>
                            <Input
                              {...field}
                              type={showConfirmPassword ? "text" : "password"}
                              placeholder="Confirm your password"
                              className="h-12 bg-background border-border focus:border-secondary focus:ring-secondary/20 transition-all duration-200 pr-12"
                            />
                          </FormControl>
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          >
                            {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                          </button>
                        </div>
                        {field.value && (
                          <div className="flex items-center gap-2 text-sm mt-1">
                            {passwordsMatch ? (
                              <>
                                <Check className="h-4 w-4 text-green-500" />
                                <span className="text-green-500">Passwords match</span>
                              </>
                            ) : (
                              <>
                                <X className="h-4 w-4 text-destructive" />
                                <span className="text-destructive">Passwords do not match</span>
                              </>
                            )}
                          </div>
                        )}
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
                        Create Account
                        <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </Button>

                  <p className="text-center text-sm text-muted-foreground">
                    Already have an account?{" "}
                    <Link to="/" className="font-medium text-secondary hover:text-stratview-mint transition-colors">
                      Sign in
                    </Link>
                  </p>
                </form>
              </Form>
            </>
          )}

          <div className="pt-4 border-t border-border">
            <p className="text-sm text-center text-muted-foreground">
              Need help?{" "}
              <a href="mailto:support@stratviewresearch.com" className="text-secondary hover:text-stratview-mint transition-colors font-medium">
                Contact Support
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
