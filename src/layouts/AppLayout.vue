<script setup lang="ts">
import { ref, computed } from "vue";
import { useRoute } from "vue-router";
import SidebarNavigation from "../components/layout/SidebarNavigation.vue";
import TopNavigation from "../components/layout/TopNavigation.vue";

const route = useRoute();
const sidebarOpen = ref(false);

const toggleSidebar = () => {
  sidebarOpen.value = !sidebarOpen.value;
};

const pageTitle = computed(() => {
  const name = route.name as string;
  return name ? name.charAt(0).toUpperCase() + name.slice(1) : "Dashboard";
});
</script>

<template>
  <div class="flex min-h-screen bg-gray-100">
    <!-- Navbar -->
    <TopNavigation :page-title="pageTitle" @toggle-sidebar="toggleSidebar" />

    <!-- Sidebar -->
    <SidebarNavigation
      :is-open="sidebarOpen"
      @close-sidebar="sidebarOpen = false"
    />

    <!-- Main content -->
    <div class="flex-1 flex flex-col pt-16 md:ml-72">
      <main class="flex-1 overflow-y-auto">
        <div class="py-6 px-4 sm:px-6 lg:px-8">
          <router-view></router-view>
        </div>
      </main>
    </div>
  </div>
</template>

<style scoped>
.min-h-screen {
  min-height: 100vh;
}
.transition-transform {
  transition: transform 0.3s ease-in-out;
}
</style>
