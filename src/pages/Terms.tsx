import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import DashboardHeader from "@/components/DashboardHeader";
import AppFooter from "@/components/AppFooter";

const sections = [
  {
    number: "1",
    title: "Definitions and Interpretation",
    intro: "Meanings of phrases within this document:",
    definitions: [
      {
        term: "Data",
        text: 'Any information that a user of the website provides to us, through our "Contact" page, or through emailing us relating to any person who can be directly or indirectly identified from that information.',
      },
      {
        term: "We/Us/Our",
        text: "Stratview Research, Trademark owned by Radiant Offshore Consultancy LLP (LLPIN - AAF-3443), with the registered office at 2nd Floor, Crystal Tower, Telibandha, Raipur – 492001, Chhattisgarh, India.",
      },
      {
        term: "You/Your",
        text: "A user of the website.",
      },
      {
        term: "The Website",
        text: "https://www.stratviewresearch.com",
      },
    ],
  },
  {
    number: "2",
    title: "Company Information",
    paragraphs: [
      "Stratview Research is a trademark owned by Radiant Offshore Consultancy LLP.",
      "Our company registration number is AAF-3443.",
      "If you have any questions about the website or the use of your data, please contact us at +1-313-307-4176 or helpdesk@stratviewresearch.com.",
    ],
  },
  {
    number: "3",
    title: "Users Rights",
    intro: "As a user you have the following rights:",
    bullets: [
      "A right to be informed about our collection and use of personal information;",
      "A right of access to the personal information we hold about you;",
      "A right to rectification if any personal information we hold about you is inaccurate or incomplete;",
      "A right to ask us to delete any personal information held about you unless we are obliged to retain the information for other legal reasons;",
      "A right to restrict or prevent the processing of your personal information;",
      "A right to data portability (obtaining a copy of your data to re-use with another service or organisation);",
      "A right to object to the use of your data for particular purposes.",
    ],
  },
  {
    number: "4",
    title: "Data Collection",
    paragraphs: [
      "Except where you contact us directly through any of our contact options available on the Website, we do not collect any other personal data from you.",
      "If you contact us or send us an email, we will retain the details you provide to us including your name, your email address, and any other information, which you choose to give us.",
      "However, we do place cookies on your computer or device.",
    ],
  },
  {
    number: "5",
    title: "Using Your Information",
    intro:
      "Where we hold any personal information, it will be processed and stored securely, for no longer than is necessary, considering the reason it was provided to us.",
    subIntro: "We will potentially:",
    bullets: [
      "Reply to your email;",
      "Provide details on the properties requested, plus any others we think may interest you;",
      "Offer or provide you with the services requested, plus any others we think may interest you.",
    ],
    afterBullets:
      "We will delete your personal information once your request has been met or the service has been provided, except where:",
    secondBullets: [
      "You were interested in details of services we are offering, when we will continue to hold your information in order to send you information on other services that may interest you;",
      "You become a client or a buyer of our service;",
      "You require us to retain it for longer;",
      "We are required to retain it for longer for other legal reasons.",
    ],
    closing: [
      "You have the right to withdraw your consent to us using your data and to request that we delete it.",
      "We will not share any of your data with any third parties for any purposes.",
    ],
  },
  {
    number: "6",
    title: "Accessing Your Data",
    paragraphs: [
      "You have a right to ask for a copy of any personal information we hold on you free of charge. Please contact us to make a request at +1-313-307-4176 or helpdesk@stratviewresearch.com.",
    ],
  },
  {
    number: "7",
    title: "Changes to our Policies",
    paragraphs: [
      "We recommend that you check this page regularly to keep up-to-date, as we reserve the right to change this Policy from time to time if our policies change or the law changes. Any changes will be posted on this page of the website and you will be deemed to have accepted changes to the Policy on your first use of the website following the changes.",
    ],
  },
  {
    number: "8",
    title: "Applicability",
    paragraphs: [
      "This Policy applies only to your use of this website. The website may contain links to other websites. Please note that we have no control over how your data is collected, stored, or used by other websites and we advise you to check the policies of any such websites before providing any data to them.",
    ],
  },
  {
    number: "9",
    title: "Complaints",
    paragraphs: [
      "If you have any cause for complaint about our use of your personal data, please contact us at +1-313-307-4176 or helpdesk@stratviewresearch.com. We will address your concerns and attempt to solve the problem to your satisfaction.",
    ],
  },
];

const Terms = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <DashboardHeader />

      {/* Hero */}
      <section className="relative overflow-hidden gradient-hero py-10 md:py-14 px-4 md:px-6">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-64 h-64 rounded-full bg-accent blur-3xl" />
          <div className="absolute bottom-10 right-10 w-48 h-48 rounded-full bg-primary blur-3xl" />
        </div>
        <div className="container relative z-10 px-0">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-4 text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
          <h1 className="text-2xl md:text-4xl font-bold text-primary-foreground font-display">
            Terms &amp; Conditions and Privacy Policy
          </h1>
          <p className="mt-2 text-primary-foreground/70 text-sm md:text-base max-w-2xl">
            How we handle &amp; use your information
          </p>
        </div>
      </section>

      {/* Content */}
      <main className="container px-4 md:px-6 py-8 md:py-12 max-w-3xl">
        <div className="mb-8 p-4 rounded-lg bg-muted/50 border border-border">
          <p className="text-sm text-muted-foreground leading-relaxed">
            We may collect, hold and use some of your personal data and so here
            will provide more information about how this works. Please read it
            carefully and ensure that you understand it. If you do not accept and
            agree with any part of it please stop using the website immediately,
            because your continuing use of our website will be seen as your
            acceptance of it.
          </p>
        </div>

        <div className="space-y-10">
          {sections.map((section) => (
            <section key={section.number}>
              <h2 className="text-lg md:text-xl font-semibold text-foreground mb-3">
                {section.number}. {section.title}
              </h2>

              {section.intro && (
                <p className="text-sm text-muted-foreground mb-3">
                  {section.intro}
                </p>
              )}

              {"definitions" in section &&
                section.definitions?.map((def) => (
                  <div key={def.term} className="mb-3 pl-4 border-l-2 border-primary/20">
                    <p className="text-sm font-medium text-foreground">
                      {def.term}
                    </p>
                    <p className="text-sm text-muted-foreground">{def.text}</p>
                  </div>
                ))}

              {"paragraphs" in section &&
                section.paragraphs?.map((p, i) => (
                  <p
                    key={i}
                    className="text-sm text-muted-foreground mb-2 leading-relaxed"
                  >
                    {p}
                  </p>
                ))}

              {"subIntro" in section && section.subIntro && (
                <p className="text-sm text-muted-foreground mb-2">
                  {section.subIntro}
                </p>
              )}

              {"bullets" in section && (
                <ul className="list-disc pl-6 space-y-1 mb-3">
                  {section.bullets?.map((b, i) => (
                    <li
                      key={i}
                      className="text-sm text-muted-foreground leading-relaxed"
                    >
                      {b}
                    </li>
                  ))}
                </ul>
              )}

              {"afterBullets" in section && section.afterBullets && (
                <p className="text-sm text-muted-foreground mb-2">
                  {section.afterBullets}
                </p>
              )}

              {"secondBullets" in section && (
                <ul className="list-disc pl-6 space-y-1 mb-3">
                  {section.secondBullets?.map((b, i) => (
                    <li
                      key={i}
                      className="text-sm text-muted-foreground leading-relaxed"
                    >
                      {b}
                    </li>
                  ))}
                </ul>
              )}

              {"closing" in section &&
                section.closing?.map((c, i) => (
                  <p
                    key={i}
                    className="text-sm text-muted-foreground mb-2 leading-relaxed"
                  >
                    {c}
                  </p>
                ))}
            </section>
          ))}
        </div>
      </main>

      <AppFooter />
    </div>
  );
};

export default Terms;
