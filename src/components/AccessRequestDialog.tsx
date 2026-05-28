import { useState, useEffect } from "react";
import { Lock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CountrySelector } from "@/components/CountrySelector";
import { toast } from "sonner";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { submitInquiry, resetInquiryStatus } from "@/store/slices/subscriptionSlice";
import { parsePhone } from "@/lib/phoneUtils";
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
  "gmail.com", "yahoo.com", "yahoo.co.in", "outlook.com", "hotmail.com",
  "icloud.com", "msn.com", "live.com", "live.in", "aol.com", "ymail.com",
  "protonmail.com", "zoho.com", "rediffmail.com", "gmx.com", "mail.com"
];

const isPublicEmail = (email: string) => {
  const domain = email.split("@")[1]?.toLowerCase();
  return domain ? PUBLIC_EMAIL_DOMAINS.includes(domain) : false;
};

const accessRequestSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  designation: z.string().min(2, "Designation must be at least 2 characters"),
  company: z.string().min(2, "Company name must be at least 2 characters"),
  email: z.string().email("Invalid email address").refine((email) => !isPublicEmail(email), {
    message: "Please use your official company email address.",
  }),
  phoneCode: z.string(),
  phoneNum: z.string()
    .min(7, "Phone number must be at least 7 digits")
    .max(15, "Phone number cannot exceed 15 digits")
    .regex(/^[0-9]*$/, "Phone number must contain only digits"),
  requirement: z.string().optional(),
});

type AccessRequestValues = z.infer<typeof accessRequestSchema>;

interface AccessRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  datasetName: string;
  dashboardSlug: string;
}

const AccessRequestDialog = ({ open, onOpenChange, datasetName, dashboardSlug }: AccessRequestDialogProps) => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state: any) => state.auth);
  const { inquiryStatus } = useAppSelector((state: any) => state.subscriptions);

  const form = useForm<AccessRequestValues>({
    resolver: zodResolver(accessRequestSchema),
    defaultValues: {
      name: "",
      designation: "",
      company: "",
      email: "",
      phoneCode: "+1",
      phoneNum: "",
      requirement: "",
    },
    mode: "onChange",
  });

  // Re-sync from profile each time the dialog opens
  useEffect(() => {
    if (open) {
      const { code, number } = parsePhone(user?.phone_number);
      form.reset({
        name: user?.name || "",
        designation: user?.designation || "",
        company: user?.company || "",
        email: user?.email || "",
        phoneCode: code || "+1",
        phoneNum: number || "",
        requirement: "",
      });
      dispatch(resetInquiryStatus());
    }
  }, [open, user, dispatch, form]);

  useEffect(() => {
    if (inquiryStatus === 'success' && open) {
      toast.success("Your request has been submitted. Our team will get in touch with you shortly.");
      onOpenChange(false);
    } else if (inquiryStatus === 'failed') {
      toast.error("Failed to submit inquiry. Please try again.");
    }
  }, [inquiryStatus, open, onOpenChange]);

  const submitting = inquiryStatus === 'loading';

  const handleSubmit = async (values: AccessRequestValues) => {
    if (!user?.id) {
      toast.error("You must be logged in to submit an inquiry.");
      return;
    }

    const formDetails = {
      name: values.name,
      designation: values.designation,
      company: values.company,
      email: values.email,
      mobile: `${values.phoneCode}${values.phoneNum}`,
      requirement: values.requirement,
    };

    dispatch(submitInquiry({
      user_id: user.id,
      dashboard_slug: dashboardSlug,
      message: `${datasetName === 'Custom Requirement' ? 'Custom Requirement' : 'Access Request'} Details for ${datasetName}: ${JSON.stringify(formDetails)}`,
      type: datasetName === 'Custom Requirement' ? 'custom_requirement' : 'access_request'
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[95vh] p-0 overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto p-6 pt-8">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-1">
              <Lock className="h-5 w-5 text-muted-foreground" />
              <DialogTitle>{datasetName === 'Custom Requirement' ? 'Got a Custom Requirement?' : 'Request Access'}</DialogTitle>
            </div>
            <DialogDescription>
              {datasetName === 'Custom Requirement' 
                ? "Have a specific requirement? Share a brief overview below and review your contact details. Our team will get in touch to understand your needs and propose a tailored solution."
                : <>You don’t currently have access to the <span className="font-medium text-foreground">{datasetName}</span> dataset. Please review your contact details below and click Request Access. Our team will reach out shortly with the next steps.</>
              }
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 mt-6">
              {/* <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-4">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Your Profile</p>
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormLabel className="text-muted-foreground text-xs">Name <span className="text-destructive ml-1">*</span></FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Your full name"
                          readOnly={!!user?.name}
                          className={user?.name ? "bg-muted/50 text-foreground cursor-default" : ""}
                          onChange={(e) => {
                            const val = e.target.value.replace(/[^a-zA-Z\s]/g, "");
                            field.onChange(val);
                          }}
                        />
                      </FormControl>
                      <FormMessage className="text-[10px]" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="designation"
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormLabel className="text-muted-foreground text-xs">Designation <span className="text-destructive ml-1">*</span></FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Your designation"
                          readOnly={!!user?.designation}
                          className={user?.designation ? "bg-muted/50 text-foreground cursor-default" : ""}
                          onChange={(e) => {
                            const val = e.target.value.replace(/[^a-zA-Z\s]/g, "");
                            field.onChange(val);
                          }}
                        />
                      </FormControl>
                      <FormMessage className="text-[10px]" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="company"
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormLabel className="text-muted-foreground text-xs">Company <span className="text-destructive ml-1">*</span></FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Your company name"
                          readOnly={!!user?.company}
                          className={user?.company ? "bg-muted/50 text-foreground cursor-default" : ""}
                          onChange={(e) => {
                            const val = e.target.value.replace(/[^a-zA-Z\s]/g, "");
                            field.onChange(val);
                          }}
                        />
                      </FormControl>
                      <FormMessage className="text-[10px]" />
                    </FormItem>
                  )}
                />
              </div> */}

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel className="text-foreground text-sm">Official Email <span className="text-destructive ml-1">*</span></FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="email"
                        placeholder="you@company.com"
                        readOnly={!!user?.email}
                        className={user?.email ? "bg-muted/50 text-foreground cursor-default" : ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phoneNum"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel className="text-foreground text-sm">Mobile Number <span className="text-destructive ml-1">*</span></FormLabel>
                    <div className="flex gap-0">
                      <FormControl>
                        <CountrySelector
                          value={form.watch("phoneCode")}
                          onValueChange={(v) => form.setValue("phoneCode", v)}
                          className="rounded-r-none border-r-0 bg-muted/20 focus:ring-0 focus:ring-offset-0"
                        />
                      </FormControl>
                      <FormControl>
                        <Input
                          {...field}
                          type="tel"
                          maxLength={15}
                          className="rounded-l-none focus-visible:ring-1"
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, "").slice(0, 15);
                            field.onChange(val);
                          }}
                        />
                      </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {datasetName === 'Custom Requirement' && (
                <FormField
                  control={form.control}
                  name="requirement"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className="text-foreground text-sm">Requirement Details <span className="text-destructive ml-1">*</span></FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Please describe your specific research needs or the data you are looking for..."
                          className="min-h-[100px] resize-none focus-visible:ring-1"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <Button type="submit" className="w-full mt-4 h-11 gradient-primary text-white font-semibold rounded-xl" disabled={submitting}>
                {submitting ? "Submitting..." : datasetName === 'Custom Requirement' ? "Submit Requirement" : "Request Access"}
              </Button>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AccessRequestDialog;
