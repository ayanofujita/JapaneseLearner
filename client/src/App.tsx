import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/hooks/use-auth";
import Layout from "@/components/layout";
import Home from "@/pages/home";
import Study from "@/pages/study";
import Auth from "@/pages/auth";
import NotFound from "@/pages/not-found";
import History from "@/pages/history";
import PWAUpdateNotification from "@/components/pwa-update";


function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/study" component={Study} />
        <Route path="/auth" component={Auth} />
        <Route path="/history" component={History} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
        <PWAUpdateNotification />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;