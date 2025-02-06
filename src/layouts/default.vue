<template>
    <div>
        <header>Mon header</header>
        <slot /> 
        <footer class="bg-white border-t mt-12">
            <div class="container mx-auto py-4 text-center text-gray-500 text-sm">
                &copy; {{ new Date().getFullYear() }} - {{  $t("activity_dashboard") }}
            </div>
        </footer>
    </div>
  </template>
  