<script setup lang="ts">
interface Props {
  modelValue: {
    name: string
    description: string
    detailedDescription?: string
    type: 'YACHT' | 'CATAMARAN' | 'SPEEDBOAT' | 'SAILBOAT'
    capacity: number
    recommendedCapacity?: number
    length?: number
    width?: number
    year?: number
    pricePerHour: number
    pricePerDay?: number
    minimumHours: number
    thumbnail?: string
    images: string[]
    location: string
    pier?: string
    features: string[]
    hasCapitan: boolean
    hasCrew: boolean
  }
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:modelValue': [value: Props['modelValue']]
}>()

const formData = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const boatTypes = [
  { label: 'Яхта', value: 'YACHT' },
  { label: 'Катамаран', value: 'CATAMARAN' },
  { label: 'Катер', value: 'SPEEDBOAT' },
  { label: 'Парусная яхта', value: 'SAILBOAT' }
]

const isUploading = ref(false)

const uploadImage = async (file: File) => {
  isUploading.value = true
  try {
    const uploadFormData = new FormData()
    uploadFormData.append('file', file)
    
    // Send boat name to create folder by name
    if (formData.value.name) {
      uploadFormData.append('boatName', formData.value.name)
    }

    const response = await $fetch<{
      success: boolean
      data: { url: string; filename: string; boatSlug: string }
    }>('/api/admin/upload', {
      method: 'POST',
      body: uploadFormData,
      credentials: 'include'
    })

    if (response.success && response.data) {
      formData.value.images.push(response.data.url)
      if (!formData.value.thumbnail) {
        formData.value.thumbnail = response.data.url
      }
      return response.data.url
    }
  } catch (error: any) {
    console.error('Upload error:', error)
    alert(error?.data?.message || 'Ошибка загрузки изображения')
  } finally {
    isUploading.value = false
  }
}

const handleFileSelect = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    await uploadImage(file)
    target.value = '' // Reset input
  }
}

const addImage = () => {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/jpeg,image/jpg,image/png,image/webp'
  input.onchange = handleFileSelect
  input.click()
}

const removeImage = (index: number) => {
  formData.value.images.splice(index, 1)
}

const addFeature = () => {
  const feature = prompt('Введите название удобства:')
  if (feature) {
    formData.value.features.push(feature)
  }
}

const removeFeature = (index: number) => {
  formData.value.features.splice(index, 1)
}
</script>

<template>
  <div class="space-y-6">
    <!-- Basic Info -->
    <div class="space-y-4">
      <h4 class="font-semibold text-gray-900 dark:text-white">Основная информация</h4>
      
      <div>
        <label class="block text-sm font-medium mb-1">Название *</label>
        <UInput v-model="formData.name" placeholder="Лазурная мечта" required class="w-full" />
      </div>

      <div>
        <label class="block text-sm font-medium mb-1">Краткое описание</label>
        <UTextarea
          v-model="formData.description"
          placeholder="Краткое описание яхты..."
          :rows="2"
          class="w-full"
        />
      </div>

      <div>
        <label class="block text-sm font-medium mb-1">Подробное описание</label>
        <UTextarea
          v-model="formData.detailedDescription"
          placeholder="Подробное описание яхты, характеристики, особенности..."
          :rows="4"
          class="w-full"
        />
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium mb-1">Тип *</label>
          <USelect
            v-model="formData.type"
            :items="boatTypes"
            class="w-full"
          />
        </div>

        <div>
          <label class="block text-sm font-medium mb-1">Вместимость (макс.) *</label>
          <UInput
            v-model.number="formData.capacity"
            type="number"
            :min="1"
            :max="11"
            required
            class="w-full"
          />
          <p class="text-xs text-gray-500 mt-1">Максимум 11 человек по документам</p>
        </div>
      </div>

      <div>
        <label class="block text-sm font-medium mb-1">Рекомендованная вместимость</label>
        <UInput
          v-model.number="formData.recommendedCapacity"
          type="number"
          :min="1"
          :max="11"
          class="w-full"
        />
        <p class="text-xs text-gray-500 mt-1">Рекомендуемое количество для комфорта</p>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium mb-1">Длина (м)</label>
          <UInput
            v-model.number="formData.length"
            type="number"
            step="0.1"
            class="w-full"
          />
        </div>

        <div>
          <label class="block text-sm font-medium mb-1">Ширина (м)</label>
          <UInput
            v-model.number="formData.width"
            type="number"
            step="0.1"
            class="w-full"
          />
        </div>
      </div>

      <div class="grid grid-cols-2 gap-4">

        <div>
          <label class="block text-sm font-medium mb-1">Год постройки</label>
          <UInput
            v-model.number="formData.year"
            type="number"
            :min="1900"
            :max="new Date().getFullYear()"
            class="w-full"
          />
        </div>

        <div>
          <label class="block text-sm font-medium mb-1">Минимум часов</label>
          <UInput
            v-model.number="formData.minimumHours"
            type="number"
            :min="1"
            class="w-full"
          />
          <p class="text-xs text-gray-500 mt-1">Минимум 1 час</p>
        </div>
      </div>
    </div>

    <!-- Pricing -->
    <div class="space-y-4">
      <h4 class="font-semibold text-gray-900 dark:text-white">Ценообразование</h4>
      
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium mb-1">Цена за час (₽) *</label>
          <UInput
            v-model.number="formData.pricePerHour"
            type="number"
            :min="0"
            required
            class="w-full"
          />
        </div>

        <div>
          <label class="block text-sm font-medium mb-1">Цена за день (₽)</label>
          <UInput
            v-model.number="formData.pricePerDay"
            type="number"
            :min="0"
            class="w-full"
          />
        </div>
      </div>
    </div>

    <!-- Location -->
    <div class="space-y-4">
      <h4 class="font-semibold text-gray-900 dark:text-white">Местоположение</h4>
      
      <div>
        <label class="block text-sm font-medium mb-1">Город</label>
        <UInput v-model="formData.location" placeholder="Сочи" class="w-full" />
      </div>

      <div>
        <label class="block text-sm font-medium mb-1">Причал</label>
        <UInput v-model="formData.pier" placeholder="Морской порт, причал №3" class="w-full" />
      </div>
    </div>

    <!-- Images -->
    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <h4 class="font-semibold text-gray-900 dark:text-white">Изображения</h4>
        <div class="flex gap-2">
          <UButton size="sm" variant="outline" @click="addImage" :loading="isUploading">
            <UIcon name="i-heroicons-arrow-up-tray" class="mr-1" />
            Загрузить файл
          </UButton>
          <UButton size="sm" variant="outline" @click="() => {
            const url = prompt('Введите URL изображения:\n\nПримеры:\nhttps://res.cloudinary.com/.../yacht.jpg\n/images/boats/yacht-1.jpg')
            if (url && url.trim()) {
              formData.images.push(url.trim())
              if (!formData.thumbnail) formData.thumbnail = url.trim()
            }
          }">
            <UIcon name="i-heroicons-link" class="mr-1" />
            Добавить URL
          </UButton>
        </div>
      </div>

      <div>
        <label class="block text-sm font-medium mb-1">Главное изображение (URL)</label>
        <UInput v-model="formData.thumbnail" placeholder="https://example.com/yacht.jpg или /images/boats/yacht.jpg" class="w-full" />
        <p class="text-xs text-gray-500 mt-1">
          Вставьте полный URL (https://...) или путь от корня (/images/...)
        </p>
      </div>

      <div v-if="formData.images.length > 0" class="space-y-2">
        <div
          v-for="(img, idx) in formData.images"
          :key="idx"
          class="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded"
        >
          <NuxtImg
            :src="img"
            alt=""
            class="w-16 h-12 object-cover rounded"
            width="64"
            height="48"
            loading="lazy"
          />
          <UInput
            v-model="formData.images[idx]"
            type="text"
            placeholder="URL изображения"
            class="flex-1"
          />
          <UButton
            size="sm"
            variant="ghost"
            color="error"
            icon="i-heroicons-trash"
            @click="removeImage(idx)"
          />
        </div>
      </div>
    </div>

    <!-- Features -->
    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <h4 class="font-semibold text-gray-900 dark:text-white">Удобства</h4>
        <UButton size="sm" variant="outline" @click="addFeature">
          <UIcon name="i-heroicons-plus" class="mr-1" />
          Добавить
        </UButton>
      </div>

      <div v-if="formData.features.length > 0" class="flex flex-wrap gap-2">
        <UBadge
          v-for="(feature, idx) in formData.features"
          :key="idx"
          color="primary"
          variant="subtle"
          class="flex items-center gap-1"
        >
          {{ feature }}
          <UButton
            type="button"
            variant="ghost"
            size="2xs"
            color="neutral"
            class="ml-1 hover:text-error-500 px-1 py-0"
            @click="removeFeature(idx)"
          >
            <UIcon name="i-heroicons-x-mark" class="w-3 h-3" />
          </UButton>
        </UBadge>
      </div>
    </div>

    <!-- Options -->
    <div class="space-y-4">
      <h4 class="font-semibold text-gray-900 dark:text-white">Опции</h4>
      
      <div class="space-y-2">
        <div class="flex items-center gap-2">
          <UCheckbox v-model="formData.hasCapitan" />
          <label class="text-sm">С капитаном</label>
        </div>

        <div class="flex items-center gap-2">
          <UCheckbox v-model="formData.hasCrew" />
          <label class="text-sm">С экипажем</label>
        </div>
      </div>
    </div>
  </div>
</template>
