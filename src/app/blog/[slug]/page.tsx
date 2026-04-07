import { getAllArticles } from "@/lib/articles";
import path from "path";
import fs from "fs";
import matter from "gray-matter";
import { compileMDX } from "next-mdx-remote/rsc";
import { notFound } from "next/navigation";
import remarkGfm from "remark-gfm";
import "highlight.js/styles/github-dark.css";
import WasmComponent from "@/components/wasmComponent";
import BanhMe from "@/components/BanhMe";
import rehypeHighlight from "rehype-highlight";

const components = { WasmComponent: WasmComponent, BanhMe: BanhMe };


const articleClasses = `
  prose prose-lg max-w-none
  prose-p:font-normal prose-p:text-foreground
  prose-headings:font-black prose-headings:text-foreground
  prose-li:font-normal prose-li:text-foreground prose-li:marker:text-foreground
  prose-strong:text-foreground prose-strong:font-black
  prose-code:text-orange-400 prose-code:bg-neutral-800 prose-code:rounded prose-code:px-1.5 prose-code:py-0.5
  prose-pre:bg-transparent prose-pre:p-0
  prose-img:rounded
`;

export async function generateStaticParams() {
  return getAllArticles().map((a) => ({ slug: a.slug }));
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const filepath = path.join(process.cwd(), "content/articles", `${slug}.mdx`);

  if (!fs.existsSync(filepath)) notFound();

  const raw = fs.readFileSync(filepath, "utf8");
  const { content, data } = matter(raw);

  const { content: rendered } = await compileMDX({
    source: content,
    components,
    options: {
      parseFrontmatter: false,
      mdxOptions: {
        remarkPlugins: [remarkGfm],
        rehypePlugins: [rehypeHighlight],
      },
    },
  });

  return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      <h1 className="text-4xl font-black mb-2">{data.title}</h1>
      <div className="text-sm mb-8">{data.date}</div>
      <article className={articleClasses}>{rendered}</article>
    </div>
  );
}