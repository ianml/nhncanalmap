import { getCollection, type CollectionEntry } from 'astro:content';

export const postPath = (post: CollectionEntry<'blog'>) => post.data.permalink ?? `/blog/${post.data.slug}`;
export const getPosts = async () => (await getCollection('blog', ({ data }) => !data.draft)).sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
export const formatDate = (date: Date) => new Intl.DateTimeFormat('en-US', { dateStyle: 'long', timeZone: 'UTC' }).format(date);
