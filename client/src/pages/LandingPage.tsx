import { useLocation } from "wouter";
import { useEffect } from "react";

export default function LandingPage() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    setLocation("/login");
  }, [setLocation]);

  return null;
}
