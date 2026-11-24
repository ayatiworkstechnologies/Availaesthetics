
"use client";

import { useState } from "react";

import {
  homepageFaqs,
} from "@/lib/cms/homepage-faq-preview";

// -----------------------------------------
// Animated Plus / Close Icon
// -----------------------------------------

function AccordionIcon({
  isOpen,
}: {
  isOpen: boolean;
}) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`
        h-5 w-5 shrink-0
        transition-transform
        duration-300 ease-out
        motion-reduce:transition-none
        ${isOpen ? "rotate-45" : "rotate-0"}
      `}
    >
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  );
}

// -----------------------------------------
// Frequently Asked Questions
// -----------------------------------------

export default function FaqSection() {
  // First question is open by default.
  const [openFaqId, setOpenFaqId] = useState<
    string | null
  >(homepageFaqs[0]?.id ?? null);

  function toggleFaq(id: string) {
    setOpenFaqId((current) =>
      current === id ? null : id
    );
  }

  if (homepageFaqs.length === 0) {
    return null;
  }

  return (
    <section
      id="frequently-asked-questions"
      aria-labelledby="faq-heading"
      className="
        w-full bg-white
        pb-14 pt-12
        sm:pb-16 sm:pt-14
        lg:pb-20 lg:pt-16
      "
    >
      {/* MAIN CONTAINER */}
      <div className="mx-auto w-full max-w-[1700px] px-4 sm:px-6 lg:px-28">

        {/* SECTION HEADING */}
        <h2
          id="faq-heading"
          className="
            mb-10 text-center
            font-serif
            text-[clamp(1.85rem,3vw,3rem)]
            font-normal
            leading-tight
            tracking-[-0.025em]
            text-[#0B253B]
            sm:mb-12
            lg:mb-14
          "
        >
          Frequently Asked Questions
        </h2>

        {/* FAQ LIST */}
        <div className="w-full">

          {homepageFaqs.map((faq, index) => {
            const isOpen = openFaqId === faq.id;

            const questionId =
              `faq-question-${faq.id}`;

            const answerId =
              `faq-answer-${faq.id}`;

            return (
              <div
                key={faq.id}
                className="
                  border-b border-[#D7D9DC]
                  first:border-t-0
                "
              >

                {/* QUESTION BUTTON */}
                <h3 className="m-0">
                  <button
                    id={questionId}
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={answerId}
                    onClick={() => toggleFaq(faq.id)}
                    className={`
                      group
                      flex w-full
                      min-h-[68px]
                      cursor-pointer
                      items-center
                      justify-between
                      gap-5
                      px-3 py-5
                      text-left
                      transition-colors
                      duration-300 ease-out
                      hover:bg-[#F4F5F6]
                      focus-visible:outline-2
                      focus-visible:outline-offset-[-2px]
                      focus-visible:outline-[#0B253B]
                      sm:min-h-[80px]
                      sm:px-4
                      lg:min-h-[86px]
                      motion-reduce:transition-none
                      ${
                        isOpen
                          ? "text-[#0B253B]"
                          : "text-[#535E70]"
                      }
                    `}
                  >
                    {/* NUMBER AND QUESTION */}
                    <span
                      className="
                        flex min-w-0
                        items-start gap-2.5
                        font-sans
                        text-[14px]
                        font-normal
                        leading-[1.6]
                        tracking-[-0.01em]
                        transition-colors
                        duration-300
                        group-hover:text-[#0B253B]
                        sm:gap-3
                        sm:text-[16px]
                        lg:text-[18px]
                      "
                    >
                      <span className="shrink-0">
                        {index + 1}.
                      </span>

                      <span>
                        {faq.question}
                      </span>
                    </span>

                    {/* PLUS / CLOSE ICON */}
                    <span
                      className="
                        flex h-8 w-8
                        shrink-0
                        items-center
                        justify-center
                        rounded-full
                        text-[#0B253B]
                        transition-colors
                        duration-300
                        group-hover:bg-[#0B253B]/5
                        sm:h-9 sm:w-9
                      "
                    >
                      <AccordionIcon isOpen={isOpen} />
                    </span>

                  </button>
                </h3>

                {/* SMOOTH ANSWER ANIMATION */}
                <div
                  id={answerId}
                  role="region"
                  aria-labelledby={questionId}
                  aria-hidden={!isOpen}
                  className={`
                    grid
                    transition-[grid-template-rows,opacity]
                    duration-500
                    ease-[cubic-bezier(0.22,1,0.36,1)]
                    motion-reduce:transition-none
                    ${
                      isOpen
                        ? "grid-rows-[1fr] opacity-100"
                        : "grid-rows-[0fr] opacity-0"
                    }
                  `}
                >
                  <div className="min-h-0 overflow-hidden">

                    {/* ANSWER CONTENT */}
                    <div
                      className="
                        px-3 pb-7
                        sm:px-4 sm:pb-8
                      "
                    >
                      {faq.answer ? (
                        <p
                          className="
                            max-w-[1300px]
                            font-sans
                            text-[13px]
                            font-normal
                            leading-[1.8]
                            tracking-[-0.005em]
                            text-[#657184]
                            sm:text-[15px]
                            lg:text-[16px]
                          "
                        >
                          {faq.answer}
                        </p>
                      ) : (
                        <p
                          className="
                            text-[13px]
                            italic
                            leading-[1.8]
                            text-[#8B939E]
                            sm:text-sm
                          "
                        >
                          Answer pending client approval.
                        </p>
                      )}
                    </div>

                  </div>
                </div>

              </div>
            );
          })}

        </div>
      </div>
    </section>
  );
}
