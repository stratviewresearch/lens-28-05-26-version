const BackgroundPattern = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Gradient overlay */}
      <div className="absolute inset-0 gradient-primary opacity-95" />
      
      {/* Geometric patterns */}
      <svg
        className="absolute inset-0 w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern
            id="grid"
            width="60"
            height="60"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 60 0 L 0 0 0 60"
              fill="none"
              stroke="rgba(255,255,255,0.05)"
              strokeWidth="1"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>

      {/* Floating shapes */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-stratview-teal/10 rounded-full blur-3xl animate-pulse-subtle" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-stratview-mint/10 rounded-full blur-3xl animate-pulse-subtle" style={{ animationDelay: "1.5s" }} />
      <div className="absolute top-1/2 right-1/3 w-48 h-48 bg-stratview-dark-teal/15 rounded-full blur-2xl animate-float" />
      
      {/* Decorative circles */}
      <div className="absolute top-20 right-20 w-3 h-3 bg-stratview-mint/40 rounded-full" />
      <div className="absolute top-40 right-40 w-2 h-2 bg-stratview-mint/30 rounded-full" />
      <div className="absolute bottom-32 left-32 w-4 h-4 bg-stratview-mint/25 rounded-full" />
      <div className="absolute bottom-48 left-48 w-2 h-2 bg-stratview-mint/35 rounded-full" />
    </div>
  );
};

export default BackgroundPattern;
