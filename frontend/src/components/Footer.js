import { Link } from "react-router-dom";
import { Instagram } from "lucide-react";

const Footer = () => {
  return (
    <footer className="border-t border-black/10 bg-white" data-testid="footer">
      <div className="px-4 md:px-8 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link
              to="/"
              className="text-3xl md:text-4xl font-black tracking-tighter uppercase hover:text-accent transition-colors"
              data-testid="footer-logo"
            >
              OOKEI
            </Link>
            <p className="mt-4 text-sm text-muted-foreground max-w-md">
              Conceptual streetwear for the ones who see. Limited drops, no restocks.
            </p>
            <p className="mt-2 text-xs text-muted-foreground uppercase tracking-widest">
              NOT FOR EVERYONE
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest mb-4">
              Navigate
            </h4>
            <nav className="flex flex-col gap-3">
              <Link
                to="/drop"
                className="text-sm text-muted-foreground hover:text-black transition-colors"
                data-testid="footer-link-drop"
              >
                DROP 001
              </Link>
              <Link
                to="/archive"
                className="text-sm text-muted-foreground hover:text-black transition-colors"
                data-testid="footer-link-archive"
              >
                Archive
              </Link>
              <Link
                to="/about"
                className="text-sm text-muted-foreground hover:text-black transition-colors"
                data-testid="footer-link-about"
              >
                About
              </Link>
              <Link
                to="/contact"
                className="text-sm text-muted-foreground hover:text-black transition-colors"
                data-testid="footer-link-contact"
              >
                Contact
              </Link>
            </nav>
          </div>

          {/* Social */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest mb-4">
              Connect
            </h4>
            <a
              href="https://instagram.com/weareookei"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-accent transition-colors"
              data-testid="footer-instagram"
            >
              <Instagram size={16} />
              @weareookei
            </a>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 pt-8 border-t border-black/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} OOKEI. All rights reserved.
          </p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
            WE KNOW YOU LOOKED
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
