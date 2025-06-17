import { useCallback } from "react";

const useCookies = () => {
  const setCookie = useCallback((name: string, value: string, hours = 24) => {
    const expires = new Date(Date.now() + hours * 3600000).toUTCString();
    document.cookie = `${name}=${value}; expires=${expires}; path=/; Secure; SameSite=None`;
  }, []);

  const removeCookie = useCallback((name: string) => {
    document.cookie = `${name}=; path=/; max-age=0; Secure; SameSite=None`;
  }, []);
  const getCookie = useCallback((name: string) => {
    if (typeof document === "undefined") {
      return null;
    }
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
      return parts.pop()?.split(";").shift();
    }
    return null;
  }, []);

  return { setCookie, removeCookie, getCookie };
};

export default useCookies;
