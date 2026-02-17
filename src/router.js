import { createRouter, createWebHistory } from 'vue-router';
import SimpleList from './SimpleList.vue';
import CompleteList from './CompleteList.vue';
import Background from './Background.vue';

// Utility to create URL-friendly slugs from fund names
export function createSlug(name, id) {
    const slug = name
        .toLowerCase()
        .replace(/[åä]/g, 'a')
        .replace(/ö/g, 'o')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
    return `${slug}-${id}`;
}

// Extract fund ID from slug
export function getIdFromSlug(slug) {
    const match = slug.match(/-(\d+)$/);
    return match ? match[1] : null;
}

const routes = [
    {
        path: '/',
        name: 'simple',
        component: SimpleList,
        meta: { view: 'simple' }
    },
    {
        path: '/komplett',
        name: 'complete',
        component: CompleteList,
        meta: { view: 'complete' }
    },
    {
        path: '/bakgrund',
        name: 'background',
        component: Background,
        meta: { view: 'background' }
    },
    {
        path: '/fond/:slug',
        name: 'fund',
        component: SimpleList,  // We show SimpleList with modal overlay
        meta: { view: 'simple', showFund: true }
    },
    {
        path: '/komplett/fond/:slug',
        name: 'fund-complete',
        component: CompleteList,
        meta: { view: 'complete', showFund: true }
    }
];

const router = createRouter({
    history: createWebHistory(),
    routes
});

export default router;
