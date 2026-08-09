import Link from 'next/link';
import matter from 'gray-matter';
import fs from 'fs';
import path from 'path';

interface LessonMeta {
  slug: string;
  title: string;
  tech: string;
}

export default function LessonsPage({ searchParams }: { searchParams: { tech?: string } }) {
  const dir = path.join(process.cwd(), 'content/lessons');
  const files = fs.readdirSync(dir);
  const lessons: LessonMeta[] = files.map((file) => {
    const source = fs.readFileSync(path.join(dir, file), 'utf8');
    const { data } = matter(source);
    return data as LessonMeta;
  });

  const filtered = searchParams.tech
    ? lessons.filter((l) => l.tech === searchParams.tech)
    : lessons;

  return (
    <main className="p-8 grid gap-4 grid-cols-1 md:grid-cols-3">
      {filtered.map((lesson) => (
        <Link key={lesson.slug} href={`/lessons/${lesson.slug}`} className="border p-4 rounded shadow">
          <h2 className="text-xl font-semibold">{lesson.title}</h2>
          <p className="text-sm text-gray-600">Tech: {lesson.tech}</p>
        </Link>
      ))}
    </main>
  );
}
