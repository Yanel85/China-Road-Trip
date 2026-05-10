import { getRoutes } from "@/lib/notion";
import ResponsiveHome from "@/components/ResponsiveHome";

export const dynamic = "force-dynamic";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedSearchParams = await searchParams;
  const q = resolvedSearchParams.q;
  const query = typeof q === "string" ? q : undefined;
  const t = resolvedSearchParams.tag;
  const tag = typeof t === "string" ? t : undefined;

  const routes = await getRoutes();
  const allTags = Array.from(new Set(routes.flatMap(r => r.tags))).filter(Boolean);

  return (
    <ResponsiveHome 
      routes={routes} 
      allTags={allTags} 
      initialTag={tag} 
      initialQuery={query} 
    />
  );
}

