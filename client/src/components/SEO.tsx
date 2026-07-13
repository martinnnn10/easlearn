import { Helmet } from "react-helmet-async";

interface SEOProps {
  title: string;
  description: string;
  path?: string;
  type?: string;
  image?: string;
}

const SITE_NAME = "Electrical Automation Services";

const DEFAULT_OG_IMAGE = "https://d2xsxph8kpxj0f.cloudfront.net/310519663631243604/dBvv3KQQ9K9tWbpcptY97y/og-image-8tSV6uouUPwb5bx8CWMbAG.png";

export default function SEO({ title, description, path, type = "website", image }: SEOProps) {
  const ogImage = image || DEFAULT_OG_IMAGE;
  const fullTitle = `${title} | ${SITE_NAME}`;
  // Route-aware: derive canonical URL from current location if no explicit path given
  const currentPath = path ?? (typeof window !== "undefined" ? window.location.pathname : "/");
  const origin = typeof window !== "undefined" ? window.location.origin : "https://easlearn.org";
  const url = `${origin}${currentPath}`;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:image" content={ogImage} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
    </Helmet>
  );
}
