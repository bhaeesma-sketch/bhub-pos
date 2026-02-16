import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { Ghost, Home, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4 overflow-hidden relative">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center z-10 max-w-md"
      >
        <motion.div
          animate={{ y: [0, -15, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="inline-flex items-center justify-center w-24 h-24 bg-primary/10 rounded-3xl mb-8 border border-primary/20 backdrop-blur-sm shadow-xl"
        >
          <Ghost className="w-12 h-12 text-primary" />
        </motion.div>

        <h1 className="text-8xl font-black text-foreground tracking-tighter mb-2">404</h1>
        <h2 className="text-xl font-bold font-heading text-foreground mb-4">You've Disconnected from B-HUB</h2>
        <p className="text-muted-foreground mb-8 text-sm leading-relaxed">
          The page <code className="px-1.5 py-0.5 bg-muted rounded font-mono text-primary">{location.pathname}</code> doesn't exist or has been moved to another cloud vector.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/">
            <Button className="w-full sm:w-auto h-12 px-8 gradient-cyan glow-cyan font-bold inline-flex items-center gap-2">
              <Home className="w-4 h-4" /> Go to Dashboard
            </Button>
          </Link>
          <Button
            variant="outline"
            className="w-full sm:w-auto h-12 px-8 font-bold inline-flex items-center gap-2"
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="w-4 h-4" /> Go Back
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default NotFound;
