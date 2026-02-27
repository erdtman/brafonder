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

        <router-view />

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
        const defaultMetaDescription = 'brafonder.se är tänkt att vara ett stöd när du letar efter bra fonder. Vi har gjort en analys av historisk avkastning på alla fonder tillgängliga via Avanza.';
        const metaDescriptionTag = document.querySelector('meta[name="description"]');

        watch(
            () => route.params.slug,
            (slug) => {
                if (slug) {
                    const fundId = getIdFromSlug(slug);
                    if (fundId) {
                        const fund = fundData.find(f => String(f.id) === fundId);
                        if (fund) {
                            selectedFund.value = fund;
                            document.title = `${fund.name} - brafonder.se`;
                            if (metaDescriptionTag) {
                                const desc = fund.descriptions && fund.descriptions.length > 0
                                    ? `${fund.name}: ${fund.descriptions[0]}`
                                    : `Historisk avkastningsanalys för ${fund.name} — se 1-, 5- och 10-årsperioder på brafonder.se.`;
                                metaDescriptionTag.setAttribute('content', desc);
                            }
                            return;
                        }
                    }
                }
                selectedFund.value = null;
                document.title = 'brafonder.se';
                if (metaDescriptionTag) {
                    metaDescriptionTag.setAttribute('content', defaultMetaDescription);
                }
            },
            { immediate: true }
        );

        const closeFund = () => {
            selectedFund.value = null;
            // Go back to list view
            const basePath = currentView.value === 'complete' ? '/komplett' : '/';
            router.push(basePath);
        };

        return {
            currentView,
            selectedFund,
            closeFund
        };
    }
};
</script>
