
export type HomepageBlog = {
  id: string;
  title: string;
  excerpt: string;
  imageSrc: string | null;
  imageAlt: string;
  href: string | null;
  featured: boolean;
};

export const homepageBlogs: HomepageBlog[] = [
  {
    id: "skin-rejuvenation",
    title:
      "Skin Rejuvenation Treatments: Improve Skin Texture and Uneven Skin Tone",
    excerpt:
      "Quick Summary: Dull skin, uneven skin tone, rough texture and lingering acne marks are common concerns discussed in this article.",
    imageSrc:
      "/avail/home/blogs/skin-rejuvenation.png",
    imageAlt:
      "Close-up showing natural facial skin texture",
    href: null,
    featured: true,
  },
  {
    id: "sermorelin-benefits",
    title:
      "Sermorelin Benefits: What the Research Shows About This Growth Hormone Peptide",
    excerpt:
      "What is Sermorelin? Explore the research and questions surrounding this growth hormone peptide.",
    imageSrc:
      "/avail/home/blogs/sermorelin.png",
    imageAlt:
      "Medical research illustration about Sermorelin",
    href: null,
    featured: true,
  },
  {
    id: "improve-skin-texture",
    title:
      "How to Improve Skin Texture, Large Pores and Uneven Skin Tone",
    excerpt:
      "An overview of skin texture concerns, large pores and the aesthetic treatments discussed for them.",
    imageSrc:
      "/avail/home/blogs/skin-texture.png",
    imageAlt:
      "Close-up of natural cheek and facial skin texture",
    href: null,
    featured: true,
  },
];
