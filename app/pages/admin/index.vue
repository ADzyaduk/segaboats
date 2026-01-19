<script setup lang="ts">
// Admin login page

const email = ref('admin@boats2026.ru')
const password = ref('')
const isLoading = ref(false)
const error = ref<string | null>(null)
const toast = useNotificationToast()

// Redirect if already authenticated
const checkAuth = async () => {
  try {
    const authData = await $fetch('/api/admin/auth/check').catch(() => ({ authenticated: false }))
    if (authData?.authenticated) {
      await navigateTo('/admin/boats')
    }
  } catch (e) {
    // Not authenticated, stay on login page
  }
}

onMounted(() => {
  checkAuth()
})

const login = async () => {
  if (!email.value || !password.value) {
    error.value = 'Заполните все поля'
    return
  }

  isLoading.value = true
  error.value = null

  try {
    const data = await $fetch('/api/admin/auth', {
      method: 'POST',
      body: {
        email: email.value,
        password: password.value
      }
    })

    if (data?.success) {
      toast.success('Вход выполнен', 'Добро пожаловать в админ-панель')
      await navigateTo('/admin/boats')
    } else {
      error.value = 'Неверный email или пароль'
    }
  } catch (e: any) {
    error.value = e.data?.message || 'Ошибка входа'
    toast.error('Ошибка', error.value)
  } finally {
    isLoading.value = false
  }
}

// SEO
useSeoMeta({
  title: 'Админ-панель',
  robots: 'noindex, nofollow'
})
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8">
      <div class="text-center">
        <h2 class="text-3xl font-bold text-gray-900 dark:text-white">
          Админ-панель
        </h2>
        <p class="mt-2 text-gray-600 dark:text-gray-400">
          Войдите для управления яхтами и бронированиями
        </p>
      </div>

      <UCard>
        <form @submit.prevent="login" class="space-y-6">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email
            </label>
            <UInput
              v-model="email"
              type="email"
              placeholder="admin@boats2026.ru"
              required
              autocomplete="email"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Пароль
            </label>
            <UInput
              v-model="password"
              type="password"
              placeholder="Введите пароль"
              required
              autocomplete="current-password"
            />
          </div>

          <UAlert
            v-if="error"
            color="error"
            :title="error"
            icon="i-heroicons-exclamation-circle"
          />

          <UButton
            type="submit"
            color="primary"
            size="lg"
            block
            :loading="isLoading"
          >
            Войти
          </UButton>
        </form>

        <div class="mt-6 text-center text-sm text-gray-500">
          <p>По умолчанию: admin@boats2026.ru / Admin2026</p>
        </div>
      </UCard>
    </div>
  </div>
</template>
