import { createRouter, createWebHistory, RouteRecordRaw } from "vue-router";
import { useAuthStore } from "../stores/auth";

// Auth views
import Login from "../views/auth/Login.vue";
import ForgotPassword from "../views/auth/ForgotPassword.vue";
import ResetPassword from "../views/auth/ResetPassword.vue";
import Register from "../views/auth/Register.vue";

// Dashboard view
import Dashboard from "../views/Dashboard.vue";

// Home view
import Home from "../Home.vue";

// Project views
import Projects from "../views/projects/Projects.vue";
import ProjectDetails from "../views/projects/ProjectDetails.vue";
import CreateProject from "../views/projects/CreateProject.vue";

// Task views
import Tasks from "../views/tasks/Tasks.vue";
import TaskDetails from "../views/tasks/TaskDetails.vue";
import CreateTask from "../views/tasks/CreateTask.vue";
import AcceptedProjects from "../views/projects/AcceptedProjects.vue";
import Vendors from "../views/vendors/Vendors.vue";
import Users from "../views/users/Users.vue";
import Profile from "../views/users/Profile.vue";
import CreateMaterial from "../views/materials/CreateMaterial.vue";
import MaterialDetail from "../views/materials/MaterialDetail.vue";
import Materials from "../views/materials/Materials.vue";
import Documents from "../views/documents/Documents.vue";
import VerifyOtp from "../views/auth/VerifyOtp.vue";

// Define routes
const routes: RouteRecordRaw[] = [
  // Home route
  {
    path: "/",
    name: "Home",
    component: Home,
    meta: { requiresAuth: false },
  },

  // Auth routes
  {
    path: "/login",
    name: "Login",
    component: Login,
    meta: { requiresAuth: false, layout: "auth" },
  },
  {
    path: "/register",
    name: "Register",
    component: Register,
    meta: { requiresAuth: false, layout: "auth" },
  },
  {
    path: "/forgot-password",
    name: "ForgotPassword",
    component: ForgotPassword,
    meta: { requiresAuth: false, layout: "auth" },
  },
  {
    path: "/reset-password",
    name: "ResetPassword",
    component: ResetPassword,
    meta: { requiresAuth: false, layout: "auth" },
  },
  {
    path: "/verify-otp",
    name: "verify-otp",
    component: VerifyOtp,
    meta: { requiresAuth: false, layout: "auth" },
  },

  // Dashboard route
  {
    path: "/dashboard",
    name: "Dashboard",
    component: Dashboard,
    meta: { requiresAuth: true },
  },

  // Project routes
  {
    path: "/projects",
    name: "Projects",
    component: Projects,
    meta: { requiresAuth: true },
  },
  {
    path: "/projects/create",
    name: "CreateProject",
    component: CreateProject,
    meta: { requiresAuth: true, roles: ["admin", "client"] },
  },
  {
    path: "/projects/:id",
    name: "ProjectDetails",
    component: ProjectDetails,
    meta: { requiresAuth: true },
  },
  {
    path: "/projects/accepted",
    name: "AcceptedProjects",
    component: AcceptedProjects,
  },
  // Task routes
  {
    path: "/projects/:projectId/tasks",
    name: "Tasks",
    component: Tasks,
    meta: { requiresAuth: true },
  },
  {
    path: "/projects/:projectId/tasks/create",
    name: "CreateTask",
    component: CreateTask,
    meta: {
      requiresAuth: true,
      roles: ["site_engineer", "contractor"],
    },
  },
  {
    path: "/projects/:projectId/tasks/:id",
    name: "TaskDetails",
    component: TaskDetails,
    meta: { requiresAuth: true },
  },

  {
    path: "/vendors",
    name: "Vendors",
    component: Vendors,
    meta: { requiresAuth: true },
  },

  {
    path: "/users",
    name: "Users",
    component: Users,
    meta: { requiresAuth: true },
  },

  {
    path: "/profile",
    name: "Profile",
    component: Profile,
    meta: { requiresAuth: true },
  },

  //material
  {
    path: "/projects/:projectId/materials",
    name: ":Materials",
    component: Materials,
    meta: { requiresAuth: true },
  },
  {
    path: "/projects/:projectId/materials/:id",
    name: "MaterialDetail",
    component: MaterialDetail,
    meta: { requiresAuth: true },
  },
  {
    path: "/projects/:projectId/materials/create",
    name: ":CreateMaterial",
    component: CreateMaterial,
    meta: { requiresAuth: true, roles: ["contractor", "site_engineer"] },
  },
  {
    path: "/projects/:projectId/documents",
    name: "Documents",
    component: Documents,
    meta: {
      requiresAuth: true,
      roles: ["admin", "site_engineer", "contractor", "client"],
    },
  },
];

// Create router
const router = createRouter({
  history: createWebHistory(),
  routes: [
    ...routes,
    // Auth routes
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/auth/Login.vue'),
      meta: { requiresAuth: false, layout: 'auth' }
    },
    {
      path: '/forgot-password',
      name: 'forgot-password',
      component: () => import('../views/auth/ForgotPassword.vue'),
      meta: { requiresAuth: false, layout: 'auth' }
    },
    {
      path: '/verify-otp',
      name: 'verify-otp',
      component: () => import('../views/auth/VerifyOtp.vue'),
      meta: { requiresAuth: false, layout: 'auth' },
      props: (route) => ({
        email: route.query.email,
        otp: route.query.otp
      })
    },
    {
      path: '/reset-password',
      name: 'reset-password',
      component: () => import('../views/auth/ResetPassword.vue'),
      meta: { requiresAuth: false, layout: 'auth' },
      props: (route) => ({
        email: route.query.email,
        otp: route.query.otp
      })
    }
  ]
});

// Navigation guard to check authentication and route requirements
router.beforeEach((to, _from, next) => {
  const authStore = useAuthStore();
  const requiresAuth = to.meta.requiresAuth as boolean | undefined;
  const requiredRoles = to.meta.roles as string[] | undefined;

  // Redirect to login if route requires authentication and user is not authenticated
  if (requiresAuth && !authStore.isAuthenticated) {
    next({ name: 'login' });
    return;
  }

  // Redirect to home if user is authenticated and tries to access auth pages
  if (
    (to.name === 'login' || 
     to.name === 'register' || 
     to.name === 'forgot-password' ||
     to.name === 'verify-otp') && 
    authStore.isAuthenticated
  ) {
    next({ name: 'home' });
    return;
  }

  // Ensure email is present for verify-otp and reset-password routes
  if (
    (to.name === 'verify-otp' || to.name === 'reset-password') && 
    !to.query.email
  ) {
    next({ name: 'forgot-password' });
    return;
  }

  // Check if route requires specific roles
  if (requiredRoles && authStore.isAuthenticated) {
    const hasRequiredRole = requiredRoles.includes(authStore.userRole);
    if (!hasRequiredRole) {
      next({ name: 'dashboard' });
      return;
    }
  }

  next();
});

export default router;
