
export type HomepageFaq = {
  id: string;
  question: string;
  answer: string | null;
};

export const homepageFaqs: HomepageFaq[] = [
  
{
  id: "treatments",
  question:
    "What Treatments Does Avail Aesthetics MD Offer?",
  answer:
    "We offer medical aesthetics, laser treatments, wellness therapies, weight management, IV therapy, peptide therapy, and intimate wellness services for both men and women.",
},

  {
    id: "consultation",
    question: "Do I Need A Consultation Before Treatment?",
    answer: null,
  },
  {
    id: "professionals",
    question: "Are Your Treatments Performed By Medical Professionals?",
    answer: null,
  },
  {
    id: "downtime",
    question: "Do Aesthetic Treatments Require Downtime?",
    answer: null,
  },
  {
    id: "financing",
    question: "Do You Offer Financing Options?",
    answer: null,
  },
  {
    id: "choosing-treatment",
    question: "How Do I Know Which Treatment Is Right For Me?",
    answer: null,
  },
  {
    id: "wellness-programmes",
    question:
      "Are Your Wellness And Weight Loss Programmes Personalised?",
    answer: null,
  },
  {
    id: "appointment",
    question: "How Do I Book An Appointment?",
    answer: null,
  },
];
