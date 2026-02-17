<template>
    <div>
        <h1 class="title">brafonder.se</h1>
        <header class="navbar">
            <section class="navbar-section"></section>
            <section class="navbar-center">
                <router-link to="/" class="btn" :class="{ active: currentView === 'simple' }"
                    style="margin: 10px; width: 100px;">Enkel</router-link>
                <router-link to="/komplett" class="btn" :class="{ active: currentView === 'complete' }"
                    style="margin: 10px; width: 100px;">Komplett</router-link>
                <router-link to="/bakgrund" class="btn" :class="{ active: currentView === 'background' }"
                    style="margin: 10px; width: 100px;">Bakgrund</router-link>
            </section>
            <section class="navbar-section"></section>
        </header>

        <router-view v-slot="{ Component }">
            <component :is="Component" @open-fund="openFund" />
        </router-view>

        <FundModal v-if="selectedFund" :fund="selectedFund" @close="closeFund" />
    </div>
</template>

<script>
import { ref, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import FundModal from './FundModal.vue';
import { getIdFromSlug } from './router.js';
import fundData from './data/fundDataAll.json';

export default {
    components: {
        FundModal
    },
    setup() {
        const route = useRoute();
        const router = useRouter();
        const selectedFund = ref(null);

        const currentView = computed(() => {
            return route.meta?.view || 'simple';
        });

        // Watch for route changes to handle fund modal
        watch(
            () => route.params.slug,
            (slug) => {
                if (slug) {
                    const fundId = getIdFromSlug(slug);
                    if (fundId) {
                        const fund = fundData.find(f => String(f.id) === fundId);
                        if (fund) {
                            selectedFund.value = fund;
                            return;
                        }
                    }
                }
                selectedFund.value = null;
            },
            { immediate: true }
        );

        const openFund = (fund) => {
            selectedFund.value = fund;
            // Update URL without full navigation
            const slug = createSlugFromFund(fund);
            const basePath = currentView.value === 'complete' ? '/komplett' : '';
            router.push(`${basePath}/fond/${slug}`);
        };

        const closeFund = () => {
            selectedFund.value = null;
            // Go back to list view
            const basePath = currentView.value === 'complete' ? '/komplett' : '/';
            router.push(basePath);
        };

        const createSlugFromFund = (fund) => {
            const slug = fund.name
                .toLowerCase()
                .replace(/[åä]/g, 'a')
                .replace(/ö/g, 'o')
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-|-$/g, '');
            return `${slug}-${fund.id}`;
        };

        return {
            currentView,
            selectedFund,
            openFund,
            closeFund
        };
    }
};
</script>
