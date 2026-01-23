"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from "firebase/auth"
import { doc, setDoc, getDoc } from "firebase/firestore"
import { auth, db } from "./config"

export type UserRole = "attendee" | "organizer"

export interface UserProfile {
  uid: string
  email: string
  role: UserRole
  displayName?: string
  createdAt: Date
}

interface AuthContextType {
  user: FirebaseUser | null
  userProfile: UserProfile | null
  loading: boolean
  signUpWithEmail: (email: string, password: string, role: UserRole, displayName?: string) => Promise<void>
  signInWithEmail: (email: string, password: string) => Promise<void>
  signInWithGoogle: (role: UserRole) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchUserProfile = async (uid: string) => {
    try {
      const profileDoc = await getDoc(doc(db, "users", uid))
      if (profileDoc.exists()) {
        const data = profileDoc.data()
        setUserProfile({
          uid: uid,
          email: data.email,
          role: data.role as UserRole,
          displayName: data.displayName,
          createdAt: data.createdAt?.toDate() || new Date(),
        })
      } else {
        setUserProfile(null)
      }
    } catch (error) {
      console.error("Error fetching user profile:", error)
      setUserProfile(null)
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser)

      if (firebaseUser) {
        await fetchUserProfile(firebaseUser.uid)
      } else {
        setUserProfile(null)
      }

      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const signUpWithEmail = async (
    email: string,
    password: string,
    role: UserRole,
    displayName?: string
  ) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)

      await setDoc(doc(db, "users", userCredential.user.uid), {
        email,
        role,
        displayName: displayName || email.split("@")[0],
        createdAt: new Date(),
      })

      // Fetch profile immediately to update state
      await fetchUserProfile(userCredential.user.uid)
    } catch (error: any) {
      console.error("Error signing up:", error)
      throw new Error(error.message || "Failed to sign up")
    }
  }

  const signInWithEmail = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password)
    } catch (error: any) {
      console.error("Error signing in:", error)
      throw new Error(error.message || "Failed to sign in")
    }
  }

  const signInWithGoogle = async (role: UserRole) => {
    try {
      const provider = new GoogleAuthProvider()

      console.log('[Auth] Starting Google sign-in...')
      console.log('[Auth] Auth domain:', auth.config.authDomain)

      // Call signInWithPopup immediately without any delays
      const result = await signInWithPopup(auth, provider)

      console.log('[Auth] Sign-in successful:', result.user.email)

      const userDoc = await getDoc(doc(db, "users", result.user.uid))

      if (!userDoc.exists()) {
        console.log('[Auth] Creating new user profile...')
        await setDoc(doc(db, "users", result.user.uid), {
          email: result.user.email,
          role,
          displayName: result.user.displayName || result.user.email?.split("@")[0],
          createdAt: new Date(),
        })
      }

      // Always fetch profile to ensure state is updated, especially after new account creation
      await fetchUserProfile(result.user.uid)
    } catch (error: any) {
      console.error("Error signing in with Google:", error)
      console.error("Error code:", error.code)
      console.error("Error details:", error)

      if (error.code === 'auth/popup-closed-by-user') {
        throw new Error("The sign-in popup was closed before completing. Please try again and complete the sign-in process.")
      }

      if (error.code === 'auth/popup-blocked') {
        throw new Error("Your browser blocked the sign-in popup. Please allow popups for this site in your browser settings.")
      }

      if (error.code === 'auth/cancelled-popup-request') {
        throw new Error("Another sign-in popup is already open. Please close it and try again.")
      }

      if (error.code === 'auth/unauthorized-domain') {
        throw new Error("This domain is not authorized for OAuth operations. Please add it to your Firebase console under Authentication > Settings > Authorized domains.")
      }

      if (error.code === 'auth/internal-error') {
        throw new Error("Firebase internal error. Please check your Firebase configuration and try again.")
      }

      throw new Error(error.message || "Failed to sign in with Google")
    }
  }

  const logout = async () => {
    try {
      await signOut(auth)
    } catch (error: any) {
      console.error("Error signing out:", error)
      throw new Error(error.message || "Failed to sign out")
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        loading,
        signUpWithEmail,
        signInWithEmail,
        signInWithGoogle,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
