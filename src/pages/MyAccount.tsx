import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, User, Mail, Building2, Phone, Briefcase, Pencil, Save, X, Calendar, Lock, Send, CheckCircle2, Loader2, Key, ChevronDown, ChevronUp, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CountrySelector } from "@/components/CountrySelector";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import DashboardHeader from "@/components/DashboardHeader";
import AppFooter from "@/components/AppFooter";
import { activeDashboardRoutes } from "@/data/dashboardRoutes";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchSubscriptions, submitInquiry, resetInquiryStatus } from "@/store/slices/subscriptionSlice";
import { fetchSubCategories } from "@/store/slices/categorySlice";
import { fetchMe, updateProfile, changePassword } from "@/store/slices/authSlice";
import { useEffect, useMemo } from "react";
import { COUNTRIES } from "@/config/countries";
import { parsePhone } from "@/lib/phoneUtils";

// Types for inquiry state
interface InquiryState {
  category: string;
  subCategory: string;
  dashboard: string;
  message: string;
}

const MyAccount = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  // Get data from Redux
  const auth = useAppSelector((state: any) => state.auth);
  const user = auth.user;
  const { subscriptions, isLoading, inquiryStatus } = useAppSelector((state: any) => state.subscriptions);
  const { allSubCategories: subCategories, isSubCategoriesLoading } = useAppSelector((state: any) => state.categories);

  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    name: user?.name || "",
    company: user?.company || "",
    designation: user?.designation || "",
  });
  const [phoneCode, setPhoneCode] = useState("+1");
  const [phoneNum, setPhoneNum] = useState("");

  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const [inquiry, setInquiry] = useState<InquiryState>({
    category: "",
    subCategory: "",
    dashboard: "",
    message: "",
  });

  useEffect(() => {
    if (user) {
      setEditData({
        name: user.name || "",
        company: user.company || "",
        designation: user.designation || "",
      });
      const { code, number } = parsePhone(user.phone_number);
      setPhoneCode(code);
      setPhoneNum(number);
    }
  }, [user]);

  useEffect(() => {
    if (user?.id) {
      // Refresh user profile only
      dispatch(fetchMe());
      // Subscriptions and Categories are handled globally in App.tsx
    }
    return () => {
      dispatch(resetInquiryStatus());
    };
  }, [user?.id, dispatch]);

  const availableCategories = useMemo(() => {
    const categories = new Set<string>();
    subCategories.forEach(sub => {
      const hasUnpurchased = sub.dashboards.some((db: any) => 
        !subscriptions.some(s => s.dashboard_slug === db.slug)
      );
      if (hasUnpurchased) {
        categories.add(sub.category_name);
      }
    });
    return Array.from(categories).sort();
  }, [subCategories, subscriptions]);

  const availableSubCategories = useMemo(() => {
    if (!inquiry.category) return [];
    return subCategories.filter(sub => {
      if (sub.category_name !== inquiry.category) return false;
      return sub.dashboards.some((db: any) => 
        !subscriptions.some(s => s.dashboard_slug === db.slug)
      );
    }).sort((a, b) => a.name.localeCompare(b.name));
  }, [subCategories, inquiry.category, subscriptions]);

  const availableDashboards = useMemo(() => {
    if (!inquiry.subCategory) return [];
    const sub = subCategories.find(s => s.slug === inquiry.subCategory);
    if (!sub) return [];
    
    return sub.dashboards.filter((db: any) => {
      return !subscriptions.some(s => s.dashboard_slug === db.slug);
    }).sort((a: any, b: any) => a.name.localeCompare(b.name));
  }, [subCategories, inquiry.subCategory, subscriptions]);

  const handleCategoryChange = (val: string) => {
    setInquiry(prev => ({
      ...prev,
      category: val,
      subCategory: "",
      dashboard: ""
    }));
  };

  const handleSubCategoryChange = (val: string) => {
    setInquiry(prev => ({
      ...prev,
      subCategory: val,
      dashboard: ""
    }));
  };

  const { isUpdatingProfile } = useAppSelector((state: any) => state.auth);


  const handleSave = async () => {
    if (phoneNum.length < 7 || phoneNum.length > 15) {
      toast.error("Validation Error", { description: "Phone number must be between 7 and 15 digits" });
      return;
    }
    try {
      await dispatch(updateProfile({
        ...editData,
        phone_number: `${phoneCode}${phoneNum}`.trim()
      })).unwrap();
      setIsEditing(false);
      toast.success("Profile updated successfully");
    } catch (err: any) {
      toast.error("Update failed", { description: err || "Please try again." });
    }
  };

  const handleCancel = () => {
    if (user) {
      setEditData({
        name: user.name || "",
        company: user.company || "",
        designation: user.designation || "",
      });
      const { code, number } = parsePhone(user.phone_number);
      setPhoneCode(code);
      setPhoneNum(number);
    }
    setIsEditing(false);
  };

  const handleInquirySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inquiry.dashboard || !user?.id) {
      toast.error("Validation Error", { description: "Please select a dashboard" });
      return;
    }

    if (phoneNum.length < 7 || phoneNum.length > 15) {
      toast.error("Validation Error", { description: "Phone number must be between 7 and 15 digits" });
      return;
    }

    const fullMessage = JSON.stringify({
      name: user.name || "",
      designation: user.designation || "",
      company: user.company || "",
      email: user.email || "",
      mobile: `${phoneCode}${phoneNum}`,
      message: inquiry.message
    });

    dispatch(submitInquiry({
      user_id: user.id,
      dashboard_slug: inquiry.dashboard,
      message: `Subscription Inquiry: ${fullMessage}`,
      type: 'subscription_inquires'
    }));
  };

  const handlePasswordUpdate = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("Validation Error", { description: "New passwords do not match" });
      return;
    }
    if (passwordData.newPassword.length < 8) {
      toast.error("Validation Error", { description: "Password must be at least 8 characters" });
      return;
    }

    setIsUpdatingPassword(true);
    try {
      await dispatch(changePassword({
        current_password: passwordData.currentPassword,
        new_password: passwordData.newPassword,
        confirm_password: passwordData.confirmPassword
      })).unwrap();
      
      toast.success("Password Updated", { description: "Your password has been changed successfully" });
      setIsChangingPassword(false);
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err: any) {
      toast.error("Update Failed", { description: err || "Could not update password. Please check your current password." });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const inquirySubmitted = inquiryStatus === 'success';

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <DashboardHeader />

      <main className="flex-1 container max-w-4xl px-4 md:px-6 py-8 space-y-8">
        {/* Back */}
        <button
          onClick={() => navigate("/dashboard")}
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Dashboard
        </button>

        <h1 className="text-2xl md:text-3xl font-bold text-foreground">My Account</h1>

        {/* ─── Personal Information ─── */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Personal Information
              </CardTitle>
              <CardDescription>Manage your account details</CardDescription>
            </div>
            {!isEditing ? (
              <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                <Pencil className="h-4 w-4 mr-1" /> Edit
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleCancel} disabled={isUpdatingProfile}>
                  <X className="h-4 w-4 mr-1" /> Cancel
                </Button>
                <Button size="sm" onClick={handleSave} disabled={isUpdatingProfile}>
                  {isUpdatingProfile ? (
                    <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Saving...</>
                  ) : (
                    <><Save className="h-4 w-4 mr-1" /> Save</>
                  )}
                </Button>
              </div>
            )}
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Name */}
            <div className="grid grid-cols-1 sm:grid-cols-[140px_1fr] items-start gap-2 sm:gap-4">
              <Label className="text-muted-foreground flex items-center gap-1.5 pt-2.5">
                <User className="h-4 w-4" /> Full Name <span className="text-destructive ml-1">*</span>
              </Label>
              {isEditing ? (
                <Input
                  value={editData.name}
                  onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                  className="h-10"
                />
              ) : (
                <p className="text-foreground pt-2.5 font-medium">{user?.name}</p>
              )}
            </div>

            <Separator />

            {/* Email (read-only always) */}
            <div className="grid grid-cols-1 sm:grid-cols-[140px_1fr] items-start gap-2 sm:gap-4">
              <Label className="text-muted-foreground flex items-center gap-1.5 pt-2.5">
                <Mail className="h-4 w-4" /> Email
              </Label>
              <div className="flex items-center gap-2 pt-2.5">
                <p className="text-foreground font-medium">{user?.email}</p>
                <span title="Email cannot be changed"><Lock className="h-3.5 w-3.5 text-muted-foreground/50" /></span>
              </div>
            </div>

            <Separator />

            {/* Company */}
            <div className="grid grid-cols-1 sm:grid-cols-[140px_1fr] items-start gap-2 sm:gap-4">
              <Label className="text-muted-foreground flex items-center gap-1.5 pt-2.5">
                <Building2 className="h-4 w-4" /> Company <span className="text-destructive ml-1">*</span>
              </Label>
              {isEditing ? (
                <Input
                  value={editData.company}
                  onChange={(e) => setEditData({ ...editData, company: e.target.value })}
                  className="h-10"
                />
              ) : (
                <p className="text-foreground pt-2.5 font-medium">{user?.company || "Not Provided"}</p>
              )}
            </div>

            <Separator />

            {/* Designation */}
            <div className="grid grid-cols-1 sm:grid-cols-[140px_1fr] items-start gap-2 sm:gap-4">
              <Label className="text-muted-foreground flex items-center gap-1.5 pt-2.5">
                <Briefcase className="h-4 w-4" /> Designation <span className="text-destructive ml-1">*</span>
              </Label>
              {isEditing ? (
                <Input
                  value={editData.designation}
                  onChange={(e) => setEditData({ ...editData, designation: e.target.value })}
                  className="h-10"
                />
              ) : (
                <p className="text-foreground pt-2.5 font-medium">{user?.designation || "Not Provided"}</p>
              )}
            </div>

            <Separator />

            {/* Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-[140px_1fr] items-start gap-2 sm:gap-4">
              <Label className="text-muted-foreground flex items-center gap-1.5 pt-2.5">
                <Phone className="h-4 w-4" /> Phone <span className="text-destructive ml-1">*</span>
              </Label>
              {isEditing ? (
                <div className="flex gap-0">
                  <CountrySelector 
                    value={phoneCode} 
                    onValueChange={setPhoneCode} 
                    className="rounded-r-none border-r-0 bg-muted/20 focus:ring-0 focus:ring-offset-0"
                  />
                  <Input 
                    type="tel" 
                    value={phoneNum} 
                    onChange={(e) => setPhoneNum(e.target.value.replace(/\D/g, "").slice(0, 15))} 
                    placeholder="1234567890" 
                    maxLength={15}
                    className="rounded-l-none focus-visible:ring-1 h-10 flex-1"
                  />
                </div>
              ) : (
                <p className="text-foreground pt-2.5 font-medium">{user?.phone_number || "Not Provided"}</p>
              )}
            </div>

            <Separator />

            {/* Password */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-[140px_1fr] items-center gap-2 sm:gap-4">
                <Label className="text-muted-foreground flex items-center gap-1.5">
                  <Key className="h-4 w-4" /> Password
                </Label>
                <div className="flex items-center justify-between gap-4">
                  <p className="text-foreground font-medium tracking-widest pt-1">••••••••</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-9 px-3 gap-2 border-slate-200 hover:bg-slate-50 text-[#1b4263] font-medium transition-all"
                    onClick={() => setIsChangingPassword(!isChangingPassword)}
                  >
                    {isChangingPassword ? "Cancel" : "Change Password"}
                    {isChangingPassword ? <ChevronUp className="h-3.5 w-3.5 opacity-70" /> : <ChevronDown className="h-3.5 w-3.5 opacity-70" />}
                  </Button>
                </div>
              </div>

              {isChangingPassword && (
                <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 sm:p-6 space-y-4 ml-0  animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="grid gap-3.5">
                    {/* Current Password */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-[#1b4263] flex items-center gap-1.5 ml-1">
                         <Lock className="h-3 w-3" /> Current Password <span className="text-destructive ml-1">*</span>
                      </Label>
                      <div className="relative">
                        <Input
                          type={showCurrentPassword ? "text" : "password"}
                          placeholder="••••••••"
                          className="h-10 bg-white border-slate-200 focus:border-[#1b4263]/30 focus:ring-[#1b4263]/5 pr-10"
                          value={passwordData.currentPassword}
                          onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                        >
                          {showCurrentPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                    </div>

                    {/* New Password */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-[#1b4263] flex items-center gap-1.5 ml-1">
                         <Lock className="h-3 w-3" /> New Password <span className="text-destructive ml-1">*</span>
                      </Label>
                      <div className="relative">
                        <Input
                          type={showNewPassword ? "text" : "password"}
                          placeholder="At least 8 characters"
                          className="h-10 bg-white border-slate-200 focus:border-[#1b4263]/30 focus:ring-[#1b4263]/5 pr-10"
                          value={passwordData.newPassword}
                          onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                        >
                          {showNewPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                    </div>

                    {/* Confirm New Password */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-[#1b4263] flex items-center gap-1.5 ml-1">
                         <Lock className="h-3 w-3" /> Confirm New Password <span className="text-destructive ml-1">*</span>
                      </Label>
                      <div className="relative">
                        <Input
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="••••••••"
                          className="h-10 bg-white border-slate-200 focus:border-[#1b4263]/30 focus:ring-[#1b4263]/5 pr-10"
                          value={passwordData.confirmPassword}
                          onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                        >
                          {showConfirmPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end items-center gap-3 pt-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setIsChangingPassword(false)}
                      className="text-slate-500 font-medium hover:bg-slate-100 h-9"
                    >
                      Cancel
                    </Button>
                    <Button 
                      size="sm" 
                      onClick={handlePasswordUpdate}
                      disabled={isUpdatingPassword || !passwordData.currentPassword || !passwordData.newPassword || passwordData.newPassword !== passwordData.confirmPassword}
                      className="bg-slate-500 text-white hover:bg-slate-600 h-9 px-4 rounded-lg shadow-sm font-medium transition-all"
                    >
                      {isUpdatingPassword ? (
                        <><Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" /> Updating...</>
                      ) : (
                        <><Key className="h-3.5 w-3.5 mr-2" /> Update Password</>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* ─── Your Subscriptions ─── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Your Subscriptions
            </CardTitle>
            <CardDescription>Dashboards you currently have access to</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : subscriptions.length === 0 ? (
              <p className="text-muted-foreground text-sm py-4">You don't have any active subscriptions yet.</p>
            ) : (
              <div className="space-y-6">
                <div className="space-y-2">
                  {subscriptions.map((sub) => (
                    <div
                      key={sub.dashboard_id || sub.dashboard_slug}
                      onClick={() => {
                        // 0. Handle "All Categories" special case
                        if (sub.category_name === 'All Categories' || sub.subcategory_name === 'All Datasets') {
                          navigate('/dashboard');
                          return;
                        }

                        // 1. Check direct dashboard routes
                        if (sub.dashboard_slug && activeDashboardRoutes[sub.dashboard_slug as keyof typeof activeDashboardRoutes]) {
                          navigate(activeDashboardRoutes[sub.dashboard_slug as keyof typeof activeDashboardRoutes]);
                          return;
                        }

                        // 2. Resolve sub-category/dataset slug
                        let slug = sub.subcategory_slug;
                        
                        // Fallback 1: Match by name in existing categories
                        if (!slug && sub.subcategory_name) {
                          const matchedSub = subCategories.find((s: any) => s.name === sub.subcategory_name);
                          if (matchedSub) slug = matchedSub.slug;
                        }

                        // Fallback 2: Extract from URL
                        if (!slug && sub.url) {
                          const parts = sub.url.split('/');
                          const lastPart = parts[parts.length - 1];
                          if (lastPart && !lastPart.includes('.') && lastPart !== 'dataset') {
                            slug = lastPart;
                          }
                        }

                        if (slug) {
                          navigate(`/dataset/${slug}`);
                        } else {
                          toast.error("Navigation Error", { 
                            description: "Could not resolve the link for this subscription." 
                          });
                        }
                      }}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-lg border border-border bg-muted/30 px-4 py-3 cursor-pointer hover:bg-muted/50 transition-colors group"
                    >
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">{sub.category_name} › {sub.subcategory_name}</span>
                        <span className="text-[10px] text-muted-foreground">{sub.dashboard_name}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>
                          Valid Till: <span className="font-medium text-foreground">{sub.valid_to}</span>
                        </span>
                        <Badge variant="secondary" className="text-[10px] bg-primary/10 text-primary border-0">Active</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ─── Inquiry Section ─── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Send className="h-5 w-5 text-primary" />
              Need to extend a subscription or buy a new one?
            </CardTitle>
            <CardDescription>Let us know which datasets you're interested in, and review your contact details below. Our team will get back to you shortly.</CardDescription>
          </CardHeader>
          <CardContent>
            {inquirySubmitted ? (
              <div className="flex flex-col items-center justify-center py-8 text-center space-y-3">
                <CheckCircle2 className="h-12 w-12 text-primary" />
                <h3 className="font-semibold text-foreground">Inquiry Sent!</h3>
                <p className="text-sm text-muted-foreground max-w-md">
                  Thank you for your interest. Our team will review your request and contact you shortly.
                </p>
                <Button variant="outline" size="sm" onClick={() => { setInquiry({ category: "", subCategory: "", dashboard: "", message: "" }); dispatch(resetInquiryStatus()); }}>
                  Submit Another Inquiry
                </Button>
              </div>
            ) : (
              <form onSubmit={handleInquirySubmit} className="space-y-5">
                {/* <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-4">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Your Profile</p>
                  <div className="space-y-2">
                    <Label className="text-muted-foreground text-xs">Name</Label>
                    <Input
                      value={user?.name || ""}
                      readOnly={!!user?.name}
                      className={user?.name ? "bg-muted/50 text-foreground cursor-default" : ""}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-muted-foreground text-xs">Designation</Label>
                    <Input
                      value={user?.designation || ""}
                      readOnly={!!user?.designation}
                      placeholder="Not provided"
                      className={user?.designation ? "bg-muted/50 text-foreground cursor-default" : ""}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-muted-foreground text-xs">Company</Label>
                    <Input
                      value={user?.company || ""}
                      readOnly={!!user?.company}
                      placeholder="Not provided"
                      className={user?.company ? "bg-muted/50 text-foreground cursor-default" : ""}
                    />
                  </div>
                </div> */}

                <div className="space-y-2">
                  <Label htmlFor="inq-email" className="text-sm font-medium">Email <span className="text-destructive ml-1">*</span></Label>
                  <Input
                    id="inq-email"
                    type="email"
                    value={user?.email || ""}
                    readOnly
                    className="bg-muted/50 text-foreground cursor-default"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="inq-phone" className="text-sm font-medium">Phone <span className="text-destructive ml-1">*</span></Label>
                  <div className="flex gap-0">
                    <CountrySelector
                      value={phoneCode}
                      onValueChange={setPhoneCode}
                      className="rounded-r-none border-r-0 bg-muted/20 focus:ring-0 focus:ring-offset-0"
                    />
                    <Input
                      id="inq-phone"
                      type="tel"
                      value={phoneNum}
                      onChange={(e) => setPhoneNum(e.target.value.replace(/\D/g, "").slice(0, 15))}
                      placeholder="1234567890"
                      maxLength={15}
                      className="rounded-l-none focus-visible:ring-1 h-10 flex-1"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-sm font-medium">Which dashboard are you interested in? <span className="text-destructive ml-1">*</span></Label>
                  {availableCategories.length === 0 && !isSubCategoriesLoading ? (
                    <div className="p-6 rounded-lg border border-dashed border-border bg-muted/20 text-center">
                      <p className="text-sm text-muted-foreground">You already have access to all available dashboards.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Category <span className="text-destructive ml-1">*</span></Label>
                          <Select 
                            value={inquiry.category} 
                            onValueChange={handleCategoryChange}
                          >
                            <SelectTrigger className="h-10">
                              <SelectValue placeholder="Select category..." />
                            </SelectTrigger>
                            <SelectContent>
                              {availableCategories.map((cat) => (
                                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Dataset <span className="text-destructive ml-1">*</span></Label>
                          <Select 
                            value={inquiry.subCategory} 
                            onValueChange={handleSubCategoryChange}
                            disabled={!inquiry.category}
                          >
                            <SelectTrigger className="h-10">
                              <SelectValue placeholder="Select market..." />
                            </SelectTrigger>
                            <SelectContent>
                              {availableSubCategories.map((sub) => (
                                <SelectItem key={sub.slug} value={sub.slug}>{sub.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Dashboard <span className="text-destructive ml-1">*</span></Label>
                        <Select 
                          value={inquiry.dashboard} 
                          onValueChange={(v) => setInquiry({ ...inquiry, dashboard: v })}
                          disabled={!inquiry.subCategory}
                        >
                          <SelectTrigger className="h-10">
                            <SelectValue placeholder="Select dashboard..." />
                          </SelectTrigger>
                          <SelectContent>
                            {availableDashboards.map((db) => (
                              <SelectItem key={db.slug} value={db.slug}>{db.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Additional Details</Label>
                  <Textarea
                    placeholder="Tell us about your requirements, number of users, preferred subscription duration, etc."
                    value={inquiry.message}
                    onChange={(e) => setInquiry({ ...inquiry, message: e.target.value })}
                    rows={4}
                  />
                </div>

                <Button type="submit" className="gradient-primary text-primary-foreground">
                  <Send className="h-4 w-4 mr-2" />
                  Confirm interest
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </main>

      <AppFooter />
    </div>
  );
};

export default MyAccount;
