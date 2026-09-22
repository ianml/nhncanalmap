import { stripBase, withBase } from './paths.mjs';

export const sitePath = (path: string) => withBase(path, import.meta.env.BASE_URL, import.meta.env.PUBLIC_DIRECTORY_URLS === 'true');
export const routePath = (path: string) => stripBase(path, import.meta.env.BASE_URL).replace(/\/$/, '') || '/';
