import React, { createContext, useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient'; 

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
    const [profile, setProfile] = useState({ full_name: 'Loading...', avatar_url: null });
    const [isLoggedIn, setIsLoggedIn] = useState(false); // 1. 管理登录状态

    useEffect(() => {
        checkUser();
    }, []);

    const checkUser = async () => {
        // 检查当前是否有活跃的 session
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            setIsLoggedIn(true);
            fetchProfile(session.user.id);
        } else {
            setIsLoggedIn(false);
        }
    };

    const fetchProfile = async (userId) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('full_name, avatar_url')
                .eq('id', userId)
                .single();

            if (error) throw error;
            if (data) setProfile(data);
        } catch (error) {
            console.error('获取 Profile 失败:', error.message);
            setProfile({ full_name: 'Guest', avatar_url: null });
        }
    };

    // 2. 定义登出函数
    const logout = async () => {
        await supabase.auth.signOut();
        setIsLoggedIn(false); // 登出后重置状态，触发页面跳转
        setProfile({ full_name: 'Guest', avatar_url: null });
    };

    // 3. 将这些变量和函数通过 value 传递出去
    return (
        <UserContext.Provider value={{ 
            profile, 
            setProfile, 
            fetchProfile, 
            isLoggedIn, 
            setIsLoggedIn, 
            logout 
        }}>
            {children}
        </UserContext.Provider>
    );
};