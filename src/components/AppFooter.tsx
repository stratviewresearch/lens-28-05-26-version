import { motion } from "framer-motion";
import stratviewLogo from "@/assets/stratview-logo.png";
import stratviewLogoWhite from "@/assets/stratview-logo-white.png";

interface AppFooterProps {
  /** "light" for standard pages, "dark" for dashboard pages with dark theme */
  variant?: "light" | "dark";
  /** Optional data source text shown on dark variant */
  sourceText?: string;
  /** Optional unit text shown on dark variant */
  unitText?: string;
}

/**
 * Shared footer component used across all pages.
 * Provides consistent links to Terms & Privacy Policy, Disclaimer, and Support.
 */
const AppFooter = ({ variant = "light", sourceText, unitText }: AppFooterProps) => {
  if (variant === "dark") {
    return (
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="mt-12 border-t border-border pt-6"
      >
        <div className="flex flex-col items-center justify-between gap-4 text-center md:flex-row md:text-left">
          <div>
            {sourceText && <p className="text-sm text-muted-foreground">{sourceText}</p>}
            {unitText && <p className="text-xs text-muted-foreground/70">{unitText}</p>}
          </div>
          <img src={stratviewLogoWhite} alt="Stratview Research" className="h-10 w-auto" />
        </div>
        <div className="flex flex-wrap items-center justify-center gap-4 mt-4 text-xs text-muted-foreground/60">
          <a href="/terms" className="hover:text-muted-foreground transition-colors">Terms &amp; Privacy Policy</a>
          <span>·</span>
          <a href="/disclaimer" className="hover:text-muted-foreground transition-colors">Disclaimer</a>
          <span>·</span>
          <a href="mailto:support@stratviewresearch.com" className="hover:text-muted-foreground transition-colors">Support</a>
        </div>
      </motion.footer>
    );
  }

  return (
    <footer className="border-t border-border mt-12 py-6">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-3">
            <img
              src={stratviewLogo}
              alt="Stratview Research"
              className="h-8 w-auto object-contain"
            />
            <span>© {new Date().getFullYear()} Stratview Research. All rights reserved.</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="/terms" className="hover:text-foreground transition-colors">Terms &amp; Privacy Policy</a>
            <a href="/disclaimer" className="hover:text-foreground transition-colors">Disclaimer</a>
            <a href="mailto:support@stratviewresearch.com" className="hover:text-foreground transition-colors">Support</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default AppFooter;
