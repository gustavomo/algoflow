import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { MDXRemote } from 'next-mdx-remote/rsc';
import LessonVizPlayer from '../../../components/lesson/LessonVizPlayer';
import QABox from '../../../components/lesson/QABox';

export default function LessonPage({ params }: { params: { slug: string } }) {
  const filePath = path.join(process.cwd(), `content/lessons/${params.slug}.mdx`);
  const source = fs.readFileSync(filePath, 'utf8');
  const { content, data } = matter(source);
  const mdxComponents = { Hint: (props: any) => <div className="p-2 bg-yellow-100 border">{props.children}</div> };


  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8">
      <article>
        <MDXRemote source={content} components={mdxComponents} />
        <QABox tech={data.tech} />
      </article>
      <section>
        <LessonVizPlayer slug={params.slug} />
      </section>
    </div>
  );
}
