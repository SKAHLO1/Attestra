"use client"

import { useState } from "react"
import { Menu, X, User, LogOut, Wallet, Mail, Tag, LogIn, UserPlus } from "lucide-react"
import { LoginDialog } from "./auth/login-dialog"
import { UserRole } from "@/lib/firebase/auth-context"
import { Button } from "@/components/ui/button"
import { useWallet } from "@provablehq/aleo-wallet-adaptor-react"
import { useAuth } from "@/lib/firebase/auth-context"
import WalletButton from "./wallet-button"
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"

interface HamburgerMenuProps {
    onLogout?: () => void
}

export default function HamburgerMenu({ onLogout }: HamburgerMenuProps) {
    const [open, setOpen] = useState(false)
    const { connected, disconnect, address } = useWallet()
    const { user, userProfile, logout } = useAuth()

    // Auth Dialog State
    const [showLoginDialog, setShowLoginDialog] = useState(false)
    const [selectedRole, setSelectedRole] = useState<UserRole>("attendee")

    const handleAuthAction = (role: UserRole) => {
        setSelectedRole(role)
        setShowLoginDialog(true)
        // Note: Sheet closing is handled by the Dialog opening or manual state if needed
    }

    const handleLogout = async () => {
        try {
            if (connected) {
                await disconnect()
            }
            await logout()
            if (onLogout) {
                onLogout()
            }
            setOpen(false)
        } catch (error) {
            console.error("Logout error:", error)
        }
    }

    const handleDisconnectWallet = async () => {
        try {
            await disconnect()
            setOpen(false)
        } catch (error) {
            console.error("Disconnect wallet error:", error)
        }
    }

    // Format public key for display
    const formatPublicKey = (key: string | null) => {
        if (!key) return ""
        return `${key.slice(0, 6)}...${key.slice(-4)}`
    }

    // Get user initials for avatar
    const getUserInitials = () => {
        if (userProfile?.displayName) {
            return userProfile.displayName
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2)
        }
        if (user?.email) {
            return user.email[0].toUpperCase()
        }
        return "U"
    }

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon-sm"
                    className="rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-700 transition-colors border border-gray-200"
                >
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Open menu</span>
                </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80 bg-white border-l border-gray-200">
                <SheetHeader className="text-left pb-6">
                    <SheetTitle className="text-gray-900 text-xl font-semibold">Menu</SheetTitle>
                </SheetHeader>

                <div className="flex flex-col gap-6">
                    {/* Profile Info Section */}
                    {user && (
                        <>
                            <div className="flex items-start gap-4 p-4 rounded-lg bg-gray-50 border border-gray-200">
                                <Avatar className="h-14 w-14 border-2 border-gray-300">
                                    <AvatarImage src={user?.photoURL || undefined} />
                                    <AvatarFallback className="bg-gray-200 text-gray-700 font-semibold text-lg">
                                        {getUserInitials()}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-gray-900 truncate">
                                        {userProfile?.displayName || "User"}
                                    </p>
                                    <p className="text-xs text-gray-600 truncate">
                                        {user.email}
                                    </p>
                                    {userProfile?.role && (
                                        <span className="inline-block mt-2 px-3 py-1 text-xs font-medium rounded-full bg-gray-200 text-gray-700 capitalize">
                                            {userProfile.role}
                                        </span>
                                    )}
                                </div>
                            </div>

                            <Separator className="bg-gray-200" />
                        </>
                    )}

                    {/* Wallet Section */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-gray-700 mb-2">
                            <Wallet className="h-5 w-5" />
                            <span className="text-sm font-semibold">Wallet Connection</span>
                        </div>

                        <div className="pl-7 space-y-3">
                            {connected && address ? (
                                <div className="space-y-2">
                                    <div className="p-3 rounded-lg bg-gray-50 border border-gray-200">
                                        <p className="text-xs text-gray-600 mb-1">Connected Address:</p>
                                        <p className="text-sm font-mono text-gray-900 break-all">
                                            {formatPublicKey(address)}
                                        </p>
                                    </div>
                                    <Button
                                        onClick={handleDisconnectWallet}
                                        variant="outline"
                                        size="sm"
                                        className="w-full bg-white hover:bg-gray-100 text-gray-700 border-gray-300"
                                    >
                                        Disconnect Wallet
                                    </Button>
                                </div>
                            ) : (
                                <div className="wallet-button-container">
                                    <WalletButton />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Auth Section for Guest Users */}
                    {!user && (
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 text-gray-700 mb-2">
                                <LogIn className="h-5 w-5" />
                                <span className="text-sm font-semibold">Join Veleo</span>
                            </div>
                            <div className="pl-7 flex flex-col gap-2">
                                <Button
                                    onClick={() => handleAuthAction("organizer")}
                                    variant="outline"
                                    className="w-full justify-start border-gray-200 hover:bg-gray-50 text-gray-700 h-9"
                                >
                                    <UserPlus className="w-4 h-4 mr-2" />
                                    Sign in as Organizer
                                </Button>
                                <Button
                                    onClick={() => handleAuthAction("attendee")}
                                    variant="outline"
                                    className="w-full justify-start border-gray-200 hover:bg-gray-50 text-gray-700 h-9"
                                >
                                    <UserPlus className="w-4 h-4 mr-2" />
                                    Sign in as Attendee
                                </Button>
                            </div>
                        </div>
                    )}

                    <Separator className="bg-gray-200" />

                    {/* Navigation Links */}
                    <div className="space-y-1">
                        <Button
                            variant="ghost"
                            className="w-full justify-start text-gray-700 hover:bg-gray-100 px-2 h-10"
                            onClick={() => { /* Navigate to Pricing */ }}
                        >
                            <Tag className="w-5 h-5 mr-3 text-gray-500" />
                            <span className="font-medium">Pricing</span>
                        </Button>
                        <Button
                            variant="ghost"
                            className="w-full justify-start text-gray-700 hover:bg-gray-100 px-2 h-10"
                            onClick={() => { /* Navigate to Contact */ }}
                        >
                            <Mail className="w-5 h-5 mr-3 text-gray-500" />
                            <span className="font-medium">Contact Us</span>
                        </Button>
                    </div>

                    {/* Logout Button */}
                    {user && (
                        <>
                            <Separator className="bg-gray-200" />
                            <Button
                                onClick={handleLogout}
                                className="w-full bg-gray-600 hover:bg-gray-700 text-white mt-auto"
                            >
                                <LogOut className="w-4 h-4 mr-2" />
                                Logout
                            </Button>
                        </>
                    )}
                </div>
            </SheetContent>

            <LoginDialog
                open={showLoginDialog}
                onOpenChange={(isOpen) => {
                    setShowLoginDialog(isOpen)
                    if (!isOpen) setOpen(false)
                }}
                role={selectedRole}
            />
        </Sheet>
    )
}
