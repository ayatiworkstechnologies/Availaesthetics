
"use client";

import {
    useEffect,
    useRef,
    useState,
    type KeyboardEvent as ReactKeyboardEvent,
} from "react";

import Image from "next/image";
import Link from "next/link";

import {
    aestheticsMenu,
    clinicNames,
} from "@/lib/cms/homepage-preview";

// ----------------------------------------
// Types and navigation configuration
// ----------------------------------------

type MenuKey = "aesthetics" | "wellness" | "locations";

type NavigationItem = {
    label: string;
    href?: string | null;
    menu?: MenuKey;
};

const navigation: NavigationItem[] = [
    { label: "AESTHETICS", menu: "aesthetics" },
    { label: "WELLNESS", menu: "wellness" },
    { label: "CONCERNS", href: null },
    { label: "ABOUT", href: null },
    { label: "MEMBERSHIP", href: null },
    { label: "LOCATIONS", menu: "locations" },
];

// ----------------------------------------
// SVG Icons
// ----------------------------------------

function ChevronIcon({ open = false }: { open?: boolean }) {
    return (
        <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`h-4 w-4 shrink-0 transition-transform duration-300 ease-in-out motion-reduce:transition-none ${open ? "rotate-180" : "rotate-0"
                }`}
        >
            <path d="m6 9 6 6 6-6" />
        </svg>
    );
}

function ArrowRightIcon() {
    return (
        <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4 shrink-0 transition-transform duration-300 group-hover:translate-x-1 motion-reduce:transition-none"
        >
            <path d="M5 12h14" />
            <path d="m13 6 6 6-6 6" />
        </svg>
    );
}

function MenuIcon() {
    return (
        <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            className="h-6 w-6"
        >
            <path d="M4 7h16M4 12h16M4 17h16" />
        </svg>
    );
}

function CloseIcon() {
    return (
        <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            className="h-6 w-6"
        >
            <path d="M5 5l14 14M19 5 5 19" />
        </svg>
    );
}

function FacebookIcon() {
    return (
        <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="h-3.5 w-3.5"
        >
            <path d="M13.5 21v-8h2.8l.4-3.2h-3.2V7.7c0-.9.3-1.5 1.6-1.5h1.7V3.3c-.3 0-1.3-.1-2.5-.1-2.6 0-4.4 1.6-4.4 4.5v2.1H7V13h2.9v8h3.6Z" />
        </svg>
    );
}

function InstagramIcon() {
    return (
        <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-3.5 w-3.5"
        >
            <rect x="3" y="3" width="18" height="18" rx="5" />
            <circle cx="12" cy="12" r="4" />
            <path d="M17.5 6.5h.01" />
        </svg>
    );
}

// ----------------------------------------
// Desktop Aesthetics Mega-Menu
// ----------------------------------------

function AestheticsMegaMenu({
    selectedCategory,
    onCategoryChange,
}: {
    selectedCategory: number;
    onCategoryChange: (index: number) => void;
}) {
    const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

    const activeCategory =
        aestheticsMenu[selectedCategory] ??
        aestheticsMenu[0];

    function handleCategoryKeyDown(
        event: ReactKeyboardEvent<HTMLButtonElement>,
        index: number
    ) {
        let nextIndex = index;

        if (event.key === "ArrowRight") {
            nextIndex = (index + 1) % aestheticsMenu.length;
        } else if (event.key === "ArrowLeft") {
            nextIndex =
                (index - 1 + aestheticsMenu.length) %
                aestheticsMenu.length;
        } else if (event.key === "Home") {
            nextIndex = 0;
        } else if (event.key === "End") {
            nextIndex = aestheticsMenu.length - 1;
        } else {
            return;
        }

        event.preventDefault();

        onCategoryChange(nextIndex);
        tabRefs.current[nextIndex]?.focus();
    }

    return (
        <div className="px-6 pb-7 pt-3 lg:px-9">
            {/* CATEGORY TABS */}
            <div
                role="tablist"
                aria-label="Aesthetics treatment categories"
                className="grid grid-cols-5 gap-x-4 border-b border-[#0B253B]/10 xl:gap-x-6"
            >
                {aestheticsMenu.map((category, index) => {
                    const isActive = selectedCategory === index;

                    return (
                        <button
                            key={category.label}
                            ref={(node) => {
                                tabRefs.current[index] = node;
                            }}
                            id={`avail-category-tab-${index}`}
                            type="button"
                            role="tab"
                            tabIndex={isActive ? 0 : -1}
                            aria-selected={isActive}
                            aria-controls="avail-category-panel"
                            onMouseEnter={() =>
                                onCategoryChange(index)
                            }
                            onFocus={() =>
                                onCategoryChange(index)
                            }
                            onClick={() =>
                                onCategoryChange(index)
                            }
                            onKeyDown={(event) =>
                                handleCategoryKeyDown(event, index)
                            }
                            className="group flex h-[58px] min-w-0 cursor-pointer items-center justify-start text-left focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-[#0B253B]"
                        >
                            {/* Label-sized active underline */}
                            <span
                                className={`relative inline-flex h-full max-w-full items-center text-[10px] font-semibold uppercase tracking-[0.03em] transition-colors duration-200 xl:text-[12px] ${isActive
                                    ? "text-[#0B253B]"
                                    : "text-[#64748B] group-hover:text-[#0B253B]"
                                    }`}
                            >
                                <span>{category.label}</span>

                                <span
                                    aria-hidden="true"
                                    className={`absolute bottom-0 left-1/2 h-[3px] w-full -translate-x-1/2 rounded-full bg-[#0B253B] transition-[transform,opacity] duration-300 ease-out motion-reduce:transition-none ${isActive
                                        ? "scale-x-100 opacity-100"
                                        : "scale-x-0 opacity-0 group-hover:scale-x-100 group-hover:opacity-100"
                                        }`}
                                />
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* SELECTED CATEGORY CONTENT */}
            <div
                id="avail-category-panel"
                role="tabpanel"
                aria-labelledby={`avail-category-tab-${selectedCategory}`}
                tabIndex={0}
                className="min-h-[155px] pt-5 focus-visible:outline-2 focus-visible:outline-[#0B253B]"
            >
                <div
                    key={activeCategory.label}
                    className="grid w-full max-w-[510px] grid-flow-col grid-cols-2 grid-rows-4 gap-x-9 gap-y-3 motion-safe:animate-[availMenuReveal_250ms_ease-out]"
                >
                    {activeCategory.treatments.map((treatment) => (
                        <span
                            key={treatment}
                            title="Treatment page pending CMS URL"
                            className="inline-flex min-h-6 w-fit items-center text-[12px] leading-5 text-[#222222] xl:text-[13px]"
                        >
                            <span>{treatment}</span>
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
}

// ----------------------------------------
// Mobile Aesthetics Category Accordion
// ----------------------------------------

function MobileAestheticsMenu() {
    const [activeCategory, setActiveCategory] =
        useState<number | null>(0);

    return (
        <div className="pb-4 pl-3">
            {aestheticsMenu.map((category, index) => {
                const expanded = activeCategory === index;

                return (
                    <div
                        key={category.label}
                        className="border-b border-[#0B253B]/10 last:border-0"
                    >
                        <button
                            type="button"
                            aria-expanded={expanded}
                            aria-controls={`avail-mobile-category-${index}`}
                            onClick={() =>
                                setActiveCategory(expanded ? null : index)
                            }
                            className={`flex min-h-12 w-full cursor-pointer items-center justify-between gap-3 py-3 text-left text-xs font-semibold transition-colors duration-200 ${expanded
                                ? "text-[#0B253B]"
                                : "text-slate-500 hover:text-[#0B253B]"
                                }`}
                        >
                            <span>{category.label}</span>
                            <ChevronIcon open={expanded} />
                        </button>

                        {expanded && (
                            <div
                                id={`avail-mobile-category-${index}`}
                                className="space-y-1 pb-4 pl-3 motion-safe:animate-[availMenuReveal_250ms_ease-out]"
                            >
                                {category.treatments.map((treatment) => (
                                    <span
                                        key={treatment}
                                        title="Treatment page pending CMS URL"
                                        className="block py-2 text-sm text-[#222222]"
                                    >
                                        {treatment}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

// ----------------------------------------
// Main Site Header
// ----------------------------------------

export default function SiteHeader() {
    const headerRef = useRef<HTMLElement>(null);

    const [desktopMenu, setDesktopMenu] =
        useState<MenuKey | null>(null);

    const [renderedDesktopMenu, setRenderedDesktopMenu] =
        useState<MenuKey>("aesthetics");

    const [selectedCategory, setSelectedCategory] =
        useState(0);

    const [mobileOpen, setMobileOpen] =
        useState(false);

    const [mobileSection, setMobileSection] =
        useState<MenuKey | null>(null);

    const isDesktopMenuOpen = desktopMenu !== null;

    function openDesktopMenu(menu: MenuKey) {
        if (
            menu === "aesthetics" &&
            desktopMenu !== "aesthetics"
        ) {
            setSelectedCategory(0);
        }

        setRenderedDesktopMenu(menu);
        setDesktopMenu(menu);
    }

    function toggleMobileSection(menu: MenuKey) {
        setMobileSection((current) =>
            current === menu ? null : menu
        );
    }

    function closeMenus() {
        setDesktopMenu(null);
        setMobileSection(null);
        setMobileOpen(false);
    }

    // Close navigation on Escape and outside clicks
    useEffect(() => {
        function onKeyDown(event: KeyboardEvent) {
            if (event.key === "Escape") {
                setDesktopMenu(null);
                setMobileSection(null);
                setMobileOpen(false);
            }
        }

        function onPointerDown(event: PointerEvent) {
            if (
                headerRef.current &&
                !headerRef.current.contains(
                    event.target as Node
                )
            ) {
                setDesktopMenu(null);
                setMobileSection(null);
                setMobileOpen(false);
            }
        }

        document.addEventListener("keydown", onKeyDown);
        document.addEventListener("pointerdown", onPointerDown);

        return () => {
            document.removeEventListener(
                "keydown",
                onKeyDown
            );

            document.removeEventListener(
                "pointerdown",
                onPointerDown
            );
        };
    }, []);

    return (

        <header
            ref={headerRef}
            className="sticky top-0 z-[100] w-full bg-white text-[#0B253B] shadow-[0_2px_12px_rgba(11,37,59,0.06)]"
        >

            {/* Smooth category-change animation */}
            <style>{`
        @keyframes availMenuReveal {
          from {
            opacity: 0;
            transform: translateY(6px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>

            {/* TOP NAVY LOCATION BAR */}
            <div className="bg-[#0B253B] text-white">
                <div className="mx-auto flex min-h-12 max-w-[1440px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 py-2 text-[10px] font-semibold uppercase tracking-[0.03em] sm:text-[11px]">
                        <span>LOCATIONS:</span>

                        {clinicNames.map((name, index) => (
                            <span
                                key={name}
                                className="inline-flex items-center gap-2"
                            >
                                <Link
                                    href="#our-locations"
                                    className="cursor-pointer transition-colors duration-200 hover:text-[#9AEFF0] hover:underline"
                                >
                                    {name.toUpperCase()}
                                </Link>

                                {index < clinicNames.length - 1 && (
                                    <span
                                        aria-hidden="true"
                                        className="font-normal text-white/50"
                                    >
                                        |
                                    </span>
                                )}
                            </span>
                        ))}
                    </div>

                    {/* Decorative SVG icons until social URLs exist */}
                    <div
                        aria-hidden="true"
                        className="hidden shrink-0 items-center gap-2 sm:flex"
                    >
                        <span className="flex h-6 w-6 items-center justify-center rounded-full border border-white/35">
                            <FacebookIcon />
                        </span>

                        <span className="flex h-6 w-6 items-center justify-center rounded-full border border-white/35">
                            <InstagramIcon />
                        </span>
                    </div>
                </div>
            </div>

            {/* MAIN WHITE HEADER */}
            <div
                className="relative border-b border-[#0B253B]/10 bg-white"
                onMouseLeave={() => setDesktopMenu(null)}
                onBlurCapture={(event) => {
                    if (
                        !event.currentTarget.contains(
                            event.relatedTarget as Node | null
                        )
                    ) {
                        setDesktopMenu(null);
                    }
                }}
            >
                <div className="mx-auto flex min-h-[78px] max-w-[1440px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">

                    {/* ORIGINAL LOGO */}
                    <Link
                        href="/dev/home-preview"
                        aria-label="Avail Aesthetics MD preview home"
                        onMouseEnter={() => setDesktopMenu(null)}
                        className="shrink-0 cursor-pointer"
                    >
                        <Image
                            src="/avail/brand/logo.svg"
                            alt="Avail Aesthetics MD"
                            width={140}
                            height={55}
                            priority
                            className="h-auto w-[112px] object-contain sm:w-[135px]"
                        />
                    </Link>

                    {/* DESKTOP NAVIGATION */}
                    <nav
                        aria-label="Main navigation"
                        className="hidden items-center gap-4 xl:flex xl:gap-6"
                    >
                        {navigation.map((item) => {
                            // Dropdown navigation
                            if (item.menu) {
                                const menu = item.menu;
                                const expanded = desktopMenu === menu;

                                return (
                                    <button
                                        key={item.label}
                                        type="button"
                                        aria-expanded={expanded}
                                        aria-controls="avail-desktop-megamenu"
                                        onMouseEnter={() =>
                                            openDesktopMenu(menu)
                                        }
                                        onFocus={() =>
                                            openDesktopMenu(menu)
                                        }
                                        onClick={() =>
                                            openDesktopMenu(menu)
                                        }
                                        className="group relative inline-flex min-h-12 cursor-pointer items-center whitespace-nowrap text-xs font-semibold tracking-[0.025em] text-[#0B253B] transition-colors duration-200 hover:text-slate-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B253B]"
                                    >
                                        <span className="relative inline-flex items-center gap-1.5 py-3">
                                            {item.label}

                                            <ChevronIcon open={expanded} />

                                            {/* Animated navigation underline */}
                                            <span
                                                aria-hidden="true"
                                                className={`absolute bottom-0 left-1/2 h-[2px] w-full -translate-x-1/2 rounded-full bg-[#0B253B] transition-transform duration-300 ease-out ${expanded
                                                    ? "scale-x-100"
                                                    : "scale-x-0 group-hover:scale-x-100"
                                                    }`}
                                            />
                                        </span>
                                    </button>
                                );
                            }

                            // Standard navigation links
                            if (!item.href) {
                                return (
                                    <span
                                        key={item.label}
                                        title={`${item.label} page pending CMS URL`}
                                        className="inline-flex min-h-12 items-center whitespace-nowrap text-xs font-semibold tracking-[0.025em] text-[#0B253B]"
                                    >
                                        {item.label}
                                    </span>
                                );
                            }

                            return (
                                <Link
                                    key={item.label}
                                    href={item.href}
                                    onMouseEnter={() => setDesktopMenu(null)}
                                    className="group relative inline-flex min-h-12 cursor-pointer items-center whitespace-nowrap text-xs font-semibold tracking-[0.025em] text-[#0B253B] transition-colors duration-200 hover:text-slate-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B253B]"
                                >
                                    {item.label}

                                    <span
                                        aria-hidden="true"
                                        className="absolute bottom-1 left-1/2 h-[2px] w-full -translate-x-1/2 scale-x-0 rounded-full bg-[#0B253B] transition-transform duration-300 group-hover:scale-x-100"
                                    />
                                </Link>
                            );
                        })}
                    </nav>

                    {/* HEADER ACTIONS */}
                    <div className="flex shrink-0 items-center gap-3">
                        {/* Keep inactive until the real EMR URL exists */}
                        <span
                            title="Booking URL is not configured yet"
                            className="hidden min-h-11 cursor-default items-center justify-center rounded-full bg-[#0B253B] px-6 text-xs font-semibold text-white sm:inline-flex"
                        >
                            Book Now
                        </span>

                        {/* MOBILE MENU TOGGLE */}
                        <button
                            type="button"
                            aria-label={
                                mobileOpen
                                    ? "Close navigation"
                                    : "Open navigation"
                            }
                            aria-expanded={mobileOpen}
                            aria-controls="avail-mobile-menu"
                            onClick={() => {
                                setMobileOpen((current) => !current);
                                setDesktopMenu(null);
                            }}
                            className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-lg border border-[#0B253B]/15 transition-colors duration-200 hover:bg-[#0B253B]/5 focus-visible:outline-2 focus-visible:outline-[#0B253B] xl:hidden"
                        >
                            {mobileOpen ? (
                                <CloseIcon />
                            ) : (
                                <MenuIcon />
                            )}
                        </button>
                    </div>
                </div>

                {/* DESKTOP FLOATING MEGA-MENU */}
                <div
                    id="avail-desktop-megamenu"
                    aria-hidden={!isDesktopMenuOpen}
                    className={`absolute inset-x-0 top-full z-50 hidden px-4 pt-2 transition-[opacity,transform,visibility] duration-300 ease-out motion-reduce:transition-none sm:px-6 xl:block xl:px-8 ${isDesktopMenuOpen
                        ? "visible pointer-events-auto translate-y-0 opacity-100"
                        : "invisible pointer-events-none -translate-y-2 opacity-0"
                        }`}
                >
                    <div className="mx-auto max-w-[1440px] overflow-hidden rounded-xl border border-[#0B253B]/10 bg-white shadow-[0_20px_55px_rgba(11,37,59,0.16)]">
                        {renderedDesktopMenu === "aesthetics" && (
                            <AestheticsMegaMenu
                                selectedCategory={selectedCategory}
                                onCategoryChange={setSelectedCategory}
                            />
                        )}

                        {renderedDesktopMenu === "wellness" && (
                            <div className="px-9 py-9">
                                <h3 className="text-sm font-semibold text-[#0B253B]">
                                    WELLNESS
                                </h3>

                                <p className="mt-3 text-sm text-slate-500">
                                    Wellness categories will be connected
                                    to the approved CMS menu.
                                </p>
                            </div>
                        )}

                        {renderedDesktopMenu === "locations" && (
                            <div className="px-9 py-8">
                                <h3 className="text-xs font-semibold tracking-wide text-[#0B253B]">
                                    OUR LOCATIONS
                                </h3>

                                <div className="mt-5 grid grid-cols-3 gap-4">
                                    {clinicNames.map((name) => (
                                        <Link
                                            key={name}
                                            href="#our-locations"
                                            onClick={closeMenus}
                                            className="group flex cursor-pointer items-center justify-between rounded-lg border border-[#0B253B]/10 px-5 py-4 text-sm font-medium text-[#0B253B] transition-colors duration-200 hover:bg-[#0B253B]/5"
                                        >
                                            {name}

                                            <ArrowRightIcon />
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* RESPONSIVE MOBILE NAVIGATION */}
                {mobileOpen && (
                    <div
                        id="avail-mobile-menu"
                        className="border-t border-[#0B253B]/10 bg-white motion-safe:animate-[availMenuReveal_250ms_ease-out] xl:hidden"
                    >
                        <nav
                            aria-label="Mobile navigation"
                            className="max-h-[calc(100dvh-120px)] overflow-y-auto px-5 pb-7"
                        >
                            {navigation.map((item) => {
                                // Standard mobile links
                                if (!item.menu && item.href) {
                                    return (
                                        <Link
                                            key={item.label}
                                            href={item.href}
                                            onClick={closeMenus}
                                            className="flex min-h-14 cursor-pointer items-center border-b border-[#0B253B]/10 text-sm font-semibold transition-colors duration-200 hover:text-slate-500"
                                        >
                                            {item.label}
                                        </Link>
                                    );
                                }

                                if (!item.menu) {
                                    return (
                                        <span
                                            key={item.label}
                                            title={`${item.label} page pending CMS URL`}
                                            className="flex min-h-14 items-center border-b border-[#0B253B]/10 text-sm font-semibold"
                                        >
                                            {item.label}
                                        </span>
                                    );
                                }

                                const menu = item.menu;
                                const expanded = mobileSection === menu;

                                return (
                                    <div
                                        key={item.label}
                                        className="border-b border-[#0B253B]/10"
                                    >
                                        {/* MOBILE DROPDOWN BUTTON */}
                                        <button
                                            type="button"
                                            aria-expanded={expanded}
                                            aria-controls={`avail-mobile-section-${menu}`}
                                            onClick={() =>
                                                toggleMobileSection(menu)
                                            }
                                            className="flex min-h-14 w-full cursor-pointer items-center justify-between gap-3 text-left text-sm font-semibold transition-colors duration-200 hover:text-slate-500"
                                        >
                                            <span>{item.label}</span>
                                            <ChevronIcon open={expanded} />
                                        </button>

                                        {expanded && (
                                            <div
                                                id={`avail-mobile-section-${menu}`}
                                                className="motion-safe:animate-[availMenuReveal_250ms_ease-out]"
                                            >
                                                {/* AESTHETICS */}
                                                {menu === "aesthetics" && (
                                                    <MobileAestheticsMenu />
                                                )}

                                                {/* LOCATIONS */}
                                                {menu === "locations" && (
                                                    <div className="space-y-1 pb-4 pl-3">
                                                        {clinicNames.map((name) => (
                                                            <Link
                                                                key={name}
                                                                href="#our-locations"
                                                                onClick={closeMenus}
                                                                className="block cursor-pointer py-2 text-sm text-[#222222] transition-colors hover:text-[#0B253B] hover:underline"
                                                            >
                                                                {name}
                                                            </Link>
                                                        ))}
                                                    </div>
                                                )}

                                                {/* WELLNESS */}
                                                {menu === "wellness" && (
                                                    <p className="pb-4 pl-3 text-sm text-slate-500">
                                                        Wellness categories will be
                                                        connected to the CMS.
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}

                            {/* Mobile booking placeholder */}
                            <span
                                title="Booking URL is not configured yet"
                                className="mt-6 flex min-h-12 w-full cursor-default items-center justify-center rounded-full bg-[#0B253B] px-6 text-sm font-semibold text-white"
                            >
                                Book Now
                            </span>
                        </nav>
                    </div>
                )}
            </div>
        </header>
    );
}
