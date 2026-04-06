import { getAllArticles } from "@/lib/articles";
import path from "path";
import fs from "fs";
import matter from "gray-matter";
import { marked } from "marked";
import { notFound } from "next/navigation";
import { markedHighlight } from "marked-highlight";
import hljs from "highlight.js";
import "highlight.js/styles/github-dark.css";

export async function generateStaticParams() {
  return getAllArticles().map((a) => ({ slug: a.slug }));
}
marked.use(markedHighlight({
  langPrefix: "hljs language-",
  highlight(code, lang) {
    const language = hljs.getLanguage(lang) ? lang : "plaintext";
    return hljs.highlight(code, { language }).value;
  }
}));

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
  const html = await marked(content);

  return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      <h1 className="text-4xl font-black mb-2">{data.title}</h1>
      <div className="text-sm mb-8">{data.date}</div>
      <article
        className="
          prose prose-lg max-w-none
          prose-p:font-normal prose-p:text-foreground
          prose-headings:font-black prose-headings:text-foreground
          prose-li:font-normal prose-li:text-foreground prose-li:marker:text-foreground
          prose-strong:text-foreground prose-strong:font-black
          prose-code:text-orange-400 prose-code:bg-neutral-800 prose-code:rounded prose-code:px-1.5 prose-code:py-0.5
          prose-pre:bg-transparent prose-pre:p-0
          
        "
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}