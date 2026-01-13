"use client"

import { useState } from "react"
import Link from "next/link"
import { Search, Menu, X } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

export default function Navbar() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

    const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen)
    const closeMobileMenu = () => setIsMobileMenuOpen(false)

    return (
        <>
            <nav className="fixed top-0 w-full z-50 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center gap-8">
                            <Link
                                href="/"
                                className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent"
                                onClick={closeMobileMenu}
                            >
                                BoomBigNose รีวิว
                            </Link>
                            <div className="hidden md:flex items-center gap-6">
                                <Link href="/products" className="text-sm font-medium text-black hover:text-primary transition-colors">
                                    สินค้า
                                </Link>
                                <Link href="/categories" className="text-sm font-medium text-black hover:text-primary transition-colors">
                                    หมวดหมู่
                                </Link>
                                <Link href="/about" className="text-sm font-medium text-black hover:text-primary transition-colors">
                                    เกี่ยวกับเรา
                                </Link>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <button
                                className="p-2 hover:bg-slate-100 rounded-full transition-colors text-black"
                                aria-label="ค้นหา"
                            >
                                <Search className="w-5 h-5" />
                            </button>
                            <Link href="/admin" className="btn-primary py-2 px-4 text-sm hidden sm:inline-block">
                                แผงควบคุม
                            </Link>
                            <button
                                className="md:hidden p-2 text-black hover:bg-slate-100 rounded-lg transition-colors"
                                onClick={toggleMobileMenu}
                                aria-label={isMobileMenuOpen ? "ปิดเมนู" : "เปิดเมนู"}
                                aria-expanded={isMobileMenuOpen}
                            >
                                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Mobile Menu Overlay */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="fixed inset-0 bg-black/50 z-40 md:hidden"
                            onClick={closeMobileMenu}
                        />

                        {/* Mobile Menu */}
                        <motion.div
                            initial={{ x: "100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="fixed top-16 right-0 bottom-0 w-64 bg-white shadow-2xl z-40 md:hidden"
                        >
                            <div className="flex flex-col p-6 space-y-4">
                                <Link
                                    href="/products"
                                    className="text-base font-medium text-black hover:text-primary transition-colors py-2"
                                    onClick={closeMobileMenu}
                                >
                                    สินค้า
                                </Link>
                                <Link
                                    href="/categories"
                                    className="text-base font-medium text-black hover:text-primary transition-colors py-2"
                                    onClick={closeMobileMenu}
                                >
                                    หมวดหมู่
                                </Link>
                                <Link
                                    href="/about"
                                    className="text-base font-medium text-black hover:text-primary transition-colors py-2"
                                    onClick={closeMobileMenu}
                                >
                                    เกี่ยวกับเรา
                                </Link>
                                <div className="pt-4 border-t border-slate-200">
                                    <Link
                                        href="/admin"
                                        className="btn-primary py-2 px-4 text-sm inline-block text-center w-full"
                                        onClick={closeMobileMenu}
                                    >
                                        แผงควบคุม
                                    </Link>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    )
}
