import { useState, useRef, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { logoutUser } from "@/store/slices/authSlice";
import { searchDashboards, clearSearchResults, SearchResult } from "@/store/slices/searchSlice";
import {
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  dismissNotificationThunk,
  Notification
} from "@/store/slices/notificationSlice";
import { Bell, Search, User, Check, X, BarChart3, Database, Lock, Loader2, BellRing, AlertTriangle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import stratviewLogo from "@/assets/stratview-logo.png";
import { activeDashboardRoutes } from "@/data/dashboardRoutes";
import { toast } from "sonner";
import CustomRequirementButton from "@/components/CustomRequirementButton";

// Redux state handles notifications now

const DashboardHeader = () => {
  const navigate = useNavigate();
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const dispatch = useAppDispatch();
  const { results: searchResults, isLoading: isSearchLoading } = useAppSelector((state: any) => state.search);
  const { user: reduxUser } = useAppSelector((state: any) => state.auth);
  const { notifications, isLoading: isNotificationsLoading } = useAppSelector((state: any) => state.notifications);

  // Close search dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Debounced server-side search
  useEffect(() => {
    const q = searchQuery.trim();
    if (q.length < 2) {
      dispatch(clearSearchResults());
      return;
    }

    const timer = setTimeout(() => {
      dispatch(searchDashboards(q));
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, dispatch]);

  // Fetch and poll notifications
  useEffect(() => {
    dispatch(fetchNotifications());

    const intervalId = setInterval(() => {
      dispatch(fetchNotifications());
    }, 60000); // Poll every 60 seconds

    return () => clearInterval(intervalId);
  }, [dispatch]);

  const handleResultClick = (result: SearchResult) => {
    setSearchQuery("");
    setSearchOpen(false);

    if (result.type === "dashboard" && result.purchased) {
      const route = activeDashboardRoutes[result.dashboardId as keyof typeof activeDashboardRoutes];
      if (route) {
        navigate(route);
        return;
      }
    }

    navigate(`/dataset/${result.datasetId}`);
  };

  const unreadCount = notifications.filter((n: Notification) => !n.read).length;

  const markAsRead = (id: string) => {
    dispatch(markNotificationRead(id));
  };

  const markAllAsRead = () => {
    dispatch(markAllNotificationsRead());
  };

  const dismissNotification = (id: string) => {
    dispatch(dismissNotificationThunk(id));
  };

  const getTypeIcon = (type: Notification["type"]) => {
    switch (type) {
      case "update":
        return <BellRing className="h-4 w-4" />;
      case "alert":
        return <AlertTriangle className="h-4 w-4" />;
      case "info":
        return <Info className="h-4 w-4" />;
    }
  };

  const getTypeStyles = (type: Notification["type"]) => {
    switch (type) {
      case "update":
        return "bg-primary/10 text-primary";
      case "alert":
        return "bg-destructive/10 text-destructive";
      case "info":
        return "bg-muted text-muted-foreground";
    }
  };


  const handleLogout = () => {
    dispatch(logoutUser());
    toast.success("Successfully logged out");
    navigate("/");
  };

  const handleNotificationClick = (
    e: React.MouseEvent<HTMLElement>,
    notification: Notification
  ) => {
    const target = e.target as HTMLElement;
    
    // Don't navigate if clicking on action buttons
    if (target.closest('button')) {
      return;
    }

    // Mark as read if not already read
    if (!notification.read) {
      markAsRead(notification.id);
    }

    // Try to find a link in the message
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = notification.message;
    const anchor = tempDiv.querySelector('a');

    if (anchor) {
      const href = anchor.getAttribute('href');
      const slug = href?.split("/").filter(Boolean).pop();
      
      if (slug) {
        // Check expiry
        const expireDateStr = notification.dashabord_expire;
        const isExpired = expireDateStr
          ? new Date(expireDateStr) < new Date(new Date().toDateString())
          : false;

        if (isExpired) {
          setIsNotificationsOpen(false);
          navigate("/dashboard");
          return;
        }

        // 1. Handle dataset links
        if (href?.includes('/dataset/')) {
          navigate(`/dataset/${slug}`);
          setIsNotificationsOpen(false);
          return;
        }

        // 2. Handle dashboard links via registry (ID lookup)
        const registeredRoute = activeDashboardRoutes[slug as keyof typeof activeDashboardRoutes];
        if (registeredRoute) {
          navigate(registeredRoute);
          setIsNotificationsOpen(false);
          return;
        }

        // 3. Handle direct dashboard route links (fallback)
        if (href?.includes('/dashboard/')) {
          navigate(`/dashboard/${slug}`);
          setIsNotificationsOpen(false);
          return;
        }
      }
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-card/80 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between px-4 md:px-6">
        {/* Logo */}
        <div className="flex items-center">
          <img
            src={stratviewLogo}
            alt="Stratview Research"
            className="h-10 md:h-12 w-auto object-contain"
          />
        </div>

        {/* Search */}
        <div className="hidden md:flex flex-1 mx-8" ref={searchRef}>
          <div className="relative w-full">
            {isSearchLoading ? (
              <Loader2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary animate-spin" />
            ) : (
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            )}
            <Input
              placeholder="Search datasets, dashboards..."
              className="pl-10 bg-muted/50 border-transparent focus:border-primary/30 focus:bg-card transition-all"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSearchOpen(true);
              }}
              onFocus={() => searchQuery.length >= 2 && setSearchOpen(true)}
            />

            {searchOpen && searchQuery.length >= 2 && (
              <div className="absolute top-12 left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg overflow-hidden z-50">
                {isSearchLoading && searchResults.length === 0 ? (
                  <div className="px-4 py-8 text-center">
                    <Loader2 className="h-6 w-6 text-primary animate-spin mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Searching thousands of dashboards...</p>
                  </div>
                ) : searchResults.length === 0 ? (
                  <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                    No results found for "{searchQuery}"
                  </div>
                ) : (
                  <ScrollArea className="max-h-[320px]">
                    <div className="py-1">
                      {searchResults.map((result, i) => (
                        <button
                          key={`${result.type}-${result.dashboardId || result.datasetId}-${i}`}
                          onClick={() => handleResultClick(result)}
                          className="flex items-center gap-3 w-full px-4 py-2.5 text-left hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary/50 text-muted-foreground">
                            {result.type === "dataset" ? (
                              <Database className="h-4 w-4" />
                            ) : (
                              <BarChart3 className="h-4 w-4" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">
                              {result.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {result.category} · {result.type === "dataset" ? "Dataset" : "Dashboard"}
                            </p>
                          </div>
                          {result.type === "dashboard" && !result.purchased && (
                            <Lock className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
                          )}
                        </button>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </div>
            )}
          </div>

        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          {/* <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground">
                    {unreadCount}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 p-0">
              <div className="flex items-center justify-between border-b px-4 py-3">
                <h4 className="font-semibold text-sm">Notifications</h4>
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-muted-foreground hover:text-foreground h-auto py-1 px-2"
                    onClick={markAllAsRead}
                  >
                    Mark all as read
                  </Button>
                )}
              </div>
              <ScrollArea className="h-[300px]">
                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                    <Bell className="h-8 w-8 mb-2 opacity-50" />
                    <p className="text-sm">No notifications</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`group relative px-4 py-3 hover:bg-muted/50 transition-colors ${!notification.read ? "bg-primary/5" : ""
                          }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`mt-0.5 rounded-full p-1.5 ${getTypeStyles(notification.type)}`}>
                            <Bell className="h-3 w-3" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium truncate">
                                {notification.title}
                              </p>
                              {!notification.read && (
                                <span className="h-2 w-2 rounded-full bg-primary shrink-0" />
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                              {notification.message}
                            </p>
                            <p className="text-xs text-muted-foreground/70 mt-1">
                              {notification.time}
                            </p>
                          </div>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {!notification.read && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => markAsRead(notification.id)}
                              >
                                <Check className="h-3 w-3" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-muted-foreground hover:text-destructive"
                              onClick={() => dismissNotification(notification.id)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </PopoverContent>
          </Popover>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 px-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                  <User className="h-4 w-4 text-primary" />
                </div>
                <span className="hidden md:inline text-sm font-medium">
                  {reduxUser?.name || "User"}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate("/my-account")}>
                <User className="h-4 w-4 mr-2" />
                My Account
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive" onClick={handleLogout}>
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu> */}

          <CustomRequirementButton />

          <Button
            variant="ghost"
            size="icon"
            className="relative text-muted-foreground hover:text-foreground"
            onClick={() => setIsNotificationsOpen(true)}
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground">
                {unreadCount}
              </span>
            )}
          </Button>

          <Dialog open={isNotificationsOpen} onOpenChange={setIsNotificationsOpen}>
            <DialogContent className="sm:max-w-[700px] w-[calc(100%-32px)] max-h-[90vh] flex flex-col p-0 gap-0">
              <DialogHeader className="px-4 sm:px-6 py-4 pr-12 sm:pr-12 border-b border-border shrink-0">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0">
                  <div className="flex items-center gap-3">
                    <DialogTitle className="text-base sm:text-lg font-semibold">Notifications</DialogTitle>
                    {unreadCount > 0 && (
                      <Badge variant="secondary" className="text-xs font-medium shrink-0">
                        {unreadCount} new
                      </Badge>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs text-muted-foreground hover:text-foreground h-auto py-1.5 px-2 sm:px-3 self-start sm:self-auto"
                      onClick={markAllAsRead}
                    >
                      Mark all as read
                    </Button>
                  )}
                </div>
              </DialogHeader>

              <ScrollArea className="flex-1 min-h-0 max-h-[60vh] overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                    <div className="rounded-full bg-muted p-4 mb-4">
                      <Bell className="h-8 w-8 opacity-40" />
                    </div>
                    <p className="text-sm font-medium">All caught up!</p>
                    <p className="text-xs text-muted-foreground/70 mt-1">No notifications to show</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        onClick={(e) => handleNotificationClick(e, notification)}
                        className={`group relative px-6 py-4 hover:bg-muted/40 transition-colors cursor-pointer ${!notification.read ? "bg-primary/[0.03]" : ""
                          }`}
                      >
                        <div className="flex items-start gap-4">
                          <div className={`mt-0.5 rounded-full p-2 shrink-0 ${getTypeStyles(notification.type)}`}>
                            {getTypeIcon(notification.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="text-sm font-semibold text-foreground">
                                {notification.title}
                              </p>
                              {!notification.read && (
                                <span className="h-2 w-2 rounded-full bg-primary shrink-0" />
                              )}
                            </div>
                            {/* <p
                              className="text-sm text-muted-foreground leading-relaxed [&_a]:text-primary [&_a]:underline [&_a]:hover:opacity-80"
                              dangerouslySetInnerHTML={{ __html: notification.message }}
                            /> */}
                            <p
                              className="text-sm text-muted-foreground leading-relaxed [&_a]:text-primary [&_a]:underline [&_a]:hover:opacity-80"
                              dangerouslySetInnerHTML={{ __html: notification.message }}
                            />
                            <p className="text-xs text-muted-foreground/60 mt-2">
                              {notification.time}
                            </p>
                          </div>
                          <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                            {!notification.read && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-muted-foreground hover:text-primary"
                                onClick={() => markAsRead(notification.id)}
                                title="Mark as read"
                              >
                                <Check className="h-3.5 w-3.5" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-destructive"
                              onClick={() => dismissNotification(notification.id)}
                              title="Dismiss"
                            >
                              <X className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </DialogContent>
          </Dialog>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 px-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                  <User className="h-4 w-4 text-primary" />
                </div>
                <span className="hidden md:inline text-sm font-medium">
                  {reduxUser?.name || "User"}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate("/my-account")}>
                <User className="h-4 w-4 mr-2" />
                My Account
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive" onClick={handleLogout}>
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

    </header>
  );
};

export default DashboardHeader;
