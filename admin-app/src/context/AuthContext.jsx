
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../supabase';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);
    const [adminProfile, setAdminProfile] = useState(null);

    // 10 Min Timeout
    const TIMEOUT_DURATION = 10 * 60 * 1000;
    let idleTimer;

    const resetIdleTimer = () => {
        if (!session) return;
        clearTimeout(idleTimer);
        idleTimer = setTimeout(lockSession, TIMEOUT_DURATION);
    };

    const lockSession = async () => {
        await supabase.auth.signOut();
        // Use window.location to ensure full refresh/redirect logic
        // Or use router navigation if we had access here, but window is safer for hard logout
        if (window.location.pathname !== '/signin') {
            window.location.href = '/signin?reason=timeout';
        }
    };

    useEffect(() => {
        // Session setup
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            if (session) loadProfile(session.user.id);
            setLoading(false);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            if (session) {
                loadProfile(session.user.id);
                resetIdleTimer();
            } else {
                setAdminProfile(null);
            }
            setLoading(false);
        });

        // Activity listeners
        const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'];
        const handleActivity = () => resetIdleTimer();

        events.forEach(e => document.addEventListener(e, handleActivity));

        return () => {
            subscription.unsubscribe();
            clearTimeout(idleTimer);
            events.forEach(e => document.removeEventListener(e, handleActivity));
        };
    }, [session]); // dependency on session to re-bind listeners? acts as reliable trigger

    const loadProfile = async (userId) => {
        const { data } = await supabase
            .from('admins')
            .select('*')
            .eq('id', userId)
            .single();
        setAdminProfile(data);
    };

    const value = {
        session,
        adminProfile,
        signOut: () => supabase.auth.signOut(),
        loading
    };

    return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
};
