import { useState, useEffect, useMemo } from "react";
import { useLocation } from "react-router-dom";
import { MessageCircleQuestion, Send, CheckCircle2, ChevronDown } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { CountrySelector } from "@/components/CountrySelector";
import { dashboardRegistry } from "@/dashboards/registry";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { submitInquiry, resetInquiryState } from "@/store/slices/inquirySlice";
import { COUNTRIES } from "@/config/countries";
import { parsePhone } from "@/lib/phoneUtils";

const QueryFormTab = () => {
    const location = useLocation();
    const dispatch = useAppDispatch();
    const { user } = useAppSelector((state) => state.auth);
    const { isLoading, isSuccess, error } = useAppSelector((state) => state.inquiry);

    const match = dashboardRegistry.find((d) => d.routePath === location.pathname);

    const [open, setOpen] = useState(false);
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [phoneCode, setPhoneCode] = useState("+1");
    const [phoneNum, setPhoneNum] = useState("");
    const [company, setCompany] = useState("");
    const [designation, setDesignation] = useState("");
    const [query, setQuery] = useState("");

    // Initialize/Reset state
    useEffect(() => {
        if (open && user) {
            setName(user.name || "");
            setEmail(user.email || "");
            const { code, number } = parsePhone(user.phone_number);
            setPhoneCode(code);
            setPhoneNum(number);
            setCompany(user.company || "");
            setDesignation(user.designation || "");
            dispatch(resetInquiryState());
        } else if (open && !user) {
            // Default for non-logged in or if user is cleared
            setPhoneCode("+1");
            setPhoneNum("");
            dispatch(resetInquiryState());
        }
    }, [open, user, dispatch]);

    // Handle success toast and auto-close
    useEffect(() => {
        if (isSuccess) {
            toast({ title: "Query Submitted!", description: "Our research analyst will get in touch within 72 hours." });
            setQuery("");
            const timer = setTimeout(() => {
                setOpen(false);
                dispatch(resetInquiryState());
            }, 2500);
            return () => clearTimeout(timer);
        }
    }, [isSuccess, dispatch]);

    // Handle error toast
    useEffect(() => {
        if (error) {
            toast({ 
                title: "Submission Failed", 
                description: error,
                variant: "destructive" 
            });
        }
    }, [error]);


    if (!match) return null;

    const dashboardTitle = match.title;
    const dashboardId = match.catalogs?.[0]?.dashboardId || "unknown";

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;
        
        const formDetails = {
            name,
            designation,
            company,
            email,
            mobile: `${phoneCode}${phoneNum}`,
            message: query.trim()
        };

        dispatch(submitInquiry({
            user_id: user?.id,
            dashboard_slug: dashboardId,
            message: `Analyst Query for ${dashboardTitle}: ${JSON.stringify(formDetails)}`,
            type: 'query_form'
        }));
    };

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <button
                    className="query-tab-trigger fixed right-0 top-1/2 -translate-y-1/2 z-50 flex items-center gap-1 sm:gap-2 px-2 py-2 sm:px-3 sm:py-4 rounded-l-lg border border-r-0 border-primary/40 bg-primary text-primary-foreground font-semibold text-xs sm:text-sm shadow-lg cursor-pointer transition-transform hover:translate-x-0 translate-x-0"
                    style={{ writingMode: "vertical-rl", textOrientation: "mixed" }}
                    aria-label="Got a Query?"
                >
                    <MessageCircleQuestion className="h-4 w-4 sm:h-5 sm:w-5 rotate-90 mb-1" />
                    Got a Query?
                </button>
            </SheetTrigger>

            <SheetContent className="w-full sm:max-w-md border-border bg-card overflow-y-auto">
                <SheetHeader className="mb-6">
                    <SheetTitle className="text-xl text-foreground flex items-center gap-2">
                        <MessageCircleQuestion className="h-6 w-6 text-primary" />
                        Talk to our Research Analyst
                    </SheetTitle>
                    <SheetDescription className="text-muted-foreground">
                       Have a question about the <span className="font-medium text-foreground">{dashboardTitle}</span>?
                      Review your contact details and write your query below. Our team will get in touch within <span className="font-semibold text-primary">72 hours</span>.
                    </SheetDescription>
                </SheetHeader>

                {isSuccess ? (
                    <div className="flex flex-col items-center justify-center py-16 gap-4 animate-fade-in">
                        <CheckCircle2 className="h-16 w-16 text-green-500" />
                        <p className="text-lg font-semibold text-foreground">Thank you!</p>
                        <p className="text-muted-foreground text-center text-sm">Your query has been submitted. We'll be in touch soon.</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-4">
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Your Profile</p>
                            <div>
                                <Label className="text-muted-foreground text-xs">Name <span className="text-destructive ml-1">*</span></Label>
                                <Input value={name} readOnly={!!user?.name} onChange={(e) => setName(e.target.value)} className={user?.name ? "bg-muted/50 text-foreground cursor-default" : ""} />
                            </div>
                            <div>
                                <Label className="text-muted-foreground text-xs">Designation <span className="text-destructive ml-1">*</span></Label>
                                <Input value={designation} readOnly={!!user?.designation} onChange={(e) => setDesignation(e.target.value)} className={user?.designation ? "bg-muted/50 text-foreground cursor-default" : ""} />
                            </div>
                            <div>
                                <Label className="text-muted-foreground text-xs">Company <span className="text-destructive ml-1">*</span></Label>
                                <Input value={company} readOnly={!!user?.company} onChange={(e) => setCompany(e.target.value)} className={user?.company ? "bg-muted/50 text-foreground cursor-default" : ""} />
                            </div>
                        </div> */}

                        <div className="space-y-3">
                            <div>
                                <Label htmlFor="query-email" className="text-foreground text-sm">Email <span className="text-destructive ml-1">*</span></Label>
                                <Input id="query-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="your.email@company.com" />
                            </div>
                            <div>
                                <Label htmlFor="query-phone" className="text-foreground text-sm">Phone <span className="text-destructive ml-1">*</span></Label>
                                <div className="flex gap-0">
                                    <CountrySelector 
                                        value={phoneCode} 
                                        onValueChange={setPhoneCode} 
                                        className="rounded-r-none border-r-0 bg-muted/20 focus:ring-0 focus:ring-offset-0"
                                    />
                                    <Input 
                                        id="query-phone" 
                                        type="tel" 
                                        value={phoneNum} 
                                        onChange={(e) => setPhoneNum(e.target.value.replace(/\D/g, "").slice(0, 15))} 
                                        placeholder="1234567890" 
                                        maxLength={15}
                                        className="rounded-l-none focus-visible:ring-1"
                                    />
                                </div>
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="query-text" className="text-foreground text-sm">Your Query <span className="text-destructive ml-1">*</span></Label>
                            <Textarea
                                id="query-text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                required
                                rows={5}
                                placeholder="Type your question here..."
                                className="resize-none"
                            />
                        </div>

                        <Button type="submit" className="w-full" disabled={!query.trim() || isLoading}>
                            {isLoading ? (
                                <>
                                    <span className="animate-spin mr-2">⏳</span> Submitting...
                                </>
                            ) : (
                                <>
                                    <Send className="mr-2 h-4 w-4" /> Submit Query
                                </>
                            )}
                        </Button>
                    </form>
                )}
            </SheetContent>
        </Sheet>
    );
};

export default QueryFormTab;