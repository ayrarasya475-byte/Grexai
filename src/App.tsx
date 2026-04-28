/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { useStore, UserProfile } from './lib/store';
import { auth, db, loginWithGoogle, logout, handleFirestoreError, OperationType } from './lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import Dashboard from './components/Dashboard';

export default function App() {
  const { user, setUser, profile, setProfile, isLoading, setIsLoading } = useStore();
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    // Simulate boot animation
    const timer = setTimeout(() => setBooting(false), 2500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      setUser(fbUser);
      if (fbUser) {
        try {
          const userRef = doc(db, 'users', fbUser.uid);
          const userSnap = await getDoc(userRef);
          
          if (userSnap.exists()) {
            setProfile(userSnap.data() as UserProfile);
          } else {
            // Create user
            const newProfile: UserProfile = {
              uid: fbUser.uid,
              email: fbUser.email || '',
              firstName: fbUser.displayName ? fbUser.displayName.split(' ')[0] : 'User',
              role: 'user',
              limitRemaining: 50,
              lastLimitReset: Date.now(),
              createdAt: Date.now(),
              updatedAt: Date.now(),
              settings: {
                puterJsActive: true,
                geminiApiKey: '',
                deepseekApiKey: '',
                grokApiKey: ''
              }
            };
            await setDoc(userRef, newProfile);
            setProfile(newProfile);
          }
        } catch (err) {
          try { handleFirestoreError(err, OperationType.GET, 'users'); } catch(e){}
        }
      } else {
        setProfile(null);
      }
      setIsLoading(false);
    });
    return unsub;
  }, []);

  if (booting) {
    return (
      <div className="flex h-screen items-center justify-center bg-black text-green-500 font-mono text-2xl">
        <div className="flex flex-col items-center">
          <div className="animate-pulse mb-4 text-4xl font-bold tracking-widest text-red-600 shadow-red-500 drop-shadow-lg">GREXAI POWER</div>
          <div>INITIALIZING SYSTEM...</div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return <div className="flex h-screen bg-black" />; // Blank screen while loading auth
  }

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center bg-black text-white font-mono">
        <div className="text-center">
          <h1 className="text-5xl font-bold mb-8 text-red-600 drop-shadow-[0_0_15px_rgba(220,38,38,0.8)]">GREXAI</h1>
          <p className="mb-8 text-gray-400">UNLEASH THE POWER WITHOUT LIMITS</p>
          <button 
            onClick={() => loginWithGoogle().catch(e => alert("Login failed"))}
            className="px-6 py-3 bg-red-900 hover:bg-red-700 text-white font-bold rounded shadow-lg shadow-red-900/50 transition duration-300"
          >
            LOGIN WITH GOOGLE
          </button>
        </div>
      </div>
    );
  }

  return <Dashboard />;
}

