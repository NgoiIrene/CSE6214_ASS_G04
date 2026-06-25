import React, { createContext, useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient'; 

// 1. 创建 Context
export const RiderContext = createContext();

// 2. 创建 Provider 组件包装器
export const RiderProvider = ({ children }) => {
  const [avatarUri, setAvatarUri] = useState(null);
  const [riderName, setRiderName] = useState('Loading...');
  const [isOnline, setIsOnline] = useState(false);

  // 独立出来的获取数据函数
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
    // 🛡️ 保险 1：初始化时获取 Session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchProfileData(session.user.id);
      }
    });

    // 🛡️ 保险 2：实时监听 Auth 状态。一旦监听到 Login，立刻强制拉取数据！
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        fetchProfileData(session.user.id);
      } else {
        // 如果触发了 Logout，顺手把内存里的旧头像和名字清空
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