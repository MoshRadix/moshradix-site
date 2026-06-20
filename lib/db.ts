import { neon } from "@neondatabase/serverless"
import { blogPosts as blogSeed } from "@/lib/blog-data"
import { notesSeed, projectsSeed, workbenchSeed, activitySeed } from "@/lib/seed-data"

const connectionString =
  process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.POSTGRES_PRISMA_URL

export const sql = neon(connectionString!)

// ---------------------------------------------------------------------------
// Types (shapes consumed by the public-facing components)
// ---------------------------------------------------------------------------

export interface BlogPostRecord {
  id: number
  slug: string
  title: string
  excerpt: string
  content: string
  date: string
  readTime: string
  category: string
  tags: string[]
  author: {
    name: string
    avatar: string
    role: string
  }
  featured: boolean
  color: string
}

export interface NoteRecord {
  id: number
  title: string
  excerpt: string
  content: string
  date: string
  category: string
  tags: string[]
  color: string
  readTime: string
}

export interface ProjectRecord {
  id: number
  title: string
  description: string
  tags: string[]
  status: string
  year: string
  stars: number
  forks: number
  url: string
  homepage: string | null
  featured: boolean
  highlight: boolean
}

export interface WorkbenchItemRecord {
  id: number
  name: string
  description: string
  progress: number
  lastUpdated: string
  url: string
  branch: string
  commits: number
}

export interface ActivityRecord {
  id: number
  type: string
  project: string
  message: string
  time: string
}

// ---------------------------------------------------------------------------
// Row mappers
// ---------------------------------------------------------------------------

/* eslint-disable @typescript-eslint/no-explicit-any */
function mapBlog(row: any): BlogPostRecord {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    content: row.content,
    date: row.date,
    readTime: row.read_time,
    category: row.category,
    tags: row.tags ?? [],
    author: {
      name: row.author_name,
      avatar: row.author_avatar,
      role: row.author_role,
    },
    featured: row.featured,
    color: row.color,
  }
}

function mapNote(row: any): NoteRecord {
  return {
    id: row.id,
    title: row.title,
    excerpt: row.excerpt,
    content: row.content,
    date: row.date,
    category: row.category,
    tags: row.tags ?? [],
    color: row.color,
    readTime: row.read_time,
  }
}

function mapProject(row: any): ProjectRecord {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    tags: row.tags ?? [],
    status: row.status,
    year: row.year,
    stars: row.stars,
    forks: row.forks,
    url: row.url,
    homepage: row.homepage,
    featured: row.featured,
    highlight: row.highlight,
  }
}

function mapWorkbench(row: any): WorkbenchItemRecord {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    progress: row.progress,
    lastUpdated: row.last_updated,
    url: row.url,
    branch: row.branch,
    commits: row.commits,
  }
}

function mapActivity(row: any): ActivityRecord {
  return {
    id: row.id,
    type: row.type,
    project: row.project,
    message: row.message,
    time: row.time,
  }
}
/* eslint-enable @typescript-eslint/no-explicit-any */

// ---------------------------------------------------------------------------
// Seeding (runs once when tables are empty)
// ---------------------------------------------------------------------------

let seedPromise: Promise<void> | null = null

async function seed() {
  const [{ count }] = (await sql`SELECT COUNT(*)::int AS count FROM blog_posts`) as { count: number }[]
  if (count > 0) return

  let i = 0
  for (const p of blogSeed) {
    await sql`
      INSERT INTO blog_posts
        (slug, title, excerpt, content, date, read_time, category, tags, author_name, author_avatar, author_role, featured, color, sort_index)
      VALUES
        (${p.slug}, ${p.title}, ${p.excerpt}, ${p.content}, ${p.date}, ${p.readTime}, ${p.category}, ${p.tags}, ${p.author.name}, ${p.author.avatar}, ${p.author.role}, ${p.featured}, ${p.color}, ${i})
      ON CONFLICT (slug) DO NOTHING
    `
    i++
  }

  i = 0
  for (const n of notesSeed) {
    await sql`
      INSERT INTO notes (title, excerpt, content, date, category, tags, color, read_time, sort_index)
      VALUES (${n.title}, ${n.excerpt}, ${n.content}, ${n.date}, ${n.category}, ${n.tags}, ${n.color}, ${n.readTime}, ${i})
    `
    i++
  }

  i = 0
  for (const p of projectsSeed) {
    await sql`
      INSERT INTO projects (title, description, tags, status, year, stars, forks, url, homepage, featured, highlight, sort_index)
      VALUES (${p.title}, ${p.description}, ${p.tags}, ${p.status}, ${p.year}, ${p.stars}, ${p.forks}, ${p.url}, ${p.homepage ?? null}, ${p.featured}, ${p.highlight ?? false}, ${i})
    `
    i++
  }

  i = 0
  for (const w of workbenchSeed) {
    await sql`
      INSERT INTO workbench_items (name, description, progress, last_updated, url, branch, commits, sort_index)
      VALUES (${w.name}, ${w.description}, ${w.progress}, ${w.lastUpdated}, ${w.url}, ${w.branch}, ${w.commits}, ${i})
    `
    i++
  }

  i = 0
  for (const a of activitySeed) {
    await sql`
      INSERT INTO workbench_activity (type, project, message, time, sort_index)
      VALUES (${a.type}, ${a.project}, ${a.message}, ${a.time}, ${i})
    `
    i++
  }
}

export function ensureSeeded() {
  if (!seedPromise) {
    seedPromise = seed().catch((err) => {
      seedPromise = null
      throw err
    })
  }
  return seedPromise
}

// ---------------------------------------------------------------------------
// Blog posts
// ---------------------------------------------------------------------------

export async function getBlogPosts(): Promise<BlogPostRecord[]> {
  await ensureSeeded()
  const rows = await sql`SELECT * FROM blog_posts ORDER BY sort_index ASC, id ASC`
  return rows.map(mapBlog)
}

export async function getBlogPostBySlug(slug: string): Promise<BlogPostRecord | undefined> {
  await ensureSeeded()
  const rows = await sql`SELECT * FROM blog_posts WHERE slug = ${slug} LIMIT 1`
  return rows[0] ? mapBlog(rows[0]) : undefined
}

export async function getRelatedBlogPosts(slug: string, limit = 3): Promise<BlogPostRecord[]> {
  const all = await getBlogPosts()
  const current = all.find((p) => p.slug === slug)
  if (!current) return []
  return all
    .filter((p) => p.slug !== slug)
    .filter((p) => p.category === current.category || p.tags.some((t) => current.tags.includes(t)))
    .slice(0, limit)
}

export async function createBlogPost(data: Omit<BlogPostRecord, "id">) {
  await sql`
    INSERT INTO blog_posts
      (slug, title, excerpt, content, date, read_time, category, tags, author_name, author_avatar, author_role, featured, color)
    VALUES
      (${data.slug}, ${data.title}, ${data.excerpt}, ${data.content}, ${data.date}, ${data.readTime}, ${data.category}, ${data.tags}, ${data.author.name}, ${data.author.avatar}, ${data.author.role}, ${data.featured}, ${data.color})
  `
}

export async function updateBlogPost(id: number, data: Omit<BlogPostRecord, "id">) {
  await sql`
    UPDATE blog_posts SET
      slug = ${data.slug},
      title = ${data.title},
      excerpt = ${data.excerpt},
      content = ${data.content},
      date = ${data.date},
      read_time = ${data.readTime},
      category = ${data.category},
      tags = ${data.tags},
      author_name = ${data.author.name},
      author_avatar = ${data.author.avatar},
      author_role = ${data.author.role},
      featured = ${data.featured},
      color = ${data.color}
    WHERE id = ${id}
  `
}

export async function deleteBlogPost(id: number) {
  await sql`DELETE FROM blog_posts WHERE id = ${id}`
}

// ---------------------------------------------------------------------------
// Notes
// ---------------------------------------------------------------------------

export async function getNotes(): Promise<NoteRecord[]> {
  await ensureSeeded()
  const rows = await sql`SELECT * FROM notes ORDER BY sort_index ASC, id ASC`
  return rows.map(mapNote)
}

export async function createNote(data: Omit<NoteRecord, "id">) {
  await sql`
    INSERT INTO notes (title, excerpt, content, date, category, tags, color, read_time)
    VALUES (${data.title}, ${data.excerpt}, ${data.content}, ${data.date}, ${data.category}, ${data.tags}, ${data.color}, ${data.readTime})
  `
}

export async function updateNote(id: number, data: Omit<NoteRecord, "id">) {
  await sql`
    UPDATE notes SET
      title = ${data.title},
      excerpt = ${data.excerpt},
      content = ${data.content},
      date = ${data.date},
      category = ${data.category},
      tags = ${data.tags},
      color = ${data.color},
      read_time = ${data.readTime}
    WHERE id = ${id}
  `
}

export async function deleteNote(id: number) {
  await sql`DELETE FROM notes WHERE id = ${id}`
}

// ---------------------------------------------------------------------------
// Projects
// ---------------------------------------------------------------------------

export async function getProjects(): Promise<ProjectRecord[]> {
  await ensureSeeded()
  const rows = await sql`SELECT * FROM projects ORDER BY sort_index ASC, id ASC`
  return rows.map(mapProject)
}

export async function createProject(data: Omit<ProjectRecord, "id">) {
  await sql`
    INSERT INTO projects (title, description, tags, status, year, stars, forks, url, homepage, featured, highlight)
    VALUES (${data.title}, ${data.description}, ${data.tags}, ${data.status}, ${data.year}, ${data.stars}, ${data.forks}, ${data.url}, ${data.homepage ?? null}, ${data.featured}, ${data.highlight})
  `
}

export async function updateProject(id: number, data: Omit<ProjectRecord, "id">) {
  await sql`
    UPDATE projects SET
      title = ${data.title},
      description = ${data.description},
      tags = ${data.tags},
      status = ${data.status},
      year = ${data.year},
      stars = ${data.stars},
      forks = ${data.forks},
      url = ${data.url},
      homepage = ${data.homepage ?? null},
      featured = ${data.featured},
      highlight = ${data.highlight}
    WHERE id = ${id}
  `
}

export async function deleteProject(id: number) {
  await sql`DELETE FROM projects WHERE id = ${id}`
}

// ---------------------------------------------------------------------------
// Workbench items
// ---------------------------------------------------------------------------

export async function getWorkbenchItems(): Promise<WorkbenchItemRecord[]> {
  await ensureSeeded()
  const rows = await sql`SELECT * FROM workbench_items ORDER BY sort_index ASC, id ASC`
  return rows.map(mapWorkbench)
}

export async function createWorkbenchItem(data: Omit<WorkbenchItemRecord, "id">) {
  await sql`
    INSERT INTO workbench_items (name, description, progress, last_updated, url, branch, commits)
    VALUES (${data.name}, ${data.description}, ${data.progress}, ${data.lastUpdated}, ${data.url}, ${data.branch}, ${data.commits})
  `
}

export async function updateWorkbenchItem(id: number, data: Omit<WorkbenchItemRecord, "id">) {
  await sql`
    UPDATE workbench_items SET
      name = ${data.name},
      description = ${data.description},
      progress = ${data.progress},
      last_updated = ${data.lastUpdated},
      url = ${data.url},
      branch = ${data.branch},
      commits = ${data.commits}
    WHERE id = ${id}
  `
}

export async function deleteWorkbenchItem(id: number) {
  await sql`DELETE FROM workbench_items WHERE id = ${id}`
}

// ---------------------------------------------------------------------------
// Workbench activity
// ---------------------------------------------------------------------------

export async function getWorkbenchActivity(): Promise<ActivityRecord[]> {
  await ensureSeeded()
  const rows = await sql`SELECT * FROM workbench_activity ORDER BY sort_index ASC, id ASC`
  return rows.map(mapActivity)
}

export async function createActivity(data: Omit<ActivityRecord, "id">) {
  await sql`
    INSERT INTO workbench_activity (type, project, message, time)
    VALUES (${data.type}, ${data.project}, ${data.message}, ${data.time})
  `
}

export async function updateActivity(id: number, data: Omit<ActivityRecord, "id">) {
  await sql`
    UPDATE workbench_activity SET
      type = ${data.type},
      project = ${data.project},
      message = ${data.message},
      time = ${data.time}
    WHERE id = ${id}
  `
}

export async function deleteActivity(id: number) {
  await sql`DELETE FROM workbench_activity WHERE id = ${id}`
}
