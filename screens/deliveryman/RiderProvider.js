import React, { createContext, useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient'; 

export const RiderContext = createContext();

export const RiderProvider = ({ children }) => {
  const [avatarUri, setAvatarUri] = useState(null);
  const [riderName, setRiderName] = useState('Loading...');
  const [isOnline, setIsOnline] = useState(false);

  const fetchProfileData = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, avatar_url')
        .eq('id', userId)
        .single();

      if (!error && data) {
        if (data.full_name) setRiderName(data.full_name);
        if (data.avatar_url) setAvatarUri(data.avatar_url); // 🌟 确保从数据库加载头像
      }
    } catch (error) {
      console.log("Error fetching profile in Provider:", error);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchProfileData(session.user.id);
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        fetchProfileData(session.user.id);
      } else {
        setAvatarUri(null);
        setRiderName('Loading...');
        setIsOnline(false);
      }
    });

    return () => authListener.subscription.unsubscribe();
  }, []); 

  return (
    <RiderContext.Provider value={{ avatarUri, setAvatarUri, riderName, setRiderName, isOnline, setIsOnline }}>
      {children}
    </RiderContext.Provider>
  );
};