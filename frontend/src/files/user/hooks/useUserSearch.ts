import { useEffect, useRef, useState } from "react";
import { handleApiAction } from "@/utils";
import UserService from "../user.service";
import type { IUser } from "../user.interface";

const useUserSearch = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<IUser[]>([]);
  const [isLoadingSearch, setIsLoadingSearch] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestQueryRef = useRef("");

  useEffect(() => {
    const trimmed = query.trim();
    latestQueryRef.current = trimmed;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!trimmed) {
      setResults([]);
      setIsLoadingSearch(false);
      return;
    }
    debounceRef.current = setTimeout(() => {
      void handleApiAction({
        action: () => UserService.searchUsers(trimmed),
        onSuccess: (result) => {
          if (latestQueryRef.current !== trimmed) return;
          setResults(result?.data?.items ?? []);
        },
        setLoading: setIsLoadingSearch,
        errorMessage: "We could not search users",
        isToastDisabled: true,
      });
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  return { query, setQuery, results, isLoadingSearch };
};

export default useUserSearch;
