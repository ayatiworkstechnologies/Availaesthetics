
"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

import {
  footerBrandDescription,
  footerLocationLinks,
  footerGroups,
  footerSocialLinks,
  type FooterLink,
  type FooterSocialLink,
} from "@/lib/cms/footer-preview";

// =====================================
// FOOTER LOGO
// =====================================

function FooterLogo() {
  return (
    <Link
      href="/"
      aria-label="Avail Aesthetics MD homepage"
      className="
        group relative block
        h-[74px] w-[195px]
        cursor-pointer
        transition-opacity duration-300
        hover:opacity-90
        focus-visible:rounded
        focus-visible:outline-2
        focus-visible:outline-offset-4
        focus-visible:outline-white
        sm:w-[205px]
      "
    >
      {/* Original footer logo */}
      <Image
        src="/avail/brand/footer-logo.svg"
        alt="Avail Aesthetics MD"
        fill
        sizes="205px"
        className="object-contain object-left"
      />

      {/* White wordmark overlay */}
      <Image
        src="/avail/brand/logo.svg"
        alt=""
        aria-hidden="true"
        fill
        sizes="205px"
        className="
          pointer-events-none
          object-contain object-left
          brightness-0 invert
        "
        style={{
          clipPath: "inset(0 0 0 34%)",
        }}
      />
    </Link>
  );
}

// =====================================
// SOCIAL MEDIA ICONS
// =====================================

function SocialIcon({
  platform,
}: {
  platform: FooterSocialLink["platform"];
}) {
  if (platform === "facebook") {
    return (
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="h-[15px] w-[15px]"
      >
        <path d="M13.5 21v-8h2.7l.4-3.1h-3.1V7.9c0-.9.3-1.5 1.6-1.5h1.7V3.6c-.3-.1-1.3-.1-2.5-.1-2.5 0-4.2 1.5-4.2 4.3v2.1H7.3V13h2.8v8h3.4Z" />
      </svg>
    );
  }

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
    >
      <rect
        x="3"
        y="3"
        width="18"
        height="18"
        rx="5"
      />

      <circle
        cx="12"
        cy="12"
        r="4"
      />

      <circle
        cx="17.5"
        cy="6.5"
        r="1"
        fill="currentColor"
        stroke="none"
      />
    </svg>
  );
}

// =====================================
// SOCIAL LINK
// =====================================

function SocialLink({
  social,
}: {
  social: FooterSocialLink;
}) {
  const label =
    social.platform === "facebook"
      ? "Facebook"
      : "Instagram";

  const commonStyles = `
    inline-flex h-[30px] w-[30px]
    items-center justify-center
    rounded-full
    border border-white/30
    text-white/75
    transition-all duration-300 ease-out
    sm:h-[32px] sm:w-[32px]
  `;

  if (!social.href) {
    return (
      <span
        title={`${label} link pending`}
        aria-label={`${label} link pending`}
        className={`${commonStyles} cursor-default`}
      >
        <SocialIcon platform={social.platform} />
      </span>
    );
  }

  return (
    <a
      href={social.href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Avail Aesthetics MD on ${label}`}
      className={`
        ${commonStyles}
        cursor-pointer

        hover:-translate-y-0.5
        hover:border-[#83DCE5]
        hover:bg-[#83DCE5]
        hover:text-[#0B253B]
        hover:shadow-[0_5px_14px_rgba(0,0,0,0.15)]

        focus-visible:outline-2
        focus-visible:outline-offset-3
        focus-visible:outline-white

        motion-reduce:transform-none
      `}
    >
      <SocialIcon platform={social.platform} />
    </a>
  );
}

// =====================================
// FOOTER NAVIGATION LINK
// =====================================

function FooterNavLink({
  link,
}: {
  link: FooterLink;
}) {
  const baseStyles = `
    relative inline-block
    max-w-full
    text-[12px]
    font-normal
    leading-[1.65]
    tracking-[0.005em]
    sm:text-[12.5px]
  `;

  // Pages without configured URLs
  // will not navigate to broken routes.
  if (!link.href) {
    return (
      <span
        className={`
          ${baseStyles}
          cursor-default
          text-[#A4B4C1]
        `}
      >
        {link.label}
      </span>
    );
  }

  return (
    <Link
      href={link.href}
      className={`
        ${baseStyles}
        group cursor-pointer
        text-[#A4B4C1]

        transition-all duration-300 ease-out

        hover:translate-x-1
        hover:text-white

        focus-visible:rounded-sm
        focus-visible:text-white
        focus-visible:outline-2
        focus-visible:outline-offset-3
        focus-visible:outline-[#83DCE5]

        motion-reduce:transform-none

        after:absolute
        after:bottom-[-3px]
        after:left-0
        after:h-[1px]
        after:w-0
        after:bg-[#83DCE5]
        after:transition-[width]
        after:duration-300
        after:ease-out

        hover:after:w-full
        focus-visible:after:w-full
      `}
    >
      {link.label}
    </Link>
  );
}

// =====================================
// FOOTER COLUMN
// =====================================

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: FooterLink[];
}) {
  return (
    <nav
      aria-label={`${title} footer links`}
      className="
        min-w-0
        lg:border-l
        lg:border-white/15
        lg:pl-5
        xl:pl-6
      "
    >
      {/* COLUMN HEADING */}
      <h3
        className="
          mb-5
          text-[10px]
          font-semibold
          uppercase
          tracking-[0.13em]
          text-white
          sm:text-[11px]
        "
      >
        {title}
      </h3>

      {/* NAVIGATION LINKS */}
      <ul className="space-y-2.5">
        {links.map((link) => (
          <li
            key={link.label}
            className="min-w-0"
          >
            <FooterNavLink link={link} />
          </li>
        ))}
      </ul>
    </nav>
  );
}

// =====================================
// MAIN SITE FOOTER
// =====================================

export default function SiteFooter() {
  // Stable value used during server prerender.
  const [currentYear, setCurrentYear] =
    useState(2026);

  // Calculate the actual year only after
  // the component mounts in the browser.
  // This avoids the Next.js 16 prerender error.
  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
  }, []);

  return (
    <footer
      aria-label="Avail Aesthetics MD footer"
      className="w-full bg-[#0B253B] text-white"
    >
      {/* MAIN FOOTER CONTAINER */}
      <div
        className="
          mx-auto w-full
          max-w-[1600px]

          px-5
          pb-10 pt-11

          sm:px-7
          sm:pb-12 sm:pt-12

          lg:px-10
          lg:pb-14 lg:pt-12

          xl:px-12
        "
      >
        {/* =================================
            FOOTER CONTENT GRID
        ================================= */}

        <div
          className="
            grid grid-cols-2
            gap-x-8 gap-y-10

            sm:gap-x-10
            sm:gap-y-12

            lg:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)_minmax(0,0.65fr)_minmax(0,0.75fr)_minmax(0,1.1fr)]
            lg:gap-x-4
            lg:gap-y-0

            xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,0.65fr)_minmax(0,0.75fr)_minmax(0,1.1fr)]
            xl:gap-x-5
          "
        >
          {/* =================================
              BRAND COLUMN
          ================================= */}

          <div
            className="
              col-span-2 min-w-0
              lg:col-span-1
              lg:pr-5
            "
          >
            <FooterLogo />

            <p
              className="
                mt-5
                max-w-[245px]
                text-[12px]
                font-normal
                leading-[1.75]
                text-[#A4B4C1]
                sm:text-[12.5px]
              "
            >
              {footerBrandDescription}
            </p>
          </div>

          {/* =================================
              LOCATIONS COLUMN
          ================================= */}

          <FooterColumn
            title="LOCATIONS"
            links={footerLocationLinks}
          />

          {/* =================================
              OTHER NAVIGATION COLUMNS
          ================================= */}

          {footerGroups.map((group) => (
            <FooterColumn
              key={group.title}
              title={group.title}
              links={group.links}
            />
          ))}
        </div>

        {/* =================================
            COPYRIGHT AND SOCIAL LINKS
        ================================= */}

        <div
          className="
            mt-12
            flex flex-col gap-5

            sm:mt-14
            sm:flex-row
            sm:items-center
            sm:justify-between

            lg:mt-11
          "
        >
          {/* COPYRIGHT */}
          <p
            className="
              text-[10px]
              font-normal
              leading-[1.8]
              tracking-[0.005em]
              text-[#8FA3B3]
              sm:text-[11px]
            "
          >
            Copyright © {currentYear} Avail Aesthetics MD
            {" – "}
            All rights reserved.

            <span className="hidden sm:inline">
              {" | "}
            </span>

            <span className="block sm:inline">
              Designed by ayatiworks
            </span>
          </p>

          {/* SOCIAL ICONS */}
          <div
            className="
              flex shrink-0
              items-center gap-2
            "
          >
            {footerSocialLinks.map((social) => (
              <SocialLink
                key={social.platform}
                social={social}
              />
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
