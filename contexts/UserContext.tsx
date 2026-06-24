import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useState,
} from 'react';
import { matchingService } from '../services/matchingService';
import type { School, VolunteerProfile } from '../types';
import { useAuth } from './AuthContext';

interface UserContextValue {
  volunteerProfile: VolunteerProfile | null;
  schoolProfile: School | null;
  isLoading: boolean;
  refreshProfile: () => Promise<void>;
}

const UserContext = createContext<UserContextValue | null>(null);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const { appUser } = useAuth();
  const [volunteerProfile, setVolunteerProfile] = useState<VolunteerProfile | null>(null);
  const [schoolProfile, setSchoolProfile] = useState<School | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const refreshProfile = useCallback(async () => {
    if (!appUser) return;
    setIsLoading(true);
    try {
      if (appUser.role === 'volunteer') {
        const profile = await matchingService.getVolunteerProfile(appUser.id);
        setVolunteerProfile(profile);
      } else if (appUser.role === 'school') {
        const school = await matchingService.getSchoolByUserId(appUser.id);
        setSchoolProfile(school);
      }
    } finally {
      setIsLoading(false);
    }
  }, [appUser]);

  useEffect(() => {
    if (appUser) refreshProfile();
    else {
      setVolunteerProfile(null);
      setSchoolProfile(null);
    }
  }, [appUser, refreshProfile]);

  return (
    <UserContext.Provider value={{ volunteerProfile, schoolProfile, isLoading, refreshProfile }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUserContext() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUserContext must be used within UserProvider');
  return ctx;
}
