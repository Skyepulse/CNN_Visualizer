import { ref, onMounted, onUnmounted } from 'vue';

export function useResponsive() {
  const isMobile = ref(false);

  const checkScreen = () => {
    // You can customize the logic here for tablets etc.
    isMobile.value = window.innerWidth < 768 || window.matchMedia('(orientation: portrait)').matches;
  };

  onMounted(() => {
    checkScreen();
    window.addEventListener('resize', checkScreen);
  });

  onUnmounted(() => {
    window.removeEventListener('resize', checkScreen);
  });

  return { isMobile };
}
